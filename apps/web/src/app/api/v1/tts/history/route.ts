import { type NextRequest } from 'next/server';
import { getTtsPriceHistory } from '@/lib/tts-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { TtsModelHistory } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(Number(searchParams.get('days') ?? 30), 365);
    const modelId = searchParams.get('modelId') ?? undefined;
    const provider = searchParams.get('provider') ?? undefined;

    const cacheKey = `pt:cache:tts:history:${days}:${modelId ?? ''}:${provider ?? ''}`;

    const cached = await getCached<TtsModelHistory[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const history = await getTtsPriceHistory(days, { modelId, provider });
    await setCache(cacheKey, history);

    return apiSuccess(history);
  } catch (err) {
    console.error('GET /api/v1/tts/history error:', err);
    return apiError('Internal server error', 500);
  }
}
