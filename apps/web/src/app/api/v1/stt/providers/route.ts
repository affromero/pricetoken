import { getSttProviderSummaries } from '@/lib/stt-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { SttProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:stt:providers';

    const cached = await getCached<SttProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getSttProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/stt/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
