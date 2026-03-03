import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedModel {
  modelId: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow?: number;
  maxOutputTokens?: number;
}

const SYSTEM_PROMPT = `You are a pricing data extractor. Extract AI model pricing from the given text.
Return a JSON array of objects with these fields:
- modelId: the API model identifier (e.g. "gpt-4.1", "claude-sonnet-4-6", "gemini-2.5-pro")
- displayName: human-readable name
- inputPerMTok: price per million input tokens in USD (number)
- outputPerMTok: price per million output tokens in USD (number)
- contextWindow: max input context in tokens (number, optional)
- maxOutputTokens: max output tokens (number, optional)

Only include chat/text generation models. Skip embedding, image, audio, and fine-tuning models.
Return ONLY the JSON array, no markdown or explanation.`;

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
