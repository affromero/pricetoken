import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VideoModelPricing } from 'pricetoken';

const mockVideoPricing: VideoModelPricing[] = [
  {
    modelId: 'runway-gen4-720p',
    provider: 'runway',
    displayName: 'Runway Gen-4 720p',
    costPerMinute: 7.2,
    inputType: 'text,image',
    resolution: '720p',
    maxDuration: 10,
    qualityMode: 'standard',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2025-06-01',
  },
  {
    modelId: 'kling-3.0-1080p',
    provider: 'kling',
    displayName: 'Kling 3.0 1080p',
    costPerMinute: 5.04,
    inputType: 'text,image',
    resolution: '1080p',
    maxDuration: 15,
    qualityMode: 'standard',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2025-09-01',
  },
  {
    modelId: 'sora2-pro-1080p',
    provider: 'sora',
    displayName: 'Sora 2 Pro 1080p',
    costPerMinute: 42.0,
    inputType: 'text,image',
    resolution: '1080p',
    maxDuration: 25,
    qualityMode: 'professional',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: '2026-03-01T00:00:00Z', ageHours: 0, stale: false },
    lastUpdated: '2026-03-01T00:00:00Z',
    launchDate: '2025-02-01',
  },
];

vi.mock('./fetcher/video-store', () => ({
  getLatestVideoPricing: vi.fn((provider?: string) => {
    if (provider) return Promise.resolve(mockVideoPricing.filter((m) => m.provider === provider));
    return Promise.resolve(mockVideoPricing);
  }),
  getVideoPriceHistory: vi.fn(() => Promise.resolve([])),
}));

vi.mock('./fetcher/providers', () => ({
  VIDEO_PROVIDERS: {
    runway: { url: 'https://runwayml.com/pricing', displayName: 'Runway' },
    kling: { url: 'https://klingai.com/pricing', displayName: 'Kling' },
    sora: { url: 'https://openai.com/api/pricing/', displayName: 'Sora (OpenAI)' },
  },
}));

import {
  getCurrentVideoPricing,
  getVideoModelPricing,
  getVideoProviderSummaries,
  compareVideoModels,
  getCheapestVideoModel,
} from './video-pricing-queries';

describe('getCurrentVideoPricing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all video models when no filter', async () => {
    const result = await getCurrentVideoPricing();
    expect(result).toHaveLength(3);
  });

  it('filters by provider', async () => {
    const result = await getCurrentVideoPricing('runway');
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('runway');
  });

  it('filters by after date', async () => {
    const result = await getCurrentVideoPricing(undefined, { after: '2025-05-01' });
    expect(result).toHaveLength(2);
  });

  it('filters by before date', async () => {
    const result = await getCurrentVideoPricing(undefined, { before: '2025-08-01' });
    expect(result).toHaveLength(2);
  });
});

describe('getVideoModelPricing', () => {
  it('returns matching video model', async () => {
    const result = await getVideoModelPricing('kling-3.0-1080p');
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('kling-3.0-1080p');
  });

  it('returns null for unknown model', async () => {
    const result = await getVideoModelPricing('nonexistent');
    expect(result).toBeNull();
  });
});

describe('getVideoProviderSummaries', () => {
  it('returns one summary per provider with display names', async () => {
    const result = await getVideoProviderSummaries();
    expect(result).toHaveLength(3);
    const ids = result.map((p) => p.id).sort();
    expect(ids).toEqual(['kling', 'runway', 'sora']);
    expect(result.find((p) => p.id === 'runway')!.displayName).toBe('Runway');
  });

  it('includes cheapest cost per minute', async () => {
    const result = await getVideoProviderSummaries();
    const runway = result.find((p) => p.id === 'runway')!;
    expect(runway.cheapestCostPerMinute).toBe(7.2);
  });

  it('includes model counts', async () => {
    const result = await getVideoProviderSummaries();
    for (const provider of result) {
      expect(provider.modelCount).toBe(1);
    }
  });
});

describe('compareVideoModels', () => {
  it('returns only requested models', async () => {
    const result = await compareVideoModels(['runway-gen4-720p', 'kling-3.0-1080p']);
    expect(result).toHaveLength(2);
  });

  it('skips models not found', async () => {
    const result = await compareVideoModels(['runway-gen4-720p', 'nonexistent']);
    expect(result).toHaveLength(1);
  });

  it('handles empty array', async () => {
    const result = await compareVideoModels([]);
    expect(result).toHaveLength(0);
  });
});

describe('getCheapestVideoModel', () => {
  it('returns cheapest across all providers', async () => {
    const result = await getCheapestVideoModel();
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('kling-3.0-1080p');
  });

  it('returns cheapest within a provider', async () => {
    const result = await getCheapestVideoModel('runway');
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('runway-gen4-720p');
  });

  it('returns null when no models match date range', async () => {
    const result = await getCheapestVideoModel(undefined, { after: '2030-01-01' });
    expect(result).toBeNull();
  });
});
