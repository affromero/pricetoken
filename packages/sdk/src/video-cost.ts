import type { VideoCostEstimate, VideoModelPricing } from './types';
import { STATIC_VIDEO_PRICING } from './video-static';

export function calculateVideoCost(
  modelId: string,
  costPerMinute: number,
  durationSeconds: number
): VideoCostEstimate {
  const totalCost = (durationSeconds / 60) * costPerMinute;

  return {
    modelId,
    durationSeconds,
    costPerMinute,
    totalCost,
  };
}

export function calculateVideoModelCost(
  modelId: string,
  durationSeconds: number,
  pricing?: VideoModelPricing[]
): VideoCostEstimate {
  const data = pricing ?? STATIC_VIDEO_PRICING;
  const model = data.find((m) => m.modelId === modelId);

  if (!model) {
    throw new Error(`Unknown video model: ${modelId}. Provide pricing data or use calculateVideoCost().`);
  }

  return calculateVideoCost(modelId, model.costPerMinute, durationSeconds);
}
