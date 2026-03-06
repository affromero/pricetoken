import type { TtsCostEstimate, TtsModelPricing } from './types';
import { STATIC_TTS_PRICING } from './tts-static';

export function calculateTtsCost(
  modelId: string,
  costPerMChars: number,
  characters: number
): TtsCostEstimate {
  const totalCost = (characters / 1_000_000) * costPerMChars;

  return {
    modelId,
    characters,
    costPerMChars,
    totalCost,
  };
}

export function calculateTtsModelCost(
  modelId: string,
  characters: number,
  pricing?: TtsModelPricing[]
): TtsCostEstimate {
  const data = pricing ?? STATIC_TTS_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown TTS model: ${modelId}. Provide pricing data or use calculateTtsCost().`);
  }

  return calculateTtsCost(modelId, model.costPerMChars, characters);
}
