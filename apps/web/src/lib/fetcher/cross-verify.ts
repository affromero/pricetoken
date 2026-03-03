import { EXTRACTION_PROVIDERS } from './ai-registry';
import { logUsage } from '@/lib/usage-logger';
import { VERIFICATION_SYSTEM_PROMPT } from './verification-prompt';
import type { ExtractedModel } from './extractor';
import type { AgentVerification, ModelVerdict } from './verification-types';

interface VerificationAgent {
  provider: string;
  model: string;
}

const VERIFICATION_AGENTS: VerificationAgent[] = [
  { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { provider: 'openai', model: 'gpt-4.1-mini' },
  { provider: 'google', model: 'gemini-2.5-flash' },
];

export async function crossVerify(
  pageText: string,
  models: ExtractedModel[]
): Promise<AgentVerification[]> {
  const modelsJson = JSON.stringify(models, null, 2);
  const userPrompt = `Verify these extracted prices against the raw page text.\n\nRaw text:\n${pageText.slice(0, 6000)}\n\nExtracted data:\n${modelsJson}`;

  const availableAgents = VERIFICATION_AGENTS.filter((agent) => {
    const config = EXTRACTION_PROVIDERS[agent.provider];
    if (!config) return false;
    const apiKey = process.env[config.envKey];
    return !!apiKey;
  });

  if (availableAgents.length === 0) {
    console.warn('No verification agents available — skipping cross-verification');
    return [];
  }

  const results = await Promise.allSettled(
    availableAgents.map((agent) => runVerificationAgent(agent, userPrompt))
  );

  const verifications: AgentVerification[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      verifications.push(result.value);
    } else {
      const agent = availableAgents[i]!;
      console.error(
        `Verification agent ${agent.provider}/${agent.model} failed:`,
        result.reason
      );
    }
  }

  return verifications;
}

async function runVerificationAgent(
  agent: VerificationAgent,
  userPrompt: string
): Promise<AgentVerification> {
  const config = EXTRACTION_PROVIDERS[agent.provider]!;
  const apiKey = process.env[config.envKey]!;

  const startTime = Date.now();
  const result = await config.extract(
    apiKey,
    agent.model,
    VERIFICATION_SYSTEM_PROMPT,
    userPrompt
  );

  logUsage({
    provider: agent.provider,
    model: agent.model,
    operation: 'pricing_verification',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    durationMs: Date.now() - startTime,
    metadata: { operation: 'pricing_verification' },
  });

  const verdicts = parseVerdicts(result.content);

  return {
    agentProvider: agent.provider,
    agentModel: agent.model,
    verdicts,
    usage: result.usage,
  };
}

function parseVerdicts(text: string): ModelVerdict[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is ModelVerdict =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as Record<string, unknown>).modelId === 'string' &&
        typeof (v as Record<string, unknown>).approved === 'boolean'
    );
  } catch {
    console.warn('Failed to parse verification verdicts:', text.slice(0, 200));
    return [];
  }
}
