import { describe, it, expect } from 'vitest';
import {
  computeConfidenceScore,
  confidenceLevelFromScore,
  computeFreshness,
} from './confidence';

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

describe('computeConfidenceScore', () => {
  it('returns high score for verified, 3/3 agents, fresh, stable', () => {
    const score = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(2),
      agentApprovals: 3,
      agentTotal: 3,
      priceUnchanged: true,
    });
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it('returns moderate score for seed data with no agents', () => {
    const score = computeConfidenceScore({
      source: 'seed',
      createdAt: hoursAgo(48),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: true,
    });
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(80);
  });

  it('returns low score for carried, old, changed data', () => {
    const score = computeConfidenceScore({
      source: 'carried',
      createdAt: hoursAgo(14 * 24),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: false,
    });
    expect(score).toBeLessThan(20);
  });

  it('penalizes low agent approval ratio', () => {
    const high = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(2),
      agentApprovals: 3,
      agentTotal: 3,
      priceUnchanged: true,
    });
    const low = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(2),
      agentApprovals: 1,
      agentTotal: 3,
      priceUnchanged: true,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('penalizes age', () => {
    const fresh = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(1),
      agentApprovals: 3,
      agentTotal: 3,
      priceUnchanged: true,
    });
    const old = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(14 * 24),
      agentApprovals: 3,
      agentTotal: 3,
      priceUnchanged: true,
    });
    expect(fresh).toBeGreaterThanOrEqual(old);
  });

  it('penalizes price change', () => {
    const stable = computeConfidenceScore({
      source: 'seed',
      createdAt: hoursAgo(72),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: true,
    });
    const changed = computeConfidenceScore({
      source: 'seed',
      createdAt: hoursAgo(72),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: false,
    });
    expect(stable).toBeGreaterThan(changed);
  });

  it('treats unknown source as fetched', () => {
    const score = computeConfidenceScore({
      source: 'unknown',
      createdAt: hoursAgo(2),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: true,
    });
    const fetched = computeConfidenceScore({
      source: 'fetched',
      createdAt: hoursAgo(2),
      agentApprovals: null,
      agentTotal: null,
      priceUnchanged: true,
    });
    expect(score).toBe(fetched);
  });

  it('handles zero agent total gracefully', () => {
    const score = computeConfidenceScore({
      source: 'verified',
      createdAt: hoursAgo(2),
      agentApprovals: 0,
      agentTotal: 0,
      priceUnchanged: true,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns value between 0 and 100', () => {
    const score = computeConfidenceScore({
      source: 'carried',
      createdAt: hoursAgo(30 * 24),
      agentApprovals: 0,
      agentTotal: 3,
      priceUnchanged: false,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('confidenceLevelFromScore', () => {
  it('returns high for scores >= 80', () => {
    expect(confidenceLevelFromScore(80)).toBe('high');
    expect(confidenceLevelFromScore(100)).toBe('high');
  });

  it('returns medium for scores 50-79', () => {
    expect(confidenceLevelFromScore(50)).toBe('medium');
    expect(confidenceLevelFromScore(79)).toBe('medium');
  });

  it('returns low for scores < 50', () => {
    expect(confidenceLevelFromScore(0)).toBe('low');
    expect(confidenceLevelFromScore(49)).toBe('low');
  });
});

describe('computeFreshness', () => {
  it('returns correct age in hours', () => {
    const result = computeFreshness(hoursAgo(5));
    expect(result.ageHours).toBe(5);
  });

  it('marks as stale after 48 hours', () => {
    expect(computeFreshness(hoursAgo(47)).stale).toBe(false);
    expect(computeFreshness(hoursAgo(49)).stale).toBe(true);
  });

  it('returns ISO string for lastVerified', () => {
    const date = hoursAgo(1);
    const result = computeFreshness(date);
    expect(result.lastVerified).toBe(date.toISOString());
  });
});
