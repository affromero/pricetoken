import { describe, it, expect } from 'vitest';
import { carrySource } from './store';

describe('carrySource', () => {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  it('preserves verified source within 24h', () => {
    expect(carrySource('verified', hoursAgo(12))).toBe('verified');
  });

  it('preserves admin source within 24h', () => {
    expect(carrySource('admin', hoursAgo(1))).toBe('admin');
  });

  it('degrades verified to carried after 24h', () => {
    expect(carrySource('verified', hoursAgo(25))).toBe('carried');
  });

  it('degrades admin to carried after 24h', () => {
    expect(carrySource('admin', hoursAgo(48))).toBe('carried');
  });

  it('always degrades seed to carried', () => {
    expect(carrySource('seed', hoursAgo(1))).toBe('carried');
  });

  it('always degrades fetched to carried', () => {
    expect(carrySource('fetched', hoursAgo(1))).toBe('carried');
  });

  it('always degrades carried to carried without original', () => {
    expect(carrySource('carried', hoursAgo(1))).toBe('carried');
  });

  it('preserves verified via original source when latest is carried', () => {
    expect(carrySource('carried', hoursAgo(1), 'verified', hoursAgo(12))).toBe('verified');
  });

  it('preserves admin via original source when latest is carried', () => {
    expect(carrySource('carried', hoursAgo(1), 'admin', hoursAgo(6))).toBe('admin');
  });

  it('degrades to carried when original source is too old', () => {
    expect(carrySource('carried', hoursAgo(1), 'verified', hoursAgo(25))).toBe('carried');
  });

  it('degrades to carried when original source is seed', () => {
    expect(carrySource('carried', hoursAgo(1), 'seed', hoursAgo(1))).toBe('carried');
  });
});
