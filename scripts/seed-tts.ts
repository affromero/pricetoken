import { PrismaClient } from '@prisma/client';
import { STATIC_TTS_PRICING } from '../packages/sdk/src/tts-static';

const prisma = new PrismaClient();

async function main() {
  const existingIds = (
    await prisma.ttsPricingSnapshot.findMany({
      select: { modelId: true },
      distinct: ['modelId'],
    })
  ).map((r) => r.modelId);

  const missing = STATIC_TTS_PRICING.filter((m) => !existingIds.includes(m.modelId));

  if (missing.length > 0) {
    const data = missing.map((m) => ({
      modelId: m.modelId,
      provider: m.provider,
      displayName: m.displayName,
      costPerMChars: m.costPerMChars,
      voiceType: m.voiceType,
      maxCharacters: m.maxCharacters,
      supportedLanguages: m.supportedLanguages,
      source: 'seed',
      status: m.status ?? 'active',
      confidence: m.confidence ?? 'high',
      launchDate: m.launchDate ? new Date(m.launchDate) : null,
    }));

    const result = await prisma.ttsPricingSnapshot.createMany({ data });
    console.log(`Seeded ${result.count} new TTS models (${existingIds.length} already existed).`);
  } else {
    console.log(`All ${STATIC_TTS_PRICING.length} TTS models already seeded.`);
  }

  const { count } = await prisma.ttsPricingSnapshot.updateMany({
    where: { source: 'seed', confidence: 'low' },
    data: { confidence: 'high' },
  });
  if (count > 0) {
    console.log(`Fixed confidence on ${count} seed records.`);
  }
}

main()
  .catch((err) => {
    console.error('TTS seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
