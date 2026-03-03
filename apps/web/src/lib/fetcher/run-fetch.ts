import { PRICING_PROVIDERS } from './providers';
import { fetchPricingPage } from './scraper';
import { extractPricing } from './extractor';
import { saveSnapshots, seedFromStatic } from './store';
import { crossVerify } from './cross-verify';
import { checkPriorConsistency } from './prior-check';
import { buildConsensus } from './consensus';
import type { VerificationResult } from './verification-types';

export interface FetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  verificationResults: Map<string, VerificationResult>;
}

export async function runPricingFetch(): Promise<FetchResult> {
  // Seed DB from static data if empty (first run)
  await seedFromStatic();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const verificationResults = new Map<string, VerificationResult>();

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

      // Layer 2: Cross-verify with multiple AI agents
      console.log(`Verifying pricing for ${config.displayName}...`);
      const agentResults = await crossVerify(pageText, extraction.models);

      // Layer 3: Check against prior snapshots
      const priorFlags = await checkPriorConsistency(providerId, extraction.models);

      // Layer 4: Build consensus
      const consensus = buildConsensus(extraction.models, agentResults, priorFlags);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching ${config.displayName}:`, message);
    }
  }

  console.log(
    `Pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${errors.length} errors`
  );
  return { totalModels, totalFlagged, errors, verificationResults };
}
