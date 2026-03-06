import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/tts-pricing-queries', () => ({
  getTtsPriceHistory: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getTtsPriceHistory } from '@/lib/tts-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetTtsPriceHistory = vi.mocked(getTtsPriceHistory);

describe('GET /api/v1/tts/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns TTS price history', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetTtsPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/tts/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns cached data on cache hit', async () => {
    const cached = [{ modelId: 'openai-tts-1', provider: 'openai', displayName: 'TTS-1', history: [] }];
    mockGetCached.mockResolvedValue(cached);

    const req = new NextRequest('http://localhost/api/v1/tts/history');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetTtsPriceHistory).not.toHaveBeenCalled();
  });

  it('passes query params to history function', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetTtsPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/tts/history?days=60&provider=openai');
    await GET(req);

    expect(mockGetTtsPriceHistory).toHaveBeenCalledWith(60, { modelId: undefined, provider: 'openai' });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/tts/history');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
