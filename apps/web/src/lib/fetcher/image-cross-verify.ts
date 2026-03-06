import { IMAGE_VERIFICATION_SYSTEM_PROMPT } from './image-verification-prompt';
import { getFetcherConfig, parseVerificationAgents } from '@/lib/fetcher-config';
import type { ExtractedImageModel } from './image-store';
import type { AgentVerification } from './verification-types';
import { verifyWithRetry } from './verify-with-retry';

export async function imageCrossVerify(
  pageText: string,
  models: ExtractedImageModel[],
  priorVerdicts?: AgentVerification[]
): Promise<AgentVerification[]> {
  const config = await getFetcherConfig();
  const agents = parseVerificationAgents(config);
  const modelsJson = JSON.stringify(models, null, 2);

  return verifyWithRetry({
    agents,
    systemPrompt: IMAGE_VERIFICATION_SYSTEM_PROMPT,
    userPrompt: '',
    modelIds: models.map((m) => m.modelId),
    operation: 'image_verification',
    label: 'Image',
    pageText,
    modelsJson,
    priorVerdicts,
  });
}
