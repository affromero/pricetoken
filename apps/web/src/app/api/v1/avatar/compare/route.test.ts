import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({ getCached: vi.fn(), setCache: vi.fn() }));
vi.mock('@/lib/avatar-pricing-queries', () => ({ compareAvatarModels: vi.fn() }));
vi.mock('@/lib/currency-convert', () => ({ resolveCurrency: vi.fn(), convertAvatarPricing: vi.fn() }));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { compareAvatarModels } from '@/lib/avatar-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

describe('GET /api/v1/avatar/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveCurrency).mockResolvedValue(null);
  });

  it('compares requested models', async () => {
    const models = [{ modelId: 'heygen-avatar-standard' }, { modelId: 'heygen-avatar-iv' }];
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(compareAvatarModels).mockResolvedValue(models as never);

    const req = new NextRequest('http://localhost/api/v1/avatar/compare?models=heygen-avatar-standard,heygen-avatar-iv');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it('returns 400 when models param is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/avatar/compare');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});
