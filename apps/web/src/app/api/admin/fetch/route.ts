import { NextResponse } from 'next/server';
import { runPricingFetch } from '@/lib/fetcher/run-fetch';
import { deleteByPattern } from '@/lib/redis';

export async function POST() {
  try {
    const result = await runPricingFetch();

    // Invalidate pricing cache so fresh data is served immediately
    await deleteByPattern('pt:cache:pricing:*').catch(() => {});

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('POST /api/admin/fetch error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
