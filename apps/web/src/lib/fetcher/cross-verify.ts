import { VERIFICATION_SYSTEM_PROMPT } from './verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedModel } from './extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function crossVerify(
  pageText: string,
  models: ExtractedModel[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'pricing_verification',
    label: 'Text',
    pageText,
    modelsJson,
  });
}
