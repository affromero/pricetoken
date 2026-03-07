/**
 * Seeds/corrects video pricing in the DB from the curated corrections file.
 *
 * Operations (all idempotent):
 * 1. Insert models missing from DB entirely (new snapshot)
 * 2. Correct prices that don't match (creates new latest snapshot)
 * 3. Backfill inputType on existing records with null
 * 4. Backfill launchDate on existing records with null
 *
 * Usage: doppler run -- npx tsx scripts/seed-video.ts
 */

import { PrismaClient } from '@prisma/client';
import { VIDEO_CORRECTIONS } from './video-corrections';

const prisma = new PrismaClient();

async function main() {
  // Get the latest snapshot per model from the DB
  const latestSnapshots = await prisma.$queryRaw<
    Array<{
      modelId: string;
      provider: string;
      displayName: string;
      costPerMinute: number;
      inputType: string | null;
      resolution: string | null;
      maxDuration: number | null;
      qualityMode: string | null;
      status: string | null;
      launchDate: Date | null;
    }>
  >`
    SELECT DISTINCT ON ("modelId")
      "modelId", "provider", "displayName", "costPerMinute",
      "inputType", "resolution", "maxDuration", "qualityMode",
      "status", "launchDate"
    FROM "VideoPricingSnapshot"
    ORDER BY "modelId", "createdAt" DESC
  `;
  const latestByModel = new Map(latestSnapshots.map((s) => [s.modelId, s]));

  let inserted = 0;
  let corrected = 0;
  let backfilledInputType = 0;
  let backfilledLaunchDate = 0;

  for (const c of VIDEO_CORRECTIONS) {
    const existing = latestByModel.get(c.modelId);

    if (!existing) {
      // 1. Insert completely missing model
      await prisma.videoPricingSnapshot.create({
        data: {
          modelId: c.modelId,
          provider: c.provider,
          displayName: c.displayName,
          costPerMinute: c.costPerMinute,
          inputType: c.inputType,
          resolution: c.resolution,
          maxDuration: c.maxDuration,
          qualityMode: c.qualityMode,
          source: 'seed',
          status: c.status ?? 'active',
          confidence: 'high',
          launchDate: c.launchDate ? new Date(c.launchDate) : null,
        },
      });
      console.log(`  + INSERT ${c.modelId} ($${c.costPerMinute}/min)`);
      inserted++;
      continue;
    }

    // 2. Correct price, displayName, maxDuration, or qualityMode if they differ
    const priceDiffers = existing.costPerMinute !== c.costPerMinute;
    const displayNameDiffers = existing.displayName !== c.displayName;
    const maxDurationDiffers = c.maxDuration !== null && existing.maxDuration !== c.maxDuration;
    const qualityModeDiffers = c.qualityMode !== null && existing.qualityMode !== c.qualityMode;

    if (priceDiffers || displayNameDiffers || maxDurationDiffers || qualityModeDiffers) {
      const changes: string[] = [];
      if (priceDiffers) changes.push(`price $${existing.costPerMinute}→$${c.costPerMinute}`);
      if (displayNameDiffers) changes.push(`name "${existing.displayName}"→"${c.displayName}"`);
      if (maxDurationDiffers) changes.push(`maxDuration ${existing.maxDuration}→${c.maxDuration}`);
      if (qualityModeDiffers) changes.push(`qualityMode ${existing.qualityMode}→${c.qualityMode}`);

      await prisma.videoPricingSnapshot.create({
        data: {
          modelId: c.modelId,
          provider: c.provider,
          displayName: c.displayName,
          costPerMinute: c.costPerMinute,
          inputType: c.inputType ?? existing.inputType,
          resolution: c.resolution,
          maxDuration: c.maxDuration,
          qualityMode: c.qualityMode,
          source: 'seed',
          status: c.status ?? (existing.status as string) ?? 'active',
          confidence: 'high',
          launchDate: c.launchDate ? new Date(c.launchDate) : existing.launchDate,
        },
      });
      console.log(`  ~ CORRECT ${c.modelId}: ${changes.join(', ')}`);
      corrected++;
      continue;
    }

    // 3. Backfill inputType on existing records that have null
    if (!existing.inputType && c.inputType) {
      const { count } = await prisma.videoPricingSnapshot.updateMany({
        where: { modelId: c.modelId, inputType: null },
        data: { inputType: c.inputType },
      });
      if (count > 0) {
        console.log(`  ← BACKFILL inputType on ${c.modelId}: ${c.inputType} (${count} rows)`);
        backfilledInputType += count;
      }
    }

    // 4. Backfill launchDate on existing records that have null
    if (!existing.launchDate && c.launchDate) {
      const { count } = await prisma.videoPricingSnapshot.updateMany({
        where: { modelId: c.modelId, launchDate: null },
        data: { launchDate: new Date(c.launchDate) },
      });
      if (count > 0) {
        console.log(`  ← BACKFILL launchDate on ${c.modelId}: ${c.launchDate} (${count} rows)`);
        backfilledLaunchDate += count;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Inserted:            ${inserted} new models`);
  console.log(`Corrected:           ${corrected} models (new snapshot created)`);
  console.log(`Backfilled inputType: ${backfilledInputType} rows`);
  console.log(`Backfilled launchDate: ${backfilledLaunchDate} rows`);

  if (inserted === 0 && corrected === 0 && backfilledInputType === 0 && backfilledLaunchDate === 0) {
    console.log('\nAll video models already up to date.');
  }
}

main()
  .catch((err) => {
    console.error('Video seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
