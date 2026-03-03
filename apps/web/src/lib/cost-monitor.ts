import { prisma } from '@/lib/prisma';

export interface CostBreakdownEntry {
  provider: string;
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface DailyCostEntry {
  date: string;
  costUsd: number;
  requests: number;
}

export async function getCostBreakdown(days: number): Promise<CostBreakdownEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.apiUsageLog.groupBy({
    by: ['provider', 'model'],
    where: { createdAt: { gte: since } },
    _count: true,
    _sum: { inputTokens: true, outputTokens: true, costUsd: true },
  });

  return rows.map((r) => ({
    provider: r.provider,
    model: r.model,
    requests: r._count,
    inputTokens: r._sum.inputTokens ?? 0,
    outputTokens: r._sum.outputTokens ?? 0,
    costUsd: r._sum.costUsd ?? 0,
  }));
}

export async function getDailyCostTrend(days: number): Promise<DailyCostEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.apiUsageLog.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, costUsd: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<string, { costUsd: number; requests: number }>();
  for (const log of logs) {
    const date = log.createdAt.toISOString().split('T')[0]!;
    const entry = grouped.get(date) ?? { costUsd: 0, requests: 0 };
    entry.costUsd += log.costUsd;
    entry.requests += 1;
    grouped.set(date, entry);
  }

  return Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
}

export async function getTotalCost(days: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await prisma.apiUsageLog.aggregate({
    where: { createdAt: { gte: since } },
    _sum: { costUsd: true },
  });

  return result._sum.costUsd ?? 0;
}
