import type { MusicModelPricing, MusicProviderSummary } from 'pricetoken';
import { getLatestMusicPricing, getMusicPriceHistory } from './fetcher/music-store';
import { MUSIC_PROVIDERS } from './fetcher/music-providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentMusicPricing(provider?: string, dateRange?: DateRange): Promise<MusicModelPricing[]> {
  let models = await getLatestMusicPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getMusicModelPricing(modelId: string): Promise<MusicModelPricing | null> {
  const all = await getLatestMusicPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getMusicPriceHistory };

export async function getMusicProviderSummaries(): Promise<MusicProviderSummary[]> {
  const all = await getLatestMusicPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: MusicModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = MUSIC_PROVIDERS[model.provider];
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

export async function compareMusicModels(modelIds: string[]): Promise<MusicModelPricing[]> {
  const all = await getLatestMusicPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestMusicModel(provider?: string, dateRange?: DateRange): Promise<MusicModelPricing | null> {
  let all = await getLatestMusicPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.costPerMinute < cheapest.costPerMinute ? model : cheapest
  );
}
