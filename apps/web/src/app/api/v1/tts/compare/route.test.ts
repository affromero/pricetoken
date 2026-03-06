import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/tts-pricing-queries', () => ({
  compareTtsModels: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertTtsPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { compareTtsModels } from '@/lib/tts-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockCompareTtsModels = vi.mocked(compareTtsModels);
const mockResolveCurrency = vi.mocked(resolveCurrency);

describe('GET /api/v1/tts/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns compared TTS models', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareTtsModels.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/tts/compare?models=openai-tts-1,openai-tts-1-hd');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns 400 when models param is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/tts/compare');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/tts/compare?models=a');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
