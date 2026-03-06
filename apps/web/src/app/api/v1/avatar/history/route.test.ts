import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({ getCached: vi.fn(), setCache: vi.fn() }));
vi.mock('@/lib/avatar-pricing-queries', () => ({ getAvatarPriceHistory: vi.fn() }));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getAvatarPriceHistory } from '@/lib/avatar-pricing-queries';

describe('GET /api/v1/avatar/history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns avatar price history', async () => {
    const history = [{ modelId: 'heygen-avatar-standard', history: [{ date: '2026-03-01', costPerMinute: 0.99 }] }];
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getAvatarPriceHistory).mockResolvedValue(history as never);

    const req = new NextRequest('http://localhost/api/v1/avatar/history');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('returns cached history', async () => {
    const cached = [{ modelId: 'test', history: [] }];
    vi.mocked(getCached).mockResolvedValue(cached);

    const req = new NextRequest('http://localhost/api/v1/avatar/history');
    const res = await GET(req);
    const body = await res.json();

    expect(body.meta.cached).toBe(true);
    expect(getAvatarPriceHistory).not.toHaveBeenCalled();
  });
});
