import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { TtsModelPricing, TtsModelHistory, TtsPriceHistoryPoint } from 'pricetoken';
import { STATIC_TTS_PRICING } from 'pricetoken';
import type { ExtractedTtsModel } from './tts-extractor';
import { computeConfidenceScore, confidenceLevelFromScore, computeFreshness } from '@/lib/confidence';
import { carrySource, findOriginalSnapshot, type RegistryValidationResult } from './store';

export async function saveTtsSnapshots(
  provider: string,
  models: ExtractedTtsModel[],
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
    FROM "TtsPricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  const priorByModel = new Map(priorSnapshots.map((s) => [s.modelId, s]));

  const data = models.map((m) => ({
    modelId: m.modelId,
    provider,
    displayName: m.displayName,
    costPerMChars: m.costPerMChars,
    voiceType: m.voiceType ?? null,
    maxCharacters: m.maxCharacters ?? null,
    supportedLanguages: m.supportedLanguages ?? null,
    source,
    status: m.status ?? null,
    confidence,
    agentApprovals: 'agentApprovals' in m ? (m as unknown as { agentApprovals: number }).agentApprovals : null,
    agentTotal: agentTotal ?? null,
    launchDate: m.launchDate ? new Date(m.launchDate) : priorByModel.get(m.modelId)?.launchDate ?? null,
  }));

  const result = await prisma.ttsPricingSnapshot.createMany({ data });
  return result.count;
}

export async function getLatestTtsPricing(provider?: string): Promise<TtsModelPricing[]> {
  const where = provider ? Prisma.sql`WHERE "provider" = ${provider}` : Prisma.empty;

  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      costPerMChars: number;
      voiceType: string | null;
      maxCharacters: number | null;
      supportedLanguages: number | null;
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
      "costPerMChars", "voiceType", "maxCharacters", "supportedLanguages",
      "source", "status", "confidence",
      "agentApprovals", "agentTotal",
      "launchDate", "createdAt"
    FROM "TtsPricingSnapshot"
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
      costPerMChars: s.costPerMChars,
      voiceType: s.voiceType,
      maxCharacters: s.maxCharacters,
      supportedLanguages: s.supportedLanguages,
      source: s.source as TtsModelPricing['source'],
      status: (s.status as TtsModelPricing['status']) ?? null,
      confidence: level,
      confidenceScore: score,
      confidenceLevel: level,
      freshness,
      lastUpdated: s.createdAt.toISOString(),
      launchDate: s.launchDate?.toISOString().split('T')[0] ?? null,
    };
  });
}

export async function getTtsPriceHistory(
  days: number,
  filters?: { modelId?: string; provider?: string }
): Promise<TtsModelHistory[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.modelId) where.modelId = filters.modelId;
  if (filters?.provider) where.provider = filters.provider;

  const snapshots = await prisma.ttsPricingSnapshot.findMany({
    where,
    select: {
      modelId: true,
      provider: true,
      displayName: true,
      costPerMChars: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { provider: string; displayName: string; history: TtsPriceHistoryPoint[] }
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
        costPerMChars: s.costPerMChars,
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

export async function seedTtsFromStatic(staticPricing: TtsModelPricing[]): Promise<number> {
  const existingIds = (
    await prisma.ttsPricingSnapshot.findMany({
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
      costPerMChars: m.costPerMChars,
      voiceType: m.voiceType,
      maxCharacters: m.maxCharacters,
      supportedLanguages: m.supportedLanguages,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.ttsPricingSnapshot.createMany({ data });
    created = result.count;
    console.log(`Seeded ${created} new TTS models (${existingIds.length} already existed)`);
  }

  const withDates = staticPricing.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.ttsPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing TTS records`);
  }

  return created;
}

export async function carryForwardMissingTts(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]!;
  const startOfDay = new Date(today + 'T00:00:00Z');

  const allModels = await prisma.ttsPricingSnapshot.findMany({
    distinct: ['modelId'],
    select: { modelId: true },
  });

  const todayModels = await prisma.ttsPricingSnapshot.findMany({
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
    costPerMChars: number;
    voiceType: string | null;
    maxCharacters: number | null;
    supportedLanguages: number | null;
    source: string;
    status: string | null;
    confidence: string;
    launchDate: Date | null;
  }> = [];

  for (const modelId of missing) {
    const original = await findOriginalSnapshot(
      prisma.ttsPricingSnapshot.findFirst.bind(prisma.ttsPricingSnapshot),
      modelId,
    );
    if (!original) continue;

    const latest = await prisma.ttsPricingSnapshot.findFirst({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) continue;

    data.push({
      modelId: latest.modelId,
      provider: latest.provider,
      displayName: latest.displayName,
      costPerMChars: latest.costPerMChars,
      voiceType: latest.voiceType,
      maxCharacters: latest.maxCharacters,
      supportedLanguages: latest.supportedLanguages,
      source: carrySource(latest.source, latest.createdAt, original.source, original.createdAt),
      status: latest.status,
      confidence: latest.confidence,
      launchDate: latest.launchDate,
    });
  }

  if (data.length === 0) return 0;
  const result = await prisma.ttsPricingSnapshot.createMany({ data });
  return result.count;
}

export async function registryValidateCarriedTts(): Promise<RegistryValidationResult> {
  const startOfDay = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  const carriedSnapshots = await prisma.ttsPricingSnapshot.findMany({
    where: { source: 'carried', createdAt: { gte: startOfDay } },
    select: { id: true, modelId: true, costPerMChars: true },
  });

  if (carriedSnapshots.length === 0) return { validated: 0, unvalidated: 0 };

  const registryByModel = new Map(
    STATIC_TTS_PRICING.map((m) => [m.modelId, m])
  );

  const matchIds: string[] = [];
  const mismatchIds: string[] = [];

  for (const snap of carriedSnapshots) {
    const reg = registryByModel.get(snap.modelId);
    if (reg && reg.costPerMChars === snap.costPerMChars) {
      matchIds.push(snap.id);
    } else {
      mismatchIds.push(snap.id);
    }
  }

  if (matchIds.length > 0) {
    await prisma.ttsPricingSnapshot.updateMany({
      where: { id: { in: matchIds } },
      data: { source: 'admin', confidence: 'high' },
    });
  }

  if (mismatchIds.length > 0) {
    await prisma.ttsPricingSnapshot.updateMany({
      where: { id: { in: mismatchIds } },
      data: { confidence: 'low' },
    });
  }

  return { validated: matchIds.length, unvalidated: mismatchIds.length };
}
