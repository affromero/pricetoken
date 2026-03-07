import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ModelPricing, ModelHistory, PriceHistoryPoint } from 'pricetoken';
import { STATIC_PRICING } from 'pricetoken';
import type { ExtractedModel } from './extractor';
import type { VerifiedModel } from './verification-types';
import { computeConfidenceScore, confidenceLevelFromScore, computeFreshness } from '@/lib/confidence';

const CARRY_GRACE_MS = 24 * 60 * 60 * 1000; // 1 day

/** Preserve source for recently-verified data instead of degrading to 'carried'. */
export function carrySource(
  source: string,
  createdAt: Date,
  originalSource?: string,
  originalCreatedAt?: Date,
): string {
  // If the latest snapshot is already 'carried', look at the original non-carried source
  const effectiveSource = source === 'carried' && originalSource ? originalSource : source;
  const effectiveDate = source === 'carried' && originalCreatedAt ? originalCreatedAt : createdAt;

  const trusted = effectiveSource === 'verified' || effectiveSource === 'admin';
  const recent = Date.now() - effectiveDate.getTime() < CARRY_GRACE_MS;
  return trusted && recent ? effectiveSource : 'carried';
}

export interface FetchWarning {
  type: 'models_missing' | 'low_confidence' | 'extraction_error' | 'sanity_check_failed';
  provider: string;
  modelIds?: string[];
  message: string;
}

export async function saveSnapshots(
  provider: string,
  models: ExtractedModel[],
  source: string = 'fetched',
  confidence: 'high' | 'low' = 'high',
  agentTotal?: number
): Promise<number> {
  if (models.length === 0) return 0;

  // Look up prior snapshots to backfill contextWindow/maxOutputTokens when missing
  const priorSnapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      contextWindow: number | null;
      maxOutputTokens: number | null;
      launchDate: Date | null;
    }>
  >`
    SELECT DISTINCT ON ("modelId")
      "modelId", "contextWindow", "maxOutputTokens", "launchDate"
    FROM "ModelPricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  const priorByModel = new Map(priorSnapshots.map((s) => [s.modelId, s]));

  const data = models.map((m) => {
    const prior = priorByModel.get(m.modelId);
    return {
      modelId: m.modelId,
      provider,
      displayName: m.displayName,
      inputPerMTok: m.inputPerMTok,
      outputPerMTok: m.outputPerMTok,
      contextWindow: m.contextWindow ?? prior?.contextWindow ?? null,
      maxOutputTokens: m.maxOutputTokens ?? prior?.maxOutputTokens ?? null,
      source,
      status: m.status ?? null,
      confidence,
      agentApprovals: 'agentApprovals' in m ? (m as unknown as VerifiedModel).agentApprovals : null,
      agentTotal: agentTotal ?? null,
      launchDate: m.launchDate ? new Date(m.launchDate) : prior?.launchDate ?? null,
    };
  });

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  return result.count;
}

export async function getLatestPricing(provider?: string): Promise<ModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;
  const staticLaunchDates = new Map(
    STATIC_PRICING.filter((m) => m.launchDate).map((m) => [m.modelId, m.launchDate!])
  );

  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      inputPerMTok: number;
      outputPerMTok: number;
      contextWindow: number | null;
      maxOutputTokens: number | null;
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
      "inputPerMTok", "outputPerMTok",
      "contextWindow", "maxOutputTokens",
      "source", "status", "confidence",
      "agentApprovals", "agentTotal",
      "launchDate", "createdAt"
    FROM "ModelPricingSnapshot"
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
      inputPerMTok: s.inputPerMTok,
      outputPerMTok: s.outputPerMTok,
      contextWindow: s.contextWindow,
      maxOutputTokens: s.maxOutputTokens,
      source: s.source as ModelPricing['source'],
      status: (s.status as ModelPricing['status']) ?? null,
      confidence: level,
      confidenceScore: score,
      confidenceLevel: level,
      freshness,
      lastUpdated: s.createdAt.toISOString(),
      launchDate: s.launchDate?.toISOString().split('T')[0] ?? staticLaunchDates.get(s.modelId) ?? null,
    };
  });
}

export async function getPriceHistory(
  days: number,
  filters?: { modelId?: string; provider?: string }
): Promise<ModelHistory[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.modelId) where.modelId = filters.modelId;
  if (filters?.provider) where.provider = filters.provider;

  const snapshots = await prisma.modelPricingSnapshot.findMany({
    where,
    select: {
      modelId: true,
      provider: true,
      displayName: true,
      inputPerMTok: true,
      outputPerMTok: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { provider: string; displayName: string; history: PriceHistoryPoint[] }
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
        inputPerMTok: s.inputPerMTok,
        outputPerMTok: s.outputPerMTok,
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

export async function seedFromStatic(): Promise<number> {
  const { STATIC_PRICING } = await import('pricetoken');

  const existingIds = (
    await prisma.modelPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r: { modelId: string }) => r.modelId);

  const missing = STATIC_PRICING.filter((m) => !existingIds.includes(m.modelId));
  let created = 0;

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      inputPerMTok: m.inputPerMTok,
      outputPerMTok: m.outputPerMTok,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.modelPricingSnapshot.createMany({ data });
    created = result.count;
    console.log(`Seeded ${created} new models (${existingIds.length} already existed)`);
  }

  // Backfill launchDate on existing records that are missing it
  const withDates = STATIC_PRICING.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.modelPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing records`);
  }

  return created;
}

export async function carryForwardMissing(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!;
  const startOfDay = new Date(today + 'T00:00:00Z');

  // All distinct models ever recorded
  const allModels = await prisma.modelPricingSnapshot.findMany({
    distinct: ['modelId'],
    select: { modelId: true },
  });

  // Models that already have a snapshot today
  const todayModels = await prisma.modelPricingSnapshot.findMany({
    where: { createdAt: { gte: startOfDay } },
    distinct: ['modelId'],
    select: { modelId: true },
  });
  const todayIds = new Set(todayModels.map((m) => m.modelId));

  const missing = allModels.map((m) => m.modelId).filter((id) => !todayIds.has(id));
  if (missing.length === 0) return 0;

  // For each missing model, copy its latest snapshot
  const data: Array<{
    modelId: string;
    provider: string;
    displayName: string;
    inputPerMTok: number;
    outputPerMTok: number;
    contextWindow: number | null;
    maxOutputTokens: number | null;
    source: string;
    status: string | null;
    confidence: string;
    launchDate: Date | null;
  }> = [];

  for (const modelId of missing) {
    const latest = await prisma.modelPricingSnapshot.findFirst({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      let originalSource: string | undefined;
      let originalCreatedAt: Date | undefined;
      if (latest.source === 'carried') {
        const original = await prisma.modelPricingSnapshot.findFirst({
          where: { modelId, source: { notIn: ['carried'] } },
          orderBy: { createdAt: 'desc' },
        });
        if (original) {
          originalSource = original.source;
          originalCreatedAt = original.createdAt;
        }
      }
      data.push({
        modelId: latest.modelId,
        provider: latest.provider,
        displayName: latest.displayName,
        inputPerMTok: latest.inputPerMTok,
        outputPerMTok: latest.outputPerMTok,
        contextWindow: latest.contextWindow,
        maxOutputTokens: latest.maxOutputTokens,
        source: carrySource(latest.source, latest.createdAt, originalSource, originalCreatedAt),
        status: latest.status,
        confidence: latest.confidence,
        launchDate: latest.launchDate,
      });
    }
  }

  if (data.length === 0) return 0;
  const result = await prisma.modelPricingSnapshot.createMany({ data });
  return result.count;
}


export async function getKnownModelIds(): Promise<Set<string>> {
  const { STATIC_PRICING } = await import('pricetoken');
  const staticIds = STATIC_PRICING.map((m) => m.modelId);
  const dbIds = (
    await prisma.modelPricingSnapshot.findMany({
      distinct: ['modelId'],
      select: { modelId: true },
    })
  ).map((r: { modelId: string }) => r.modelId);
  return new Set([...staticIds, ...dbIds]);
}

export async function getLastFetchRun(provider: string) {
  return prisma.fetchRunLog.findFirst({
    where: { provider },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveFetchRun(
  provider: string,
  modelsFound: string[],
  modelsMissing: string[],
  modelsNew: string[],
  totalExtracted: number,
  error?: string
) {
  return prisma.fetchRunLog.create({
    data: { provider, modelsFound, modelsMissing, modelsNew, totalExtracted, error },
  });
}

export async function getRecentWarnings(days = 7): Promise<FetchWarning[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const runs = await prisma.fetchRunLog.findMany({
    where: {
      createdAt: { gte: since },
      modelsMissing: { isEmpty: false },
    },
    orderBy: { createdAt: 'desc' },
  });

  return runs.map((run) => ({
    type: 'models_missing' as const,
    provider: run.provider,
    modelIds: run.modelsMissing,
    message: `${run.modelsMissing.length} model(s) missing from ${run.provider}: ${run.modelsMissing.join(', ')}`,
  }));
}
