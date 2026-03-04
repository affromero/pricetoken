const COOKIE_NAME = 'pt_admin_session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};

function getSecret(): Uint8Array {
  const hex = process.env.ADMIN_SESSION_SECRET;
  if (!hex) throw new Error('ADMIN_SESSION_SECRET is not set');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    getSecret() as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function createSessionToken(): Promise<string> {
  const timestamp = String(Date.now());
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp));
  return `${timestamp}.${toHex(sig)}`;
}

async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const dotIdx = token.indexOf('.');
    if (dotIdx === -1) return false;

    const timestamp = token.slice(0, dotIdx);
    const ts = Number(timestamp);
    if (Number.isNaN(ts)) return false;

    // Check max age
    const age = (Date.now() - ts) / 1000;
    if (age < 0 || age > MAX_AGE_SECONDS) return false;

    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(token.slice(dotIdx + 1)) as BufferSource,
      new TextEncoder().encode(timestamp),
    );
    return valid;
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Timing-safe string comparison using HMAC.
 * Edge-compatible — no node:crypto dependency.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('timing-safe-compare'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(a)),
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b)),
  ]);
  const viewA = new Uint8Array(macA);
  const viewB = new Uint8Array(macB);
  if (viewA.length !== viewB.length) return false;
  let result = 0;
  for (let i = 0; i < viewA.length; i++) {
    result |= viewA[i]! ^ viewB[i]!;
  }
  return result === 0;
}

export {
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
  timingSafeEqual,
};
