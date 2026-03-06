import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({ getCached: vi.fn(), setCache: vi.fn() }));
vi.mock('@/lib/avatar-pricing-queries', () => ({ getAvatarProviderSummaries: vi.fn() }));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getAvatarProviderSummaries } from '@/lib/avatar-pricing-queries';

describe('GET /api/v1/avatar/providers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns avatar provider summaries', async () => {
    const providers = [{ id: 'heygen', displayName: 'HeyGen', modelCount: 3, cheapestCostPerMinute: 0.99 }];
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getAvatarProviderSummaries).mockResolvedValue(providers);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('heygen');
  });

  it('returns cached providers', async () => {
    const cached = [{ id: 'heygen' }];
    vi.mocked(getCached).mockResolvedValue(cached);

    const res = await GET();
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(getAvatarProviderSummaries).not.toHaveBeenCalled();
  });
});
