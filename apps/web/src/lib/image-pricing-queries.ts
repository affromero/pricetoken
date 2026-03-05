import type { ImageModelPricing, ImageProviderSummary } from 'pricetoken';
import { getLatestImagePricing, getImagePriceHistory } from './fetcher/image-store';
import { IMAGE_PRICING_PROVIDERS } from './fetcher/image-providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentImagePricing(provider?: string, dateRange?: DateRange): Promise<ImageModelPricing[]> {
  let models = await getLatestImagePricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getImageModelPricing(modelId: string): Promise<ImageModelPricing | null> {
  const all = await getLatestImagePricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getImagePriceHistory };

export async function getImageProviderSummaries(): Promise<ImageProviderSummary[]> {
  const all = await getLatestImagePricing();
  const providerMap = new Map<string, { displayName: string; models: ImageModelPricing[] }>();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = IMAGE_PRICING_PROVIDERS[model.provider];
      const displayName = config?.displayName ?? model.provider;
      providerMap.set(model.provider, { displayName, models: [] });
    }
    providerMap.get(model.provider)!.models.push(model);
  }

  return Array.from(providerMap.entries()).map(([id, data]) => ({
    id,
    displayName: data.displayName,
    modelCount: data.models.length,
    cheapestPerImage: Math.min(...data.models.map((m) => m.pricePerImage)),
  }));
}

export async function compareImageModels(modelIds: string[]): Promise<ImageModelPricing[]> {
  const all = await getLatestImagePricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestImageModel(provider?: string, dateRange?: DateRange): Promise<ImageModelPricing | null> {
  let all = await getLatestImagePricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;
  return all.reduce((cheapest, model) => model.pricePerImage < cheapest.pricePerImage ? model : cheapest);
}
