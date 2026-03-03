import { PRICING_PROVIDERS } from './providers';
import { fetchPricingPage } from './scraper';
import { extractPricing } from './extractor';
import { saveSnapshots, seedFromStatic } from './store';

export async function runPricingFetch(): Promise<{
  totalModels: number;
  errors: string[];
}> {
  // Seed DB from static data if empty (first run)
  await seedFromStatic();

  let totalModels = 0;
  const errors: string[] = [];

  for (const [providerId, config] of Object.entries(PRICING_PROVIDERS)) {
    try {
      console.log(`Fetching pricing for ${config.displayName}...`);
      const pageText = await fetchPricingPage(config.url);

      console.log(`Extracting pricing for ${config.displayName}...`);
      const extraction = await extractPricing(providerId, pageText);

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no models extracted`);
        continue;
      }

      const saved = await saveSnapshots(providerId, extraction.models);
      totalModels += saved;
      console.log(`${config.displayName}: saved ${saved} models`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching ${config.displayName}:`, message);
    }
  }

  console.log(`Pricing fetch complete: ${totalModels} models, ${errors.length} errors`);
  return { totalModels, errors };
}
