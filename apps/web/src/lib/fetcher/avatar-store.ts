import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AvatarModelPricing, AvatarModelHistory, AvatarPriceHistoryPoint } from 'pricetoken';
import type { ExtractedAvatarModel } from './avatar-extractor';
import { computeConfidenceScore, confidenceLevelFromScore, computeFreshness } from '@/lib/confidence';

export async function saveAvatarSnapshots(
  provider: string,
  models: ExtractedAvatarModel[],
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
    FROM "AvatarPricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  const priorByModel = new Map(priorSnapshots.map((s) => [s.modelId, s]));

  const data = models.map((m) => ({
    modelId: m.modelId,
    provider,
    displayName: m.displayName,
    costPerMinute: m.costPerMinute,
    avatarType: m.avatarType ?? null,
    resolution: m.resolution ?? null,
    maxDuration: m.maxDuration ?? null,
    qualityMode: m.qualityMode ?? null,
    source,
    status: m.status ?? null,
    confidence,
    agentApprovals: 'agentApprovals' in m ? (m as unknown as { agentApprovals: number }).agentApprovals : null,
    agentTotal: agentTotal ?? null,
    launchDate: m.launchDate ? new Date(m.launchDate) : priorByModel.get(m.modelId)?.launchDate ?? null,
  }));

  const result = await prisma.avatarPricingSnapshot.createMany({ data });
  return result.count;
}

export async function getLatestAvatarPricing(provider?: string): Promise<AvatarModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;

  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      costPerMinute: number;
      avatarType: string | null;
      resolution: string | null;
      maxDuration: number | null;
      qualityMode: string | null;
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
      "costPerMinute", "avatarType", "resolution", "maxDuration", "qualityMode",
      "source", "status", "confidence",
      "agentApprovals", "agentTotal",
      "launchDate", "createdAt"
    FROM "AvatarPricingSnapshot"
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
      costPerMinute: s.costPerMinute,
      avatarType: s.avatarType,
      resolution: s.resolution,
      maxDuration: s.maxDuration,
      qualityMode: s.qualityMode,
      source: s.source as AvatarModelPricing['source'],
      status: (s.status as AvatarModelPricing['status']) ?? null,
      confidence: level,
      confidenceScore: score,
      confidenceLevel: level,
      freshness,
      lastUpdated: s.createdAt.toISOString(),
      launchDate: s.launchDate?.toISOString().split('T')[0] ?? null,
    };
  });
}

export async function getAvatarPriceHistory(
  days: number,
  filters?: { modelId?: string; provider?: string }
): Promise<AvatarModelHistory[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.modelId) where.modelId = filters.modelId;
  if (filters?.provider) where.provider = filters.provider;

  const snapshots = await prisma.avatarPricingSnapshot.findMany({
    where,
    select: {
      modelId: true,
      provider: true,
      displayName: true,
      costPerMinute: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { provider: string; displayName: string; history: AvatarPriceHistoryPoint[] }
  >();

  for (const s of snapshots) {
    const dateKey = s.createdAt.toISOString().split('T')[0]!;
    if (!grouped.has(s.modelId)) {
      grouped.set(s.modelId, {
        provider: s.provider,
        displayName: s.displayName,
        history: [],
      });
    }

    const group = grouped.get(s.modelId)!;
    const existing = group.history.find((h) => h.date === dateKey);
    if (!existing) {
      group.history.push({
        date: dateKey,
        costPerMinute: s.costPerMinute,
      });
    }
  }

  return Array.from(grouped.entries()).map(([modelId, data]) => ({
    modelId,
    provider: data.provider,
    displayName: data.displayName,
    history: data.history,
  }));
}

export async function seedAvatarFromStatic(staticPricing: AvatarModelPricing[]): Promise<number> {
  const existingIds = (
    await prisma.avatarPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r: { modelId: string }) => r.modelId);

  const missing = staticPricing.filter((m) => !existingIds.includes(m.modelId));
  let created = 0;

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMinute: m.costPerMinute,
      avatarType: m.avatarType,
      resolution: m.resolution,
      maxDuration: m.maxDuration,
      qualityMode: m.qualityMode,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.avatarPricingSnapshot.createMany({ data });
    created = result.count;
    console.log(`Seeded ${created} new avatar models (${existingIds.length} already existed)`);
  }

  const withDates = staticPricing.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.avatarPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing avatar records`);
  }

  return created;
}

export async function carryForwardMissingAvatar(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!;
  const startOfDay = new Date(today + 'T00:00:00Z');

  const allModels = await prisma.avatarPricingSnapshot.findMany({
    distinct: ['modelId'],
    select: { modelId: true },
  });

  const todayModels = await prisma.avatarPricingSnapshot.findMany({
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
    costPerMinute: number;
    avatarType: string | null;
    resolution: string | null;
    maxDuration: number | null;
    qualityMode: string | null;
    source: string;
    status: string | null;
    confidence: string;
    launchDate: Date | null;
  }> = [];

  for (const modelId of missing) {
    const latest = await prisma.avatarPricingSnapshot.findFirst({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      data.push({
        modelId: latest.modelId,
        provider: latest.provider,
        displayName: latest.displayName,
        costPerMinute: latest.costPerMinute,
        avatarType: latest.avatarType,
        resolution: latest.resolution,
        maxDuration: latest.maxDuration,
        qualityMode: latest.qualityMode,
        source: 'carried',
        status: latest.status,
        confidence: latest.confidence,
        launchDate: latest.launchDate,
      });
    }
  }

  if (data.length === 0) return 0;
  const result = await prisma.avatarPricingSnapshot.createMany({ data });
  return result.count;
}
