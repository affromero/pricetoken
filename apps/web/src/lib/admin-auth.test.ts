import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TEST_SECRET = 'ab'.repeat(32); // 64 hex chars = 32 bytes

describe('admin-auth', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SESSION_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('createSessionToken + verifySessionToken round-trips', async () => {
    const { createSessionToken, verifySessionToken } = await import('./admin-auth');
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it('rejects token with wrong HMAC', async () => {
    const { createSessionToken, verifySessionToken } = await import('./admin-auth');
    const token = await createSessionToken();
    const [timestamp] = token.split('.');
    const tampered = `${timestamp}.${'ff'.repeat(32)}`;
    expect(await verifySessionToken(tampered)).toBe(false);
  });

  it('rejects expired token', async () => {
    const { verifySessionToken, MAX_AGE_SECONDS } = await import('./admin-auth');

    // Create a token with a timestamp older than MAX_AGE
    const oldTimestamp = String(Date.now() - (MAX_AGE_SECONDS + 1) * 1000);
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(TEST_SECRET) as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(oldTimestamp));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const expiredToken = `${oldTimestamp}.${hex}`;

    expect(await verifySessionToken(expiredToken)).toBe(false);
  });

  it('rejects malformed tokens', async () => {
    const { verifySessionToken } = await import('./admin-auth');
    expect(await verifySessionToken('')).toBe(false);
    expect(await verifySessionToken('notavalidtoken')).toBe(false);
    expect(await verifySessionToken('abc.def')).toBe(false);
    expect(await verifySessionToken('.something')).toBe(false);
  });

  it('timingSafeEqual returns true for matching strings', async () => {
    const { timingSafeEqual } = await import('./admin-auth');
    expect(await timingSafeEqual('password123', 'password123')).toBe(true);
  });

  it('timingSafeEqual returns false for different strings', async () => {
    const { timingSafeEqual } = await import('./admin-auth');
    expect(await timingSafeEqual('password123', 'password456')).toBe(false);
    expect(await timingSafeEqual('short', 'muchlongerstring')).toBe(false);
  });
});

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
