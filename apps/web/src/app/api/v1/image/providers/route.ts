import { getImageProviderSummaries } from '@/lib/image-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ImageProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:image:providers';

    const cached = await getCached<ImageProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getImageProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/image/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
