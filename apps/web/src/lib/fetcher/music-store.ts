import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { MusicModelPricing, MusicModelHistory, MusicPriceHistoryPoint } from 'pricetoken';
import { STATIC_MUSIC_PRICING } from 'pricetoken';
import { carrySource, findOriginalSnapshot } from './store';
import { computeConfidenceScore, confidenceLevelFromScore, computeFreshness } from '@/lib/confidence';

export async function getLatestMusicPricing(provider?: string): Promise<MusicModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;
  const staticLaunchDates = new Map(
    STATIC_MUSIC_PRICING.filter((m) => m.launchDate).map((m) => [m.modelId, m.launchDate!])
  );

  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      costPerMinute: number;
      maxDuration: number | null;
      outputFormat: string | null;
      vocals: boolean | null;
      official: boolean;
      pricingNote: string | null;
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
      "costPerMinute", "maxDuration", "outputFormat", "vocals",
      "official", "pricingNote",
      "source", "status", "confidence",
      "agentApprovals", "agentTotal",
      "launchDate", "createdAt"
    FROM "MusicPricingSnapshot"
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
      maxDuration: s.maxDuration,
      outputFormat: s.outputFormat,
      vocals: s.vocals,
      official: s.official,
      pricingNote: s.pricingNote,
      source: s.source as MusicModelPricing['source'],
      status: (s.status as MusicModelPricing['status']) ?? null,
      confidence: level,
      confidenceScore: score,
      confidenceLevel: level,
      freshness,
      lastUpdated: s.createdAt.toISOString(),
      launchDate: s.launchDate?.toISOString().split('T')[0] ?? staticLaunchDates.get(s.modelId) ?? null,
    };
  });
}

export async function getMusicPriceHistory(
  days: number,
  filters?: { modelId?: string; provider?: string }
): Promise<MusicModelHistory[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.modelId) where.modelId = filters.modelId;
  if (filters?.provider) where.provider = filters.provider;

  const snapshots = await prisma.musicPricingSnapshot.findMany({
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
    { provider: string; displayName: string; history: MusicPriceHistoryPoint[] }
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

export async function seedMusicFromStatic(staticPricing: MusicModelPricing[]): Promise<number> {
  const existingIds = (
    await prisma.musicPricingSnapshot.findMany({
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
      maxDuration: m.maxDuration,
      outputFormat: m.outputFormat,
      vocals: m.vocals,
      official: m.official,
      pricingNote: m.pricingNote,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.musicPricingSnapshot.createMany({ data });
    created = result.count;
    console.log(`Seeded ${created} new music models (${existingIds.length} already existed)`);
  }

  const withDates = staticPricing.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.musicPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing music records`);
  }

  return created;
}

export async function carryForwardMissingMusic(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!;
  const startOfDay = new Date(today + 'T00:00:00Z');

  const allModels = await prisma.musicPricingSnapshot.findMany({
    distinct: ['modelId'],
    select: { modelId: true },
  });

  const todayModels = await prisma.musicPricingSnapshot.findMany({
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
    maxDuration: number | null;
    outputFormat: string | null;
    vocals: boolean | null;
    official: boolean;
    pricingNote: string | null;
    source: string;
    status: string | null;
    confidence: string;
    launchDate: Date | null;
  }> = [];

  for (const modelId of missing) {
    const original = await findOriginalSnapshot(
      prisma.musicPricingSnapshot.findFirst.bind(prisma.musicPricingSnapshot),
      modelId,
    );
    if (!original) continue;

    const latest = await prisma.musicPricingSnapshot.findFirst({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) continue;

    data.push({
      modelId: latest.modelId,
      provider: latest.provider,
      displayName: latest.displayName,
      costPerMinute: latest.costPerMinute,
      maxDuration: latest.maxDuration,
      outputFormat: latest.outputFormat,
      vocals: latest.vocals,
      official: latest.official,
      pricingNote: latest.pricingNote,
      source: carrySource(latest.source, latest.createdAt, original.source, original.createdAt),
      status: latest.status,
      confidence: latest.confidence,
      launchDate: latest.launchDate,
    });
  }

  if (data.length === 0) return 0;
  const result = await prisma.musicPricingSnapshot.createMany({ data });
  return result.count;
}
