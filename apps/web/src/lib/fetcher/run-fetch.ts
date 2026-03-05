import { PRICING_PROVIDERS } from './providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractPricing } from './extractor';
import {
  saveSnapshots,
  seedFromStatic,
  getLastFetchRun,
  saveFetchRun,
  carryForwardMissing,
  getKnownModelIds,
  type FetchWarning,
} from './store';
import { fetchFallbackPricing } from './fallback';
import { crossVerify } from './cross-verify';
import { checkPriorConsistency } from './prior-check';
import { buildConsensus } from './consensus';
import type { VerificationResult } from './verification-types';

export interface FetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, VerificationResult>;
}

export async function runPricingFetch(): Promise<FetchResult> {
  // Seed DB from static data if empty (first run)
  await seedFromStatic();

  // Only accept models we already track (prevents AI hallucinating new modelIds)
  const knownIds = await getKnownModelIds();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, VerificationResult>();

  for (const [providerId, config] of Object.entries(PRICING_PROVIDERS)) {
    try {
      console.log(`Fetching pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url)
        : await fetchPricingPage(config.url);

      console.log(`Extracting pricing for ${config.displayName}...`);
      const extraction = await extractPricing(providerId, pageText);

      // Filter out unknown modelIds (AI hallucinations)
      const knownModels = extraction.models.filter((m) => knownIds.has(m.modelId));
      const unknownCount = extraction.models.length - knownModels.length;
      if (unknownCount > 0) {
        const unknownIds = extraction.models
          .filter((m) => !knownIds.has(m.modelId))
          .map((m) => m.modelId);
        console.warn(
          `${config.displayName}: filtered out ${unknownCount} unknown model(s): ${unknownIds.join(', ')}`
        );
      }

      if (knownModels.length === 0) {
        errors.push(`${config.displayName}: no known models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no known models extracted');
        continue;
      }

      // Layer 2: Cross-verify with multiple AI agents
      console.log(`Verifying pricing for ${config.displayName}...`);
      const agentResults = await crossVerify(pageText, knownModels);

      // Layer 3: Check against prior snapshots
      const priorFlags = await checkPriorConsistency(providerId, knownModels);

      // Layer 4: Build consensus
      const consensus = buildConsensus(knownModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      // Save only approved models with 'verified' source
      if (consensus.approved.length > 0) {
        const saved = await saveSnapshots(providerId, consensus.approved, 'verified');
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified models`);
      }

      // Log flagged models
      if (consensus.flagged.length > 0) {
        totalFlagged += consensus.flagged.length;
        console.warn(
          `${config.displayName}: ${consensus.flagged.length} models flagged for review:`,
          consensus.flagged.map((m) => m.modelId)
        );
      }

      // Detect missing and new models by comparing with previous run
      const currentModelIds = consensus.approved.map((m) => m.modelId);
      const lastRun = await getLastFetchRun(providerId);
      const previousModelIds = lastRun?.modelsFound ?? [];

      const missing = previousModelIds.filter((id: string) => !currentModelIds.includes(id));
      const newModels = currentModelIds.filter((id: string) => !previousModelIds.includes(id));

      if (missing.length > 0 && config.fallbackUrls?.length) {
        console.log(`Attempting fallback for ${missing.length} missing ${config.displayName} model(s)...`);
        const fallbackResults = await fetchFallbackPricing(providerId, config.fallbackUrls, missing, config.requiresBrowser);
        for (const result of fallbackResults) {
          const fallbackSaved = await saveSnapshots(providerId, result.models, 'fetched', 'low');
          totalModels += fallbackSaved;
          console.log(`Fallback: saved ${fallbackSaved} model(s) from ${result.sourceUrl} (low confidence)`);
          warnings.push({
            type: 'low_confidence',
            provider: providerId,
            modelIds: result.models.map((m) => m.modelId),
            message: `${result.models.length} model(s) recovered via fallback for ${config.displayName} (low confidence)`,
          });
        }
      }

      if (missing.length > 0) {
        warnings.push({
          type: 'models_missing',
          provider: providerId,
          modelIds: missing,
          message: `${missing.length} model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  // Carry forward last known price for any model missing today's snapshot
  const carried = await carryForwardMissing();
  if (carried > 0) {
    console.log(`Carried forward ${carried} models with no new data today`);
  }

  console.log(
    `Pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
