import type { VideoModelPricing, VideoProviderSummary } from 'pricetoken';
import { getLatestVideoPricing, getVideoPriceHistory } from './fetcher/video-store';
import { VIDEO_PROVIDERS } from './fetcher/providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentVideoPricing(provider?: string, dateRange?: DateRange): Promise<VideoModelPricing[]> {
  let models = await getLatestVideoPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getVideoModelPricing(modelId: string): Promise<VideoModelPricing | null> {
  const all = await getLatestVideoPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getVideoPriceHistory };

export async function getVideoProviderSummaries(): Promise<VideoProviderSummary[]> {
  const all = await getLatestVideoPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: VideoModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = VIDEO_PROVIDERS[model.provider];
      const displayName = config?.displayName ?? model.provider;
      providerMap.set(model.provider, { displayName, models: [] });
    }
    providerMap.get(model.provider)!.models.push(model);
  }

  return Array.from(providerMap.entries()).map(([id, data]) => ({
    id,
    displayName: data.displayName,
    modelCount: data.models.length,
    cheapestCostPerMinute: Math.min(...data.models.map((m) => m.costPerMinute)),
  }));
}

export async function compareVideoModels(modelIds: string[]): Promise<VideoModelPricing[]> {
  const all = await getLatestVideoPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestVideoModel(provider?: string, dateRange?: DateRange): Promise<VideoModelPricing | null> {
  let all = await getLatestVideoPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.costPerMinute < cheapest.costPerMinute ? model : cheapest
  );
}
