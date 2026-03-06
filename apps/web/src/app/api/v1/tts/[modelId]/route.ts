import { type NextRequest } from 'next/server';
import { getTtsModelPricing } from '@/lib/tts-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertTtsPricing } from '@/lib/currency-convert';
import type { TtsModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:tts:model:${modelId}`;

    const cached = await getCached<TtsModelPricing>(cacheKey);
    let model = cached ?? await getTtsModelPricing(modelId);

    if (!model) {
      return apiError('TTS model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertTtsPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/tts/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
