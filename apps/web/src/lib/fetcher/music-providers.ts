import type { ProviderConfig } from './providers';

export const MUSIC_PROVIDERS: Record<string, ProviderConfig> = {
  elevenlabs: {
    url: 'https://elevenlabs.io/pricing',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
  },
  soundverse: {
    url: 'https://www.soundverse.ai/pricing',
    displayName: 'Soundverse',
    requiresBrowser: true,
  },
  sunoapi: {
    url: 'https://sunoapi.org/billing',
    displayName: 'SunoAPI.org',
    requiresBrowser: true,
  },
};
