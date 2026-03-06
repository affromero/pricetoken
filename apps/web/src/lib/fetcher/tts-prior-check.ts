import { prisma } from '@/lib/prisma';
import type { ExtractedTtsModel } from './tts-extractor';
import type { PriorConsistencyFlag } from './verification-types';

const PRICE_CHANGE_THRESHOLD = 0.5; // 50%

export async function checkTtsPriorConsistency(
  provider: string,
  models: ExtractedTtsModel[]
): Promise<PriorConsistencyFlag[]> {
  const lastSnapshots = await getLastTtsSnapshots(provider);
  if (lastSnapshots.length === 0) return [];

  const flags: PriorConsistencyFlag[] = [];
  const lastByModelId = new Map(lastSnapshots.map((s) => [s.modelId, s]));
  const newModelIds = new Set(models.map((m) => m.modelId));

  for (const model of models) {
    const prior = lastByModelId.get(model.modelId);

    if (!prior) {
      flags.push({
        modelId: model.modelId,
        type: 'new_model',
        detail: `New TTS model not seen before: ${model.displayName}`,
      });
      continue;
    }

    const priceChange = Math.abs(model.costPerMChars - prior.costPerMChars) / prior.costPerMChars;

    if (priceChange > PRICE_CHANGE_THRESHOLD) {
      flags.push({
        modelId: model.modelId,
        type: 'price_change',
        detail: `Price changed >50%: $${prior.costPerMChars}/M chars → $${model.costPerMChars}/M chars`,
      });
    }
  }

  for (const prior of lastSnapshots) {
    if (!newModelIds.has(prior.modelId)) {
      flags.push({
        modelId: prior.modelId,
        type: 'disappeared_model',
        detail: `TTS model ${prior.displayName} was in last snapshot but not in new extraction`,
      });
    }
  }

  return flags;
}

async function getLastTtsSnapshots(provider: string) {
  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      displayName: string;
      costPerMChars: number;
    }>
  >`
    SELECT DISTINCT ON ("modelId")
      "modelId", "displayName", "costPerMChars"
    FROM "TtsPricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  return snapshots;
}
