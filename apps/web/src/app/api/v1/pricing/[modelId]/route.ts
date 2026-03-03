import { type NextRequest } from 'next/server';
import { getModelPricing } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { ModelPricing } from 'pricetoken';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const cacheKey = `pt:cache:model:${modelId}`;

    const cached = await getCached<ModelPricing>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const model = await getModelPricing(modelId);
    if (!model) {
      return apiError('Model not found', 404);
    }

    await setCache(cacheKey, model);
    return apiSuccess(model);
  } catch (err) {
    console.error('GET /api/v1/pricing/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
