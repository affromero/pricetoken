import { type NextRequest } from 'next/server';
import { getMusicModelPricing } from '@/lib/music-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { resolveCurrency, convertMusicPricing } from '@/lib/currency-convert';
import type { MusicModelPricing } from 'pricetoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const cacheKey = `pt:cache:music:model:${modelId}`;

    const cached = await getCached<MusicModelPricing>(cacheKey);
    let model = cached ?? await getMusicModelPricing(modelId);

    if (!model) {
      return apiError('Music model not found', 404);
    }

    if (!cached) await setCache(cacheKey, model);

    const currencyInfo = await resolveCurrency(currencyParam);
    if (currencyInfo) {
      model = convertMusicPricing(model, currencyInfo.exchangeRate);
      return apiSuccess(model, !!cached, currencyInfo);
    }

    return apiSuccess(model, !!cached);
  } catch (err) {
    console.error('GET /api/v1/music/[modelId] error:', err);
    return apiError('Internal server error', 500);
  }
}
