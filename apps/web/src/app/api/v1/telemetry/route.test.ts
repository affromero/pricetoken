import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const mockCreate = vi.fn().mockResolvedValue({});
const mockCheckRateLimit = vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: 0 });

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sdkTelemetryPing: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

vi.mock('@/lib/redis', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

function makeRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ 'user-agent': 'test-agent', 'x-forwarded-for': '1.2.3.4' }),
  } as unknown as NextRequest;
}

describe('POST /api/v1/telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: 0 });
  });

  it('returns 204 with valid payload and stores ping', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ sdk: 'js', version: '0.5.0', runtime: 'node-20' }));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ sdk: 'js', version: '0.5.0', runtime: 'node-20' }),
    });
  });

  it('returns 204 with invalid payload (silent drop)', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ version: '0.5.0' }));

    expect(res.status).toBe(204);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 204 when rate limited (silent drop)', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: 0 });
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ sdk: 'js', version: '0.5.0', runtime: 'node-20' }));

    expect(res.status).toBe(204);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('OPTIONS /api/v1/telemetry', () => {
  it('returns 204 with CORS headers', async () => {
    const { OPTIONS } = await import('./route');
    const res = await OPTIONS();

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });
});
