import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/redis', () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/stt-pricing-queries', () => ({
  compareSttModels: vi.fn(),
}));

vi.mock('@/lib/currency-convert', () => ({
  resolveCurrency: vi.fn(),
  convertSttPricing: vi.fn(),
}));

import { GET } from './route';
import { getCached } from '@/lib/redis';
import { compareSttModels } from '@/lib/stt-pricing-queries';
import { resolveCurrency } from '@/lib/currency-convert';

const mockGetCached = vi.mocked(getCached);
const mockCompareSttModels = vi.mocked(compareSttModels);
const mockResolveCurrency = vi.mocked(resolveCurrency);

describe('GET /api/v1/stt/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveCurrency.mockResolvedValue(null);
  });

  it('returns compared STT models', async () => {
    mockGetCached.mockResolvedValue(null);
    mockCompareSttModels.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/v1/stt/compare?models=openai-whisper-1,deepgram-nova-2');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns 400 when models param is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/stt/compare');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCached.mockRejectedValue(new Error('boom'));

    const req = new NextRequest('http://localhost/api/v1/stt/compare?models=a');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
