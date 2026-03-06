import { STT_VERIFICATION_SYSTEM_PROMPT } from './stt-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedSttModel } from './stt-extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function sttCrossVerify(
  pageText: string,
  models: ExtractedSttModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: STT_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'stt_verification',
    label: 'STT',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
