import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/redis';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.sdk !== 'string' ||
      typeof body.version !== 'string' ||
      typeof body.runtime !== 'string'
    ) {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }

    const ip = getClientIp(request);

    try {
      const result = await checkRateLimit(`telemetry:${ip}`, 10, 3600);
      if (!result.allowed) {
        return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
      }
    } catch {
      // Redis unavailable — allow through
    }

    const userAgent = request.headers.get('user-agent') ?? '';

    prisma.sdkTelemetryPing
      .create({
        data: {
          sdk: body.sdk,
          version: body.version,
          runtime: body.runtime,
          ip,
          userAgent,
        },
      })
      .catch(() => {
        // fire-and-forget
      });
  } catch {
    // silent drop
  }

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
