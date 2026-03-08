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
    browserOptions: { waitMs: 8000, scrollToBottom: true },
    fallbackUrls: ['https://developers.deepgram.com/docs/pricing'],
  },
  assemblyai: {
    url: 'https://www.assemblyai.com/pricing',
    displayName: 'AssemblyAI',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  'google-cloud': {
    url: 'https://cloud.google.com/speech-to-text/pricing',
    displayName: 'Google Cloud',
    requiresBrowser: false,
  },
  azure: {
    url: 'https://azure.microsoft.com/en-us/pricing/details/speech/',
    displayName: 'Microsoft Azure',
    requiresBrowser: true,
    fallbackUrls: ['https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  elevenlabs: {
    url: 'https://elevenlabs.io/pricing',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
    fallbackUrls: ['https://elevenlabs.io/pricing/api'],
    browserOptions: { waitMs: 15000, scrollToBottom: true, waitForSelector: 'table, [class*=Plan], [class*=plan], [class*=tier], [role=table]' },
  },
  cartesia: {
    url: 'https://cartesia.ai/pricing',
    displayName: 'Cartesia',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.cartesia.ai/build-with-cartesia/pricing'],
  },
};
