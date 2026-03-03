import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, string>();
const sortedSets = new Map<string, Map<string, number>>();

function resetMockRedis() {
  store.clear();
  sortedSets.clear();
}

vi.mock('ioredis', () => {
  const mockRedis = {
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    zremrangebyscore: vi.fn((key: string, min: number, max: number) => {
      const ss = sortedSets.get(key);
      if (!ss) return Promise.resolve(0);
      let removed = 0;
      for (const [member, score] of ss) {
        if (score >= min && score <= max) {
          ss.delete(member);
          removed++;
        }
      }
      return Promise.resolve(removed);
    }),
    zcard: vi.fn((key: string) => {
      const ss = sortedSets.get(key);
      return Promise.resolve(ss?.size ?? 0);
    }),
    zadd: vi.fn((key: string, score: number, member: string) => {
      if (!sortedSets.has(key)) sortedSets.set(key, new Map());
      sortedSets.get(key)!.set(member, score);
      return Promise.resolve(1);
    }),
    zrange: vi.fn(() => Promise.resolve([])),
    expire: vi.fn(() => Promise.resolve(1)),
  };

  return { default: vi.fn(() => mockRedis) };
});

import { checkRateLimit, getCached, setCache } from './redis';

describe('cache helpers', () => {
  beforeEach(() => {
    resetMockRedis();
  });

  it('getCached returns null for missing key', async () => {
    const result = await getCached('nonexistent');
    expect(result).toBeNull();
  });

  it('setCache + getCached round-trips JSON', async () => {
    await setCache('test-key', { foo: 'bar' });
    const result = await getCached<{ foo: string }>('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetMockRedis();
  });

  it('allows first request', async () => {
    const result = await checkRateLimit('user:1', 100, 86400);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('blocks after limit is reached', async () => {
    // Use unique timestamps so zadd members don't collide
    let tick = 1000000000000;
    vi.spyOn(Date, 'now').mockImplementation(() => tick++);

    const r1 = await checkRateLimit('user:2', 3, 86400);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit('user:2', 3, 86400);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit('user:2', 3, 86400);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit of 3
    const r4 = await checkRateLimit('user:2', 3, 86400);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);

    vi.restoreAllMocks();
  });

  it('returns resetAt timestamp in the future', async () => {
    const before = Date.now();
    const result = await checkRateLimit('user:3', 100, 86400);
    expect(result.resetAt).toBeGreaterThanOrEqual(before);
  });
});
