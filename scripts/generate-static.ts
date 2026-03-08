/**
 * Generates all 12 static pricing files (6 TS + 6 Python) from the
 * YAML model registry under registry/*.yaml.
 *
 * Usage:
 *   npx tsx scripts/generate-static.ts          # write mode
 *   npx tsx scripts/generate-static.ts --check   # verify files match YAML
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

import {
  textToTs, textToPy,
  ttsToTs, ttsToPy,
  sttToTs, sttToPy,
  avatarToTs, avatarToPy,
  imageToTs, imageToPy,
  videoToTs, videoToPy,
} from './lib/formatters';

const CHECK = process.argv.includes('--check');
const ROOT = join(__dirname, '..');
const REGISTRY_DIR = join(ROOT, 'registry');
const TS_DIR = join(ROOT, 'packages', 'sdk', 'src');
const PY_DIR = join(ROOT, 'packages', 'sdk-python', 'src', 'pricetoken');

const HEADER_TS = '// DO NOT EDIT — generated from registry/*.yaml by `npm run generate-static`\n';
const HEADER_PY = '# DO NOT EDIT — generated from registry/*.yaml by `npm run generate-static`\n';

// ---------------------------------------------------------------------------
// YAML parsing + validation
// ---------------------------------------------------------------------------

interface YamlRegistry {
  models: Record<string, unknown>[];
}

function loadYaml(filename: string): Record<string, unknown>[] {
  const path = join(REGISTRY_DIR, filename);
  if (!existsSync(path)) {
    throw new Error(`Registry file not found: ${path}`);
  }
  const content = readFileSync(path, 'utf-8');
  const parsed = yaml.load(content) as YamlRegistry;
  if (!parsed || !Array.isArray(parsed.models)) {
    throw new Error(`${filename}: expected top-level 'models' array`);
  }
  return parsed.models;
}

class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
}

function validateCommon(model: Record<string, unknown>, index: number, file: string): string[] {
  const errors: string[] = [];
  const prefix = `${file}[${index}]`;

  if (!model['modelId'] || typeof model['modelId'] !== 'string') {
    errors.push(`${prefix}: modelId is required and must be a string`);
  } else if (!/^[a-z0-9][a-z0-9._-]*$/.test(model['modelId'] as string)) {
    errors.push(`${prefix}: modelId "${model['modelId']}" must be lowercase kebab-case (a-z, 0-9, hyphens, dots, underscores)`);
  }

  if (!model['provider'] || typeof model['provider'] !== 'string') {
    errors.push(`${prefix}: provider is required`);
  }
  if (!model['displayName'] || typeof model['displayName'] !== 'string') {
    errors.push(`${prefix}: displayName is required`);
  }

  if (model['status'] !== undefined && model['status'] !== null) {
    const valid = ['active', 'deprecated', 'preview'];
    if (!valid.includes(model['status'] as string)) {
      errors.push(`${prefix}: status must be one of ${valid.join(', ')}`);
    }
  }

  if (model['pricingUrl'] !== undefined && model['pricingUrl'] !== null) {
    const url = model['pricingUrl'] as string;
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      errors.push(`${prefix}: pricingUrl must start with https://`);
    }
  }

  return errors;
}

function validatePriceField(
  model: Record<string, unknown>,
  field: string,
  prefix: string,
): string[] {
  const val = model[field];
  if (val === undefined || val === null || typeof val !== 'number' || val < 0) {
    return [`${prefix}: ${field} is required and must be >= 0`];
  }
  return [];
}

function validateText(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'inputPerMTok', prefix));
    errors.push(...validatePriceField(m, 'outputPerMTok', prefix));
  }
  return errors;
}

function validateTts(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'costPerMChars', prefix));
  }
  return errors;
}

function validateStt(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'costPerMinute', prefix));
  }
  return errors;
}

function validateAvatar(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'costPerMinute', prefix));
  }
  return errors;
}

function validateImage(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'pricePerImage', prefix));
    if (!m['defaultResolution'] || typeof m['defaultResolution'] !== 'string') {
      errors.push(`${prefix}: defaultResolution is required`);
    }
    if (!m['qualityTier'] || typeof m['qualityTier'] !== 'string') {
      errors.push(`${prefix}: qualityTier is required`);
    }
  }
  return errors;
}

function validateVideo(models: Record<string, unknown>[], file: string): string[] {
  const errors: string[] = [];
  for (let i = 0; i < models.length; i++) {
    const m = models[i]!;
    const prefix = `${file}[${i}]`;
    errors.push(...validateCommon(m, i, file));
    errors.push(...validatePriceField(m, 'costPerMinute', prefix));
  }
  return errors;
}

function checkDuplicateIds(models: Record<string, unknown>[], file: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const m of models) {
    const id = m['modelId'] as string;
    if (!id) continue;
    if (seen.has(id)) {
      errors.push(`${file}: duplicate modelId "${id}"`);
    }
    seen.add(id);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Model injection (add auto-generated fields)
// ---------------------------------------------------------------------------

/** Metadata fields that exist in YAML but should not be in generated output */
const METADATA_FIELDS = ['pricingUrl', 'fallbackUrls'];

function injectDefaults(model: Record<string, unknown>): Record<string, unknown> {
  const result = { ...model };
  // Strip metadata fields
  for (const field of METADATA_FIELDS) {
    delete result[field];
  }
  // Inject auto-generated fields
  result['source'] = 'seed';
  result['confidence'] = 'high';
  result['confidenceScore'] = 99;
  result['confidenceLevel'] = 'high';
  result['lastUpdated'] = null;
  // Default status to 'active' if not set
  if (result['status'] === undefined || result['status'] === null) {
    result['status'] = 'active';
  }
  return result;
}

function sortByModelId(models: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...models].sort((a, b) =>
    (a['modelId'] as string).localeCompare(b['modelId'] as string),
  );
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

interface ModalityConfig {
  name: string;
  yamlFile: string;
  tsFile: string;
  pyFile: string;
  validate: (models: Record<string, unknown>[], file: string) => string[];
  toTs: (models: never[]) => string;
  toPy: (models: never[]) => string;
}

const MODALITIES: ModalityConfig[] = [
  { name: 'text', yamlFile: 'text.yaml', tsFile: 'static.ts', pyFile: 'static.py', validate: validateText, toTs: textToTs as (m: never[]) => string, toPy: textToPy as (m: never[]) => string },
  { name: 'tts', yamlFile: 'tts.yaml', tsFile: 'tts-static.ts', pyFile: 'tts_static.py', validate: validateTts, toTs: ttsToTs as (m: never[]) => string, toPy: ttsToPy as (m: never[]) => string },
  { name: 'stt', yamlFile: 'stt.yaml', tsFile: 'stt-static.ts', pyFile: 'stt_static.py', validate: validateStt, toTs: sttToTs as (m: never[]) => string, toPy: sttToPy as (m: never[]) => string },
  { name: 'avatar', yamlFile: 'avatar.yaml', tsFile: 'avatar-static.ts', pyFile: 'avatar_static.py', validate: validateAvatar, toTs: avatarToTs as (m: never[]) => string, toPy: avatarToPy as (m: never[]) => string },
  { name: 'image', yamlFile: 'image.yaml', tsFile: 'static-image.ts', pyFile: 'static_image.py', validate: validateImage, toTs: imageToTs as (m: never[]) => string, toPy: imageToPy as (m: never[]) => string },
  { name: 'video', yamlFile: 'video.yaml', tsFile: 'video-static.ts', pyFile: 'video_static.py', validate: validateVideo, toTs: videoToTs as (m: never[]) => string, toPy: videoToPy as (m: never[]) => string },
];

export function generateModality(config: ModalityConfig): {
  tsContent: string;
  pyContent: string;
  count: number;
} {
  const rawModels = loadYaml(config.yamlFile);

  // Validate
  const errors = [
    ...config.validate(rawModels, config.yamlFile),
    ...checkDuplicateIds(rawModels, config.yamlFile),
  ];
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  // Inject defaults, sort, and generate
  const models = sortByModelId(rawModels.map(injectDefaults));
  const tsContent = HEADER_TS + config.toTs(models as never[]);
  const pyContent = HEADER_PY + config.toPy(models as never[]);

  return { tsContent, pyContent, count: models.length };
}

function main() {
  const mode = CHECK ? 'check' : 'write';
  console.log(`generate-static: ${mode} mode\n`);

  let allErrors: string[] = [];
  let hasDiff = false;

  for (const mod of MODALITIES) {
    try {
      const { tsContent, pyContent, count } = generateModality(mod);
      console.log(`${mod.name}: ${count} models`);

      const tsPath = join(TS_DIR, mod.tsFile);
      const pyPath = join(PY_DIR, mod.pyFile);

      if (CHECK) {
        // Compare against existing files
        const existingTs = existsSync(tsPath) ? readFileSync(tsPath, 'utf-8') : '';
        const existingPy = existsSync(pyPath) ? readFileSync(pyPath, 'utf-8') : '';
        if (existingTs !== tsContent) {
          console.error(`  MISMATCH: ${mod.tsFile}`);
          hasDiff = true;
        }
        if (existingPy !== pyContent) {
          console.error(`  MISMATCH: ${mod.pyFile}`);
          hasDiff = true;
        }
      } else {
        writeFileSync(tsPath, tsContent, 'utf-8');
        writeFileSync(pyPath, pyContent, 'utf-8');
        console.log(`  -> ${mod.tsFile} + ${mod.pyFile}`);
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        allErrors = allErrors.concat(err.errors);
        console.error(`${mod.name}: validation failed`);
      } else {
        throw err;
      }
    }
  }

  if (allErrors.length > 0) {
    console.error('\nValidation errors:');
    for (const e of allErrors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  if (CHECK && hasDiff) {
    console.error('\nStatic files are out of sync with registry YAML.');
    console.error('Run `npm run generate-static` to regenerate.');
    process.exit(1);
  }

  if (!CHECK) {
    console.log('\nDone. Run `npm run ci` to verify.');
  } else {
    console.log('\nAll static files match registry YAML.');
  }
}

main();
