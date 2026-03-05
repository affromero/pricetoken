import { PrismaClient } from '@prisma/client';
import { STATIC_PRICING } from '../packages/sdk/src/static';
import { STATIC_IMAGE_PRICING } from '../packages/sdk/src/static-image';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.modelPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
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
  } else {
    console.log(`All ${STATIC_PRICING.length} models already seeded.`);
  }

  // Backfill launchDate on existing records that are missing it
  const withDates = STATIC_PRICING.filter((m) => m.launchDate);
  let updated = 0;
  for (const m of withDates) {
    const { count } = await prisma.modelPricingSnapshot.updateMany({
      where: { modelId: m.modelId, launchDate: null },
      data: { launchDate: new Date(m.launchDate!) },
    });
    updated += count;
  }
  if (updated > 0) {
    console.log(`Backfilled launchDate on ${updated} existing records.`);
  }

  // Seed image pricing
  const existingImageIds = (
    await prisma.imagePricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missingImages = STATIC_IMAGE_PRICING.filter((m) => !existingImageIds.includes(m.modelId));

  if (missingImages.length > 0) {
    const imageData = missingImages.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      pricePerImage: m.pricePerImage,
      pricePerMegapixel: m.pricePerMegapixel,
      defaultResolution: m.defaultResolution,
      qualityTier: m.qualityTier,
      maxResolution: m.maxResolution,
      supportedFormats: m.supportedFormats,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const imageResult = await prisma.imagePricingSnapshot.createMany({ data: imageData });
    console.log(`Seeded ${imageResult.count} new image models (${existingImageIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_IMAGE_PRICING.length} image models already seeded.`);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
