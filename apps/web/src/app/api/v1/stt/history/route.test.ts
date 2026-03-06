import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/stt-pricing-queries', () => ({
  getSttPriceHistory: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getSttPriceHistory } from '@/lib/stt-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetSttPriceHistory = vi.mocked(getSttPriceHistory);

describe('GET /api/v1/stt/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns STT price history', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetSttPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/stt/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns cached data on cache hit', async () => {
    const cached = [{ modelId: 'openai-whisper-1', provider: 'openai', displayName: 'Whisper', history: [] }];
    mockGetCached.mockResolvedValue(cached);

    const req = new NextRequest('http://localhost/api/v1/stt/history');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetSttPriceHistory).not.toHaveBeenCalled();
  });

  it('passes query params to history function', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetSttPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/stt/history?days=60&provider=openai');
    await GET(req);

    expect(mockGetSttPriceHistory).toHaveBeenCalledWith(60, { modelId: undefined, provider: 'openai' });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/stt/history');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
