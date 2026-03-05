export interface ProviderConfig {
  url: string;
  displayName: string;
  fallbackUrls?: string[];
  requiresBrowser?: boolean;
}

export const PRICING_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    url: 'https://developers.openai.com/api/docs/pricing',
    displayName: 'OpenAI',
    fallbackUrls: ['https://developers.openai.com/api/docs/models'],
  },
  anthropic: {
    url: 'https://platform.claude.com/docs/en/docs/about-claude/models',
    displayName: 'Anthropic',
    fallbackUrls: ['https://docs.anthropic.com/en/docs/about-claude/models'],
  },
  google: {
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    displayName: 'Google',
    fallbackUrls: ['https://cloud.google.com/vertex-ai/generative-ai/pricing'],
  },
  deepseek: {
    url: 'https://api-docs.deepseek.com/quick_start/pricing',
    displayName: 'DeepSeek',
  },
  xai: {
    url: 'https://docs.x.ai/docs/models',
    displayName: 'xAI',
  },
  mistral: {
    url: 'https://mistral.ai/pricing',
    displayName: 'Mistral',
    requiresBrowser: true,
  },
  qwen: {
    url: 'https://help.aliyun.com/zh/model-studio/getting-started/models',
    displayName: 'Qwen',
  },
  cohere: {
    url: 'https://cohere.com/pricing',
    displayName: 'Cohere',
  },
  ai21: {
    url: 'https://www.ai21.com/pricing',
    displayName: 'AI21',
  },
  amazon: {
    url: 'https://aws.amazon.com/bedrock/pricing/',
    displayName: 'Amazon',
  },
};
