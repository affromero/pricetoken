import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FREE_RATE_LIMIT = 30;
const WINDOW_SECONDS = 3600; // 1 hour

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin session cookie auth — exempt login page and auth API
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (
      pathname === '/admin/login' ||
      pathname === '/api/admin/auth' ||
      pathname === '/api/admin/auth/logout'
    ) {
      return NextResponse.next();
    }

    const { verifySessionToken, COOKIE_NAME } = await import('@/lib/admin-auth');
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const valid = token ? await verifySessionToken(token) : false;

    if (!valid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', status: 401 },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // Rate limiting — only for /api/v1/ routes
  if (!pathname.startsWith('/api/v1/')) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Extract identifier and rate limit
  const authHeader = request.headers.get('authorization');
  let identifier: string;
  let limit = FREE_RATE_LIMIT;

  if (authHeader?.startsWith('Bearer pt_')) {
    const apiKey = authHeader.slice(7);
    try {
      const { validateApiKey } = await import('@/lib/api-key');
      const result = await validateApiKey(apiKey);
      if (!result.valid) {
        return NextResponse.json(
          { error: 'Invalid API key', status: 401 },
          { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      identifier = `key:${apiKey.slice(0, 12)}`;
      limit = result.rateLimit;
    } catch {
      identifier = getClientIp(request);
    }
  } else {
    identifier = getClientIp(request);
  }

  // Rate limit check
  try {
    const { checkRateLimit } = await import('@/lib/redis');
    const result = await checkRateLimit(identifier, limit, WINDOW_SECONDS);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', status: 429 },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  } catch {
    // If Redis is unavailable, allow the request through
    return NextResponse.next();
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export const config = {
  matcher: ['/api/v1/:path*', '/admin', '/admin/:path*', '/api/admin/:path*', '/api/cron/:path*'],
};
