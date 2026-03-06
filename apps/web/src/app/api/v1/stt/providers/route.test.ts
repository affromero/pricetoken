import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/stt-pricing-queries', () => ({
  getSttProviderSummaries: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getSttProviderSummaries } from '@/lib/stt-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetSttProviderSummaries = vi.mocked(getSttProviderSummaries);

describe('GET /api/v1/stt/providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns STT provider summaries', async () => {
    const providers = [{ id: 'openai', displayName: 'OpenAI', modelCount: 2, cheapestCostPerMinute: 0.006 }];
    mockGetCached.mockResolvedValue(null);
    mockGetSttProviderSummaries.mockResolvedValue(providers);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(providers);
  });

  it('returns cached data on cache hit', async () => {
    const cached = [{ id: 'openai', displayName: 'OpenAI', modelCount: 2, cheapestCostPerMinute: 0.006 }];
    mockGetCached.mockResolvedValue(cached);

    const res = await GET();
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetSttProviderSummaries).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
