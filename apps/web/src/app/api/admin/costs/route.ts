import { type NextRequest, NextResponse } from 'next/server';
import { getCostBreakdown, getDailyCostTrend, getTotalCost } from '@/lib/cost-monitor';

export async function GET(request: NextRequest) {
  try {
    const days = Number(request.nextUrl.searchParams.get('days') ?? '30');
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'days must be between 1 and 365' }, { status: 400 });
    }

    const [breakdown, trend, total7d, total30d, totalAll] = await Promise.all([
      getCostBreakdown(days),
      getDailyCostTrend(days),
      getTotalCost(7),
      getTotalCost(30),
      getTotalCost(36500), // ~100 years = all time
    ]);

    return NextResponse.json({
      data: { breakdown, trend, totals: { '7d': total7d, '30d': total30d, all: totalAll } },
    });
  } catch (err) {
    console.error('GET /api/admin/costs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
