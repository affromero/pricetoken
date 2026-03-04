import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/pricing-queries', () => ({
  getProviderSummaries: vi.fn(),
}));

import { GET } from './route';
import { getCached, setCache } from '@/lib/redis';
import { getProviderSummaries } from '@/lib/pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockSetCache = vi.mocked(setCache);
const mockGetProviderSummaries = vi.mocked(getProviderSummaries);

const mockSummaries = [
  { id: 'openai', displayName: 'OpenAI', modelCount: 5, cheapestInputPerMTok: 0.15, cheapestOutputPerMTok: 0.6 },
  { id: 'anthropic', displayName: 'Anthropic', modelCount: 3, cheapestInputPerMTok: 3, cheapestOutputPerMTok: 15 },
];

describe('GET /api/v1/pricing/providers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns provider summaries on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetProviderSummaries.mockResolvedValue(mockSummaries);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockSummaries);
    expect(body.meta.cached).toBe(false);
    expect(mockGetProviderSummaries).toHaveBeenCalledOnce();
  });

  it('returns cached data on cache hit without calling query', async () => {
    mockGetCached.mockResolvedValue(mockSummaries);

    const res = await GET();
    const body = await res.json();

    expect(body.data).toEqual(mockSummaries);
    expect(body.meta.cached).toBe(true);
    expect(mockGetProviderSummaries).not.toHaveBeenCalled();
  });

  it('uses fixed cache key pt:cache:providers', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetProviderSummaries.mockResolvedValue(mockSummaries);

    await GET();

    expect(mockGetCached).toHaveBeenCalledWith('pt:cache:providers');
  });

  it('calls setCache on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetProviderSummaries.mockResolvedValue(mockSummaries);

    await GET();

    expect(mockSetCache).toHaveBeenCalledWith('pt:cache:providers', mockSummaries);
  });

  it('returns full CORS headers on success', async () => {
    mockGetCached.mockResolvedValue(mockSummaries);

    const res = await GET();

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
  });

  it('returns Cache-Control header on success', async () => {
    mockGetCached.mockResolvedValue(mockSummaries);

    const res = await GET();

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns apiSuccess shape with data array and meta', async () => {
    mockGetCached.mockResolvedValue(mockSummaries);

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta.currency).toBe('USD');
    expect(body.meta.timestamp).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns 500 with apiError shape on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('redis down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
    expect(res.headers.get('Access-Control-Allow-Headers')).toBeNull();
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
