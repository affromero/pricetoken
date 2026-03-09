import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST() {
  const failedRuns = await prisma.fetchRunSummary.findMany({
    where: { status: 'failed' },
    orderBy: { createdAt: 'desc' },
  });

  if (failedRuns.length === 0) {
    return apiError('No failed runs to unfreeze', 404);
  }

  await prisma.fetchRunSummary.updateMany({
    where: { status: 'failed' },
    data: { status: 'resolved' },
  });

  return apiSuccess({
    unfrozen: true,
    resolvedCount: failedRuns.length,
    categories: [...new Set(failedRuns.map((r) => r.category))],
  });
}
