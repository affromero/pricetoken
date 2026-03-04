import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  getPriceHistory: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { getPriceHistory } from '@/lib/pricing-queries';

const mockGetCached = vi.mocked(getCached);
const _mockSetCache = vi.mocked(setCache);
const mockGetPriceHistory = vi.mocked(getPriceHistory);

const mockHistory = [
  { modelId: 'claude-sonnet-4-6', provider: 'anthropic', displayName: 'Claude Sonnet 4.6', history: [] },
];

describe('GET /api/v1/pricing/history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns history on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockHistory);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetPriceHistory).not.toHaveBeenCalled();
  });

  it('defaults days to 30', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:30::');
    expect(mockGetPriceHistory).toHaveBeenCalledWith(30, { modelId: undefined, provider: undefined });
  });

  it('respects days query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history?days=90');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:90::');
    expect(mockGetPriceHistory).toHaveBeenCalledWith(90, { modelId: undefined, provider: undefined });
  });

  it('caps days at 365', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history?days=1000');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:365::');
    expect(mockGetPriceHistory).toHaveBeenCalledWith(365, { modelId: undefined, provider: undefined });
  });

  it('passes modelId filter', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history?modelId=gpt-4o');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:30:gpt-4o:');
    expect(mockGetPriceHistory).toHaveBeenCalledWith(30, { modelId: 'gpt-4o', provider: undefined });
  });

  it('passes provider filter', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history?provider=anthropic');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:30::anthropic');
    expect(mockGetPriceHistory).toHaveBeenCalledWith(30, { modelId: undefined, provider: 'anthropic' });
  });

  it('constructs correct cache key with all params', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetPriceHistory.mockResolvedValue(mockHistory);

    const req = new NextRequest('http://localhost/api/v1/pricing/history?days=90&modelId=gpt-4o&provider=openai');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:history:90:gpt-4o:openai');
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/pricing/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
