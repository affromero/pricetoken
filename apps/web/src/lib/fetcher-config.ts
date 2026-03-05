import { prisma } from '@/lib/prisma';
import type { FetcherConfig, Prisma } from '@prisma/client';

export type FetcherConfigData = FetcherConfig;

export interface VerificationAgentConfig {
  provider: string;
  model: string;
}

export async function getFetcherConfig(): Promise<FetcherConfigData> {
  return prisma.fetcherConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

interface FetcherConfigUpdate {
  extractionProvider?: string;
  extractionModel?: string;
  maxTextLength?: number;
  enabled?: boolean;
  verificationAgents?: Prisma.InputJsonValue;
}

export async function updateFetcherConfig(data: FetcherConfigUpdate): Promise<FetcherConfigData> {
  return prisma.fetcherConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
}

export function parseVerificationAgents(config: FetcherConfigData): VerificationAgentConfig[] {
  const agents = config.verificationAgents as unknown[];
  if (!Array.isArray(agents)) return [];
  return agents.filter(
    (a): a is VerificationAgentConfig =>
      typeof a === 'object' &&
      a !== null &&
      typeof (a as Record<string, unknown>).provider === 'string' &&
      typeof (a as Record<string, unknown>).model === 'string'
  );
}
