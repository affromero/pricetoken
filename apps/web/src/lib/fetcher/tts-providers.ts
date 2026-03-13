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
    url: 'https://elevenlabs.io/pricing/api',
    displayName: 'ElevenLabs',
    requiresBrowser: true,
    fallbackUrls: [
      'https://elevenlabs.io/pricing',
      'https://elevenlabs.io/docs/overview/models',
    ],
    browserOptions: { waitMs: 20000, scrollToBottom: true, waitForSelector: '[class*=price], [class*=Price], [class*=cost], [class*=plan], [class*=Plan], [class*=tier], table, [role=table], [data-testid*=price]' },
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
    url: 'https://fal.ai/models?category=text-to-speech',
    displayName: 'FAL',
    requiresBrowser: true,
    fallbackUrls: [
      'https://fal.ai/models/fal-ai/kokoro/american-english',
      'https://fal.ai/models/fal-ai/dia-tts',
      'https://fal.ai/models/fal-ai/f5-tts',
      'https://fal.ai/models/fal-ai/orpheus-tts',
      'https://fal.ai/models/fal-ai/chatterbox/text-to-speech',
    ],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
  cartesia: {
    url: 'https://cartesia.ai/pricing',
    displayName: 'Cartesia',
    requiresBrowser: true,
    fallbackUrls: ['https://docs.cartesia.ai/build-with-cartesia/pricing'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
    staticFallbackText: [
      'Cartesia TTS API Pricing (from docs.cartesia.ai):',
      'Sonic-3: $0.029875 per 1,000 characters ($29.875 per 1,000,000 characters). Neural voice model, 42 languages supported.',
      'Sonic-Turbo: $0.029875 per 1,000 characters ($29.875 per 1,000,000 characters). Low-latency neural voice model.',
      'Both models are active and generally available.',
    ].join('\n'),
  },
  replicate: {
    url: 'https://replicate.com/inworld/tts-1.5-max',
    displayName: 'Replicate',
    requiresBrowser: true,
    fallbackUrls: ['https://replicate.com/inworld/tts-1.5-mini'],
    browserOptions: { waitMs: 8000, scrollToBottom: true },
  },
};
