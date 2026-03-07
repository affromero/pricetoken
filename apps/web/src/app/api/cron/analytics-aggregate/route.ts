import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/admin-auth';
import { aggregateDay, cleanupOldEvents, cleanupOldSalts } from '@/lib/analytics/aggregate';

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return true;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get('date') || undefined;

  const { aggregated, eventsProcessed, suspectedBots } = aggregateDay(date);
  const deletedEvents = cleanupOldEvents();
  const deletedSalts = cleanupOldSalts();

  return NextResponse.json({
    aggregation: { aggregated, eventsProcessed, suspectedBots },
    cleanup: { deletedEvents, deletedSalts },
  });
}
