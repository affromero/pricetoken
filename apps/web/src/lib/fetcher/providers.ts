export interface BrowserFetchOptions {
  /** Post-load wait in ms (default: 5000) */
  waitMs?: number;
  /** Scroll to bottom to trigger lazy-loaded content (default: false) */
  scrollToBottom?: boolean;
  /** CSS selector to wait for before extracting (e.g. for React SPAs) */
  waitForSelector?: string;
}

export interface ProviderConfig {
  url: string;
  displayName: string;
  fallbackUrls?: string[];
  requiresBrowser?: boolean;
  browserOptions?: BrowserFetchOptions;
}

export const VIDEO_PROVIDERS: Record<string, ProviderConfig> = {
  runway: {
    url: 'https://runwayml.com/pricing',
    displayName: 'Runway',
    requiresBrowser: true,
    fallbackUrls: ['https://help.runwayml.com/hc/en-us/articles/credits-pricing'],
  },
  sora: { url: 'https://developers.openai.com/api/docs/pricing', displayName: 'Sora (OpenAI)' },
  veo: { url: 'https://ai.google.dev/gemini-api/docs/pricing', displayName: 'Google Veo' },
  pika: { url: 'https://pika.art/pricing', displayName: 'Pika', requiresBrowser: true },
  kling: {
    url: 'https://klingai.com/pricing',
    displayName: 'Kling',
    requiresBrowser: true,
    fallbackUrls: ['https://klingai.com/global/developer'],
  },
  luma: {
    url: 'https://lumalabs.ai/api/pricing',
    displayName: 'Luma',
    fallbackUrls: ['https://docs.lumalabs.ai/docs/api/pricing'],
  },
  minimax: { url: 'https://platform.minimax.io/docs/guides/pricing-paygo', displayName: 'MiniMax (Hailuo)', requiresBrowser: true },
  seedance: { url: 'https://www.byteplus.com/en/product/seedance', displayName: 'Seedance (ByteDance)', requiresBrowser: true },
  fal: { url: 'https://fal.ai/pricing', displayName: 'FAL', requiresBrowser: true },
  ltx: { url: 'https://docs.ltx.video/pricing', displayName: 'LTX (Lightricks)', requiresBrowser: true },
};

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
    requiresBrowser: true,
  },
  qwen: {
    url: 'https://help.aliyun.com/zh/model-studio/getting-started/models',
    displayName: 'Qwen',
  },
  cohere: {
    url: 'https://cohere.com/pricing',
    displayName: 'Cohere',
    requiresBrowser: true,
  },
  ai21: {
    url: 'https://www.ai21.com/pricing',
    displayName: 'AI21',
    requiresBrowser: true,
  },
};
