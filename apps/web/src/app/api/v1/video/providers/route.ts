import { getVideoProviderSummaries } from '@/lib/video-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { VideoProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:video:providers';

    const cached = await getCached<VideoProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getVideoProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/video/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
