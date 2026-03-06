import { type NextRequest } from 'next/server';
import { getCheapestTtsModel } from '@/lib/tts-pricing-queries';
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
    const cacheKey = `pt:cache:tts:cheapest:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<TtsModelPricing>(cacheKey);
    let model = cached ?? await getCheapestTtsModel(provider, dateRange);

    if (!model) {
      return apiError('No TTS pricing data available', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertTtsPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/tts/cheapest error:', err);
    return apiError('Internal server error', 500);
  }
}
