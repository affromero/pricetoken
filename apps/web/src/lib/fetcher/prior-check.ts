import { prisma } from '@/lib/prisma';
import type { ExtractedModel } from './extractor';
import type { PriorConsistencyFlag } from './verification-types';

const PRICE_CHANGE_THRESHOLD = 0.5; // 50%

export async function checkPriorConsistency(
  provider: string,
  models: ExtractedModel[]
): Promise<PriorConsistencyFlag[]> {
  const lastSnapshots = await getLastSnapshots(provider);
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
        detail: `New model not seen before: ${model.displayName}`,
      });
      continue;
    }

    const inputChange = Math.abs(model.inputPerMTok - prior.inputPerMTok) / prior.inputPerMTok;
    const outputChange = Math.abs(model.outputPerMTok - prior.outputPerMTok) / prior.outputPerMTok;

    if (inputChange > PRICE_CHANGE_THRESHOLD || outputChange > PRICE_CHANGE_THRESHOLD) {
      flags.push({
        modelId: model.modelId,
        type: 'price_change',
        detail: `Price changed >50%: input $${prior.inputPerMTok}→$${model.inputPerMTok}, output $${prior.outputPerMTok}→$${model.outputPerMTok}`,
      });
    }

    if (
      prior.contextWindow &&
      model.contextWindow &&
      model.contextWindow !== prior.contextWindow
    ) {
      flags.push({
        modelId: model.modelId,
        type: 'context_change',
        detail: `Context window changed: ${prior.contextWindow}→${model.contextWindow}`,
      });
    }
  }

  for (const prior of lastSnapshots) {
    if (!newModelIds.has(prior.modelId)) {
      flags.push({
        modelId: prior.modelId,
        type: 'disappeared_model',
        detail: `Model ${prior.displayName} was in last snapshot but not in new extraction`,
      });
    }
  }

  return flags;
}

async function getLastSnapshots(provider: string) {
  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      displayName: string;
      inputPerMTok: number;
      outputPerMTok: number;
      contextWindow: number | null;
    }>
  >`
    SELECT DISTINCT ON ("modelId")
      "modelId", "displayName", "inputPerMTok", "outputPerMTok", "contextWindow"
    FROM "ModelPricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  return snapshots;
}
