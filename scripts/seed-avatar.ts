import { PrismaClient } from '@prisma/client';
import { STATIC_AVATAR_PRICING } from '../packages/sdk/src/avatar-static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.avatarPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_AVATAR_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMinute: m.costPerMinute,
      avatarType: m.avatarType,
      resolution: m.resolution,
      maxDuration: m.maxDuration,
      qualityMode: m.qualityMode,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.avatarPricingSnapshot.createMany({ data });
    console.log(`Seeded ${result.count} new avatar models (${existingIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_AVATAR_PRICING.length} avatar models already seeded.`);
  }

  // Fix any low-confidence seed records
  const { count } = await prisma.avatarPricingSnapshot.updateMany({
    where: { source: 'seed', confidence: 'low' },
    data: { confidence: 'high' },
  });
  if (count > 0) {
    console.log(`Fixed confidence on ${count} seed records.`);
  }
}

main()
  .catch((err) => {
    console.error('Avatar seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
