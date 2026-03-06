import { type NextRequest } from 'next/server';
import { getCheapestSttModel } from '@/lib/stt-pricing-queries';
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
    const cacheKey = `pt:cache:stt:cheapest:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<SttModelPricing>(cacheKey);
    let model = cached ?? await getCheapestSttModel(provider, dateRange);

    if (!model) {
      return apiError('No STT pricing data available', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertSttPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/stt/cheapest error:', err);
    return apiError('Internal server error', 500);
  }
}
