import { getMusicProviderSummaries } from '@/lib/music-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { MusicProviderSummary } from 'pricetoken';

export async function GET() {
  try {
    const cacheKey = 'pt:cache:music:providers';

    const cached = await getCached<MusicProviderSummary[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const providers = await getMusicProviderSummaries();
    await setCache(cacheKey, providers);

    return apiSuccess(providers);
  } catch (err) {
    console.error('GET /api/v1/music/providers error:', err);
    return apiError('Internal server error', 500);
  }
}
