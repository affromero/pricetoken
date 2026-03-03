import type { CostEstimate, ModelPricing } from './types';
import { STATIC_PRICING } from './static';

export function calculateCost(
  modelId: string,
  inputPerMTok: number,
  outputPerMTok: number,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const inputCost = (inputTokens / 1_000_000) * inputPerMTok;
  const outputCost = (outputTokens / 1_000_000) * outputPerMTok;

  return {
    modelId,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function calculateModelCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  pricing?: ModelPricing[]
): CostEstimate {
  const data = pricing ?? STATIC_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown model: ${modelId}. Provide pricing data or use calculateCost().`);
  }

  return calculateCost(modelId, model.inputPerMTok, model.outputPerMTok, inputTokens, outputTokens);
}
