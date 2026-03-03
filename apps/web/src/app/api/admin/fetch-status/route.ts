import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  const runs = await prisma.fetchRunSummary.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return apiSuccess(runs);
}
