import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ModelPricing, ModelHistory, PriceHistoryPoint } from 'pricetoken';
import type { ExtractedModel } from './extractor';

export interface FetchWarning {
  type: 'models_missing' | 'low_confidence' | 'extraction_error';
  provider: string;
  modelIds?: string[];
  message: string;
}

export async function saveSnapshots(
  provider: string,
  models: ExtractedModel[],
  source: string = 'fetched',
  confidence: 'high' | 'low' = 'high'
): Promise<number> {
  if (models.length === 0) return 0;

  const data = models.map((m) => ({
    modelId: m.modelId,
    provider,
    displayName: m.displayName,
    inputPerMTok: m.inputPerMTok,
    outputPerMTok: m.outputPerMTok,
    contextWindow: m.contextWindow ?? null,
    maxOutputTokens: m.maxOutputTokens ?? null,
    source,
    status: m.status ?? null,
    confidence,
  }));

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  return result.count;
}

export async function getLatestPricing(provider?: string): Promise<ModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;

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
      createdAt: Date;
    }>
  >(Prisma.sql`
    SELECT DISTINCT ON ("modelId")
      "modelId", "provider", "displayName",
      "inputPerMTok", "outputPerMTok",
      "contextWindow", "maxOutputTokens",
      "source", "status", "confidence", "createdAt"
    FROM "ModelPricingSnapshot"
    ${where}
    ORDER BY "modelId", "createdAt" DESC
  `);

  return snapshots.map((s) => ({
    modelId: s.modelId,
    provider: s.provider,
    displayName: s.displayName,
    inputPerMTok: s.inputPerMTok,
    outputPerMTok: s.outputPerMTok,
    contextWindow: s.contextWindow,
    maxOutputTokens: s.maxOutputTokens,
    source: s.source as ModelPricing['source'],
    status: (s.status as ModelPricing['status']) ?? null,
    confidence: (s.confidence ?? 'high') as ModelPricing['confidence'],
    lastUpdated: s.createdAt.toISOString(),
  }));
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
  if (missing.length === 0) return 0;

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
  }));

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  console.log(`Seeded ${result.count} new models (${existingIds.length} already existed)`);
  return result.count;
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
