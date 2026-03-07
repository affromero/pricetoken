import { STATIC_VIDEO_PRICING } from 'pricetoken';
import { VIDEO_PROVIDERS } from './providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractVideoPricing } from './video-extractor';
import {
  saveVideoSnapshots,
  seedVideoFromStatic,
  carryForwardMissingVideo,
  getKnownVideoModelIds,
} from './video-store';
import { getLastFetchRun, saveFetchRun, type FetchWarning } from './store';
import { videoCrossVerify } from './video-cross-verify';
import { checkVideoPriorConsistency } from './video-prior-check';
import { buildVideoConsensus } from './video-consensus';
import { checkVideoPriceSanity } from './sanity-bounds';
import { VIDEO_VERIFICATION_SYSTEM_PROMPT } from './video-verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
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

  const knownIds = await getKnownVideoModelIds();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, VideoVerificationResult>();

  const startOfDay = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  for (const [providerId, config] of Object.entries(VIDEO_PROVIDERS)) {
    try {
      // Skip providers that already have a successful run today
      const todayRun = await getLastFetchRun(providerId);
      if (todayRun && todayRun.createdAt >= startOfDay && !todayRun.error && todayRun.totalExtracted > 0) {
        console.log(`${config.displayName}: already verified today (${todayRun.totalExtracted} video models), skipping`);
        totalModels += todayRun.totalExtracted;
        continue;
      }

      console.log(`Fetching video pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url)
        : await fetchPricingPage(config.url);

      console.log(`Extracting video pricing for ${config.displayName}...`);
      let extraction = await extractVideoPricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: video extraction returned 0 models, retrying once...`);
        extraction = await extractVideoPricing(providerId, pageText);
      }

      // Try fallback URLs when primary extraction fails
      if (extraction.models.length === 0 && config.fallbackUrls?.length) {
        for (const fallbackUrl of config.fallbackUrls) {
          try {
            console.log(`${config.displayName}: trying fallback URL ${fallbackUrl}...`);
            const fallbackText = config.requiresBrowser
              ? await fetchPricingPageWithBrowser(fallbackUrl)
              : await fetchPricingPage(fallbackUrl);
            extraction = await extractVideoPricing(providerId, fallbackText);
            if (extraction.models.length > 0) {
              console.log(`${config.displayName}: recovered ${extraction.models.length} video model(s) from fallback`);
              break;
            }
          } catch {
            console.warn(`${config.displayName}: fallback URL ${fallbackUrl} failed`);
          }
        }
      }

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no video models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no video models extracted');
        continue;
      }

      // Filter out unknown modelIds (AI hallucinations)
      const knownModels = extraction.models.filter((m) => knownIds.has(m.modelId));
      const unknownCount = extraction.models.length - knownModels.length;
      if (unknownCount > 0) {
        const unknownIds = extraction.models
          .filter((m) => !knownIds.has(m.modelId))
          .map((m) => m.modelId);
        console.warn(
          `${config.displayName}: filtered out ${unknownCount} unknown video model(s): ${unknownIds.join(', ')}`
        );
      }

      if (knownModels.length === 0) {
        errors.push(`${config.displayName}: no known video models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no known video models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = knownModels.filter((m) => {
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
        const saved = await saveVideoSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified video models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged video model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await videoCrossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildVideoConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveVideoSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged video model(s) passed area chair review (low confidence)`);
        }

        // Tier 3 — General Chair: arbitrate still-flagged models
        if (retryConsensus.flagged.length > 0) {
          const fetcherConfig = await getFetcherConfig();
          const arbitrator = parseArbitratorAgent(fetcherConfig);

          if (arbitrator) {
            const stillFlaggedModels = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            const allPriorVerdicts = [...agentResults, ...retryAgentResults];
            const arbResult = await arbitrate({
              arbitrator,
              systemPrompt: VIDEO_VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'video_verification',
              label: `Video/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildVideoConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveVideoSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} video model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveVideoSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} video model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveVideoSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} video model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveVideoSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} video model(s) still flagged after area chair (no arbitrator configured):`,
              retryConsensus.flagged.map((m) => m.modelId)
            );
          }
        }
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
