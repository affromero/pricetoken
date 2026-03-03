import { fetchPricingPage } from './scraper';
import { extractPricing } from './extractor';
import type { ExtractedModel } from './extractor';

export interface FallbackResult {
  models: ExtractedModel[];
  sourceUrl: string;
}

export async function fetchFallbackPricing(
  providerId: string,
  fallbackUrls: string[],
  missingModelIds: string[]
): Promise<FallbackResult[]> {
  const results: FallbackResult[] = [];

  for (const url of fallbackUrls) {
    try {
      const pageText = await fetchPricingPage(url);
      const extraction = await extractPricing(providerId, pageText);
      const matched = extraction.models.filter((m) =>
        missingModelIds.includes(m.modelId)
      );

      if (matched.length > 0) {
        results.push({ models: matched, sourceUrl: url });
      }
    } catch {
      console.warn(`Fallback fetch failed for ${providerId} from ${url}`);
    }
  }

  return results;
}
