import { describe, it, expect } from 'vitest';
import { calculateCost, calculateModelCost } from './cost';
import { STATIC_PRICING } from './static';

describe('calculateCost', () => {
  it('calculates cost for given token counts', () => {
    const result = calculateCost('test-model', 3, 15, 1_000_000, 500_000);
    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(7.5);
    expect(result.totalCost).toBe(10.5);
    expect(result.modelId).toBe('test-model');
    expect(result.inputTokens).toBe(1_000_000);
    expect(result.outputTokens).toBe(500_000);
  });

  it('returns zero cost for zero tokens', () => {
    const result = calculateCost('test-model', 10, 30, 0, 0);
    expect(result.totalCost).toBe(0);
    expect(result.inputCost).toBe(0);
    expect(result.outputCost).toBe(0);
  });

  it('handles large token counts', () => {
    const result = calculateCost('test-model', 1, 2, 100_000_000, 50_000_000);
    expect(result.inputCost).toBe(100);
    expect(result.outputCost).toBe(100);
    expect(result.totalCost).toBe(200);
  });

  it('handles fractional prices', () => {
    const result = calculateCost('test-model', 0.075, 0.30, 1_000_000, 1_000_000);
    expect(result.inputCost).toBeCloseTo(0.075);
    expect(result.outputCost).toBeCloseTo(0.30);
  });
});

describe('calculateModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateModelCost('claude-sonnet-4-6', 1_000_000, 500_000);
    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(7.5);
    expect(result.totalCost).toBe(10.5);
  });

  it('throws for unknown model', () => {
    expect(() => calculateModelCost('nonexistent-model', 1000, 1000)).toThrow('Unknown model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-model',
        provider: 'custom',
        displayName: 'Custom',
        inputPerMTok: 5,
        outputPerMTok: 10,
        contextWindow: null,
        maxOutputTokens: null,
        source: 'seed' as const,
        lastUpdated: null,
      },
    ];
    const result = calculateModelCost('custom-model', 2_000_000, 1_000_000, custom);
    expect(result.inputCost).toBe(10);
    expect(result.outputCost).toBe(10);
  });
});

describe('STATIC_PRICING', () => {
  it('contains models from multiple providers', () => {
    const providers = new Set(STATIC_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(3);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.inputPerMTok).toBeGreaterThan(0);
      expect(model.outputPerMTok).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
    }
  });

  it('output price is always >= input price', () => {
    for (const model of STATIC_PRICING) {
      expect(model.outputPerMTok).toBeGreaterThanOrEqual(model.inputPerMTok);
    }
  });
});
