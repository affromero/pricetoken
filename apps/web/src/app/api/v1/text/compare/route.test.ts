import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  compareModels: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { compareModels } from '@/lib/pricing-queries';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const _mockSetCache = vi.mocked(setCache);
const mockCompareModels = vi.mocked(compareModels);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertPricing = vi.mocked(convertPricing);

const mockModels = [
  {
    modelId: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    inputPerMTok: 3,
    outputPerMTok: 15,
    contextWindow: 200000,
    maxOutputTokens: 64000,
    source: 'seed' as const,
    status: 'active' as const,
    confidence: 'high' as const,
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2026-02-17',
  },
  {
    modelId: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    inputPerMTok: 2.5,
    outputPerMTok: 10,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    source: 'seed' as const,
    status: 'active' as const,
    confidence: 'high' as const,
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2026-02-17',
  },
];

describe('GET /api/v1/pricing/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns 400 when models param is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/text/compare');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Missing required parameter: models', status: 400 });
  });

  it('returns compared models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareModels.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6,gpt-4o');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6,gpt-4o');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockCompareModels).not.toHaveBeenCalled();
  });

  it('sorts model IDs for cache key to be order-independent', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareModels.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=gpt-4o,claude-sonnet-4-6');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:compare:claude-sonnet-4-6,gpt-4o');
  });

  it('truncates to 10 models maximum', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareModels.mockResolvedValue([]);

    const ids = Array.from({ length: 15 }, (_, i) => `model-${i}`).join(',');
    const req = new NextRequest(`http://localhost/api/v1/text/compare?models=${ids}`);
    await GET(req);

    const calledIds = mockCompareModels.mock.calls[0]![0];
    expect(calledIds).toHaveLength(10);
  });

  it('handles a single model ID', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareModels.mockResolvedValue([mockModels[0]!]);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareModels.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, inputPerMTok: m.inputPerMTok * 0.92 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6,gpt-4o&currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns full CORS and Cache-Control headers on success', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6,gpt-4o');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns apiSuccess shape with default currency USD', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=claude-sonnet-4-6');
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta.currency).toBe('USD');
  });

  it('returns only Allow-Origin on 400 error, not full CORS', async () => {
    const req = new NextRequest('http://localhost/api/v1/text/compare');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
    expect(res.headers.get('Access-Control-Allow-Headers')).toBeNull();
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/text/compare?models=a');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
