/**
 * Fetches current pricing from the live API and writes static data files
 * for BOTH TypeScript and Python SDKs across all 6 modalities.
 *
 * Usage: npx tsx scripts/update-static.ts [--url https://pricetoken.ai]
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.PRICETOKEN_API_URL ?? 'https://pricetoken.ai';
const ROOT = join(__dirname, '..');
const TS_DIR = join(ROOT, 'packages', 'sdk', 'src');
const PY_DIR = join(ROOT, 'packages', 'sdk-python', 'src', 'pricetoken');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tsVal(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `[${v.map(tsVal).join(', ')}]`;
  return String(v);
}

function pyVal(v: unknown): string {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'string') {
    // Replace en-dashes with hyphens to avoid ruff RUF001
    const clean = v.replace(/\u2013/g, '-');
    return `"${clean.replace(/"/g, '\\"')}"`;
  }
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (Array.isArray(v)) return `[${v.map(pyVal).join(', ')}]`;
  return String(v);
}

function pyNumVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'None';
  if (v >= 100_000) {
    // Use Python underscores for large numbers
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '_');
  }
  return String(v);
}

async function fetchData<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/api/v1/${endpoint}`);
  if (!res.ok) throw new Error(`${endpoint}: API returned ${res.status}`);
  const json = (await res.json()) as { data: T[] };
  return json.data;
}

// ---------------------------------------------------------------------------
// Text models
// ---------------------------------------------------------------------------

interface TextModel {
  modelId: string;
  provider: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function textToTs(models: TextModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    inputPerMTok: ${m.inputPerMTok},
    outputPerMTok: ${m.outputPerMTok},
    contextWindow: ${m.contextWindow ?? 'null'},
    maxOutputTokens: ${m.maxOutputTokens ?? 'null'},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { ModelPricing } from './types';

export const STATIC_PRICING: ModelPricing[] = [
${entries},
];
`;
}

function textToPy(models: TextModel[]): string {
  const entries = models.map((m) => `    ModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        input_per_m_tok=${m.inputPerMTok},
        output_per_m_tok=${m.outputPerMTok},
        context_window=${pyNumVal(m.contextWindow)},
        max_output_tokens=${pyNumVal(m.maxOutputTokens)},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
    ),`).join('\n');

  return `"""Static text model pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import FreshnessInfo, ModelPricing

STATIC_PRICING: list[ModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// TTS models
// ---------------------------------------------------------------------------

interface TtsModel {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMChars: number;
  voiceType: string | null;
  maxCharacters: number | null;
  supportedLanguages: number | null;
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function ttsToTs(models: TtsModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    costPerMChars: ${m.costPerMChars},
    voiceType: ${tsVal(m.voiceType)},
    maxCharacters: ${m.maxCharacters ?? 'null'},
    supportedLanguages: ${m.supportedLanguages ?? 'null'},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { TtsModelPricing } from './types';

export const STATIC_TTS_PRICING: TtsModelPricing[] = [
${entries},
];
`;
}

function ttsToPy(models: TtsModel[]): string {
  const entries = models.map((m) => `    TtsModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        cost_per_m_chars=${m.costPerMChars},
        voice_type=${pyVal(m.voiceType)},
        max_characters=${m.maxCharacters ?? 'None'},
        supported_languages=${m.supportedLanguages ?? 'None'},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
    ),`).join('\n');

  return `"""Static TTS pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import FreshnessInfo, TtsModelPricing

STATIC_TTS_PRICING: list[TtsModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// STT models
// ---------------------------------------------------------------------------

interface SttModel {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  sttType: string | null;
  maxDuration: number | null;
  supportedLanguages: number | null;
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function sttToTs(models: SttModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    costPerMinute: ${m.costPerMinute},
    sttType: ${tsVal(m.sttType)},
    maxDuration: ${m.maxDuration ?? 'null'},
    supportedLanguages: ${m.supportedLanguages ?? 'null'},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { SttModelPricing } from './types';

export const STATIC_STT_PRICING: SttModelPricing[] = [
${entries},
];
`;
}

function sttToPy(models: SttModel[]): string {
  const entries = models.map((m) => `    SttModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        cost_per_minute=${m.costPerMinute},
        stt_type=${pyVal(m.sttType)},
        max_duration=${m.maxDuration ?? 'None'},
        supported_languages=${m.supportedLanguages ?? 'None'},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
    ),`).join('\n');

  return `"""Static STT pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import FreshnessInfo, SttModelPricing

STATIC_STT_PRICING: list[SttModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// Avatar models
// ---------------------------------------------------------------------------

interface AvatarModel {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  avatarType: string | null;
  resolution: string | null;
  maxDuration: number | null;
  qualityMode: string | null;
  lipSync: boolean | null;
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function avatarToTs(models: AvatarModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    costPerMinute: ${m.costPerMinute},
    avatarType: ${tsVal(m.avatarType)},
    resolution: ${tsVal(m.resolution)},
    maxDuration: ${m.maxDuration ?? 'null'},
    qualityMode: ${tsVal(m.qualityMode)},
    lipSync: ${m.lipSync ?? 'null'},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { AvatarModelPricing } from './types';

export const STATIC_AVATAR_PRICING: AvatarModelPricing[] = [
${entries},
];
`;
}

function avatarToPy(models: AvatarModel[]): string {
  const entries = models.map((m) => `    AvatarModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        cost_per_minute=${m.costPerMinute},
        avatar_type=${pyVal(m.avatarType)},
        resolution=${pyVal(m.resolution)},
        max_duration=${m.maxDuration ?? 'None'},
        quality_mode=${pyVal(m.qualityMode)},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
        lip_sync=${pyVal(m.lipSync)},
    ),`).join('\n');

  return `"""Static avatar pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import AvatarModelPricing, FreshnessInfo

STATIC_AVATAR_PRICING: list[AvatarModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// Image models
// ---------------------------------------------------------------------------

interface ImageModel {
  modelId: string;
  provider: string;
  displayName: string;
  pricePerImage: number;
  pricePerMegapixel: number | null;
  defaultResolution: string;
  qualityTier: string;
  maxResolution: string | null;
  supportedFormats: string[];
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function imageToTs(models: ImageModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    pricePerImage: ${m.pricePerImage},
    pricePerMegapixel: ${m.pricePerMegapixel ?? 'null'},
    defaultResolution: ${tsVal(m.defaultResolution)},
    qualityTier: ${tsVal(m.qualityTier)},
    maxResolution: ${tsVal(m.maxResolution)},
    supportedFormats: ${tsVal(m.supportedFormats)},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { ImageModelPricing } from './types';

export const STATIC_IMAGE_PRICING: ImageModelPricing[] = [
${entries},
];
`;
}

function imageToPy(models: ImageModel[]): string {
  const entries = models.map((m) => `    ImageModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        price_per_image=${m.pricePerImage},
        price_per_megapixel=${m.pricePerMegapixel ?? 'None'},
        default_resolution=${pyVal(m.defaultResolution)},
        quality_tier=${pyVal(m.qualityTier)},
        max_resolution=${pyVal(m.maxResolution)},
        supported_formats=${pyVal(m.supportedFormats)},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
    ),`).join('\n');

  return `"""Static image pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import FreshnessInfo, ImageModelPricing

STATIC_IMAGE_PRICING: list[ImageModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// Video models
// ---------------------------------------------------------------------------

interface VideoModel {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  inputType: string | null;
  resolution: string | null;
  maxDuration: number | null;
  qualityMode: string | null;
  source: string;
  status: string | null;
  confidence: string;
  confidenceScore: number;
  confidenceLevel: string;
  lastUpdated: string | null;
  launchDate: string | null;
}

function videoToTs(models: VideoModel[]): string {
  const entries = models.map((m) => `  {
    modelId: ${tsVal(m.modelId)},
    provider: ${tsVal(m.provider)},
    displayName: ${tsVal(m.displayName)},
    costPerMinute: ${m.costPerMinute},
    inputType: ${tsVal(m.inputType)},
    resolution: ${tsVal(m.resolution)},
    maxDuration: ${m.maxDuration ?? 'null'},
    qualityMode: ${tsVal(m.qualityMode)},
    source: 'seed',
    status: ${tsVal(m.status ?? 'active')},
    confidence: ${tsVal(m.confidence)},
    confidenceScore: ${m.confidenceScore},
    confidenceLevel: ${tsVal(m.confidenceLevel)},
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: ${tsVal(m.launchDate)},
  }`).join(',\n');

  return `import type { VideoModelPricing } from './types';

export const STATIC_VIDEO_PRICING: VideoModelPricing[] = [
${entries},
];
`;
}

function videoToPy(models: VideoModel[]): string {
  const entries = models.map((m) => `    VideoModelPricing(
        model_id=${pyVal(m.modelId)},
        provider=${pyVal(m.provider)},
        display_name=${pyVal(m.displayName)},
        cost_per_minute=${m.costPerMinute},
        resolution=${pyVal(m.resolution)},
        max_duration=${m.maxDuration ?? 'None'},
        quality_mode=${pyVal(m.qualityMode)},
        source="seed",
        status=${pyVal(m.status ?? 'active')},
        confidence=${pyVal(m.confidence)},
        confidence_score=${m.confidenceScore},
        confidence_level=${pyVal(m.confidenceLevel)},
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date=${pyVal(m.launchDate)},
        input_type=${pyVal(m.inputType)},
    ),`).join('\n');

  return `"""Static video pricing data for the PriceToken SDK."""

from __future__ import annotations

from .types import FreshnessInfo, VideoModelPricing

STATIC_VIDEO_PRICING: list[VideoModelPricing] = [
${entries}
]
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Fetching pricing from ${API_URL}...\n`);

  const modalities = [
    { name: 'text', endpoint: 'text', tsFile: 'static.ts', pyFile: 'static.py', toTs: textToTs, toPy: textToPy },
    { name: 'tts', endpoint: 'tts', tsFile: 'tts-static.ts', pyFile: 'tts_static.py', toTs: ttsToTs, toPy: ttsToPy },
    { name: 'stt', endpoint: 'stt', tsFile: 'stt-static.ts', pyFile: 'stt_static.py', toTs: sttToTs, toPy: sttToPy },
    { name: 'avatar', endpoint: 'avatar', tsFile: 'avatar-static.ts', pyFile: 'avatar_static.py', toTs: avatarToTs, toPy: avatarToPy },
    { name: 'image', endpoint: 'image', tsFile: 'static-image.ts', pyFile: 'static_image.py', toTs: imageToTs, toPy: imageToPy },
    { name: 'video', endpoint: 'video', tsFile: 'video-static.ts', pyFile: 'video_static.py', toTs: videoToTs, toPy: videoToPy },
  ];

  for (const mod of modalities) {
    try {
      const data = await fetchData(mod.endpoint);
      console.log(`${mod.name}: ${data.length} models`);

      const tsContent = mod.toTs(data as never[]);
      const tsPath = join(TS_DIR, mod.tsFile);
      writeFileSync(tsPath, tsContent, 'utf-8');

      const pyContent = mod.toPy(data as never[]);
      const pyPath = join(PY_DIR, mod.pyFile);
      writeFileSync(pyPath, pyContent, 'utf-8');

      console.log(`  → ${mod.tsFile} + ${mod.pyFile}`);
    } catch (err) {
      console.error(`${mod.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nDone. Run `npm run ci` to verify.');
}

main().catch((err) => {
  console.error('Failed to update static data:', err);
  process.exit(1);
});
