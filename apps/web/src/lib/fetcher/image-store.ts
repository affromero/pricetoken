import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ImageModelPricing, ImageModelHistory, ImagePriceHistoryPoint } from 'pricetoken';
import { computeConfidenceScore, confidenceLevelFromScore, computeFreshness } from '@/lib/confidence';

export interface ExtractedImageModel {
  modelId: string;
  displayName: string;
  pricePerImage: number;
  pricePerMegapixel?: number;
  defaultResolution?: string;
  qualityTier?: string;
  maxResolution?: string;
  supportedFormats?: string[];
  status?: string;
  launchDate?: string;
}

export async function saveImageSnapshots(
  provider: string,
  models: ExtractedImageModel[],
  source: string = 'fetched',
  confidence: 'high' | 'low' = 'high',
  agentTotal?: number
): Promise<number> {
  if (models.length === 0) return 0;

  // Look up prior snapshots to preserve launchDate
  const priorSnapshots = await prisma.$queryRaw<
    Array<{ modelId: string; launchDate: Date | null }>
  >`
    SELECT DISTINCT ON ("modelId") "modelId", "launchDate"
    FROM "ImagePricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  const priorByModel = new Map(priorSnapshots.map((s) => [s.modelId, s]));

  const data = models.map((m) => ({
    modelId: m.modelId,
    provider,
    displayName: m.displayName,
    pricePerImage: m.pricePerImage,
    pricePerMegapixel: m.pricePerMegapixel ?? null,
    defaultResolution: m.defaultResolution ?? '1024x1024',
    qualityTier: m.qualityTier ?? 'standard',
    maxResolution: m.maxResolution ?? null,
    supportedFormats: m.supportedFormats ?? ['png'],
    source,
    status: m.status ?? null,
    confidence,
    agentApprovals: 'agentApprovals' in m ? (m as unknown as { agentApprovals: number }).agentApprovals : null,
    agentTotal: agentTotal ?? null,
    launchDate: m.launchDate ? new Date(m.launchDate) : priorByModel.get(m.modelId)?.launchDate ?? null,
  }));
  const result = await prisma.imagePricingSnapshot.createMany({ data });
  return result.count;
}

export async function getLatestImagePricing(provider?: string): Promise<ImageModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;
  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      pricePerImage: number;
      pricePerMegapixel: number | null;
      defaultResolution: string;
      qualityTier: string;
      maxResolution: string | null;
      supportedFormats: string[];
      source: string;
      status: string | null;
      confidence: string | null;
      agentApprovals: number | null;
      agentTotal: number | null;
      launchDate: Date | null;
      createdAt: Date;
    }>
  >(Prisma.sql`
    SELECT DISTINCT ON ("modelId")
      "modelId", "provider", "displayName",
      "pricePerImage", "pricePerMegapixel",
      "defaultResolution", "qualityTier",
      "maxResolution", "supportedFormats",
      "source", "status", "confidence",
      "agentApprovals", "agentTotal",
      "launchDate", "createdAt"
    FROM "ImagePricingSnapshot"
    ${where}
    ORDER BY "modelId", "createdAt" DESC
  `);

  return snapshots.map((s) => {
    const score = computeConfidenceScore({
      source: s.source,
      createdAt: s.createdAt,
      agentApprovals: s.agentApprovals,
      agentTotal: s.agentTotal,
      priceUnchanged: true,
    });
    const level = confidenceLevelFromScore(score);
    const freshness = computeFreshness(s.createdAt);
    return {
      modelId: s.modelId,
      provider: s.provider,
      displayName: s.displayName,
      pricePerImage: s.pricePerImage,
      pricePerMegapixel: s.pricePerMegapixel,
      defaultResolution: s.defaultResolution,
      qualityTier: s.qualityTier as ImageModelPricing['qualityTier'],
      maxResolution: s.maxResolution,
      supportedFormats: s.supportedFormats,
      source: s.source as ImageModelPricing['source'],
      status: (s.status as ImageModelPricing['status']) ?? null,
      confidence: level,
      confidenceScore: score,
      confidenceLevel: level,
      freshness,
      lastUpdated: s.createdAt.toISOString(),
      launchDate: s.launchDate?.toISOString().split('T')[0] ?? null,
    };
  });
}

export async function getImagePriceHistory(
  days: number,
  filters?: { modelId?: string; provider?: string }
): Promise<ImageModelHistory[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.modelId) where.modelId = filters.modelId;
  if (filters?.provider) where.provider = filters.provider;

  const snapshots = await prisma.imagePricingSnapshot.findMany({
    where,
    select: {
      modelId: true,
      provider: true,
      displayName: true,
      pricePerImage: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { provider: string; displayName: string; history: ImagePriceHistoryPoint[] }
  >();

  for (const s of snapshots) {
    const dateKey = s.createdAt.toISOString().split('T')[0]!;
    if (!grouped.has(s.modelId)) {
      grouped.set(s.modelId, { provider: s.provider, displayName: s.displayName, history: [] });
    }
    const group = grouped.get(s.modelId)!;
    const existing = group.history.find((h) => h.date === dateKey);
    if (!existing) {
      group.history.push({ date: dateKey, pricePerImage: s.pricePerImage });
    }
  }

  return Array.from(grouped.entries()).map(([modelId, data]) => ({
    modelId,
    provider: data.provider,
    displayName: data.displayName,
    history: data.history,
  }));
}

export async function seedImageFromStatic(): Promise<number> {
  const { STATIC_IMAGE_PRICING } = await import('pricetoken');

  const existingIds = (
    await prisma.imagePricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r: { modelId: string }) => r.modelId);

  const missing = STATIC_IMAGE_PRICING.filter((m) => !existingIds.includes(m.modelId));
  let created = 0;

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      pricePerImage: m.pricePerImage,
      pricePerMegapixel: m.pricePerMegapixel,
      defaultResolution: m.defaultResolution,
      qualityTier: m.qualityTier,
      maxResolution: m.maxResolution,
      supportedFormats: m.supportedFormats,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.imagePricingSnapshot.createMany({ data });
    created = result.count;
    console.log(`Seeded ${created} new image models (${existingIds.length} already existed)`);
  }

  const { STATIC_IMAGE_PRICING: allStatic } = await import('pricetoken');
  const withDates = allStatic.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.imagePricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing image records`);
  }

  return created;
}

export async function carryForwardMissingImages(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!;
  const startOfDay = new Date(today + 'T00:00:00Z');

  const allModels = await prisma.imagePricingSnapshot.findMany({
    distinct: ['modelId'],
    select: { modelId: true },
  });

  const todayModels = await prisma.imagePricingSnapshot.findMany({
    where: { createdAt: { gte: startOfDay } },
    distinct: ['modelId'],
    select: { modelId: true },
  });
  const todayIds = new Set(todayModels.map((m) => m.modelId));

  const missing = allModels.map((m) => m.modelId).filter((id) => !todayIds.has(id));
  if (missing.length === 0) return 0;

  const data: Array<{
    modelId: string;
    provider: string;
    displayName: string;
    pricePerImage: number;
    pricePerMegapixel: number | null;
    defaultResolution: string;
    qualityTier: string;
    maxResolution: string | null;
    supportedFormats: string[];
    source: string;
    status: string | null;
    confidence: string;
    launchDate: Date | null;
  }> = [];

  for (const modelId of missing) {
    const latest = await prisma.imagePricingSnapshot.findFirst({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      data.push({
        modelId: latest.modelId,
        provider: latest.provider,
        displayName: latest.displayName,
        pricePerImage: latest.pricePerImage,
        pricePerMegapixel: latest.pricePerMegapixel,
        defaultResolution: latest.defaultResolution,
        qualityTier: latest.qualityTier,
        maxResolution: latest.maxResolution,
        supportedFormats: latest.supportedFormats,
        source: 'carried',
        status: latest.status,
        confidence: latest.confidence,
        launchDate: latest.launchDate,
      });
    }
  }

  if (data.length === 0) return 0;
  const result = await prisma.imagePricingSnapshot.createMany({ data });
  return result.count;
}
