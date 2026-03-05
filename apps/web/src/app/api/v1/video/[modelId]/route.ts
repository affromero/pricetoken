import { type NextRequest } from 'next/server';
import { getVideoModelPricing } from '@/lib/video-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertVideoPricing } from '@/lib/currency-convert';
import type { VideoModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:video:model:${modelId}`;

    const cached = await getCached<VideoModelPricing>(cacheKey);
    let model = cached ?? await getVideoModelPricing(modelId);

    if (!model) {
      return apiError('Video model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertVideoPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/video/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
