import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://docs.heygen.com/reference/limits',
    displayName: 'HeyGen',
    requiresBrowser: true,
    fallbackUrls: ['https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained'],
  },
  fal: {
    url: 'https://fal.ai/pricing',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: ['https://fal.ai/models?category=avatar'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
};
