import { NextResponse, after } from 'next/server';
import type { NextRequest } from 'next/server';

const FREE_RATE_LIMIT = 30;
const WINDOW_SECONDS = 3600; // 1 hour

const ANALYTICS_INTERNAL_SECRET = process.env.ANALYTICS_INTERNAL_SECRET || 'pt-analytics-internal';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Block malicious paths immediately
  if (pathname.endsWith('.php') || isMaliciousPath(pathname)) {
    return new NextResponse(null, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  }

  // Admin session cookie auth — exempt login page and auth API
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (
      pathname === '/admin/login' ||
      pathname === '/api/admin/auth' ||
      pathname === '/api/admin/auth/logout'
    ) {
      const response = NextResponse.next();
      response.headers.set('X-Robots-Tag', 'noindex');
      return response;
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

  // Analytics API routes — no rate limiting
  if (pathname.startsWith('/api/analytics/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  }

  // Cron routes — pass through (auth handled in route handlers)
  if (pathname.startsWith('/api/cron/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  }

  // Rate limiting — only for /api/v1/ routes
  if (pathname.startsWith('/api/v1/')) {
    // Telemetry handles its own rate limiting — exempt from general limiter
    if (pathname === '/api/v1/telemetry') {
      return NextResponse.next();
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      response.headers.set('X-Robots-Tag', 'noindex');
      return response;
    } catch {
      // If Redis is unavailable, allow the request through
      return NextResponse.next();
    }
  }

  // Other API routes — pass through
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  }

  // --- Page view tracking (fire-and-forget to internal API) ---
  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);

  // Bot classification via UA (inline — no native deps needed)
  const botScore = classifyBotScore(userAgent, request.headers);

  // Extract external referrer
  let referrer: string | undefined;
  const refHeader = request.headers.get('referer') || '';
  try {
    if (refHeader) {
      const refUrl = new URL(refHeader);
      if (refUrl.host !== request.nextUrl.host) {
        referrer = refHeader;
      }
    }
  } catch {
    // Invalid referrer URL
  }

  // Track page view after response is sent (after() keeps the runtime alive)
  // Use localhost to avoid Edge Runtime sandbox fetch restrictions on external URLs
  const trackBody = JSON.stringify({ path: pathname, ip, userAgent, referrer, botScore });
  const port = process.env.PORT || '3001';
  const trackUrl = `http://127.0.0.1:${port}/api/analytics/track`;

  after(async () => {
    try {
      await fetch(trackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-analytics-secret': ANALYTICS_INTERNAL_SECRET,
        },
        body: trackBody,
      });
    } catch {
      // Silently fail — analytics should never break the site
    }
  });

  return NextResponse.next();
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

// Inline bot classification for Edge Runtime (no native deps)
const BOT_TOKENS = [
  'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot', 'slurp',
  'gptbot', 'claudebot', 'anthropic-ai', 'ccbot', 'bytespider', 'amazonbot',
  'perplexitybot', 'applebot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'slackbot', 'telegrambot', 'whatsapp', 'discordbot', 'bot/', 'spider/', 'crawler/',
  'scrapy', 'python-requests', 'python-urllib', 'go-http-client', 'curl/', 'wget/',
  'headlesschrome', 'phantomjs', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'petalbot', 'meta-externalagent', 'facebookbot', 'oai-searchbot', 'chatgpt-user',
  'uptimerobot', 'axios/', 'node-fetch', 'undici',
];

const BROWSER_HEADERS = ['accept-language', 'accept', 'sec-fetch-dest', 'sec-fetch-mode'] as const;

function classifyBotScore(userAgent: string, headers: Headers): number {
  const ua = userAgent.toLowerCase();
  for (const token of BOT_TOKENS) {
    if (ua.includes(token)) return 3; // known bot
  }

  let missing = 0;
  for (const h of BROWSER_HEADERS) {
    if (!headers.get(h)) missing++;
  }
  if (missing >= 2) return 2; // suspected bot

  return 1; // presumed human
}

const MALICIOUS_PATHS = [
  '/xmlrpc.php', '/wp-admin', '/wp-login.php', '/wp-content', '/wp-includes',
  '/wp-json', '/.env', '/.git', '/.htaccess', '/.htpasswd', '/phpmyadmin',
  '/pma', '/myadmin', '/admin.php', '/administrator', '/config.php',
  '/install.php', '/setup.php', '/shell.php', '/cmd.php', '/eval-stdin.php',
  '/vendor/phpunit', '/solr/', '/actuator', '/debug/', '/telescope/',
  '/elfinder', '/cgi-bin/', '/passwd', '/etc/passwd', '/proc/self',
];

function isMaliciousPath(path: string): boolean {
  const lower = path.toLowerCase();
  return MALICIOUS_PATHS.some((p) => lower.startsWith(p));
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/api/analytics/:path*',
    '/api/cron/:path*',
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    // Page routes — track analytics (excludes _next, static files)
    '/((?!_next|api|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2|ttf|eot|css|js|map)).*)',
  ],
};
