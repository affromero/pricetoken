import { describe, it, expect } from 'vitest';
import { calculateSttCost, calculateSttModelCost } from './stt-cost';
import { STATIC_STT_PRICING } from './stt-static';

describe('calculateSttCost', () => {
  it('calculates cost for given duration', () => {
    const result = calculateSttCost('test-model', 0.006, 60);
    expect(result.totalCost).toBeCloseTo(0.006);
    expect(result.modelId).toBe('test-model');
    expect(result.durationSeconds).toBe(60);
    expect(result.costPerMinute).toBe(0.006);
  });

  it('returns zero cost for zero duration', () => {
    const result = calculateSttCost('test-model', 0.006, 0);
    expect(result.totalCost).toBe(0);
  });

  it('handles fractional seconds', () => {
    const result = calculateSttCost('test-model', 6.0, 30);
    expect(result.totalCost).toBe(3.0);
  });

  it('calculates full minute correctly', () => {
    const result = calculateSttCost('test-model', 0.024, 60);
    expect(result.totalCost).toBeCloseTo(0.024);
  });
});

describe('calculateSttModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateSttModelCost('openai-whisper-1', 60);
    expect(result.totalCost).toBeCloseTo(0.006);
    expect(result.costPerMinute).toBe(0.006);
  });

  it('throws for unknown model', () => {
    expect(() => calculateSttModelCost('nonexistent-model', 10)).toThrow('Unknown STT model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-stt',
        provider: 'custom',
        displayName: 'Custom',
        costPerMinute: 0.01,
        sttType: null,
        maxDuration: null,
        supportedLanguages: null,
        source: 'seed' as const,
        status: 'active' as const,
        confidence: 'high' as const,
        confidenceScore: 65,
        confidenceLevel: 'medium' as const,
        freshness: { lastVerified: '', ageHours: 0, stale: false },
        lastUpdated: null,
        launchDate: null,
      },
    ];
    const result = calculateSttModelCost('custom-stt', 30, custom);
    expect(result.totalCost).toBe(0.005);
  });
});

describe('STATIC_STT_PRICING', () => {
  it('contains models from at least one provider', () => {
    const providers = new Set(STATIC_STT_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(1);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_STT_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.costPerMinute).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
    }
  });
});
