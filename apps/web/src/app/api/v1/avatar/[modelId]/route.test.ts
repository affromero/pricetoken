import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({ getCached: vi.fn(), setCache: vi.fn() }));
vi.mock('@/lib/avatar-pricing-queries', () => ({ getAvatarModelPricing: vi.fn() }));
vi.mock('@/lib/currency-convert', () => ({ resolveCurrency: vi.fn(), convertAvatarPricing: vi.fn() }));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getAvatarModelPricing } from '@/lib/avatar-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockModel = {
  modelId: 'heygen-avatar-standard',
  provider: 'heygen',
  displayName: 'HeyGen Standard Avatar',
  costPerMinute: 0.99,
  avatarType: 'standard',
  resolution: '1080p',
  maxDuration: null,
  qualityMode: 'standard',
  lipSync: true,
  source: 'seed' as const,
  status: 'active' as const,
  confidence: 'high' as const,
  confidenceScore: 65,
  confidenceLevel: 'medium' as const,
  freshness: { lastVerified: '', ageHours: 0, stale: false },
  lastUpdated: null,
  launchDate: '2024-01-15',
};

describe('GET /api/v1/avatar/[modelId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveCurrency).mockResolvedValue(null);
  });

  it('returns a single avatar model', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getAvatarModelPricing).mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/avatar/heygen-avatar-standard');
    const res = await GET(req, { params: Promise.resolve({ modelId: 'heygen-avatar-standard' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('heygen-avatar-standard');
  });

  it('returns 404 for unknown model', async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(getAvatarModelPricing).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/avatar/unknown');
    const res = await GET(req, { params: Promise.resolve({ modelId: 'unknown' }) });

    expect(res.status).toBe(404);
  });
});
