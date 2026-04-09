import { prisma } from '@/lib/prisma';
import { deleteByPattern } from '@/lib/redis';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getFetcherConfig } from '@/lib/fetcher-config';
import { runPricingFetch } from '@/lib/fetcher/run-fetch';
import { runAvatarFetch } from '@/lib/fetcher/run-avatar-fetch';
import { runImagePricingFetch } from '@/lib/fetcher/run-image-fetch';
import { runVideoFetch } from '@/lib/fetcher/run-video-fetch';
import { runSttFetch } from '@/lib/fetcher/run-stt-fetch';
import { runTtsFetch } from '@/lib/fetcher/run-tts-fetch';
import { runMusicFetch } from '@/lib/fetcher/run-music-fetch';

const CATEGORIES = {
  text: {
    run: (retry: boolean) => runPricingFetch({ retryFlagged: retry }),
    cache: 'pt:cache:pricing:*',
    operation: 'pricing_verification',
  },
  avatar: {
    run: () => runAvatarFetch(),
    cache: 'pt:cache:avatar:*',
    operation: 'avatar_verification',
  },
  image: {
    run: (retry: boolean) => runImagePricingFetch({ retryFlagged: retry }),
    cache: 'pt:cache:image:*',
    operation: 'image_verification',
  },
  video: {
    run: (retry: boolean) => runVideoFetch({ retryFlagged: retry }),
    cache: 'pt:cache:video:*',
    operation: 'video_verification',
  },
  stt: {
    run: () => runSttFetch(),
    cache: 'pt:cache:stt:*',
    operation: 'stt_verification',
  },
  tts: {
    run: () => runTtsFetch(),
    cache: 'pt:cache:tts:*',
    operation: 'tts_verification',
  },
  music: {
    run: () => runMusicFetch(),
    cache: 'pt:cache:music:*',
    operation: 'music_verification',
  },
} as const;

type Category = keyof typeof CATEGORIES;

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

  const startOfDay = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  // Find today's best run per category
  const todayRuns = await prisma.fetchRunSummary.findMany({
    where: { createdAt: { gte: startOfDay } },
    orderBy: { createdAt: 'desc' },
  });

  const bestByCategory = new Map<string, string>();
  for (const run of todayRuns) {
    const existing = bestByCategory.get(run.category);
    // Priority: success > partial > failed > unknown
    if (!existing || statusPriority(run.status) > statusPriority(existing)) {
      bestByCategory.set(run.category, run.status);
    }
  }

  // Determine which categories need retry
  const toRetry: { category: Category; reason: string }[] = [];
  for (const category of Object.keys(CATEGORIES) as Category[]) {
    const bestStatus = bestByCategory.get(category);
    if (!bestStatus) {
      toRetry.push({ category, reason: 'never ran today' });
    } else if (bestStatus === 'failed') {
      toRetry.push({ category, reason: 'failed' });
    } else if (bestStatus === 'partial') {
      toRetry.push({ category, reason: 'partial (has flagged models)' });
    }
    // 'success' and 'resolved' → skip
  }

  if (toRetry.length === 0) {
    return apiSuccess({ message: 'All categories succeeded today, nothing to retry', retried: [] });
  }

  console.log(`Retry: ${toRetry.map((r) => `${r.category} (${r.reason})`).join(', ')}`);

  const results: {
    category: string;
    reason: string;
    status: string;
    modelsVerified: number;
    modelsFlagged: number;
    errors: string[];
  }[] = [];

  for (const { category, reason } of toRetry) {
    const config = CATEGORIES[category];
    const isRetryFlagged = reason.startsWith('partial');

    try {
      console.log(`Retrying ${category} (${reason})...`);
      const result = await config.run(isRetryFlagged);

      const hasUnvalidated = (result.totalUnvalidated ?? 0) > 0;
      const status =
        result.errors.length === 0 && !hasUnvalidated
          ? 'success'
          : (result.totalModels > 0 || hasUnvalidated)
            ? 'partial'
            : 'failed';

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const costResult = await prisma.apiUsageLog.aggregate({
        _sum: { costUsd: true },
        where: { createdAt: { gte: fiveMinAgo }, operation: config.operation },
      });

      await prisma.fetchRunSummary.create({
        data: {
          category,
          status,
          providersRun: result.verificationResults.size + result.errors.length,
          modelsVerified: result.totalModels,
          modelsFlagged: result.totalFlagged,
          verificationCost: costResult._sum.costUsd ?? 0,
          errors: result.errors,
        },
      });

      await deleteByPattern(config.cache).catch(() => {});

      results.push({
        category,
        reason,
        status,
        modelsVerified: result.totalModels,
        modelsFlagged: result.totalFlagged,
        errors: result.errors,
      });

      console.log(`Retry ${category}: ${status} (${result.totalModels} verified, ${result.totalFlagged} flagged)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await prisma.fetchRunSummary.create({
        data: {
          category,
          status: 'failed',
          providersRun: 0,
          modelsVerified: 0,
          modelsFlagged: 0,
          verificationCost: 0,
          errors: [message],
        },
      });

      results.push({
        category,
        reason,
        status: 'failed',
        modelsVerified: 0,
        modelsFlagged: 0,
        errors: [message],
      });

      console.error(`Retry ${category} failed: ${message}`);
    }
  }

  const allSucceeded = results.every((r) => r.status === 'success');

  return apiSuccess({
    message: allSucceeded ? 'All retries succeeded' : 'Retry completed with issues',
    retried: results,
  });
}

function statusPriority(status: string): number {
  switch (status) {
    case 'success': return 4;
    case 'resolved': return 3;
    case 'partial': return 2;
    case 'failed': return 1;
    default: return 0;
  }
}
