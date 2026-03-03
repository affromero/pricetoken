import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModelPricing } from 'pricetoken';

const mockPricing: ModelPricing[] = [
  {
    modelId: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    inputPerMTok: 3,
    outputPerMTok: 15,
    contextWindow: 200000,
    maxOutputTokens: 64000,
    source: 'seed',
    lastUpdated: '2026-03-01T00:00:00Z',
  },
  {
    modelId: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    inputPerMTok: 2.5,
    outputPerMTok: 10,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    source: 'seed',
    lastUpdated: '2026-03-01T00:00:00Z',
  },
  {
    modelId: 'gemini-2.0-flash-lite',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash-Lite',
    inputPerMTok: 0.075,
    outputPerMTok: 0.30,
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    source: 'seed',
    lastUpdated: '2026-03-01T00:00:00Z',
  },
];

vi.mock('./fetcher/store', () => ({
  getLatestPricing: vi.fn((provider?: string) => {
    if (provider) return Promise.resolve(mockPricing.filter((m) => m.provider === provider));
    return Promise.resolve(mockPricing);
  }),
  getPriceHistory: vi.fn(() => Promise.resolve([])),
}));

import {
  getCurrentPricing,
  getModelPricing,
  getProviderSummaries,
  compareModels,
  getCheapestModel,
} from './pricing-queries';

describe('getCurrentPricing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all models when no filter', async () => {
    const result = await getCurrentPricing();
    expect(result).toHaveLength(3);
  });

  it('filters by provider', async () => {
    const result = await getCurrentPricing('anthropic');
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('anthropic');
  });
});

describe('getModelPricing', () => {
  it('returns matching model', async () => {
    const result = await getModelPricing('claude-sonnet-4-6');
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('claude-sonnet-4-6');
  });

  it('returns null for unknown model', async () => {
    const result = await getModelPricing('nonexistent');
    expect(result).toBeNull();
  });
});

describe('getProviderSummaries', () => {
  it('returns one summary per provider', async () => {
    const result = await getProviderSummaries();
    expect(result).toHaveLength(3);
    const ids = result.map((p) => p.id).sort();
    expect(ids).toEqual(['anthropic', 'google', 'openai']);
  });

  it('includes cheapest prices', async () => {
    const result = await getProviderSummaries();
    const google = result.find((p) => p.id === 'google')!;
    expect(google.cheapestInputPerMTok).toBe(0.075);
    expect(google.cheapestOutputPerMTok).toBe(0.30);
  });

  it('includes model counts', async () => {
    const result = await getProviderSummaries();
    for (const provider of result) {
      expect(provider.modelCount).toBe(1);
    }
  });
});

describe('compareModels', () => {
  it('returns only requested models', async () => {
    const result = await compareModels(['claude-sonnet-4-6', 'gpt-4o']);
    expect(result).toHaveLength(2);
  });

  it('skips models not found', async () => {
    const result = await compareModels(['claude-sonnet-4-6', 'nonexistent']);
    expect(result).toHaveLength(1);
  });

  it('handles empty array', async () => {
    const result = await compareModels([]);
    expect(result).toHaveLength(0);
  });
});

describe('getCheapestModel', () => {
  it('returns cheapest across all providers', async () => {
    const result = await getCheapestModel();
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('gemini-2.0-flash-lite');
  });

  it('returns cheapest within a provider', async () => {
    const result = await getCheapestModel('anthropic');
    expect(result).not.toBeNull();
    expect(result!.modelId).toBe('claude-sonnet-4-6');
  });
});
