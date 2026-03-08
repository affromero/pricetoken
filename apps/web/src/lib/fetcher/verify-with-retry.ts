import { EXTRACTION_PROVIDERS } from './ai-registry';
import { logUsage } from '@/lib/usage-logger';
import { parseVerdicts } from './parse-verdicts';
import type { AgentVerification, ModelVerdict } from './verification-types';

const MAX_RETRIES = 2;

interface VerificationAgent {
  provider: string;
  model: string;
}

interface VerifyOptions {
  agents: VerificationAgent[];
  systemPrompt: string;
  userPrompt: string;
  modelIds: string[];
  operation: string;
  label: string;
  pageText: string;
  modelsJson: string;
  /** Prior agent verdicts for area-chair context (re-verification sees reviewer disagreements) */
  priorVerdicts?: AgentVerification[];
}

export async function verifyWithRetry(opts: VerifyOptions): Promise<AgentVerification[]> {
  const { agents, systemPrompt, modelIds, operation, label, pageText, modelsJson, priorVerdicts } = opts;

  const availableAgents = agents.filter((agent) => {
    const providerConfig = EXTRACTION_PROVIDERS[agent.provider];
    if (!providerConfig) return false;
    const apiKey = process.env[providerConfig.envKey];
    return !!apiKey;
  });

  if (availableAgents.length === 0) {
    console.warn(`No verification agents available — skipping ${label} cross-verification`);
    return [];
  }

  let userPrompt: string;
  if (priorVerdicts && priorVerdicts.length > 0) {
    // Area-chair mode: include reviewer disagreements so agents can arbitrate
    const disagreementContext = formatDisagreements(priorVerdicts, modelIds);
    userPrompt = `You are acting as an AREA CHAIR in a review process. Previous reviewers disagreed on some model prices. Review their arguments, check the raw page text yourself, and make your own independent judgment.

PREVIOUS REVIEWER VERDICTS:
${disagreementContext}

Now verify these extracted prices against the raw page text. Quote the exact prices you find.

Raw text:
${pageText.slice(0, 100_000)}

Extracted data:
${modelsJson}`;
  } else {
    userPrompt = `Verify these extracted prices against the raw page text.\n\nRaw text:\n${pageText.slice(0, 100_000)}\n\nExtracted data:\n${modelsJson}`;
  }

  // Initial run: all agents in parallel
  const agentStates = await Promise.all(
    availableAgents.map(async (agent) => {
      try {
        const result = await runAgent(agent, systemPrompt, userPrompt, operation);
        return { agent, verdicts: result.verdicts, usage: result.usage, failed: false };
      } catch (err) {
        console.error(`${label} verification agent ${agent.provider}/${agent.model} failed:`, err);
        return { agent, verdicts: [] as ModelVerdict[], usage: { inputTokens: 0, outputTokens: 0 }, failed: true };
      }
    })
  );

  // Retry loop: for each agent, re-run with only missing model IDs
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const needsRetry: Array<{ idx: number; missingIds: string[] }> = [];

    for (const [idx, state] of agentStates.entries()) {
      const coveredIds = new Set(state.verdicts.map((v) => v.modelId));
      const missingIds = modelIds.filter((id) => !coveredIds.has(id));
      if (missingIds.length > 0) {
        needsRetry.push({ idx, missingIds });
      }
    }

    if (needsRetry.length === 0) break;

    console.log(
      `${label} verification retry ${retry + 1}/${MAX_RETRIES}: ${needsRetry.length} agent(s) missing verdicts`
    );

    await Promise.all(
      needsRetry.map(async ({ idx, missingIds }) => {
        const state = agentStates[idx]!;
        const retryPrompt = `You previously verified some models but MISSED the following. Verify ONLY these model IDs against the raw page text. Return a JSON array of verdicts.\n\nMissing model IDs: ${JSON.stringify(missingIds)}\n\nRaw text:\n${pageText.slice(0, 100_000)}\n\nExtracted data:\n${modelsJson}`;

        try {
          const result = await runAgent(state.agent, systemPrompt, retryPrompt, operation);
          // Merge new verdicts (don't overwrite existing ones)
          const existingIds = new Set(state.verdicts.map((v) => v.modelId));
          for (const v of result.verdicts) {
            if (!existingIds.has(v.modelId)) {
              state.verdicts.push(v);
              existingIds.add(v.modelId);
            }
          }
          state.usage.inputTokens += result.usage.inputTokens;
          state.usage.outputTokens += result.usage.outputTokens;
          state.failed = false;
        } catch (err) {
          console.error(
            `${label} verification retry failed for ${state.agent.provider}/${state.agent.model}:`,
            err
          );
        }
      })
    );
  }

  // Log final coverage
  for (const state of agentStates) {
    const coveredIds = new Set(state.verdicts.map((v) => v.modelId));
    const missingIds = modelIds.filter((id) => !coveredIds.has(id));
    if (missingIds.length > 0) {
      console.warn(
        `${label} agent ${state.agent.provider}/${state.agent.model} still missing ${missingIds.length} verdict(s) after retries: ${missingIds.join(', ')}`
      );
    }
  }

  // Return only agents that produced at least one verdict
  return agentStates
    .filter((s) => s.verdicts.length > 0)
    .map((s) => ({
      agentProvider: s.agent.provider,
      agentModel: s.agent.model,
      verdicts: s.verdicts,
      usage: s.usage,
    }));
}

/**
 * General Chair arbitration — a single strong agent makes the final call
 * on models that reviewers and area chairs couldn't agree on.
 */
export async function arbitrate(opts: {
  arbitrator: VerificationAgent;
  systemPrompt: string;
  modelIds: string[];
  operation: string;
  label: string;
  pageText: string;
  modelsJson: string;
  allPriorVerdicts: AgentVerification[];
}): Promise<AgentVerification | null> {
  const { arbitrator, systemPrompt, modelIds, operation, label, pageText, modelsJson, allPriorVerdicts } = opts;

  const providerConfig = EXTRACTION_PROVIDERS[arbitrator.provider];
  if (!providerConfig) {
    console.warn(`Arbitrator provider ${arbitrator.provider} not configured`);
    return null;
  }
  const apiKey = process.env[providerConfig.envKey];
  if (!apiKey) {
    console.warn(`Arbitrator API key not available for ${arbitrator.provider}`);
    return null;
  }

  const disagreementContext = formatDisagreements(allPriorVerdicts, modelIds);

  const userPrompt = `You are the GENERAL CHAIR making the final decision. Multiple rounds of reviewers could not reach consensus on these models. Read their arguments carefully, verify the prices against the raw page text, and make your final ruling.

Your verdict is FINAL. Be thorough — quote exact prices from the page text.

ALL PREVIOUS REVIEWER VERDICTS:
${disagreementContext}

Raw text:
${pageText.slice(0, 100_000)}

Extracted data:
${modelsJson}

Verify ONLY these model IDs: ${JSON.stringify(modelIds)}`;

  try {
    console.log(`${label}: General Chair arbitrating ${modelIds.length} model(s) via ${arbitrator.provider}/${arbitrator.model}...`);
    const result = await runAgent(arbitrator, systemPrompt, userPrompt, `${operation}_arbitration`);
    return {
      agentProvider: arbitrator.provider,
      agentModel: arbitrator.model,
      verdicts: result.verdicts,
      usage: result.usage,
    };
  } catch (err) {
    console.error(`${label} arbitrator ${arbitrator.provider}/${arbitrator.model} failed:`, err);
    return null;
  }
}

function formatDisagreements(priorVerdicts: AgentVerification[], modelIds: string[]): string {
  const modelIdSet = new Set(modelIds);
  const lines: string[] = [];

  for (const agent of priorVerdicts) {
    const relevant = agent.verdicts.filter((v) => modelIdSet.has(v.modelId));
    if (relevant.length === 0) continue;

    lines.push(`Agent ${agent.agentProvider}/${agent.agentModel}:`);
    for (const v of relevant) {
      const status = v.approved ? 'APPROVED' : 'REJECTED';
      const reason = v.reason ? ` — ${v.reason}` : '';
      lines.push(`  ${v.modelId}: ${status}${reason}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'No prior verdicts available.';
}

async function runAgent(
  agent: VerificationAgent,
  systemPrompt: string,
  userPrompt: string,
  operation: string
): Promise<{ verdicts: ModelVerdict[]; usage: { inputTokens: number; outputTokens: number } }> {
  const config = EXTRACTION_PROVIDERS[agent.provider]!;
  const apiKey = process.env[config.envKey]!;

  const startTime = Date.now();
  const result = await config.extract(apiKey, agent.model, systemPrompt, userPrompt);

  logUsage({
    provider: agent.provider,
    model: agent.model,
    operation,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    durationMs: Date.now() - startTime,
    metadata: { operation },
  });

  const verdicts = parseVerdicts(result.content);
  return { verdicts, usage: result.usage };
}
