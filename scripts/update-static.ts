/**
 * Fetches current pricing from the live API and writes static data files
 * for BOTH TypeScript and Python SDKs across all 6 modalities.
 *
 * Usage: npx tsx scripts/update-static.ts [--url https://pricetoken.ai]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  textToTs, textToPy,
  ttsToTs, ttsToPy,
  sttToTs, sttToPy,
  avatarToTs, avatarToPy,
  imageToTs, imageToPy,
  videoToTs, videoToPy,
} from './lib/formatters';

const API_URL = process.env.PRICETOKEN_API_URL ?? 'https://pricetoken.ai';
const FORCE = process.argv.includes('--force');
const ROOT = join(__dirname, '..');
const TS_DIR = join(ROOT, 'packages', 'sdk', 'src');
const PY_DIR = join(ROOT, 'packages', 'sdk-python', 'src', 'pricetoken');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchData<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/api/v1/${endpoint}`);
  if (!res.ok) throw new Error(`${endpoint}: API returned ${res.status}`);
  const json = (await res.json()) as { data: T[] };
  return json.data;
}

// ---------------------------------------------------------------------------
// Regression detection
// ---------------------------------------------------------------------------

/** Fields to watch for null regressions per modality */
const WATCH_FIELDS: Record<string, string[]> = {
  video: ['inputType'],
};

/**
 * Extracts model objects from an existing TS static file by parsing the
 * JS module. Returns an array of plain objects with string keys.
 */
function loadExistingTsModels(tsPath: string): Record<string, unknown>[] {
  try {
    const content = readFileSync(tsPath, 'utf-8');
    // Extract the array literal between [ ... ];
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    // Replace code expressions with JSON-compatible values
    const jsonish = match[0]
      .replace(/new Date\(\)\.toISOString\(\)/g, '""')
      .replace(/(\w+):/g, '"$1":')       // unquoted keys → quoted
      .replace(/'/g, '"')                  // single → double quotes
      .replace(/,\s*([\]}])/g, '$1')       // trailing commas
      .replace(/\{[^{}]*lastVerified[^{}]*\}/g, '{}'); // freshness objects
    return JSON.parse(jsonish);
  } catch {
    return [];
  }
}

interface RegressionWarning {
  modelId: string;
  field: string;
  was: unknown;
  now: unknown;
}

function detectRegressions(
  modality: string,
  oldModels: Record<string, unknown>[],
  newModels: Record<string, unknown>[],
): { nulled: RegressionWarning[]; dropped: string[] } {
  const watchFields = WATCH_FIELDS[modality] ?? [];
  const oldByModel = new Map(oldModels.map((m) => [m.modelId as string, m]));
  const newByModel = new Map(newModels.map((m) => [m.modelId as string, m]));

  const nulled: RegressionWarning[] = [];
  for (const [modelId, newModel] of newByModel) {
    const oldModel = oldByModel.get(modelId);
    if (!oldModel) continue;
    for (const field of watchFields) {
      if (oldModel[field] != null && newModel[field] == null) {
        nulled.push({ modelId, field, was: oldModel[field], now: null });
      }
    }
  }

  const dropped: string[] = [];
  for (const [modelId] of oldByModel) {
    if (!newByModel.has(modelId)) dropped.push(modelId);
  }

  return { nulled, dropped };
}

function printRegressions(modality: string, nulled: RegressionWarning[], dropped: string[]): void {
  if (nulled.length === 0 && dropped.length === 0) return;

  const total = nulled.length + dropped.length;
  console.warn(`\n  ⚠ ${modality}: ${total} potential regression(s):`);
  for (const w of nulled) {
    console.warn(`    ${w.modelId}: ${w.field} was ${JSON.stringify(w.was)}, now null`);
  }
  for (const id of dropped) {
    console.warn(`    ${id}: model REMOVED from API output`);
  }
  if (!FORCE) {
    console.warn(`    → Skipping ${modality}. Run with --force to overwrite anyway.\n`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Fetching pricing from ${API_URL}...`);
  if (FORCE) console.log('  --force: will overwrite despite regressions');
  console.log('');

  const modalities = [
    { name: 'text', endpoint: 'text', tsFile: 'static.ts', pyFile: 'static.py', toTs: textToTs, toPy: textToPy },
    { name: 'tts', endpoint: 'tts', tsFile: 'tts-static.ts', pyFile: 'tts_static.py', toTs: ttsToTs, toPy: ttsToPy },
    { name: 'stt', endpoint: 'stt', tsFile: 'stt-static.ts', pyFile: 'stt_static.py', toTs: sttToTs, toPy: sttToPy },
    { name: 'avatar', endpoint: 'avatar', tsFile: 'avatar-static.ts', pyFile: 'avatar_static.py', toTs: avatarToTs, toPy: avatarToPy },
    { name: 'image', endpoint: 'image', tsFile: 'static-image.ts', pyFile: 'static_image.py', toTs: imageToTs, toPy: imageToPy },
    { name: 'video', endpoint: 'video', tsFile: 'video-static.ts', pyFile: 'video_static.py', toTs: videoToTs, toPy: videoToPy },
  ];

  let hasRegressions = false;

  for (const mod of modalities) {
    try {
      const data = await fetchData(mod.endpoint);
      console.log(`${mod.name}: ${data.length} models`);

      // Check for regressions before writing
      const tsPath = join(TS_DIR, mod.tsFile);
      const existingModels = loadExistingTsModels(tsPath);
      const { nulled, dropped } = detectRegressions(mod.name, existingModels, data as Record<string, unknown>[]);

      if (nulled.length > 0 || dropped.length > 0) {
        printRegressions(mod.name, nulled, dropped);
        hasRegressions = true;
        if (!FORCE) continue; // skip writing this modality
      }

      const tsContent = mod.toTs(data as never[]);
      writeFileSync(tsPath, tsContent, 'utf-8');

      const pyContent = mod.toPy(data as never[]);
      const pyPath = join(PY_DIR, mod.pyFile);
      writeFileSync(pyPath, pyContent, 'utf-8');

      console.log(`  → ${mod.tsFile} + ${mod.pyFile}`);
    } catch (err) {
      console.error(`${mod.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (hasRegressions && !FORCE) {
    console.warn('\nSome modalities were skipped due to regressions.');
    console.warn('Fix the data in the DB (via seed scripts) and re-run, or use --force.');
    process.exit(1);
  }

  console.log('\nDone. Run `npm run ci` to verify.');
}

main().catch((err) => {
  console.error('Failed to update static data:', err);
  process.exit(1);
});
