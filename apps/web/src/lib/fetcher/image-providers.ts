export interface ImageProviderConfig {
  url: string;
  displayName: string;
  fallbackUrls?: string[];
  requiresBrowser?: boolean;
}

export const IMAGE_PRICING_PROVIDERS: Record<string, ImageProviderConfig> = {
  openai: {
    url: 'https://platform.openai.com/docs/guides/images',
    displayName: 'OpenAI',
    requiresBrowser: true,
  },
  google: {
    url: 'https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images',
    displayName: 'Google',
    requiresBrowser: true,
  },
  stability: {
    url: 'https://platform.stability.ai/pricing',
    displayName: 'Stability AI',
    requiresBrowser: true,
  },
  bfl: {
    url: 'https://docs.bfl.ml/quick_start/pricing',
    displayName: 'Black Forest Labs',
  },
  amazon: {
    url: 'https://aws.amazon.com/bedrock/pricing/',
    displayName: 'Amazon',
    requiresBrowser: true,
  },
  recraft: {
    url: 'https://www.recraft.ai/pricing',
    displayName: 'Recraft',
    requiresBrowser: true,
  },
  mistral: {
    url: 'https://mistral.ai/pricing',
    displayName: 'Mistral',
    requiresBrowser: true,
  },
  bytedance: {
    url: 'https://www.volcengine.com/product/doubao',
    displayName: 'Bytedance',
    requiresBrowser: true,
  },
  fal: {
    url: 'https://fal.ai/pricing',
    displayName: 'fal.ai',
    requiresBrowser: true,
  },
  ideogram: {
    url: 'https://ideogram.ai/pricing',
    displayName: 'Ideogram',
    requiresBrowser: true,
  },
  xai: {
    url: 'https://docs.x.ai/docs/models',
    displayName: 'xAI',
    requiresBrowser: true,
  },
};
