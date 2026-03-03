import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST() {
  const lastRun = await prisma.fetchRunSummary.findFirst({
    where: { status: 'failed' },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastRun) {
    return apiError('No failed run to unfreeze', 404);
  }

  await prisma.fetchRunSummary.update({
    where: { id: lastRun.id },
    data: { status: 'resolved' },
  });

  return apiSuccess({ unfrozen: true, runId: lastRun.id });
}
