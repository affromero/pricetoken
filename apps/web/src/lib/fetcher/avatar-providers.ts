import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://heygen.com/api-pricing',
    displayName: 'HeyGen',
    requiresBrowser: true,
  },
};
