import type { TtsModelPricing, TtsProviderSummary } from 'pricetoken';
import { getLatestTtsPricing, getTtsPriceHistory } from './fetcher/tts-store';
import { TTS_PROVIDERS } from './fetcher/tts-providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentTtsPricing(provider?: string, dateRange?: DateRange): Promise<TtsModelPricing[]> {
  let models = await getLatestTtsPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getTtsModelPricing(modelId: string): Promise<TtsModelPricing | null> {
  const all = await getLatestTtsPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getTtsPriceHistory };

export async function getTtsProviderSummaries(): Promise<TtsProviderSummary[]> {
  const all = await getLatestTtsPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: TtsModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = TTS_PROVIDERS[model.provider];
      const displayName = config?.displayName ?? model.provider;
      providerMap.set(model.provider, { displayName, models: [] });
    }
    providerMap.get(model.provider)!.models.push(model);
  }

  return Array.from(providerMap.entries()).map(([id, data]) => ({
    id,
    displayName: data.displayName,
    modelCount: data.models.length,
    cheapestCostPerMChars: Math.min(...data.models.map((m) => m.costPerMChars)),
  }));
}

export async function compareTtsModels(modelIds: string[]): Promise<TtsModelPricing[]> {
  const all = await getLatestTtsPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestTtsModel(provider?: string, dateRange?: DateRange): Promise<TtsModelPricing | null> {
  let all = await getLatestTtsPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.costPerMChars < cheapest.costPerMChars ? model : cheapest
  );
}
