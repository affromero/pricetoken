import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({ getCached: vi.fn(), setCache: vi.fn() }));
vi.mock('@/lib/avatar-pricing-queries', () => ({ getCheapestAvatarModel: vi.fn() }));
vi.mock('@/lib/currency-convert', () => ({ resolveCurrency: vi.fn(), convertAvatarPricing: vi.fn() }));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCheapestAvatarModel } from '@/lib/avatar-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

describe('GET /api/v1/avatar/cheapest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveCurrency).mockResolvedValue(null);
  });

  it('returns cheapest avatar model', async () => {
    const model = { modelId: 'heygen-avatar-standard', costPerMinute: 0.99 };
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getCheapestAvatarModel).mockResolvedValue(model as never);

    const req = new NextRequest('http://localhost/api/v1/avatar/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('heygen-avatar-standard');
  });

  it('returns 404 when no data available', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getCheapestAvatarModel).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/avatar/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });
});
