import { type NextRequest } from 'next/server';
import { getCurrentPricing } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';
import type { ModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:pricing:${provider ?? 'all'}`;

    const cached = await getCached<ModelPricing[]>(cacheKey);
    let data = cached ?? await getCurrentPricing(provider);

    if (!cached) await setCache(cacheKey, data);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      data = convertPricing(data, currencyInfo.exchangeRate);
      return apiSuccess(data, !!cached, currencyInfo);
    }

    return apiSuccess(data, !!cached);
  } catch (err) {
    console.error('GET /api/v1/pricing error:', err);
    return apiError('Internal server error', 500);
  }
}
