import { describe, it, expect } from 'vitest';
import { calculateImageCost, calculateImageModelCost } from './image-cost';
import { STATIC_IMAGE_PRICING } from './static-image';

describe('calculateImageCost', () => {
  it('calculates cost for given image count', () => {
    const result = calculateImageCost('test-model', 0.04, 10);
    expect(result.modelId).toBe('test-model');
    expect(result.imageCount).toBe(10);
    expect(result.pricePerImage).toBe(0.04);
    expect(result.totalCost).toBeCloseTo(0.40);
  });

  it('returns zero cost for zero images', () => {
    const result = calculateImageCost('test-model', 0.04, 0);
    expect(result.totalCost).toBe(0);
    expect(result.imageCount).toBe(0);
  });
});

describe('calculateImageModelCost', () => {
  it('looks up model from static data', () => {
    const result = calculateImageModelCost('dall-e-3-standard-1024', 5);
    expect(result.modelId).toBe('dall-e-3-standard-1024');
    expect(result.pricePerImage).toBe(0.04);
    expect(result.totalCost).toBeCloseTo(0.20);
    expect(result.imageCount).toBe(5);
  });

  it('throws for unknown model', () => {
    expect(() => calculateImageModelCost('nonexistent-model', 1)).toThrow('Unknown image model');
  });

  it('accepts custom pricing data', () => {
    const custom = [
      {
        modelId: 'custom-img',
        provider: 'custom',
        displayName: 'Custom',
        pricePerImage: 0.10,
        pricePerMegapixel: null,
        defaultResolution: '1024x1024',
        qualityTier: 'standard' as const,
        maxResolution: null,
        supportedFormats: ['png'],
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
    const result = calculateImageModelCost('custom-img', 3, custom);
    expect(result.totalCost).toBeCloseTo(0.30);
  });
});

describe('STATIC_IMAGE_PRICING', () => {
  it('contains models from multiple providers', () => {
    const providers = new Set(STATIC_IMAGE_PRICING.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(5);
  });

  it('all models have required fields', () => {
    for (const model of STATIC_IMAGE_PRICING) {
      expect(model.modelId).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.pricePerImage).toBeGreaterThan(0);
      expect(model.defaultResolution).toBeTruthy();
      expect(model.qualityTier).toBeTruthy();
      expect(model.supportedFormats).toBeInstanceOf(Array);
      expect(model.source).toBe('seed');
    }
  });
});
