import type { ImageCostEstimate, ImageModelPricing } from './types';
import { STATIC_IMAGE_PRICING } from './static-image';

export function calculateImageCost(
  modelId: string,
  pricePerImage: number,
  imageCount: number
): ImageCostEstimate {
  return {
    modelId,
    imageCount,
    pricePerImage,
    totalCost: pricePerImage * imageCount,
  };
}

export function calculateImageModelCost(
  modelId: string,
  imageCount: number,
  pricing?: ImageModelPricing[]
): ImageCostEstimate {
  const data = pricing ?? STATIC_IMAGE_PRICING;
  const model = data.find((m) => m.modelId === modelId);
  if (!model) {
    throw new Error(`Unknown image model: ${modelId}. Provide pricing data or use calculateImageCost().`);
  }
  return calculateImageCost(modelId, model.pricePerImage, imageCount);
}
