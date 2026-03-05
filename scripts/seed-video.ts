import { PrismaClient } from '@prisma/client';
import { STATIC_VIDEO_PRICING } from '../packages/sdk/src/video-static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.videoPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_VIDEO_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMinute: m.costPerMinute,
      resolution: m.resolution,
      maxDuration: m.maxDuration,
      qualityMode: m.qualityMode,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.videoPricingSnapshot.createMany({ data });
    console.log(`Seeded ${result.count} new video models (${existingIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_VIDEO_PRICING.length} video models already seeded.`);
  }

  const withDates = STATIC_VIDEO_PRICING.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.videoPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing video records.`);
  }
}

main()
  .catch((err) => {
    console.error('Video seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
