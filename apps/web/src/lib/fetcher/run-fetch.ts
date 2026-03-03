import { PRICING_PROVIDERS } from './providers';
import { fetchPricingPage } from './scraper';
import { extractPricing } from './extractor';
import {
  saveSnapshots,
  seedFromStatic,
  getLastFetchRun,
  saveFetchRun,
  type FetchWarning,
} from './store';

export async function runPricingFetch(): Promise<{
  totalModels: number;
  errors: string[];
  warnings: FetchWarning[];
}> {
  // Seed DB from static data if empty (first run)
  await seedFromStatic();

  let totalModels = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];

  for (const [providerId, config] of Object.entries(PRICING_PROVIDERS)) {
    try {
      console.log(`Fetching pricing for ${config.displayName}...`);
      const pageText = await fetchPricingPage(config.url);

      console.log(`Extracting pricing for ${config.displayName}...`);
      const extraction = await extractPricing(providerId, pageText);

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no models extracted');
        continue;
      }

      const saved = await saveSnapshots(providerId, extraction.models);
      totalModels += saved;
      console.log(`${config.displayName}: saved ${saved} models`);

      // Detect missing and new models by comparing with previous run
      const currentModelIds = extraction.models.map((m) => m.modelId);
      const lastRun = await getLastFetchRun(providerId);
      const previousModelIds = lastRun?.modelsFound ?? [];

      const missing = previousModelIds.filter((id) => !currentModelIds.includes(id));
      const newModels = currentModelIds.filter((id) => !previousModelIds.includes(id));

      if (missing.length > 0) {
        warnings.push({
          type: 'models_missing',
          provider: providerId,
          modelIds: missing,
          message: `${missing.length} model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, extraction.models.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  console.log(`Pricing fetch complete: ${totalModels} models, ${errors.length} errors, ${warnings.length} warnings`);
  return { totalModels, errors, warnings };
}
