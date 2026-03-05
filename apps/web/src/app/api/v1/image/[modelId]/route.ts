import { type NextRequest } from 'next/server';
import { getImageModelPricing } from '@/lib/image-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertImagePricing } from '@/lib/currency-convert';
import type { ImageModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:image:model:${modelId}`;

    const cached = await getCached<ImageModelPricing>(cacheKey);
    let model = cached ?? await getImageModelPricing(modelId);

    if (!model) {
      return apiError('Image model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertImagePricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/image/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
