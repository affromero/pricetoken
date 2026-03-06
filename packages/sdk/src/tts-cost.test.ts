import { describe, it, expect } from 'vitest';
import { calculateTtsCost, calculateTtsModelCost } from './tts-cost';
import { STATIC_TTS_PRICING } from './tts-static';

describe('calculateTtsCost', () => {
  it('calculates cost for given characters', () => {
    const result = calculateTtsCost('test-model', 15.0, 1_000_000);
    expect(result.totalCost).toBeCloseTo(15.0);
    expect(result.modelId).toBe('test-model');
    expect(result.characters).toBe(1_000_000);
    expect(result.costPerMChars).toBe(15.0);
  });

  it('returns zero cost for zero characters', () => {
    const result = calculateTtsCost('test-model', 30.0, 0);
    expect(result.totalCost).toBe(0);
  });

  it('handles fractional characters', () => {
    const result = calculateTtsCost('test-model', 10.0, 500_000);
    expect(result.totalCost).toBe(5.0);
  });

  it('calculates full million correctly', () => {
    const result = calculateTtsCost('test-model', 4.0, 1_000_000);
    expect(result.totalCost).toBeCloseTo(4.0);
  });
});

describe('calculateTtsModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateTtsModelCost('openai-tts-1', 1_000_000);
    expect(result.totalCost).toBeCloseTo(15.0);
    expect(result.costPerMChars).toBe(15.0);
  });

  it('throws for unknown model', () => {
    expect(() => calculateTtsModelCost('nonexistent-model', 10)).toThrow('Unknown TTS model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-tts',
        provider: 'custom',
        displayName: 'Custom',
        costPerMChars: 8.0,
        voiceType: null,
        maxCharacters: null,
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
    const result = calculateTtsModelCost('custom-tts', 500_000, custom);
    expect(result.totalCost).toBe(4.0);
  });
});

describe('STATIC_TTS_PRICING', () => {
  it('contains models from at least one provider', () => {
    const providers = new Set(STATIC_TTS_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(1);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_TTS_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.costPerMChars).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
    }
  });
});
