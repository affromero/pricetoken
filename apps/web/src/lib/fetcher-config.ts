import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { FetcherConfig } from '@prisma/client';

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
  arbitratorAgent?: Prisma.InputJsonValue | null;
}

export async function updateFetcherConfig(data: FetcherConfigUpdate): Promise<FetcherConfigData> {
  // Prisma requires Prisma.DbNull for setting nullable JSON to null
  const prismaData: Record<string, unknown> = { ...data };
  if ('arbitratorAgent' in data && data.arbitratorAgent === null) {
    prismaData.arbitratorAgent = Prisma.DbNull;
  }
  return prisma.fetcherConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...prismaData },
    update: prismaData,
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

export function parseArbitratorAgent(config: FetcherConfigData): VerificationAgentConfig | null {
  const agent = config.arbitratorAgent as unknown;
  if (
    typeof agent === 'object' &&
    agent !== null &&
    typeof (agent as Record<string, unknown>).provider === 'string' &&
    typeof (agent as Record<string, unknown>).model === 'string'
  ) {
    return agent as VerificationAgentConfig;
  }
  return null;
}
