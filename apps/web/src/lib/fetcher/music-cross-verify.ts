import { MUSIC_VERIFICATION_SYSTEM_PROMPT } from './music-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedMusicModel } from './music-extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function musicCrossVerify(
  pageText: string,
  models: ExtractedMusicModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: MUSIC_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'music_verification',
    label: 'Music',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
