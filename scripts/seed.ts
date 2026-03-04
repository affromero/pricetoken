import { PrismaClient } from '@prisma/client';
import { STATIC_PRICING } from '../packages/sdk/src/static';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.modelPricingSnapshot.count();
  if (count > 0) {
    console.log(`Database already has ${count} pricing snapshots, skipping seed.`);
    return;
  }

  const data = STATIC_PRICING.map((m) => ({
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
  }));

  const result = await prisma.modelPricingSnapshot.createMany({ data });
  console.log(`Seeded ${result.count} pricing snapshots.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
