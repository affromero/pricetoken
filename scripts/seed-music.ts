import { PrismaClient } from '@prisma/client';
import { STATIC_MUSIC_PRICING } from '../packages/sdk/src/music-static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.musicPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_MUSIC_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMinute: m.costPerMinute,
      maxDuration: m.maxDuration,
      outputFormat: m.outputFormat,
      vocals: m.vocals,
      official: m.official,
      pricingNote: m.pricingNote,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.musicPricingSnapshot.createMany({ data });
    console.log(`Seeded ${result.count} new music models (${existingIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_MUSIC_PRICING.length} music models already seeded.`);
  }

  // Fix any low-confidence seed records
  const { count } = await prisma.musicPricingSnapshot.updateMany({
    where: { source: 'seed', confidence: 'low' },
    data: { confidence: 'high' },
  });
  if (count > 0) {
    console.log(`Fixed confidence on ${count} seed records.`);
  }
}

main()
  .catch((err) => {
    console.error('Music seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
