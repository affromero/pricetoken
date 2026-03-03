import Anthropic from '@anthropic-ai/sdk';

export interface ExtractionUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ExtractionResult {
  content: string;
  usage: ExtractionUsage;
}

interface ModelInfo {
  id: string;
  name: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

interface ProviderConfig {
  displayName: string;
  envKey: string;
  models: ModelInfo[];
  extract: (
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string
  ) => Promise<ExtractionResult>;
}

export const EXTRACTION_PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    displayName: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        costPer1kInput: 0.001,
        costPer1kOutput: 0.005,
      },
    ],
    extract: async (apiKey, model, systemPrompt, userPrompt) => {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        content: text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    },
  },
  openai: {
    displayName: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    models: [
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        costPer1kInput: 0.0004,
        costPer1kOutput: 0.0016,
      },
    ],
    extract: async (apiKey, model, systemPrompt, userPrompt) => {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
      });

      return {
        content: response.choices[0]?.message.content ?? '',
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
      };
    },
  },
  google: {
    displayName: 'Google',
    envKey: 'GOOGLE_AI_API_KEY',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0035,
      },
    ],
    extract: async (apiKey, model, systemPrompt, userPrompt) => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });

      const result = await genModel.generateContent(userPrompt);
      const response = result.response;

      return {
        content: response.text(),
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    },
  },
};

export function getModelCosts(
  provider: string,
  model: string
): { costPer1kInput: number; costPer1kOutput: number } {
  const p = EXTRACTION_PROVIDERS[provider];
  const m = p?.models.find((m) => m.id === model);
  return m ?? { costPer1kInput: 0, costPer1kOutput: 0 };
}
