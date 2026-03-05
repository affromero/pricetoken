import { prisma } from '@/lib/prisma';
import type { ExtractedImageModel } from './image-store';
import type { PriorConsistencyFlag } from './verification-types';

const PRICE_CHANGE_THRESHOLD = 0.5; // 50%

export async function checkImagePriorConsistency(
  provider: string,
  models: ExtractedImageModel[]
): Promise<PriorConsistencyFlag[]> {
  const lastSnapshots = await getLastImageSnapshots(provider);
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
        detail: `New image model not seen before: ${model.displayName}`,
      });
      continue;
    }

    const priceChange = Math.abs(model.pricePerImage - prior.pricePerImage) / prior.pricePerImage;

    if (priceChange > PRICE_CHANGE_THRESHOLD) {
      flags.push({
        modelId: model.modelId,
        type: 'price_change',
        detail: `Price changed >50%: $${prior.pricePerImage}/image → $${model.pricePerImage}/image`,
      });
    }
  }

  for (const prior of lastSnapshots) {
    if (!newModelIds.has(prior.modelId)) {
      flags.push({
        modelId: prior.modelId,
        type: 'disappeared_model',
        detail: `Image model ${prior.displayName} was in last snapshot but not in new extraction`,
      });
    }
  }

  return flags;
}

async function getLastImageSnapshots(provider: string) {
  const snapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      displayName: string;
      pricePerImage: number;
    }>
  >`
    SELECT DISTINCT ON ("modelId")
      "modelId", "displayName", "pricePerImage"
    FROM "ImagePricingSnapshot"
    WHERE "provider" = ${provider}
    ORDER BY "modelId", "createdAt" DESC
  `;
  return snapshots;
}
