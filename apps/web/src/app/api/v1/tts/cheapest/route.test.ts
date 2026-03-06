import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/tts-pricing-queries', () => ({
  getCheapestTtsModel: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertTtsPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCheapestTtsModel } from '@/lib/tts-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCheapestTtsModel = vi.mocked(getCheapestTtsModel);
const mockResolveCurrency = vi.mocked(resolveCurrency);

const mockModel = {
  modelId: 'openai-tts-1',
  provider: 'openai',
  displayName: 'OpenAI TTS-1',
  costPerMChars: 15.0,
  voiceType: 'neural',
  maxCharacters: 4096,
  supportedLanguages: 57,
  source: 'seed' as const,
  status: 'active' as const,
  confidence: 'high' as const,
  confidenceScore: 65,
  confidenceLevel: 'medium' as const,
  freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
  lastUpdated: '2026-03-01T00:00:00Z',
  launchDate: '2024-01-15',
};

describe('GET /api/v1/tts/cheapest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns cheapest TTS model', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestTtsModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/tts/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('openai-tts-1');
  });

  it('returns 404 when no data available', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestTtsModel.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/tts/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('filters by provider', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestTtsModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/tts/cheapest?provider=openai');
    await GET(req);

    expect(mockGetCheapestTtsModel).toHaveBeenCalledWith('openai', undefined);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/tts/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
