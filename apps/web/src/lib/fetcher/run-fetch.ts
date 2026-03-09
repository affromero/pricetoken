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
import { checkTextPriceSanity } from './sanity-bounds';
import { VERIFICATION_SYSTEM_PROMPT } from './verification-prompt';
import { arbitrate } from './verify-with-retry';
import { getFetcherConfig, parseArbitratorAgent } from '@/lib/fetcher-config';
import { prisma } from '@/lib/prisma';
import type { VerificationResult } from './verification-types';

export interface FetchResult {
  totalModels: number;
  totalFlagged: number;
  errors: string[];
  warnings: FetchWarning[];
  verificationResults: Map<string, VerificationResult>;
}

export interface FetchOptions {
  retryFlagged?: boolean;
}

export async function runPricingFetch(options: FetchOptions = {}): Promise<FetchResult> {
  // Seed DB from static data if empty (first run)
  await seedFromStatic();

  // Only accept models we already track (prevents AI hallucinating new modelIds)
  const knownIds = await getKnownModelIds();

  let totalModels = 0;
  let totalFlagged = 0;
  const errors: string[] = [];
  const warnings: FetchWarning[] = [];
  const verificationResults = new Map<string, VerificationResult>();

  const startOfDay = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  for (const [providerId, config] of Object.entries(PRICING_PROVIDERS)) {
    try {
      // Skip providers that already have a successful run today
      const todayRun = await getLastFetchRun(providerId);
      if (todayRun && todayRun.createdAt >= startOfDay && !todayRun.error && todayRun.totalExtracted > 0) {
        if (options.retryFlagged) {
          const flaggedCount = await prisma.modelPricingSnapshot.count({
            where: { provider: providerId, source: 'flagged', createdAt: { gte: startOfDay } },
          });
          if (flaggedCount > 0) {
            console.log(`${config.displayName}: ${flaggedCount} flagged model(s) today, retrying`);
          } else {
            console.log(`${config.displayName}: already verified today (no flagged), skipping`);
            totalModels += todayRun.totalExtracted;
            continue;
          }
        } else {
          console.log(`${config.displayName}: already verified today (${todayRun.totalExtracted} models), skipping`);
          totalModels += todayRun.totalExtracted;
          continue;
        }
      }

      console.log(`Fetching pricing for ${config.displayName}...`);
      const pageText = config.requiresBrowser
        ? await fetchPricingPageWithBrowser(config.url, config.browserOptions)
        : await fetchPricingPage(config.url);

      console.log(`Extracting pricing for ${config.displayName}...`);
      let extraction = await extractPricing(providerId, pageText);
      if (extraction.models.length === 0) {
        console.warn(`${config.displayName}: extraction returned 0 models, retrying once...`);
        extraction = await extractPricing(providerId, pageText);
      }

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

      // Sanity check — reject obviously wrong prices before verification
      const saneModels = knownModels.filter((m) => {
        const check = checkTextPriceSanity(m.modelId, m.inputPerMTok, m.outputPerMTok);
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

      // Layer 2: Cross-verify with multiple AI agents
      console.log(`Verifying pricing for ${config.displayName}...`);
      const agentResults = await crossVerify(pageText, saneModels);

      // Layer 3: Check against prior snapshots
      const priorFlags = await checkPriorConsistency(providerId, saneModels);

      // Layer 4: Build consensus
      const consensus = buildConsensus(saneModels, agentResults, priorFlags);
      verificationResults.set(providerId, consensus);

      // Save only approved models with 'verified' source
      if (consensus.approved.length > 0) {
        const saved = await saveSnapshots(providerId, consensus.approved, 'verified', 'high', agentResults.length);
        totalModels += saved;
        console.log(`${config.displayName}: saved ${saved} verified models`);
      }

      // Tier 2 — Area Chair: re-verify flagged models with reviewer disagreement context
      if (consensus.flagged.length > 0) {
        console.log(`${config.displayName}: area chair re-verifying ${consensus.flagged.length} flagged model(s)...`);
        const flaggedModels = consensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
        const retryAgentResults = await crossVerify(pageText, flaggedModels, agentResults);
        const retryConsensus = buildConsensus(flaggedModels, retryAgentResults, []);

        if (retryConsensus.approved.length > 0) {
          const saved = await saveSnapshots(providerId, retryConsensus.approved, 'verified', 'low', retryAgentResults.length);
          totalModels += saved;
          console.log(`${config.displayName}: ${saved} flagged model(s) passed area chair review (low confidence)`);
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
              systemPrompt: VERIFICATION_SYSTEM_PROMPT,
              modelIds: stillFlaggedModels.map((m) => m.modelId),
              operation: 'pricing_verification',
              label: `Text/${config.displayName}`,
              pageText,
              modelsJson: JSON.stringify(stillFlaggedModels, null, 2),
              allPriorVerdicts,
            });

            if (arbResult) {
              const arbConsensus = buildConsensus(stillFlaggedModels, [arbResult], []);

              if (arbConsensus.approved.length > 0) {
                const saved = await saveSnapshots(providerId, arbConsensus.approved, 'verified', 'low', 1);
                totalModels += saved;
                console.log(`${config.displayName}: ${saved} model(s) approved by general chair`);
              }

              if (arbConsensus.flagged.length > 0) {
                totalFlagged += arbConsensus.flagged.length;
                const finalFlagged = arbConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
                await saveSnapshots(providerId, finalFlagged, 'flagged', 'low', 1);
                console.warn(
                  `${config.displayName}: ${arbConsensus.flagged.length} model(s) rejected by general chair (saved as flagged):`,
                  arbConsensus.flagged.map((m) => m.modelId)
                );
              }
            } else {
              // Arbitrator unavailable — save as flagged
              totalFlagged += retryConsensus.flagged.length;
              const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
              await saveSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
              console.warn(
                `${config.displayName}: ${retryConsensus.flagged.length} model(s) still flagged (no arbitrator configured):`,
                retryConsensus.flagged.map((m) => m.modelId)
              );
            }
          } else {
            totalFlagged += retryConsensus.flagged.length;
            const stillFlagged = retryConsensus.flagged.map(({ verificationStatus: _vs, agentApprovals: _aa, agentRejections: _ar, priorFlags: _pf, ...m }) => m);
            await saveSnapshots(providerId, stillFlagged, 'flagged', 'low', retryAgentResults.length);
            console.warn(
              `${config.displayName}: ${retryConsensus.flagged.length} model(s) still flagged after area chair (no arbitrator configured):`,
              retryConsensus.flagged.map((m) => m.modelId)
            );
          }
        }
      }

      // Detect missing and new models by comparing with previous run
      const currentModelIds = consensus.approved.map((m) => m.modelId);
      const lastRun = await getLastFetchRun(providerId);
      const previousModelIds = lastRun?.modelsFound ?? [];

      const missing = previousModelIds.filter((id: string) => !currentModelIds.includes(id));
      const newModels = currentModelIds.filter((id: string) => !previousModelIds.includes(id));

      if (missing.length > 0 && config.fallbackUrls?.length) {
        console.log(`Attempting fallback for ${missing.length} missing ${config.displayName} model(s)...`);
        const fallbackResults = await fetchFallbackPricing(providerId, config.fallbackUrls, missing, config.requiresBrowser, config.browserOptions);
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
