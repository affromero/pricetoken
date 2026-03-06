import { getTtsProviderSummaries } from '@/lib/tts-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { TtsProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:tts:providers';

    const cached = await getCached<TtsProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getTtsProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/tts/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
