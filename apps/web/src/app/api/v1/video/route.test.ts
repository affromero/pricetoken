import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  getCurrentVideoPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertVideoPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCurrentVideoPricing } from '@/lib/video-pricing-queries';
import { resolveCurrency, convertVideoPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCurrentVideoPricing = vi.mocked(getCurrentVideoPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertVideoPricing = vi.mocked(convertVideoPricing);

const mockModels = [
  {
    modelId: 'runway-gen4-720p',
    provider: 'runway',
    displayName: 'Runway Gen-4 720p',
    costPerMinute: 7.2,
    resolution: '720p',
    maxDuration: 10,
    qualityMode: 'standard',
    source: 'seed' as const,
    status: 'active' as const,
    confidence: 'high' as const,
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2025-06-01',
  },
];

describe('GET /api/v1/video', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns all video models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentVideoPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/video');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/video');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCurrentVideoPricing).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentVideoPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/video?provider=runway');
    await GET(req);

    expect(mockGetCurrentVideoPricing).toHaveBeenCalledWith('runway', undefined);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentVideoPricing.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, costPerMinute: 6.624 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertVideoPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/video?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns CORS headers', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/video');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/video');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
