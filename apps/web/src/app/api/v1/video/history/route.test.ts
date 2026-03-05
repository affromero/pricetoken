import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  getVideoPriceHistory: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getVideoPriceHistory } from '@/lib/video-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetVideoPriceHistory = vi.mocked(getVideoPriceHistory);

describe('GET /api/v1/video/history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns video price history on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetVideoPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/video/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockGetVideoPriceHistory).toHaveBeenCalledWith(30, { modelId: undefined, provider: undefined });
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/video/history');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetVideoPriceHistory).not.toHaveBeenCalled();
  });

  it('passes query params to getVideoPriceHistory', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetVideoPriceHistory.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/video/history?days=7&provider=runway');
    await GET(req);

    expect(mockGetVideoPriceHistory).toHaveBeenCalledWith(7, { modelId: undefined, provider: 'runway' });
  });
});
