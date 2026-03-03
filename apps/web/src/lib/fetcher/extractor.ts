import { getFetcherConfig } from '@/lib/fetcher-config';
import { EXTRACTION_PROVIDERS } from './ai-registry';
import type { ExtractionResult } from './ai-registry';
import { SYSTEM_PROMPT } from './system-prompt';

export interface ExtractedModel {
  modelId: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface ExtractionOutput {
  models: ExtractedModel[];
  usage: { inputTokens: number; outputTokens: number };
  provider: string;
  model: string;
}

export async function extractPricing(
  pricingProvider: string,
  pageText: string
): Promise<ExtractionOutput> {
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
  const userPrompt = `Extract ${pricingProvider} model pricing from this page:\n\n${truncated}`;

  let result: ExtractionResult;
  try {
    result = await extractionProvider.extract(apiKey, config.extractionModel, SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    throw new Error(
      `Extraction failed with ${config.extractionProvider}/${config.extractionModel}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const models = parseModels(result.content, pricingProvider);

  return {
    models,
    usage: result.usage,
    provider: config.extractionProvider,
    model: config.extractionModel,
  };
}

function parseModels(text: string, pricingProvider: string): ExtractedModel[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ExtractedModel =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as Record<string, unknown>).modelId === 'string' &&
        typeof (m as Record<string, unknown>).inputPerMTok === 'number' &&
        typeof (m as Record<string, unknown>).outputPerMTok === 'number'
    );
  } catch {
    console.warn(`Failed to parse pricing extraction for ${pricingProvider}:`, text.slice(0, 200));
    return [];
  }
}
