import type { SttCostEstimate, SttModelPricing } from './types';
import { STATIC_STT_PRICING } from './stt-static';

export function calculateSttCost(
  modelId: string,
  costPerMinute: number,
  durationSeconds: number
): SttCostEstimate {
  const totalCost = (durationSeconds / 60) * costPerMinute;

  return {
    modelId,
    durationSeconds,
    costPerMinute,
    totalCost,
  };
}

export function calculateSttModelCost(
  modelId: string,
  durationSeconds: number,
  pricing?: SttModelPricing[]
): SttCostEstimate {
  const data = pricing ?? STATIC_STT_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown STT model: ${modelId}. Provide pricing data or use calculateSttCost().`);
  }

  return calculateSttCost(modelId, model.costPerMinute, durationSeconds);
}
