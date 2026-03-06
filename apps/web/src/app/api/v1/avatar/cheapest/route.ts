import { type NextRequest } from 'next/server';
import { getCheapestAvatarModel } from '@/lib/avatar-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertAvatarPricing } from '@/lib/currency-convert';
import type { AvatarModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const after = request.nextUrl.searchParams.get('after') ?? undefined;
    const before = request.nextUrl.searchParams.get('before') ?? undefined;
    const dateRange = (after || before) ? { after, before } : undefined;
    const cacheKey = `pt:cache:avatar:cheapest:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<AvatarModelPricing>(cacheKey);
    let model = cached ?? await getCheapestAvatarModel(provider, dateRange);

    if (!model) {
      return apiError('No avatar pricing data available', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertAvatarPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/avatar/cheapest error:', err);
    return apiError('Internal server error', 500);
  }
}
