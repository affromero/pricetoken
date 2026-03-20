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
  /** Plain-text pricing info used when all scraping attempts return 0 models (e.g. heavy SPAs). */
  staticFallbackText?: string;
}

export const VIDEO_PROVIDERS: Record<string, ProviderConfig> = {
  runway: {
    url: 'https://runwayml.com/pricing',
    displayName: 'Runway',
    requiresBrowser: true,
    fallbackUrls: ['https://help.runwayml.com/hc/en-us/articles/credits-pricing', 'https://docs.runwayml.com/docs/api-pricing'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  sora: { url: 'https://developers.openai.com/api/docs/pricing', displayName: 'Sora (OpenAI)' },
  veo: { url: 'https://ai.google.dev/gemini-api/docs/pricing', displayName: 'Google Veo' },
  pika: {
    url: 'https://pika.art/pricing',
    displayName: 'Pika',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  kling: {
    url: 'https://klingai.com/pricing',
    displayName: 'Kling',
    requiresBrowser: true,
    fallbackUrls: [
      'https://klingai.com/global/developer',
      'https://docs.klingai.com/api/pricing',
      'https://platform.klingai.com/pricing',
    ],
    browserOptions: { waitMs: 10000, scrollToBottom: true },
  },
  luma: {
    url: 'https://lumalabs.ai/api/pricing',
    displayName: 'Luma',
    fallbackUrls: ['https://docs.lumalabs.ai/docs/api/pricing'],
  },
  minimax: {
    url: 'https://platform.minimax.io/docs/guides/pricing-paygo',
    displayName: 'MiniMax (Hailuo)',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  seedance: {
    url: 'https://www.byteplus.com/en/product/seedance',
    displayName: 'Seedance (ByteDance)',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
    fallbackUrls: ['https://www.volcengine.com/product/doubao'],
  },
  fal: {
    url: 'https://fal.ai/models?category=video-generation',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: [
      'https://fal.ai/models/fal-ai/kling-video/v3/standard/text-to-video',
      'https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video',
      'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
      'https://fal.ai/models/fal-ai/kling-video/v2.6/pro/image-to-video',
      'https://fal.ai/models/fal-ai/sora-2/text-to-video',
      'https://fal.ai/models/fal-ai/sora-2/text-to-video/pro',
      'https://fal.ai/models/fal-ai/veo3',
      'https://fal.ai/models/fal-ai/veo3/fast',
      'https://fal.ai/models/fal-ai/cosmos-predict-2.5/text-to-video',
      'https://fal.ai/models/fal-ai/ltx-2.3/text-to-video',
      'https://fal.ai/models/fal-ai/ltx-2/text-to-video',
      'https://fal.ai/models/fal-ai/ovi',
      'https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video',
      'https://fal.ai/models/fal-ai/wan-25-preview/text-to-video',
      'https://fal.ai/models/fal-ai/hunyuan-video',
      'https://fal.ai/models/fal-ai/hunyuan-video-v1.5/text-to-video',
      'https://fal.ai/models/fal-ai/bytedance/seedance/v1/pro/image-to-video',
      'https://fal.ai/models/fal-ai/vidu/q3/text-to-video/turbo',
      'https://fal.ai/models/fal-ai/pixverse/v5/text-to-video',
      'https://fal.ai/models/fal-ai/cogvideox-5b',
      'https://fal.ai/models/fal-ai/stable-video',
      'https://fal.ai/models/fal-ai/magi',
    ],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  ltx: {
    url: 'https://docs.ltx.video/pricing',
    displayName: 'LTX (Lightricks)',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  xai: {
    url: 'https://docs.x.ai/developers/models',
    displayName: 'xAI',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  replicate: {
    url: 'https://replicate.com/collections/text-to-video',
    displayName: 'Replicate',
    requiresBrowser: true,
    fallbackUrls: [
      'https://replicate.com/pricing',
      'https://replicate.com/collections/image-to-video',
    ],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
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
