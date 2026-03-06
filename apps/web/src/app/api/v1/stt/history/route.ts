import { type NextRequest } from 'next/server';
import { getSttPriceHistory } from '@/lib/stt-pricing-queries';
import { getCached, setCache } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { SttModelHistory } from 'pricetoken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(Number(searchParams.get('days') ?? 30), 365);
    const modelId = searchParams.get('modelId') ?? undefined;
    const provider = searchParams.get('provider') ?? undefined;

    const cacheKey = `pt:cache:stt:history:${days}:${modelId ?? ''}:${provider ?? ''}`;

    const cached = await getCached<SttModelHistory[]>(cacheKey);
    if (cached) return apiSuccess(cached, true);

    const history = await getSttPriceHistory(days, { modelId, provider });
    await setCache(cacheKey, history);

    return apiSuccess(history);
  } catch (err) {
    console.error('GET /api/v1/stt/history error:', err);
    return apiError('Internal server error', 500);
  }
}
