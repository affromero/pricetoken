import type { ProviderConfig } from './providers';

export const AVATAR_PROVIDERS: Record<string, ProviderConfig> = {
  heygen: {
    url: 'https://docs.heygen.com/reference/limits',
    displayName: 'HeyGen',
    requiresBrowser: false,
  },
};
