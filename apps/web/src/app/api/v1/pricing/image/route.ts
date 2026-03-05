import { type NextRequest } from 'next/server';
import { getCurrentImagePricing } from '@/lib/image-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertImagePricing } from '@/lib/currency-convert';
import type { ImageModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') ?? undefined;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const after = request.nextUrl.searchParams.get('after') ?? undefined;
    const before = request.nextUrl.searchParams.get('before') ?? undefined;
    const dateRange = (after || before) ? { after, before } : undefined;
    const cacheKey = `pt:cache:image:pricing:${provider ?? 'all'}:${after ?? ''}:${before ?? ''}`;

    const cached = await getCached<ImageModelPricing[]>(cacheKey);
    let data = cached ?? await getCurrentImagePricing(provider, dateRange);

    if (!cached) await setCache(cacheKey, data);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      data = convertImagePricing(data, currencyInfo.exchangeRate);
      return apiSuccess(data, !!cached, currencyInfo);
    }

    return apiSuccess(data, !!cached);
  } catch (err) {
    console.error('GET /api/v1/pricing/image error:', err);
    return apiError('Internal server error', 500);
  }
}
