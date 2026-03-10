import { describe, it, expect } from 'vitest';
import { calculateMusicCost, calculateMusicModelCost } from './music-cost';
import { STATIC_MUSIC_PRICING } from './music-static';

describe('calculateMusicCost', () => {
  it('calculates cost for given duration', () => {
    const result = calculateMusicCost('test-model', 0.50, 60);
    expect(result.totalCost).toBeCloseTo(0.50);
    expect(result.modelId).toBe('test-model');
    expect(result.durationSeconds).toBe(60);
    expect(result.costPerMinute).toBe(0.50);
  });

  it('returns zero cost for zero duration', () => {
    const result = calculateMusicCost('test-model', 0.50, 0);
    expect(result.totalCost).toBe(0);
  });

  it('handles fractional seconds', () => {
    const result = calculateMusicCost('test-model', 6.0, 30);
    expect(result.totalCost).toBe(3.0);
  });

  it('calculates full minute correctly', () => {
    const result = calculateMusicCost('test-model', 0.50, 60);
    expect(result.totalCost).toBeCloseTo(0.50);
  });
});

describe('calculateMusicModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateMusicModelCost('elevenlabs-eleven-music', 60);
    expect(result.totalCost).toBeCloseTo(0.50);
    expect(result.costPerMinute).toBe(0.50);
  });

  it('throws for unknown model', () => {
    expect(() => calculateMusicModelCost('nonexistent-model', 10)).toThrow('Unknown music model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-music',
        provider: 'custom',
        displayName: 'Custom',
        costPerMinute: 2.0,
        maxDuration: null,
        outputFormat: 'mp3',
        vocals: true,
        official: true,
        pricingNote: null,
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
    const result = calculateMusicModelCost('custom-music', 30, custom);
    expect(result.totalCost).toBe(1.0);
  });
});

describe('STATIC_MUSIC_PRICING', () => {
  it('contains models from at least one provider', () => {
    const providers = new Set(STATIC_MUSIC_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(1);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_MUSIC_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.costPerMinute).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
    }
  });
});
