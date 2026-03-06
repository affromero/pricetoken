import { describe, it, expect } from 'vitest';
import { calculateAvatarCost, calculateAvatarModelCost } from './avatar-cost';
import { STATIC_AVATAR_PRICING } from './avatar-static';

describe('calculateAvatarCost', () => {
  it('calculates cost for given duration', () => {
    const result = calculateAvatarCost('test-model', 0.99, 60);
    expect(result.totalCost).toBeCloseTo(0.99);
    expect(result.modelId).toBe('test-model');
    expect(result.durationSeconds).toBe(60);
    expect(result.costPerMinute).toBe(0.99);
  });

  it('returns zero cost for zero duration', () => {
    const result = calculateAvatarCost('test-model', 5.94, 0);
    expect(result.totalCost).toBe(0);
  });

  it('handles fractional seconds', () => {
    const result = calculateAvatarCost('test-model', 6.0, 30);
    expect(result.totalCost).toBe(3.0);
  });

  it('calculates full minute correctly', () => {
    const result = calculateAvatarCost('test-model', 5.94, 60);
    expect(result.totalCost).toBeCloseTo(5.94);
  });
});

describe('calculateAvatarModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateAvatarModelCost('heygen-avatar-standard', 60);
    expect(result.totalCost).toBeCloseTo(0.99);
    expect(result.costPerMinute).toBe(0.99);
  });

  it('throws for unknown model', () => {
    expect(() => calculateAvatarModelCost('nonexistent-model', 10)).toThrow('Unknown avatar model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-avatar',
        provider: 'custom',
        displayName: 'Custom',
        costPerMinute: 2.0,
        avatarType: null,
        resolution: null,
        maxDuration: null,
        qualityMode: null,
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
    const result = calculateAvatarModelCost('custom-avatar', 30, custom);
    expect(result.totalCost).toBe(1.0);
  });
});

describe('STATIC_AVATAR_PRICING', () => {
  it('contains models from at least one provider', () => {
    const providers = new Set(STATIC_AVATAR_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(1);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_AVATAR_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.costPerMinute).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
    }
  });
});
