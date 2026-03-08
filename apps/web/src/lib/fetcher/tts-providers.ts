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
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  elevenlabs: {
    url: 'https://elevenlabs.io/pricing',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
    fallbackUrls: ['https://elevenlabs.io/pricing/api'],
    browserOptions: { waitMs: 15000, scrollToBottom: true, waitForSelector: 'table, [class*=Plan], [class*=plan], [class*=tier], [role=table]' },
  },
  playht: {
    url: 'https://play.ht/pricing/',
    displayName: 'PlayHT',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.play.ht/reference/pricing', 'https://play.ht/studio/pricing'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  deepgram: {
    url: 'https://deepgram.com/pricing',
    displayName: 'Deepgram',
    requiresBrowser: true,
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  fal: {
    url: 'https://fal.ai/pricing',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: ['https://fal.ai/models?category=text-to-speech'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  cartesia: {
    url: 'https://cartesia.ai/pricing',
    displayName: 'Cartesia',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.cartesia.ai/build-with-cartesia/pricing'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
};
