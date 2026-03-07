import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { trackPageViewAsync } from '@/lib/analytics/track';

const INTERNAL_SECRET = process.env.ANALYTICS_INTERNAL_SECRET || 'pt-analytics-internal';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-analytics-secret');
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { path, ip, userAgent, referrer, botScore } = body;

    if (!path || !ip || !userAgent) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    trackPageViewAsync({ path, ip, userAgent, referrer, botScore });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
