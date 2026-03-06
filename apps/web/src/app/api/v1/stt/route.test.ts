import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/stt-pricing-queries', () => ({
  getCurrentSttPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertSttPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCurrentSttPricing } from '@/lib/stt-pricing-queries';
import { resolveCurrency, convertSttPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCurrentSttPricing = vi.mocked(getCurrentSttPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertSttPricing = vi.mocked(convertSttPricing);

const mockModels = [
  {
    modelId: 'openai-whisper-1',
    provider: 'openai',
    displayName: 'OpenAI Whisper',
    costPerMinute: 0.006,
    sttType: 'batch',
    maxDuration: 7200,
    supportedLanguages: 57,
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

describe('GET /api/v1/stt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns all STT models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentSttPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/stt');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/stt');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCurrentSttPricing).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentSttPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/stt?provider=openai');
    await GET(req);

    expect(mockGetCurrentSttPricing).toHaveBeenCalledWith('openai', undefined);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentSttPricing.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, costPerMinute: 0.00552 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertSttPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/stt?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns CORS headers', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/stt');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/stt');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
