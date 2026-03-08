import { IMAGE_PRICING_PROVIDERS } from './image-providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractImagePricing } from './image-extractor';
import {
  saveImageSnapshots,
  seedImageFromStatic,
  carryForwardMissingImages,
  getKnownImageModelIds,
} from './image-store';
import { saveFetchRun, getLastFetchRun, type FetchWarning } from './store';
import { imageCrossVerify } from './image-cross-verify';
import { checkImagePriorConsistency } from './image-prior-check';
import { buildImageConsensus } from './image-consensus';
import { checkImagePriceSanity } from './sanity-bounds';
import { IMAGE_VERIFICATION_SYSTEM_PROMPT } from './image-verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
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

  const knownIds = await getKnownImageModelIds();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, ImageVerificationResult>();

  const startOfDay = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  for (const [providerId, config] of Object.entries(IMAGE_PRICING_PROVIDERS)) {
    const logProvider = `image:${providerId}`;
    try {
      // Skip providers that already have a successful run today
      const todayRun = await getLastFetchRun(logProvider);
      if (todayRun && todayRun.createdAt >= startOfDay && !todayRun.error && todayRun.totalExtracted > 0) {
        console.log(`${config.displayName}: already verified today (${todayRun.totalExtracted} image models), skipping`);
        totalModels += todayRun.totalExtracted;
        continue;
      }

      console.log(`Fetching image pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url, config.browserOptions)
        : await fetchPricingPage(config.url);

      console.log(`Extracting image pricing for ${config.displayName}...`);
      let extraction = await extractImagePricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: image extraction returned 0 models, retrying once...`);
        extraction = await extractImagePricing(providerId, pageText);
      }

      // Try fallback URLs when primary extraction fails
      if (extraction.models.length === 0 && config.fallbackUrls?.length) {
        for (const fallbackUrl of config.fallbackUrls) {
          try {
            console.log(`${config.displayName}: trying fallback URL ${fallbackUrl}...`);
            const fallbackText = config.requiresBrowser
              ? await fetchPricingPageWithBrowser(fallbackUrl, config.browserOptions)
              : await fetchPricingPage(fallbackUrl);
            extraction = await extractImagePricing(providerId, fallbackText);
            if (extraction.models.length > 0) {
              console.log(`${config.displayName}: recovered ${extraction.models.length} image model(s) from fallback`);
              break;
            }
          } catch {
            console.warn(`${config.displayName}: fallback URL ${fallbackUrl} failed`);
          }
        }
      }

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no image models extracted`);
        await saveFetchRun(logProvider, [], [], [], 0, 'no image models extracted');
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
          `${config.displayName}: filtered out ${unknownCount} unknown image model(s): ${unknownIds.join(', ')}`
        );
      }

      if (knownModels.length === 0) {
        errors.push(`${config.displayName}: no known image models extracted`);
        await saveFetchRun(logProvider, [], [], [], 0, 'no known image models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = knownModels.filter((m) => {
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
        const saved = await saveImageSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified image models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged image model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await imageCrossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildImageConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveImageSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged image model(s) passed area chair review (low confidence)`);
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
              systemPrompt: IMAGE_VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'image_verification',
              label: `Image/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildImageConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveImageSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} image model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveImageSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} image model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveImageSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} image model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveImageSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} image model(s) still flagged after area chair (no arbitrator configured):`,
              retryConsensus.flagged.map((m) => m.modelId)
            );
          }
        }
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

  const carried = await carryForwardMissingImages();
  if (carried > 0) {
    console.log(`Carried forward ${carried} image models not seen in this run`);
  }

  console.log(
    `Image pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
