import { getAvatarProviderSummaries } from '@/lib/avatar-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { AvatarProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:avatar:providers';

    const cached = await getCached<AvatarProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getAvatarProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/avatar/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
