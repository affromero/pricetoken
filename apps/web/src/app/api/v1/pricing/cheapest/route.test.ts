import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  getCheapestModel: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { getCheapestModel } from '@/lib/pricing-queries';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockSetCache = vi.mocked(setCache);
const mockGetCheapestModel = vi.mocked(getCheapestModel);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertPricing = vi.mocked(convertPricing);

const mockModel = {
  modelId: 'gemini-2.0-flash-lite',
  provider: 'google',
  displayName: 'Gemini 2.0 Flash-Lite',
  inputPerMTok: 0.075,
  outputPerMTok: 0.30,
  contextWindow: 1048576,
  maxOutputTokens: 8192,
  source: 'seed' as const,
  status: 'active' as const,
  confidence: 'high' as const,
  lastUpdated: '2026-03-01T00:00:00Z',
  launchDate: '2025-02-05',
};

describe('GET /api/v1/pricing/cheapest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns cheapest model on cache miss without provider filter', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('gemini-2.0-flash-lite');
    expect(body.meta.cached).toBe(false);
    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:cheapest:all');
  });

  it('returns cached model on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetCheapestModel).not.toHaveBeenCalled();
  });

  it('filters by provider query param', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest?provider=openai');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:cheapest:openai');
    expect(mockGetCheapestModel).toHaveBeenCalledWith('openai');
  });

  it('returns 404 when no pricing data available', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'No pricing data available', status: 404 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });

  it('does not call setCache when model not found', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    await GET(req);

    expect(mockSetCache).not.toHaveBeenCalled();
  });

  it('uses cache key with provider suffix', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest?provider=anthropic');
    await GET(req);

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:cheapest:anthropic');
    expect(mockSetCache).toHaveBeenCalledWith('pt:cache:cheapest:anthropic', mockModel);
  });

  it('converts currency when requested', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestModel.mockResolvedValue(mockModel);
    const converted = { ...mockModel, inputPerMTok: 0.069, outputPerMTok: 0.276 };
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest?currency=EUR');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
    expect(mockConvertPricing).toHaveBeenCalledWith(mockModel, 0.92);
  });

  it('returns full CORS and Cache-Control headers on success', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    const res = await GET(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/pricing/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
