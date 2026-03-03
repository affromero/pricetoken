import { type NextRequest } from 'next/server';
import { getCurrentPricing } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const cacheKey = `pt:cache:pricing:${provider ?? 'all'}`;

    const cached = await getCached<ModelPricing[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const pricing = await getCurrentPricing(provider);
    await setCache(cacheKey, pricing);

    return apiSuccess(pricing);
  } catch (err) {
    console.error('GET /api/v1/pricing error:', err);
    return apiError('Internal server error', 500);
  }
}
