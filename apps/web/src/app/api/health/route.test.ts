import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = { $queryRaw: vi.fn() };
const mockRedisClient = { ping: vi.fn() };

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/redis', () => ({
  getRedisClient: () => mockRedisClient,
}));

import { GET } from './route';

describe('GET /api/health', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 when database and Redis are connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.database).toBe('connected');
    expect(body.redis).toBe('connected');
    expect(body.status).toBe('ok');
  });

  it('returns 503 when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.database).toBe('disconnected');
  });

  it('returns 200 when Redis is down but database is connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedisClient.ping.mockRejectedValue(new Error('redis down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.database).toBe('connected');
    expect(body.redis).toBe('disconnected');
  });

  it('returns 503 when both database and Redis are down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'));
    mockRedisClient.ping.mockRejectedValue(new Error('redis down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.database).toBe('disconnected');
    expect(body.redis).toBe('disconnected');
  });

  it('includes an ISO timestamp', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await GET();
    const body = await res.json();

    expect(body.timestamp).toBeDefined();
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  it('includes a version field', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await GET();
    const body = await res.json();

    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe('string');
  });

  it('does not return CORS headers', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const res = await GET();

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
