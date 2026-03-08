import { STATIC_AVATAR_PRICING } from 'pricetoken';
import { AVATAR_PROVIDERS } from './avatar-providers';
import { fetchPricingPage, fetchPricingPageWithBrowser } from './scraper';
import { extractAvatarPricing } from './avatar-extractor';
import {
  saveAvatarSnapshots,
  seedAvatarFromStatic,
  carryForwardMissingAvatar,
} from './avatar-store';
import { getLastFetchRun, saveFetchRun, type FetchWarning } from './store';
import { avatarCrossVerify } from './avatar-cross-verify';
import { checkAvatarPriorConsistency } from './avatar-prior-check';
import { buildAvatarConsensus } from './avatar-consensus';
import { checkAvatarPriceSanity } from './sanity-bounds';
import { AVATAR_VERIFICATION_SYSTEM_PROMPT } from './avatar-verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
import type { AvatarVerificationResult } from './avatar-verification-types';

export interface AvatarFetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, AvatarVerificationResult>;
}

export async function runAvatarFetch(): Promise<AvatarFetchResult> {
  await seedAvatarFromStatic(STATIC_AVATAR_PRICING);

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, AvatarVerificationResult>();

  for (const [providerId, config] of Object.entries(AVATAR_PROVIDERS)) {
    try {
      console.log(`Fetching avatar pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url, config.browserOptions)
        : await fetchPricingPage(config.url);

      console.log(`Extracting avatar pricing for ${config.displayName}...`);
      let extraction = await extractAvatarPricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: avatar extraction returned 0 models, retrying once...`);
        extraction = await extractAvatarPricing(providerId, pageText);
      }

      if (extraction.models.length === 0) {
        errors.push(`${config.displayName}: no avatar models extracted`);
        await saveFetchRun(providerId, [], [], [], 0, 'no avatar models extracted');
        continue;
      }

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = extraction.models.filter((m) => {
        const check = checkAvatarPriceSanity(m.modelId, m.costPerMinute);
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

      console.log(`Verifying avatar pricing for ${config.displayName}...`);
      const agentResults = await avatarCrossVerify(pageText, saneModels);

      const priorFlags = await checkAvatarPriorConsistency(providerId, saneModels);

      const consensus = buildAvatarConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      if (consensus.approved.length > 0) {
        const saved = await saveAvatarSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified avatar models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged avatar model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await avatarCrossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildAvatarConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveAvatarSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged avatar model(s) passed area chair review (low confidence)`);
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
              systemPrompt: AVATAR_VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'avatar_verification',
              label: `Avatar/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildAvatarConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveAvatarSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} avatar model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveAvatarSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} avatar model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveAvatarSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} avatar model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveAvatarSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} avatar model(s) still flagged after area chair (no arbitrator configured):`,
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
          message: `${missing.length} avatar model(s) missing from ${config.displayName}: ${missing.join(', ')}`,
        });
      }

      await saveFetchRun(providerId, currentModelIds, missing, newModels, consensus.approved.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${config.displayName}: ${message}`);
      console.error(`Error fetching avatar pricing for ${config.displayName}:`, message);
      await saveFetchRun(providerId, [], [], [], 0, message).catch(() => {});
    }
  }

  const carried = await carryForwardMissingAvatar();
  if (carried > 0) {
    console.log(`Carried forward ${carried} avatar models with no new data today`);
  }

  console.log(
    `Avatar pricing fetch complete: ${totalModels} verified, ${totalFlagged} flagged, ${carried} carried, ${errors.length} errors, ${warnings.length} warnings`
  );
  return { totalModels, totalFlagged, errors, warnings, verificationResults };
}
