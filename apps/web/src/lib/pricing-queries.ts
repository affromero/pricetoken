import type { ModelPricing, ProviderSummary } from 'pricetoken';
import { getLatestPricing, getPriceHistory } from './fetcher/store';
import { PRICING_PROVIDERS } from './fetcher/providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentPricing(provider?: string, dateRange?: DateRange): Promise<ModelPricing[]> {
  let models = await getLatestPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getModelPricing(modelId: string): Promise<ModelPricing | null> {
  const all = await getLatestPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getPriceHistory };

export async function getProviderSummaries(): Promise<ProviderSummary[]> {
  const all = await getLatestPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: ModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = PRICING_PROVIDERS[model.provider];
      const displayName = config?.displayName ?? model.provider;
      providerMap.set(model.provider, { displayName, models: [] });
    }
    providerMap.get(model.provider)!.models.push(model);
  }

  return Array.from(providerMap.entries()).map(([id, data]) => ({
    id,
    displayName: data.displayName,
    modelCount: data.models.length,
    cheapestInputPerMTok: Math.min(...data.models.map((m) => m.inputPerMTok)),
    cheapestOutputPerMTok: Math.min(...data.models.map((m) => m.outputPerMTok)),
  }));
}

export async function compareModels(modelIds: string[]): Promise<ModelPricing[]> {
  const all = await getLatestPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestModel(provider?: string, dateRange?: DateRange): Promise<ModelPricing | null> {
  let all = await getLatestPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.inputPerMTok + model.outputPerMTok < cheapest.inputPerMTok + cheapest.outputPerMTok
      ? model
      : cheapest
  );
}
