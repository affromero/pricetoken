import { type NextRequest } from 'next/server';
import { getCurrentTtsPricing } from '@/lib/tts-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertTtsPricing } from '@/lib/currency-convert';
import type { TtsModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const after = request.nextUrl.searchParams.get('after') ?? undefined;
    const before = request.nextUrl.searchParams.get('before') ?? undefined;
    const dateRange = (after || before) ? { after, before } : undefined;
    const cacheKey = `pt:cache:tts:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<TtsModelPricing[]>(cacheKey);
    let data = cached ?? await getCurrentTtsPricing(provider, dateRange);

    if (!cached) await setCache(cacheKey, data);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      data = convertTtsPricing(data, currencyInfo.exchangeRate);
      return apiSuccess(data, !!cached, currencyInfo);
    }

    return apiSuccess(data, !!cached);
  } catch (err) {
    console.error('GET /api/v1/tts error:', err);
    return apiError('Internal server error', 500);
  }
}
