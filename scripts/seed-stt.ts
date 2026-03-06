import { PrismaClient } from '@prisma/client';
import { STATIC_STT_PRICING } from '../packages/sdk/src/stt-static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.sttPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_STT_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMinute: m.costPerMinute,
      sttType: m.sttType,
      maxDuration: m.maxDuration,
      supportedLanguages: m.supportedLanguages,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.sttPricingSnapshot.createMany({ data });
    console.log(`Seeded ${result.count} new STT models (${existingIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_STT_PRICING.length} STT models already seeded.`);
  }

  const { count } = await prisma.sttPricingSnapshot.updateMany({
    where: { source: 'seed', confidence: 'low' },
    data: { confidence: 'high' },
  });
  if (count > 0) {
    console.log(`Fixed confidence on ${count} seed records.`);
  }
}

main()
  .catch((err) => {
    console.error('STT seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
