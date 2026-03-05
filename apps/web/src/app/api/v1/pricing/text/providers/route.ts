import { getProviderSummaries } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:providers';

    const cached = await getCached<ProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/pricing/text/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
