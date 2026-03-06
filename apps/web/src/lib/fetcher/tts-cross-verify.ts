import { TTS_VERIFICATION_SYSTEM_PROMPT } from './tts-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedTtsModel } from './tts-extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function ttsCrossVerify(
  pageText: string,
  models: ExtractedTtsModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: TTS_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'tts_verification',
    label: 'TTS',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
