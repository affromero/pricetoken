import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    client.connect().catch(() => {
      /* Redis is optional in dev */
    });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_TTL = 300; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    /* non-critical */
  }
}

// ---------------------------------------------------------------------------
// Rate limiting with sliding window
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  await redis.zremrangebyscore(key, 0, windowStart);
  const current = await redis.zcard(key);

  if (current >= limit) {
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt =
      oldestEntry.length > 0
        ? parseInt(oldestEntry[1]!) + windowSeconds * 1000
        : now + windowSeconds * 1000;
    return { allowed: false, remaining: 0, resetAt };
  }

  await redis.zadd(key, now, `${now}`);
  await redis.expire(key, windowSeconds);

  return { allowed: true, remaining: limit - current - 1, resetAt: now + windowSeconds * 1000 };
}
