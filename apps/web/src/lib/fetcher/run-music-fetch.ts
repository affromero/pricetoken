import { STATIC_MUSIC_PRICING } from 'pricetoken';
import { MUSIC_PROVIDERS } from './music-providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractMusicPricing } from './music-extractor';
import {
  saveMusicSnapshots,
  seedMusicFromStatic,
  carryForwardMissingMusic,
} from './music-store';
import { getLastFetchRun, saveFetchRun, type FetchWarning } from './store';
import { musicCrossVerify } from './music-cross-verify';
import { checkMusicPriorConsistency } from './music-prior-check';
import { buildMusicConsensus } from './music-consensus';
import { checkMusicPriceSanity } from './sanity-bounds';
import { MUSIC_VERIFICATION_SYSTEM_PROMPT } from './music-verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
import type { MusicVerificationResult } from './music-verification-types';

export interface MusicFetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, MusicVerificationResult>;
}

export async function runMusicFetch(): Promise<MusicFetchResult> {
  await seedMusicFromStatic(STATIC_MUSIC_PRICING);

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, MusicVerificationResult>();

  for (const [providerId, config] of Object.entries(MUSIC_PROVIDERS)) {
    try {
      console.log(`Fetching music pricing for ${config.displayName}...`);
      let pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url, config.browserOptions)
        : await fetchPricingPage(config.url);

      console.log(`Extracting music pricing for ${config.displayName}...`);
      let extraction = await extractMusicPricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: music extraction returned 0 models, retrying once...`);
        extraction = await extractMusicPricing(providerId, pageText);
      }

      // Try fallback URLs to recover additional models
      if (config.fallbackUrls?.length) {
        const allModels = [...extraction.models];
        const extractedIds = new Set(allModels.map((m) => m.modelId));
        for (const fallbackUrl of config.fallbackUrls) {
          try {
            console.log(`${config.displayName}: trying fallback URL ${fallbackUrl}...`);
            const fallbackText = config.requiresBrowser
              ? await fetchPricingPageWithBrowser(fallbackUrl, config.browserOptions)
              : await fetchPricingPage(fallbackUrl);
            const fallbackExtraction = await extractMusicPricing(providerId, fallbackText);
            let added = 0;
            for (const m of fallbackExtraction.models) {
              if (!extractedIds.has(m.modelId)) {
                allModels.push(m);
                extractedIds.add(m.modelId);
                added++;
              }
            }
            if (added > 0) {
              console.log(`${config.displayName}: recovered ${added} new music model(s) from ${fallbackUrl}`);
            }
            pageText += '\n\n---\n\n' + fallbackText;
          } catch {
            console.warn(`${config.displayName}: fallback URL ${fallbackUrl} failed`);
          }
        }
        extraction = { ...extraction, models: allModels };
      }

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no music models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no music models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = extraction.models.filter((m) => {
        const check = checkMusicPriceSanity(m.modelId, m.costPerMinute);
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

      console.log(`Verifying music pricing for ${config.displayName}...`);
      const agentResults = await musicCrossVerify(pageText, saneModels);

      const priorFlags = await checkMusicPriorConsistency(providerId, saneModels);

      const consensus = buildMusicConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      if (consensus.approved.length > 0) {
        const saved = await saveMusicSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified music models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged music model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await musicCrossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildMusicConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveMusicSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged music model(s) passed area chair review (low confidence)`);
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
              systemPrompt: MUSIC_VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'music_verification',
              label: `Music/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildMusicConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveMusicSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} music model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveMusicSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} music model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveMusicSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} music model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveMusicSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} music model(s) still flagged after area chair (no arbitrator configured):`,
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
          message: `${missing.length} music model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching music pricing for ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  const carried = await carryForwardMissingMusic();
  if (carried > 0) {
    console.log(`Carried forward ${carried} music models with no new data today`);
  }

  console.log(
    `Music pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
