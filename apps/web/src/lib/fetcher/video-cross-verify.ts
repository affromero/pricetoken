import { VIDEO_VERIFICATION_SYSTEM_PROMPT } from './video-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedVideoModel } from './video-extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function videoCrossVerify(
  pageText: string,
  models: ExtractedVideoModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: VIDEO_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'video_verification',
    label: 'Video',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
