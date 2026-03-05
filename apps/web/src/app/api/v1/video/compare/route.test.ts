import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  compareVideoModels: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertVideoPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { compareVideoModels } from '@/lib/video-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockCompareVideoModels = vi.mocked(compareVideoModels);
const mockResolveCurrency = vi.mocked(resolveCurrency);

describe('GET /api/v1/video/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns 400 when models param is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/video/compare');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns compared models', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareVideoModels.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/video/compare?models=runway-gen4-720p,kling-3.0-1080p');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockCompareVideoModels).toHaveBeenCalledWith(
      expect.arrayContaining(['runway-gen4-720p', 'kling-3.0-1080p'])
    );
  });
});
