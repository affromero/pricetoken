import { PrismaClient } from '@prisma/client';
import { STATIC_PRICING } from '../packages/sdk/src/static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.modelPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length === 0) {
    console.log(`All ${STATIC_PRICING.length} models already seeded, nothing to do.`);
    return;
  }

  const data = missing.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    inputPerMTok: m.inputPerMTok,
    outputPerMTok: m.outputPerMTok,
    contextWindow: m.contextWindow,
    maxOutputTokens: m.maxOutputTokens,
    source: 'seed',
    status: m.status ?? 'active',
    confidence: m.confidence ?? 'high',
    launchDate: m.launchDate ? new Date(m.launchDate) : null,
  }));

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  console.log(`Seeded ${result.count} new models (${existingIds.length} already existed).`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
