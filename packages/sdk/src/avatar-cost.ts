import type { AvatarCostEstimate, AvatarModelPricing } from './types';
import { STATIC_AVATAR_PRICING } from './avatar-static';

export function calculateAvatarCost(
  modelId: string,
  costPerMinute: number,
  durationSeconds: number
): AvatarCostEstimate {
  const totalCost = (durationSeconds / 60) * costPerMinute;

  return {
    modelId,
    durationSeconds,
    costPerMinute,
    totalCost,
  };
}

export function calculateAvatarModelCost(
  modelId: string,
  durationSeconds: number,
  pricing?: AvatarModelPricing[]
): AvatarCostEstimate {
  const data = pricing ?? STATIC_AVATAR_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown avatar model: ${modelId}. Provide pricing data or use calculateAvatarCost().`);
  }

  return calculateAvatarCost(modelId, model.costPerMinute, durationSeconds);
}
