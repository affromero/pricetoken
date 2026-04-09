import { prisma } from '@/lib/prisma';
import { runSttFetch } from '@/lib/fetcher/run-stt-fetch';
import { deleteByPattern } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getFetcherConfig } from '@/lib/fetcher-config';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401);
  }

  const config = await getFetcherConfig();
  if (!config.enabled) {
    return apiSuccess({ status: 'skipped', message: 'Fetcher disabled via admin config' });
  }

  try {
    const result = await runSttFetch();

    const hasUnvalidated = (result.totalUnvalidated ?? 0) > 0;
    const status =
      result.errors.length === 0 && !hasUnvalidated
        ? 'success'
        : (result.totalModels > 0 || hasUnvalidated)
          ? 'partial'
          : 'failed';

    const verificationCost = await getRecentSttVerificationCost();

    await prisma.fetchRunSummary.create({
      data: {
        category: 'stt',
        status,
        providersRun: result.verificationResults.size + result.errors.length,
        modelsVerified: result.totalModels,
        modelsFlagged: result.totalFlagged,
        verificationCost,
        errors: result.errors,
      },
    });

    await deleteByPattern('pt:cache:stt:*').catch(() => {});

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
        category: 'stt',
        status: 'failed',
        providersRun: 0,
        modelsVerified: 0,
        modelsFlagged: 0,
        verificationCost: 0,
        errors: [message],
      },
    });

    return apiError(`STT fetch failed: ${message}`, 500);
  }
}

async function getRecentSttVerificationCost(): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await prisma.apiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: fiveMinAgo },
      operation: 'stt_verification',
    },
  });
  return result._sum.costUsd ?? 0;
}
