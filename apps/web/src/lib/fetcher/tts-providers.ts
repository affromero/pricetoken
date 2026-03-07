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
    requiresBrowser: true,
    fallbackUrls: ['https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech'],
  },
  elevenlabs: {
    url: 'https://elevenlabs.io/pricing/api',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
    fallbackUrls: ['https://elevenlabs.io/docs/overview/pricing'],
  },
  playht: {
    url: 'https://play.ht/pricing/',
    displayName: 'PlayHT',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.play.ht/reference/pricing'],
  },
  deepgram: {
    url: 'https://deepgram.com/pricing',
    displayName: 'Deepgram',
    requiresBrowser: true,
  },
  fal: {
    url: 'https://fal.ai/pricing',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: ['https://fal.ai/models?category=text-to-speech'],
  },
  cartesia: {
    url: 'https://cartesia.ai/pricing',
    displayName: 'Cartesia',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.cartesia.ai/build-with-cartesia/pricing'],
  },
};
