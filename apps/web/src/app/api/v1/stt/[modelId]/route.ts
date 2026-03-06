import { type NextRequest } from 'next/server';
import { getSttModelPricing } from '@/lib/stt-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertSttPricing } from '@/lib/currency-convert';
import type { SttModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:stt:model:${modelId}`;

    const cached = await getCached<SttModelPricing>(cacheKey);
    let model = cached ?? await getSttModelPricing(modelId);

    if (!model) {
      return apiError('STT model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertSttPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/stt/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
