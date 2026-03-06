import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/tts-pricing-queries', () => ({
  getTtsProviderSummaries: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getTtsProviderSummaries } from '@/lib/tts-pricing-queries';

const mockGetCached = vi.mocked(getCached);
const mockGetTtsProviderSummaries = vi.mocked(getTtsProviderSummaries);

describe('GET /api/v1/tts/providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns TTS provider summaries', async () => {
    const providers = [{ id: 'openai', displayName: 'OpenAI', modelCount: 3, cheapestCostPerMChars: 15.0 }];
    mockGetCached.mockResolvedValue(null);
    mockGetTtsProviderSummaries.mockResolvedValue(providers);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(providers);
  });

  it('returns cached data on cache hit', async () => {
    const cached = [{ id: 'openai', displayName: 'OpenAI', modelCount: 3, cheapestCostPerMChars: 15.0 }];
    mockGetCached.mockResolvedValue(cached);

    const res = await GET();
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(mockGetTtsProviderSummaries).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
