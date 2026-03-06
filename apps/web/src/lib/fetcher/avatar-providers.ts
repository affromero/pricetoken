import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://docs.heygen.com/reference/limits',
    displayName: 'HeyGen',
    requiresBrowser: true,
    fallbackUrls: ['https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained'],
  },
};
