import type { SttModelPricing, SttProviderSummary } from 'pricetoken';
import { getLatestSttPricing, getSttPriceHistory } from './fetcher/stt-store';
import { STT_PROVIDERS } from './fetcher/stt-providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentSttPricing(provider?: string, dateRange?: DateRange): Promise<SttModelPricing[]> {
  let models = await getLatestSttPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getSttModelPricing(modelId: string): Promise<SttModelPricing | null> {
  const all = await getLatestSttPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getSttPriceHistory };

export async function getSttProviderSummaries(): Promise<SttProviderSummary[]> {
  const all = await getLatestSttPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: SttModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = STT_PROVIDERS[model.provider];
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

export async function compareSttModels(modelIds: string[]): Promise<SttModelPricing[]> {
  const all = await getLatestSttPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestSttModel(provider?: string, dateRange?: DateRange): Promise<SttModelPricing | null> {
  let all = await getLatestSttPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.costPerMinute < cheapest.costPerMinute ? model : cheapest
  );
}
