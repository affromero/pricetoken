import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  getCheapestVideoModel: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertVideoPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCheapestVideoModel } from '@/lib/video-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCheapestVideoModel = vi.mocked(getCheapestVideoModel);
const mockResolveCurrency = vi.mocked(resolveCurrency);

const mockModel = {
  modelId: 'kling-3.0-1080p',
  provider: 'kling',
  displayName: 'Kling 3.0 1080p',
  costPerMinute: 5.04,
  resolution: '1080p',
  maxDuration: 15,
  qualityMode: 'standard',
  source: 'seed' as const,
  status: 'active' as const,
  confidence: 'high' as const,
  confidenceScore: 65,
  confidenceLevel: 'medium' as const,
  freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
  lastUpdated: '2026-03-01T00:00:00Z',
  launchDate: '2025-09-01',
};

describe('GET /api/v1/video/cheapest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns cheapest video model', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestVideoModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/video/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('kling-3.0-1080p');
  });

  it('returns 404 when no data available', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestVideoModel.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/video/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });
});
