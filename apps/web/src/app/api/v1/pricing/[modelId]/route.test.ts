import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  getModelPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { getModelPricing } from '@/lib/pricing-queries';
import { resolveCurrency, convertPricing } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockSetCache = vi.mocked(setCache);
const mockGetModelPricing = vi.mocked(getModelPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);
const mockConvertPricing = vi.mocked(convertPricing);

const mockModel = {
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
};

const makeParams = (modelId: string) => ({ params: Promise.resolve({ modelId }) });

describe('GET /api/v1/pricing/[modelId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns model on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetModelPricing.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('claude-sonnet-4-6');
    expect(body.meta.cached).toBe(false);
    expect(mockGetModelPricing).toHaveBeenCalledWith('claude-sonnet-4-6');
  });

  it('returns cached model on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetModelPricing).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown model', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetModelPricing.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/pricing/nonexistent');
    const res = await GET(req, makeParams('nonexistent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Model not found', status: 404 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });

  it('uses cache key with modelId', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetModelPricing.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/gpt-4o');
    await GET(req, makeParams('gpt-4o'));

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:model:gpt-4o');
  });

  it('does not call setCache when model not found', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetModelPricing.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/pricing/nonexistent');
    await GET(req, makeParams('nonexistent'));

    expect(mockSetCache).not.toHaveBeenCalled();
  });

  it('converts currency and includes exchangeRate in meta', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetModelPricing.mockResolvedValue(mockModel);
    const converted = { ...mockModel, inputPerMTok: 2.76, outputPerMTok: 13.8 };
    mockResolveCurrency.mockResolvedValue({ currency: 'EUR', exchangeRate: 0.92 });
    mockConvertPricing.mockReturnValue(converted);

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6?currency=EUR');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));
    const body = await res.json();

    expect(body.meta.currency).toBe('EUR');
    expect(body.meta.exchangeRate).toBe(0.92);
    expect(mockConvertPricing).toHaveBeenCalledWith(mockModel, 0.92);
  });

  it('returns full CORS and Cache-Control headers on success', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns apiSuccess shape with default currency USD', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));
    const body = await res.json();

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta.currency).toBe('USD');
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/pricing/claude-sonnet-4-6');
    const res = await GET(req, makeParams('claude-sonnet-4-6'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
