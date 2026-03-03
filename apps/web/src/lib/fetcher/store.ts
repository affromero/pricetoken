import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ModelPricing, ModelHistory, PriceHistoryPoint } from 'pricetoken';
import type { ExtractedModel } from './extractor';

export async function saveSnapshots(
  provider: string,
  models: ExtractedModel[],
  source: string = 'fetched'
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
      createdAt: Date;
    }>
  >(Prisma.sql`
    SELECT DISTINCT ON ("modelId")
      "modelId", "provider", "displayName",
      "inputPerMTok", "outputPerMTok",
      "contextWindow", "maxOutputTokens",
      "source", "createdAt"
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
  const count = await prisma.modelPricingSnapshot.count();
  if (count > 0) return 0;

  const { STATIC_PRICING } = await import('pricetoken');

  const data = STATIC_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    inputPerMTok: m.inputPerMTok,
    outputPerMTok: m.outputPerMTok,
    contextWindow: m.contextWindow,
    maxOutputTokens: m.maxOutputTokens,
    source: 'seed',
  }));

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  console.log(`Seeded ${result.count} pricing snapshots from static data`);
  return result.count;
}
