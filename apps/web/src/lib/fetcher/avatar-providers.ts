import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained',
    displayName: 'HeyGen',
    requiresBrowser: false,
    fallbackUrls: ['https://docs.heygen.com/reference/limits'],
  },
};
