import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/admin-auth';
import {
  getPageViewsOverTime,
  getTopPages,
  getTopReferrerDomains,
  getReferrerLandingPages,
  getDeviceBreakdown,
  getBrowserBreakdown,
  getRealtimeVisitors,
  getTotalStats,
  getCountryBreakdown,
  getBotStats,
  getHumanStats,
  getOsBreakdown,
  getTopPagesEngagement,
  getEntryPages,
  getExitPages,
  getPagesPerSession,
  getHourlyHeatmap,
} from '@/lib/analytics/query';
import type { BotFilter } from '@/lib/analytics/query';

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

function parseBotFilter(value: string | null): BotFilter {
  if (value === 'bots' || value === 'all') return value;
  return 'humans';
}

export async function GET(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const metric = searchParams.get('metric');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const botFilter = parseBotFilter(searchParams.get('botFilter'));

  if (!metric) {
    return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
  }

  if (metric === 'realtime') {
    return NextResponse.json(getRealtimeVisitors());
  }

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to parameters' }, { status: 400 });
  }

  const opts = { from, to, botFilter };

  switch (metric) {
    case 'pageviews':
      return NextResponse.json(getPageViewsOverTime(opts));
    case 'top-pages':
      return NextResponse.json(getTopPages(opts));
    case 'referrers':
    case 'referrer-domains':
      return NextResponse.json(getTopReferrerDomains(opts));
    case 'referrer-landing-pages':
      return NextResponse.json(getReferrerLandingPages(opts));
    case 'devices':
      return NextResponse.json(getDeviceBreakdown(opts));
    case 'browsers':
      return NextResponse.json(getBrowserBreakdown(opts));
    case 'totals':
      return NextResponse.json(getTotalStats(opts));
    case 'countries':
      return NextResponse.json(getCountryBreakdown(opts));
    case 'bot-stats':
      return NextResponse.json(getBotStats({ from, to }));
    case 'human-stats':
      return NextResponse.json(getHumanStats({ from, to }));
    case 'os':
      return NextResponse.json(getOsBreakdown(opts));
    case 'top-pages-engagement':
      return NextResponse.json(getTopPagesEngagement(opts));
    case 'entry-pages':
      return NextResponse.json(getEntryPages(opts));
    case 'exit-pages':
      return NextResponse.json(getExitPages(opts));
    case 'pages-per-session':
      return NextResponse.json(getPagesPerSession(opts));
    case 'hourly-heatmap':
      return NextResponse.json(getHourlyHeatmap(opts));
    default:
      return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
  }
}
