import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NpmDownloads {
  downloads: number;
}

interface PyPIDay {
  category: string;
  date: string;
  downloads: number;
}

interface PyPIResponse {
  data: PyPIDay[];
}

async function fetchNpm(): Promise<{ total7d: number; total30d: number }> {
  const [week, month] = await Promise.all([
    fetch('https://api.npmjs.org/downloads/range/last-week/pricetoken').then(
      (r) => r.json() as Promise<NpmDownloads>,
    ),
    fetch('https://api.npmjs.org/downloads/range/last-month/pricetoken').then(
      (r) => r.json() as Promise<NpmDownloads>,
    ),
  ]);
  return { total7d: week.downloads ?? 0, total30d: month.downloads ?? 0 };
}

async function fetchPyPI(): Promise<{ total30d: number }> {
  const res = await fetch('https://pypistats.org/api/packages/pricetoken/overall');
  const json = (await res.json()) as PyPIResponse;
  const withoutMirrors = (json.data ?? []).filter(
    (d: PyPIDay) => d.category === 'without_mirrors',
  );
  const total30d = withoutMirrors.reduce((sum: number, d: PyPIDay) => sum + d.downloads, 0);
  return { total30d };
}

async function fetchTelemetry() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [breakdown, daily] = await Promise.all([
    prisma.sdkTelemetryPing.groupBy({
      by: ['sdk', 'version', 'runtime'],
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { sdk: 'desc' } },
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "SdkTelemetryPing"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `,
  ]);

  return {
    breakdown: breakdown.map((b) => ({
      sdk: b.sdk,
      version: b.version,
      runtime: b.runtime,
      count: b._count,
    })),
    daily: daily.map((d) => ({
      date: String(d.date),
      count: Number(d.count),
    })),
  };
}

export async function GET() {
  try {
    const [npm, pypi, telemetry] = await Promise.all([
      fetchNpm().catch(() => ({ total7d: 0, total30d: 0 })),
      fetchPyPI().catch(() => ({ total30d: 0 })),
      fetchTelemetry().catch(() => ({ breakdown: [], daily: [] })),
    ]);

    return NextResponse.json({
      data: { npm, pypi, telemetry },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch download stats' },
      { status: 500 },
    );
  }
}
