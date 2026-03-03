import { type NextRequest } from 'next/server';
import { compareModels } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ModelPricing } from 'pricetoken';

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

    const cacheKey = `pt:cache:compare:${modelIds.sort().join(',')}`;

    const cached = await getCached<ModelPricing[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const models = await compareModels(modelIds);
    await setCache(cacheKey, models);

    return apiSuccess(models);
  } catch (err) {
    console.error('GET /api/v1/pricing/compare error:', err);
    return apiError('Internal server error', 500);
  }
}
