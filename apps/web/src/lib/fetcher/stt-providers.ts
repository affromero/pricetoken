import type { ProviderConfig } from './providers';

export const STT_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    url: 'https://developers.openai.com/api/docs/pricing',
    displayName: 'OpenAI',
    requiresBrowser: false,
  },
  deepgram: {
    url: 'https://deepgram.com/pricing',
    displayName: 'Deepgram',
    requiresBrowser: true,
  },
  assemblyai: {
    url: 'https://www.assemblyai.com/pricing',
    displayName: 'AssemblyAI',
    requiresBrowser: true,
  },
  'google-cloud': {
    url: 'https://cloud.google.com/speech-to-text/pricing',
    displayName: 'Google Cloud',
    requiresBrowser: false,
  },
  azure: {
    url: 'https://azure.microsoft.com/en-us/pricing/details/speech/',
    displayName: 'Microsoft Azure',
    requiresBrowser: false,
  },
};
