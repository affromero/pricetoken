import { AVATAR_VERIFICATION_SYSTEM_PROMPT } from './avatar-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedAvatarModel } from './avatar-extractor';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function avatarCrossVerify(
  pageText: string,
  models: ExtractedAvatarModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: AVATAR_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'avatar_verification',
    label: 'Avatar',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
