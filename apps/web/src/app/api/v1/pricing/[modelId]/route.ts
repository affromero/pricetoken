import { type NextRequest } from 'next/server';
import { getModelPricing } from '@/lib/pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';
import type { ModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:model:${modelId}`;

    const cached = await getCached<ModelPricing>(cacheKey);
    let model = cached ?? await getModelPricing(modelId);

    if (!model) {
      return apiError('Model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/pricing/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
