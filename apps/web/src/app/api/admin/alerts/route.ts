import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRecentWarnings } from '@/lib/fetcher/store';

export async function GET() {
  try {
    const [warnings, lowConfidenceModels] = await Promise.all([
      getRecentWarnings(30),
      prisma.modelPricingSnapshot.findMany({
        where: { confidence: 'low' },
        select: {
          modelId: true,
          provider: true,
          displayName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ data: { warnings, lowConfidenceModels } });
  } catch (err) {
    console.error('GET /api/admin/alerts error:', err);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }
}
