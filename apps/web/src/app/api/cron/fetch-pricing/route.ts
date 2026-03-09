import { prisma } from '@/lib/prisma';
import { runPricingFetch } from '@/lib/fetcher/run-fetch';
import { deleteByPattern } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401);
  }

  // Check freeze state (scoped to text category)
  const lastRun = await prisma.fetchRunSummary.findFirst({
    where: { category: 'text' },
    orderBy: { createdAt: 'desc' },
  });

  if (lastRun?.status === 'failed') {
    return apiError('Text fetch frozen due to previous failure. Manual review required.', 423);
  }

  try {
    const result = await runPricingFetch();

    const status =
      result.errors.length === 0
        ? 'success'
        : result.totalModels > 0
          ? 'partial'
          : 'failed';

    // Calculate verification cost from usage logs for this run
    const verificationCost = await getRecentVerificationCost();

    await prisma.fetchRunSummary.create({
      data: {
        category: 'text',
        status,
        providersRun: result.verificationResults.size + result.errors.length,
        modelsVerified: result.totalModels,
        modelsFlagged: result.totalFlagged,
        verificationCost,
        errors: result.errors,
      },
    });

    // Invalidate pricing cache
    await deleteByPattern('pt:cache:pricing:*').catch(() => {});

    return apiSuccess({
      status,
      modelsVerified: result.totalModels,
      modelsFlagged: result.totalFlagged,
      errors: result.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await prisma.fetchRunSummary.create({
      data: {
        category: 'text',
        status: 'failed',
        providersRun: 0,
        modelsVerified: 0,
        modelsFlagged: 0,
        verificationCost: 0,
        errors: [message],
      },
    });

    return apiError(`Fetch failed: ${message}`, 500);
  }
}

async function getRecentVerificationCost(): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await prisma.apiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: fiveMinAgo },
      operation: 'pricing_verification',
    },
  });
  return result._sum.costUsd ?? 0;
}
