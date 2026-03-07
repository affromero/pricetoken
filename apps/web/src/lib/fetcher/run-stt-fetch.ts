import { STATIC_STT_PRICING } from 'pricetoken';
import { STT_PROVIDERS } from './stt-providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractSttPricing } from './stt-extractor';
import {
  saveSttSnapshots,
  seedSttFromStatic,
  carryForwardMissingStt,
} from './stt-store';
import { getLastFetchRun, saveFetchRun, type FetchWarning } from './store';
import { sttCrossVerify } from './stt-cross-verify';
import { checkSttPriorConsistency } from './stt-prior-check';
import { buildSttConsensus } from './stt-consensus';
import { checkSttPriceSanity } from './sanity-bounds';
import { STT_VERIFICATION_SYSTEM_PROMPT } from './stt-verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
import type { SttVerificationResult } from './stt-verification-types';

export interface SttFetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, SttVerificationResult>;
}

export async function runSttFetch(): Promise<SttFetchResult> {
  await seedSttFromStatic(STATIC_STT_PRICING);

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, SttVerificationResult>();

  for (const [providerId, config] of Object.entries(STT_PROVIDERS)) {
    try {
      console.log(`Fetching STT pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url)
        : await fetchPricingPage(config.url);

      console.log(`Extracting STT pricing for ${config.displayName}...`);
      let extraction = await extractSttPricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: STT extraction returned 0 models, retrying once...`);
        extraction = await extractSttPricing(providerId, pageText);
      }

      // Try fallback URLs when primary extraction fails
      if (extraction.models.length === 0 && config.fallbackUrls?.length) {
        for (const fallbackUrl of config.fallbackUrls) {
          try {
            console.log(`${config.displayName}: trying fallback URL ${fallbackUrl}...`);
            const fallbackText = config.requiresBrowser
              ? await fetchPricingPageWithBrowser(fallbackUrl)
              : await fetchPricingPage(fallbackUrl);
            extraction = await extractSttPricing(providerId, fallbackText);
            if (extraction.models.length > 0) {
              console.log(`${config.displayName}: recovered ${extraction.models.length} STT model(s) from fallback`);
              break;
            }
          } catch {
            console.warn(`${config.displayName}: fallback URL ${fallbackUrl} failed`);
          }
        }
      }

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no STT models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no STT models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = extraction.models.filter((m) => {
        const check = checkSttPriceSanity(m.modelId, m.costPerMinute);
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
        errors.push(`${config.displayName}: all STT models failed sanity checks`);
        await saveFetchRun(providerId, [], [], [], 0, 'all STT models failed sanity checks');
        continue;
      }

      console.log(`Verifying STT pricing for ${config.displayName}...`);
      const agentResults = await sttCrossVerify(pageText, saneModels);

      const priorFlags = await checkSttPriorConsistency(providerId, saneModels);

      const consensus = buildSttConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      if (consensus.approved.length > 0) {
        const saved = await saveSttSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified STT models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged STT model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await sttCrossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildSttConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveSttSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged STT model(s) passed area chair review (low confidence)`);
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
              systemPrompt: STT_VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'stt_verification',
              label: `STT/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildSttConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveSttSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} STT model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveSttSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} STT model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveSttSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} STT model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveSttSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} STT model(s) still flagged after area chair (no arbitrator configured):`,
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
          message: `${missing.length} STT model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching STT pricing for ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  const carried = await carryForwardMissingStt();
  if (carried > 0) {
    console.log(`Carried forward ${carried} STT models with no new data today`);
  }

  console.log(
    `STT pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
