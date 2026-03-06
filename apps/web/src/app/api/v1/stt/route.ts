import { type NextRequest } from 'next/server';
import { getCurrentSttPricing } from '@/lib/stt-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertSttPricing } from '@/lib/currency-convert';
import type { SttModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const after = request.nextUrl.searchParams.get('after') ?? undefined;
    const before = request.nextUrl.searchParams.get('before') ?? undefined;
    const dateRange = (after || before) ? { after, before } : undefined;
    const cacheKey = `pt:cache:stt:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<SttModelPricing[]>(cacheKey);
    let data = cached ?? await getCurrentSttPricing(provider, dateRange);

    if (!cached) await setCache(cacheKey, data);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      data = convertSttPricing(data, currencyInfo.exchangeRate);
      return apiSuccess(data, !!cached, currencyInfo);
    }

    return apiSuccess(data, !!cached);
  } catch (err) {
    console.error('GET /api/v1/stt error:', err);
    return apiError('Internal server error', 500);
  }
}
