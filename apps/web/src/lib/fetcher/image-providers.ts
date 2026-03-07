export interface ImageProviderConfig {
  url: string;
  displayName: string;
  fallbackUrls?: string[];
  requiresBrowser?: boolean;
}

export const IMAGE_PRICING_PROVIDERS: Record<string, ImageProviderConfig> = {
  openai: {
    url: 'https://developers.openai.com/api/docs/pricing',
    displayName: 'OpenAI',
  },
  google: {
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    displayName: 'Google',
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
  recraft: {
    url: 'https://www.recraft.ai/docs/api-reference/pricing',
    displayName: 'Recraft',
  },
  bytedance: {
    url: 'https://www.byteplus.com/en/product/seedream',
    displayName: 'Bytedance',
    requiresBrowser: true,
    fallbackUrls: ['https://www.volcengine.com/product/doubao'],
  },
  fal: {
    url: 'https://fal.ai/pricing',
    displayName: 'fal.ai',
    requiresBrowser: true,
    fallbackUrls: ['https://fal.ai/models?category=image-generation'],
  },
  ideogram: {
    url: 'https://docs.ideogram.ai/plans-and-pricing/available-plans',
    displayName: 'Ideogram',
    fallbackUrls: ['https://docs.ideogram.ai/api-reference/generate'],
  },
  xai: {
    url: 'https://docs.x.ai/docs/models',
    displayName: 'xAI',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.x.ai/docs/api-reference#image-generation'],
  },
};
