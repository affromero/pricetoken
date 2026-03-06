import type { AvatarModelPricing, AvatarProviderSummary } from 'pricetoken';
import { getLatestAvatarPricing, getAvatarPriceHistory } from './fetcher/avatar-store';
import { AVATAR_PROVIDERS } from './fetcher/avatar-providers';

export interface DateRange {
  after?: string;
  before?: string;
}

export async function getCurrentAvatarPricing(provider?: string, dateRange?: DateRange): Promise<AvatarModelPricing[]> {
  let models = await getLatestAvatarPricing(provider);
  if (dateRange?.after) models = models.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) models = models.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  return models;
}

export async function getAvatarModelPricing(modelId: string): Promise<AvatarModelPricing | null> {
  const all = await getLatestAvatarPricing();
  return all.find((m) => m.modelId === modelId) ?? null;
}

export { getAvatarPriceHistory };

export async function getAvatarProviderSummaries(): Promise<AvatarProviderSummary[]> {
  const all = await getLatestAvatarPricing();

  const providerMap = new Map<
    string,
    { displayName: string; models: AvatarModelPricing[] }
  >();

  for (const model of all) {
    if (!providerMap.has(model.provider)) {
      const config = AVATAR_PROVIDERS[model.provider];
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

export async function compareAvatarModels(modelIds: string[]): Promise<AvatarModelPricing[]> {
  const all = await getLatestAvatarPricing();
  const idSet = new Set(modelIds);
  return all.filter((m) => idSet.has(m.modelId));
}

export async function getCheapestAvatarModel(provider?: string, dateRange?: DateRange): Promise<AvatarModelPricing | null> {
  let all = await getLatestAvatarPricing(provider);
  if (dateRange?.after) all = all.filter((m) => m.launchDate && m.launchDate >= dateRange.after!);
  if (dateRange?.before) all = all.filter((m) => m.launchDate && m.launchDate <= dateRange.before!);
  if (all.length === 0) return null;

  return all.reduce((cheapest, model) =>
    model.costPerMinute < cheapest.costPerMinute ? model : cheapest
  );
}
