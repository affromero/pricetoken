import type { ProviderConfig } from './providers';

export const TTS_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    url: 'https://developers.openai.com/api/docs/pricing',
    displayName: 'OpenAI',
    requiresBrowser: false,
  },
  'google-cloud': {
    url: 'https://cloud.google.com/text-to-speech/pricing',
    displayName: 'Google Cloud',
    requiresBrowser: false,
  },
  amazon: {
    url: 'https://aws.amazon.com/polly/pricing/',
    displayName: 'Amazon Polly',
    requiresBrowser: false,
  },
  azure: {
    url: 'https://azure.microsoft.com/en-us/pricing/details/speech/',
    displayName: 'Microsoft Azure',
    requiresBrowser: false,
  },
  elevenlabs: {
    url: 'https://elevenlabs.io/pricing/api',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
  },
  playht: {
    url: 'https://play.ht/pricing/',
    displayName: 'PlayHT',
    requiresBrowser: true,
  },
  deepgram: {
    url: 'https://deepgram.com/pricing',
    displayName: 'Deepgram',
    requiresBrowser: true,
  },
};
