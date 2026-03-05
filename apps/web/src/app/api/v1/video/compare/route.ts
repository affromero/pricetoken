import { type NextRequest } from 'next/server';
import { compareVideoModels } from '@/lib/video-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertVideoPricing } from '@/lib/currency-convert';
import type { VideoModelPricing } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const modelsParam = request.nextUrl.searchParams.get('models');
    if (!modelsParam) {
      return apiError('Missing required parameter: models', 400);
    }

    const modelIds = modelsParam.split(',').slice(0, 10);
    if (modelIds.length === 0) {
      return apiError('At least one model ID is required', 400);
    }

    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:video:compare:${modelIds.sort().join(',')}`;

    const cached = await getCached<VideoModelPricing[]>(cacheKey);
    let data = cached ?? await compareVideoModels(modelIds);

    if (!cached) await setCache(cacheKey, data);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      data = convertVideoPricing(data, currencyInfo.exchangeRate);
      return apiSuccess(data, !!cached, currencyInfo);
    }

    return apiSuccess(data, !!cached);
  } catch (err) {
    console.error('GET /api/v1/video/compare error:', err);
    return apiError('Internal server error', 500);
  }
}
