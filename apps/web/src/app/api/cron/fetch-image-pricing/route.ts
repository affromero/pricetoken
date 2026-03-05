import { prisma } from '@/lib/prisma';
import { runImagePricingFetch } from '@/lib/fetcher/run-image-fetch';
import { deleteByPattern } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401);
  }

  try {
    const result = await runImagePricingFetch();

    const status =
      result.errors.length === 0
        ? 'success'
        : result.totalModels > 0
          ? 'partial'
          : 'failed';

    const verificationCost = await getRecentImageVerificationCost();

    await prisma.fetchRunSummary.create({
      data: {
        status,
        providersRun: result.verificationResults.size + result.errors.length,
        modelsVerified: result.totalModels,
        modelsFlagged: result.totalFlagged,
        verificationCost,
        errors: result.errors,
      },
    });

    await deleteByPattern('pt:cache:image:*').catch(() => {});

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
        status: 'failed',
        providersRun: 0,
        modelsVerified: 0,
        modelsFlagged: 0,
        verificationCost: 0,
        errors: [message],
      },
    });

    return apiError(`Image fetch failed: ${message}`, 500);
  }
}

async function getRecentImageVerificationCost(): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await prisma.apiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: fiveMinAgo },
      operation: 'image_verification',
    },
  });
  return result._sum.costUsd ?? 0;
}
