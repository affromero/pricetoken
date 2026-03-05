import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  getVideoModelPricing: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertVideoPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getVideoModelPricing } from '@/lib/video-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetVideoModelPricing = vi.mocked(getVideoModelPricing);
const mockResolveCurrency = vi.mocked(resolveCurrency);

const mockModel = {
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
  confidenceScore: 65,
  confidenceLevel: 'medium' as const,
  freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
  lastUpdated: '2026-03-01T00:00:00Z',
  launchDate: '2025-06-01',
};

describe('GET /api/v1/video/[modelId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns video model on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetVideoModelPricing.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/video/runway-gen4-720p');
    const res = await GET(req, { params: Promise.resolve({ modelId: 'runway-gen4-720p' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('runway-gen4-720p');
  });

  it('returns 404 for unknown model', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetVideoModelPricing.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/video/nonexistent');
    const res = await GET(req, { params: Promise.resolve({ modelId: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/video/runway-gen4-720p');
    const res = await GET(req, { params: Promise.resolve({ modelId: 'runway-gen4-720p' }) });
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetVideoModelPricing).not.toHaveBeenCalled();
  });
});
