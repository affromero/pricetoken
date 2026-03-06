import { EXTRACTION_PROVIDERS } from './ai-registry';
import { logUsage } from '@/lib/usage-logger';
import { IMAGE_VERIFICATION_SYSTEM_PROMPT } from './image-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedImageModel } from './image-store';
import type { AgentVerification } from './verification-types';
import { parseVerdicts } from './parse-verdicts';

interface VerificationAgent {
  provider: string;
  model: string;
}

export async function imageCrossVerify(
  pageText: string,
  models: ExtractedImageModel[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);

  const modelsJson = JSON.stringify(models, null, 2);
  const userPrompt = `Verify these extracted image prices against the raw page text.\n\nRaw text:\n${pageText.slice(0, 6000)}\n\nExtracted data:\n${modelsJson}`;

  const availableAgents = agents.filter((agent) => {
    const providerConfig = EXTRACTION_PROVIDERS[agent.provider];
    if (!providerConfig) return false;
    const apiKey = process.env[providerConfig.envKey];
    return !!apiKey;
  });

  if (availableAgents.length === 0) {
    console.warn('No verification agents available — skipping image cross-verification');
    return [];
  }

  const results = await Promise.allSettled(
    availableAgents.map((agent) => runImageVerificationAgent(agent, userPrompt))
  );

  const verifications: AgentVerification[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      verifications.push(result.value);
    } else {
      const agent = availableAgents[i]!;
      console.error(
        `Image verification agent ${agent.provider}/${agent.model} failed:`,
        result.reason
      );
    }
  }

  return verifications;
}

async function runImageVerificationAgent(
  agent: VerificationAgent,
  userPrompt: string
): Promise<AgentVerification> {
  const config = EXTRACTION_PROVIDERS[agent.provider]!;
  const apiKey = process.env[config.envKey]!;

  const startTime = Date.now();
  const result = await config.extract(
    apiKey,
    agent.model,
    IMAGE_VERIFICATION_SYSTEM_PROMPT,
    userPrompt
  );

  logUsage({
    provider: agent.provider,
    model: agent.model,
    operation: 'image_verification',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    durationMs: Date.now() - startTime,
    metadata: { operation: 'image_verification' },
  });

  const verdicts = parseVerdicts(result.content);

  return {
    agentProvider: agent.provider,
    agentModel: agent.model,
    verdicts,
    usage: result.usage,
  };
}
