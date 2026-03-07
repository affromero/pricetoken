import { getFetcherConfig } from '@/lib/fetcher-config';
import { logUsage } from '@/lib/usage-logger';
import { EXTRACTION_PROVIDERS } from './ai-registry';
import type { ExtractionResult } from './ai-registry';
import { VIDEO_SYSTEM_PROMPT } from './video-system-prompt';

export interface ExtractedVideoModel {
  modelId: string;
  displayName: string;
  costPerMinute: number;
  inputType?: string;
  resolution?: string;
  maxDuration?: number;
  qualityMode?: string;
  status?: 'active' | 'deprecated' | 'preview';
  launchDate?: string;
}

export interface VideoExtractionOutput {
  models: ExtractedVideoModel[];
  usage: { inputTokens: number; outputTokens: number };
  provider: string;
  model: string;
}

export async function extractVideoPricing(
  pricingProvider: string,
  pageText: string
): Promise<VideoExtractionOutput> {
  const config = await getFetcherConfig();

  const extractionProvider = EXTRACTION_PROVIDERS[config.extractionProvider];
  if (!extractionProvider) {
    throw new Error(`Unknown extraction provider: ${config.extractionProvider}`);
  }

  const apiKey = process.env[extractionProvider.envKey];
  if (!apiKey) {
    throw new Error(`${extractionProvider.envKey} is required for ${extractionProvider.displayName} extraction`);
  }

  const truncated = pageText.slice(0, config.maxTextLength);
  const userPrompt = `Extract ${pricingProvider} video model pricing from this page:\n\n${truncated}`;

  const startTime = Date.now();
  let result: ExtractionResult;
  try {
    result = await extractionProvider.extract(apiKey, config.extractionModel, VIDEO_SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    logUsage({
      provider: config.extractionProvider,
      model: config.extractionModel,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
      metadata: { pricingProvider, operation: 'video_extraction' },
    });
    throw new Error(
      `Video extraction failed with ${config.extractionProvider}/${config.extractionModel}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const models = parseVideoModels(result.content, pricingProvider);

  logUsage({
    provider: config.extractionProvider,
    model: config.extractionModel,
    operation: 'video_extraction',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    durationMs: Date.now() - startTime,
    metadata: { pricingProvider, modelsExtracted: models.length },
  });

  return {
    models,
    usage: result.usage,
    provider: config.extractionProvider,
    model: config.extractionModel,
  };
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenced) return fenced[1]!.trim();
  const first = trimmed.indexOf('[');
  const last = trimmed.lastIndexOf(']');
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function parseVideoModels(text: string, pricingProvider: string): ExtractedVideoModel[] {
  try {
    const parsed: unknown = JSON.parse(extractJson(text));
    if (!Array.isArray(parsed)) return [];
    const VALID_STATUSES = ['active', 'deprecated', 'preview'];
    return parsed
      .filter(
        (m): m is ExtractedVideoModel =>
          typeof m === 'object' &&
          m !== null &&
          typeof (m as Record<string, unknown>).modelId === 'string' &&
          typeof (m as Record<string, unknown>).costPerMinute === 'number' &&
          typeof (m as Record<string, unknown>).maxDuration === 'number'
      )
      .map((m) => {
        if (m.status && !VALID_STATUSES.includes(m.status)) {
          m.status = undefined;
        }
        if (m.launchDate && !/^\d{4}-\d{2}-\d{2}$/.test(m.launchDate)) {
          m.launchDate = undefined;
        }
        return m;
      });
  } catch {
    console.warn(`Failed to parse video pricing extraction for ${pricingProvider}:`, text.slice(0, 500));
    return [];
  }
}
