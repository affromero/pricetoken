import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/tts-pricing-queries', () => ({
  getCurrentTtsPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertTtsPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCurrentTtsPricing } from '@/lib/tts-pricing-queries';
import { resolveCurrency, convertTtsPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCurrentTtsPricing = vi.mocked(getCurrentTtsPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertTtsPricing = vi.mocked(convertTtsPricing);

const mockModels = [
  {
    modelId: 'openai-tts-1',
    provider: 'openai',
    displayName: 'OpenAI TTS-1',
    costPerMChars: 15.0,
    voiceType: 'neural',
    maxCharacters: 4096,
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

describe('GET /api/v1/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns all TTS models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentTtsPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/tts');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/tts');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCurrentTtsPricing).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentTtsPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/tts?provider=openai');
    await GET(req);

    expect(mockGetCurrentTtsPricing).toHaveBeenCalledWith('openai', undefined);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentTtsPricing.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, costPerMChars: 13.8 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertTtsPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/tts?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns CORS headers', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/tts');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/tts');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
