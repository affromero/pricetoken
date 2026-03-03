import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getModelCosts } from '@/lib/fetcher/ai-registry';

export function logUsage(params: {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs?: number;
  error?: string;
  metadata?: Prisma.InputJsonValue;
}): void {
  const costs = getModelCosts(params.provider, params.model);
  const costUsd =
    (params.inputTokens / 1000) * costs.costPer1kInput +
    (params.outputTokens / 1000) * costs.costPer1kOutput;

  // Fire-and-forget — never blocks the caller
  prisma.apiUsageLog
    .create({
      data: {
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd,
        durationMs: params.durationMs,
        error: params.error,
        metadata: params.metadata ?? undefined,
      },
    })
    .catch(() => {});
}
