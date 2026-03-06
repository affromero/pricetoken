import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/stt-pricing-queries', () => ({
  getCheapestSttModel: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertSttPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { getCheapestSttModel } from '@/lib/stt-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockGetCheapestSttModel = vi.mocked(getCheapestSttModel);
const mockResolveCurrency = vi.mocked(resolveCurrency);

const mockModel = {
  modelId: 'openai-whisper-1',
  provider: 'openai',
  displayName: 'OpenAI Whisper',
  costPerMinute: 0.006,
  sttType: 'batch',
  maxDuration: 7200,
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

describe('GET /api/v1/stt/cheapest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns cheapest STT model', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestSttModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/stt/cheapest');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.modelId).toBe('openai-whisper-1');
  });

  it('returns 404 when no data available', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestSttModel.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/stt/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('filters by provider', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestSttModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/stt/cheapest?provider=openai');
    await GET(req);

    expect(mockGetCheapestSttModel).toHaveBeenCalledWith('openai', undefined);
  });

  it('passes after and before date params to getCheapestSttModel', async () => {
    mockGetCached.mockResolvedValue(null);
    mockGetCheapestSttModel.mockResolvedValue(mockModel);

    const req = new NextRequest('http://localhost/api/v1/stt/cheapest?after=2024-01-01&before=2025-12-31');
    await GET(req);

    expect(mockGetCheapestSttModel).toHaveBeenCalledWith(undefined, { after: '2024-01-01', before: '2025-12-31' });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/stt/cheapest');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
