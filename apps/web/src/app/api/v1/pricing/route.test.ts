import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  getCurrentPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { getCurrentPricing } from '@/lib/pricing-queries';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const _mockSetCache = vi.mocked(setCache);
const mockGetCurrentPricing = vi.mocked(getCurrentPricing);
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
  },
];

describe('GET /api/v1/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns all models on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/pricing');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockModels);
    expect(body.meta.cached).toBe(false);
    expect(mockGetCurrentPricing).toHaveBeenCalledWith(undefined);
    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:pricing:all');
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/pricing');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCurrentPricing).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentPricing.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/pricing?provider=anthropic');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:pricing:anthropic');
    expect(mockGetCurrentPricing).toHaveBeenCalledWith('anthropic');
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCurrentPricing.mockResolvedValue(mockModels);
    const converted = mockModels.map((m) => ({ ...m, inputPerMTok: 2.76, outputPerMTok: 13.8 }));
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/pricing?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
  });

  it('returns USD when unsupported currency is passed', async () => {
    mockGetCached.mockResolvedValue(mockModels);
    mockResolveCurrency.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/pricing?currency=XYZ');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('USD');
    expect(mockConvertPricing).not.toHaveBeenCalled();
  });

  it('returns full CORS headers on success', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/pricing');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
  });

  it('returns Cache-Control header on success', async () => {
    mockGetCached.mockResolvedValue(mockModels);

    const req = new NextRequest('http://localhost/api/v1/pricing');
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/pricing');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
