import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://docs.heygen.com/reference/limits',
    displayName: 'HeyGen',
    requiresBrowser: true,
    fallbackUrls: ['https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained'],
  },
  fal: {
    url: 'https://fal.ai/models?category=avatar',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: [
      'https://fal.ai/models/fal-ai/heygen/avatar4/image-to-video',
      'https://fal.ai/models/fal-ai/heygen/avatar4/digital-twin',
    ],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  runway: {
    url: 'https://docs.dev.runwayml.com/guides/pricing/',
    displayName: 'Runway',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.dev.runwayml.com/guides/models/'],
    browserOptions: { waitMs: 5000, scrollToBottom: true },
  },
  replicate: {
    url: 'https://replicate.com/collections/text-to-video',
    displayName: 'Replicate',
    requiresBrowser: true,
    fallbackUrls: [
      'https://replicate.com/veed/fabric-1.0',
      'https://replicate.com/cjwbw/sadtalker',
      'https://replicate.com/devxpy/cog-wav2lip',
      'https://replicate.com/chenxwh/video-retalking',
      'https://replicate.com/bytedance/dreamactor-m2.0',
    ],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
};
