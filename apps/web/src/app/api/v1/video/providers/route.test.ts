import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/video-pricing-queries', () => ({
  getVideoProviderSummaries: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getVideoProviderSummaries } from '@/lib/video-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetVideoProviderSummaries = vi.mocked(getVideoProviderSummaries);

const mockProviders = [
  { id: 'runway', displayName: 'Runway', modelCount: 2, cheapestCostPerMinute: 3.0 },
  { id: 'kling', displayName: 'Kling', modelCount: 1, cheapestCostPerMinute: 1.74 },
];

describe('GET /api/v1/video/providers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns video provider summaries on cache miss', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetVideoProviderSummaries.mockResolvedValue(mockProviders);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockProviders);
  });

  it('returns cached data on cache hit', async () => {
    mockGetCached.mockResolvedValue(mockProviders);

    const res = await GET();
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetVideoProviderSummaries).not.toHaveBeenCalled();
  });
});
