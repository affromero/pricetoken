import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './system-prompt';

export interface ExtractedModel {
  modelId: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export async function extractPricing(
  provider: string,
  pageText: string
): Promise<ExtractedModel[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required for pricing extraction');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract ${provider} model pricing from this page:\n\n${pageText}`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

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
    console.warn(`Failed to parse pricing extraction for ${provider}:`, text.slice(0, 200));
    return [];
  }
}
