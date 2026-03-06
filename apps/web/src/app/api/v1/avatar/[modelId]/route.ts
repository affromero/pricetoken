import { type NextRequest } from 'next/server';
import { getAvatarModelPricing } from '@/lib/avatar-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertAvatarPricing } from '@/lib/currency-convert';
import type { AvatarModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:avatar:model:${modelId}`;

    const cached = await getCached<AvatarModelPricing>(cacheKey);
    let model = cached ?? await getAvatarModelPricing(modelId);

    if (!model) {
      return apiError('Avatar model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertAvatarPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/avatar/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
