import type { MusicCostEstimate, MusicModelPricing } from './types';
import { STATIC_MUSIC_PRICING } from './music-static';

export function calculateMusicCost(
  modelId: string,
  costPerMinute: number,
  durationSeconds: number
): MusicCostEstimate {
  const totalCost = (durationSeconds / 60) * costPerMinute;

  return {
    modelId,
    durationSeconds,
    costPerMinute,
    totalCost,
  };
}

export function calculateMusicModelCost(
  modelId: string,
  durationSeconds: number,
  pricing?: MusicModelPricing[]
): MusicCostEstimate {
  const data = pricing ?? STATIC_MUSIC_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown music model: ${modelId}. Provide pricing data or use calculateMusicCost().`);
  }

  return calculateMusicCost(modelId, model.costPerMinute, durationSeconds);
}
