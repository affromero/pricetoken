import { STATIC_VIDEO_PRICING } from 'pricetoken';
import { VIDEO_PROVIDERS } from './providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractVideoPricing } from './video-extractor';
import {
  saveVideoSnapshots,
  seedVideoFromStatic,
  carryForwardMissingVideo,
} from './video-store';
import { getLastFetchRun, saveFetchRun, type FetchWarning } from './store';
import { videoCrossVerify } from './video-cross-verify';
import { checkVideoPriorConsistency } from './video-prior-check';
import { buildVideoConsensus } from './video-consensus';
import { checkVideoPriceSanity } from './sanity-bounds';
import type { VideoVerificationResult } from './video-verification-types';

export interface VideoFetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, VideoVerificationResult>;
}

export async function runVideoFetch(): Promise<VideoFetchResult> {
  await seedVideoFromStatic(STATIC_VIDEO_PRICING);

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, VideoVerificationResult>();

  for (const [providerId, config] of Object.entries(VIDEO_PROVIDERS)) {
    try {
      console.log(`Fetching video pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url)
        : await fetchPricingPage(config.url);

      console.log(`Extracting video pricing for ${config.displayName}...`);
      const extraction = await extractVideoPricing(providerId, pageText);

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no video models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no video models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = extraction.models.filter((m) => {
        const check = checkVideoPriceSanity(m.modelId, m.costPerMinute);
        if (!check.valid) {
          console.warn(`Sanity check failed for ${m.modelId}: ${check.reason}`);
          warnings.push({
            type: 'sanity_check_failed',
            provider: providerId,
            modelIds: [m.modelId],
            message: check.reason!,
          });
        }
        return check.valid;
      });

      if (saneModels.length === 0) {
        errors.push(`${config.displayName}: all models failed sanity checks`);
        await saveFetchRun(providerId, [], [], [], 0, 'all models failed sanity checks');
        continue;
      }

      console.log(`Verifying video pricing for ${config.displayName}...`);
      const agentResults = await videoCrossVerify(pageText, saneModels);

      const priorFlags = await checkVideoPriorConsistency(providerId, saneModels);

      const consensus = buildVideoConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      if (consensus.approved.length > 0) {
        const saved = await saveVideoSnapshots(providerId, consensus.approved, 'verified');
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified video models`);
      }

      if (consensus.flagged.length > 0) {
        totalFlagged += consensus.flagged.length;
        console.warn(
          `${config.displayName}: ${consensus.flagged.length} video models flagged for review:`,
          consensus.flagged.map((m) => m.modelId)
        );
      }

      const currentModelIds = consensus.approved.map((m) => m.modelId);
      const lastRun = await getLastFetchRun(providerId);
      const previousModelIds = lastRun?.modelsFound ?? [];

      const missing = previousModelIds.filter((id: string) => !currentModelIds.includes(id));
      const newModels = currentModelIds.filter((id: string) => !previousModelIds.includes(id));

      if (missing.length > 0) {
        warnings.push({
          type: 'models_missing',
          provider: providerId,
          modelIds: missing,
          message: `${missing.length} video model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching video pricing for ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  const carried = await carryForwardMissingVideo();
  if (carried > 0) {
    console.log(`Carried forward ${carried} video models with no new data today`);
  }

  console.log(
    `Video pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
