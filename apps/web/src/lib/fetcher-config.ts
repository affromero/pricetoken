import { prisma } from '@/lib/prisma';
import type { FetcherConfig } from '@prisma/client';

export type FetcherConfigData = FetcherConfig;

export async function getFetcherConfig(): Promise<FetcherConfigData> {
  return prisma.fetcherConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

export async function updateFetcherConfig(
  data: Partial<Pick<FetcherConfigData, 'extractionProvider' | 'extractionModel' | 'maxTextLength' | 'enabled'>>
): Promise<FetcherConfigData> {
  return prisma.fetcherConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
}
