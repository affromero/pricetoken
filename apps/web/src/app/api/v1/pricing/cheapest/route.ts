import { type NextRequest } from 'next/server';
import { getCheapestModel } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const cacheKey = `pt:cache:cheapest:${provider ?? 'all'}`;

    const cached = await getCached<ModelPricing>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const cheapest = await getCheapestModel(provider);
    if (!cheapest) {
      return apiError('No pricing data available', 404);
    }

    await setCache(cacheKey, cheapest);
    return apiSuccess(cheapest);
  } catch (err) {
    console.error('GET /api/v1/pricing/cheapest error:', err);
    return apiError('Internal server error', 500);
  }
}
