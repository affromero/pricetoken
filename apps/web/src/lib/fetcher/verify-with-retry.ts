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
}

export async function verifyWithRetry(opts: VerifyOptions): Promise<AgentVerification[]> {
  const { agents, systemPrompt, modelIds, operation, label, pageText, modelsJson } = opts;

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

  const userPrompt = `Verify these extracted prices against the raw page text.\n\nRaw text:\n${pageText.slice(0, 6000)}\n\nExtracted data:\n${modelsJson}`;

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
        const retryPrompt = `You previously verified some models but MISSED the following. Verify ONLY these model IDs against the raw page text. Return a JSON array of verdicts.\n\nMissing model IDs: ${JSON.stringify(missingIds)}\n\nRaw text:\n${pageText.slice(0, 6000)}\n\nExtracted data:\n${modelsJson}`;

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
