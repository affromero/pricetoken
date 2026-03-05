import { IMAGE_PRICING_PROVIDERS } from './image-providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractImagePricing } from './image-extractor';
import {
  saveImageSnapshots,
  seedImageFromStatic,
} from './image-store';
import { saveFetchRun, getLastFetchRun, type FetchWarning } from './store';
import { imageCrossVerify } from './image-cross-verify';
import { checkImagePriorConsistency } from './image-prior-check';
import { buildImageConsensus } from './image-consensus';
import { checkImagePriceSanity } from './sanity-bounds';
import type { ImageVerificationResult } from './image-verification-types';

export interface ImageFetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, ImageVerificationResult>;
}

export async function runImagePricingFetch(): Promise<ImageFetchResult> {
  await seedImageFromStatic();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, ImageVerificationResult>();

  for (const [providerId, config] of Object.entries(IMAGE_PRICING_PROVIDERS)) {
    const logProvider = `image:${providerId}`;
    try {
      console.log(`Fetching image pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url)
        : await fetchPricingPage(config.url);

      console.log(`Extracting image pricing for ${config.displayName}...`);
      const extraction = await extractImagePricing(providerId, pageText);

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no image models extracted`);
        await saveFetchRun(logProvider, [], [], [], 0, 'no image models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = extraction.models.filter((m) => {
        const check = checkImagePriceSanity(m.modelId, m.pricePerImage);
        if (!check.valid) {
          console.warn(`Sanity check failed for ${m.modelId}: ${check.reason}`);
          warnings.push({
            type: 'sanity_check_failed',
            provider: logProvider,
            modelIds: [m.modelId],
            message: check.reason!,
          });
        }
        return check.valid;
      });

      if (saneModels.length === 0) {
        errors.push(`${config.displayName}: all models failed sanity checks`);
        await saveFetchRun(logProvider, [], [], [], 0, 'all models failed sanity checks');
        continue;
      }

      console.log(`Verifying image pricing for ${config.displayName}...`);
      const agentResults = await imageCrossVerify(pageText, saneModels);

      const priorFlags = await checkImagePriorConsistency(providerId, saneModels);

      const consensus = buildImageConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      if (consensus.approved.length > 0) {
        const saved = await saveImageSnapshots(providerId, consensus.approved, 'verified');
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified image models`);
      }

      if (consensus.flagged.length > 0) {
        totalFlagged += consensus.flagged.length;
        console.warn(
          `${config.displayName}: ${consensus.flagged.length} image models flagged for review:`,
          consensus.flagged.map((m) => m.modelId)
        );
      }

      const currentModelIds = consensus.approved.map((m) => m.modelId);
      const lastRun = await getLastFetchRun(logProvider);
      const previousModelIds = lastRun?.modelsFound ?? [];

      const missing = previousModelIds.filter((id: string) => !currentModelIds.includes(id));
      const newModels = currentModelIds.filter((id: string) => !previousModelIds.includes(id));

      if (missing.length > 0) {
        warnings.push({
          type: 'models_missing',
          provider: logProvider,
          modelIds: missing,
          message: `${missing.length} image model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(logProvider, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching image pricing for ${config.displayName}:`, message);
      await saveFetchRun(logProvider, [], [], [], 0, message).catch(() => {});
    }
  }

  console.log(
    `Image pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
