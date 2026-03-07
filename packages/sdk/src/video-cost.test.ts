import { describe, it, expect } from 'vitest';
import { calculateVideoCost, calculateVideoModelCost } from './video-cost';
import { STATIC_VIDEO_PRICING } from './video-static';

describe('calculateVideoCost', () => {
  it('calculates cost for given duration', () => {
    const result = calculateVideoCost('test-model', 6.0, 30);
    expect(result.totalCost).toBe(3.0);
    expect(result.modelId).toBe('test-model');
    expect(result.durationSeconds).toBe(30);
    expect(result.costPerMinute).toBe(6.0);
  });

  it('returns zero cost for zero duration', () => {
    const result = calculateVideoCost('test-model', 10, 0);
    expect(result.totalCost).toBe(0);
  });

  it('handles fractional seconds', () => {
    const result = calculateVideoCost('test-model', 12.0, 5);
    expect(result.totalCost).toBe(1.0);
  });

  it('calculates full minute correctly', () => {
    const result = calculateVideoCost('test-model', 7.2, 60);
    expect(result.totalCost).toBe(7.2);
  });
});

describe('calculateVideoModelCost', () => {
  it('looks up model from static pricing', () => {
    const result = calculateVideoModelCost('runway-gen4-720p', 60);
    expect(result.totalCost).toBe(7.2);
    expect(result.costPerMinute).toBe(7.2);
  });

  it('throws for unknown model', () => {
    expect(() => calculateVideoModelCost('nonexistent-model', 10)).toThrow('Unknown video model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-video',
        provider: 'custom',
        displayName: 'Custom',
        costPerMinute: 10,
        inputType: null,
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
    const result = calculateVideoModelCost('custom-video', 30, custom);
    expect(result.totalCost).toBe(5.0);
  });
});

describe('STATIC_VIDEO_PRICING', () => {
  it('contains models from multiple providers', () => {
    const providers = new Set(STATIC_VIDEO_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(5);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_VIDEO_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.costPerMinute).toBeGreaterThan(0);
      expect(model.source).toBe('seed');
      expect(model.inputType).toBeTruthy();
    }
  });
});
