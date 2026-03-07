import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/avatar-pricing-queries', () => ({
  getCurrentAvatarPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertAvatarPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCurrentAvatarPricing } from '@/lib/avatar-pricing-queries';
import { resolveCurrency, convertAvatarPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCurrentAvatarPricing = vi.mocked(getCurrentAvatarPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertAvatarPricing = vi.mocked(convertAvatarPricing);

const mockModels = [
  {
    modelId: 'heygen-avatar-standard',
    provider: 'heygen',
    displayName: 'HeyGen Standard Avatar',
    costPerMinute: 0.99,
    avatarType: 'standard',
    resolution: '1080p',
    maxDuration: null,
    qualityMode: 'standard',
    lipSync: true,
    source: 'seed' as const,
    status: 'active' as const,
    confidence: 'high' as const,
    confidenceScore: 65,
    confidenceLevel: 'medium' as const,
    freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2024-01-15',
  },
];

describe('GET /api/v1/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns all avatar models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentAvatarPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/avatar');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/avatar');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCurrentAvatarPricing).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentAvatarPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/avatar?provider=heygen');
    await GET(req);

    expect(mockGetCurrentAvatarPricing).toHaveBeenCalledWith('heygen', undefined);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentAvatarPricing.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, costPerMinute: 0.9108 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertAvatarPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/avatar?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns CORS headers', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/avatar');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/avatar');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
