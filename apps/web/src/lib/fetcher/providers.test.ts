import { describe, it, expect } from 'vitest';
import { PRICING_PROVIDERS, VIDEO_PROVIDERS } from './providers';

describe('PRICING_PROVIDERS', () => {
  it('exports configs for all 10 providers', () => {
    expect(Object.keys(PRICING_PROVIDERS)).toEqual(
      expect.arrayContaining(['openai', 'anthropic', 'google', 'deepseek', 'xai', 'mistral', 'qwen', 'cohere', 'ai21', 'amazon'])
    );
    expect(Object.keys(PRICING_PROVIDERS)).toHaveLength(10);
  });

  it('all URLs are valid HTTPS URLs', () => {
    for (const config of Object.values(PRICING_PROVIDERS)) {
      expect(config.url).toMatch(/^https:\/\//);
    }
  });

  it('all providers have display names', () => {
    for (const config of Object.values(PRICING_PROVIDERS)) {
      expect(config.displayName.length).toBeGreaterThan(0);
    }
  });

  it('uses the correct OpenAI developers URL', () => {
    expect(PRICING_PROVIDERS.openai!.url).toBe(
      'https://developers.openai.com/api/docs/pricing'
    );
  });

  it('uses the correct Anthropic platform URL', () => {
    expect(PRICING_PROVIDERS.anthropic!.url).toBe(
      'https://platform.claude.com/docs/en/docs/about-claude/models'
    );
  });

  it('uses the correct Google AI dev URL', () => {
    expect(PRICING_PROVIDERS.google!.url).toBe(
      'https://ai.google.dev/gemini-api/docs/pricing'
    );
  });

  it('uses the correct DeepSeek API docs URL', () => {
    expect(PRICING_PROVIDERS.deepseek!.url).toBe(
      'https://api-docs.deepseek.com/quick_start/pricing'
    );
  });

  it('fallback URLs are valid HTTPS URLs when present', () => {
    for (const config of Object.values(PRICING_PROVIDERS)) {
      if (config.fallbackUrls) {
        for (const url of config.fallbackUrls) {
          expect(url).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('openai, anthropic, and google have fallback URLs', () => {
    expect(PRICING_PROVIDERS.openai!.fallbackUrls?.length).toBeGreaterThan(0);
    expect(PRICING_PROVIDERS.anthropic!.fallbackUrls?.length).toBeGreaterThan(0);
    expect(PRICING_PROVIDERS.google!.fallbackUrls?.length).toBeGreaterThan(0);
  });

  it('deepseek, xai, and mistral have no fallback URLs', () => {
    expect(PRICING_PROVIDERS.deepseek!.fallbackUrls).toBeUndefined();
    expect(PRICING_PROVIDERS.xai!.fallbackUrls).toBeUndefined();
    expect(PRICING_PROVIDERS.mistral!.fallbackUrls).toBeUndefined();
  });

  it('uses the correct xAI docs URL', () => {
    expect(PRICING_PROVIDERS.xai!.url).toBe('https://docs.x.ai/docs/models');
  });

  it('uses the correct Mistral pricing URL', () => {
    expect(PRICING_PROVIDERS.mistral!.url).toBe('https://mistral.ai/pricing');
  });

  it('mistral requires browser scraping', () => {
    expect(PRICING_PROVIDERS.mistral!.requiresBrowser).toBe(true);
  });

  it('xai requires browser scraping', () => {
    expect(PRICING_PROVIDERS.xai!.requiresBrowser).toBe(true);
  });
});

describe('VIDEO_PROVIDERS', () => {
  it('exports configs for all 9 video providers', () => {
    expect(Object.keys(VIDEO_PROVIDERS)).toEqual(
      expect.arrayContaining(['runway', 'sora', 'veo', 'pika', 'kling', 'luma', 'minimax', 'seedance', 'fal'])
    );
    expect(Object.keys(VIDEO_PROVIDERS)).toHaveLength(9);
  });

  it('all URLs are valid HTTPS URLs', () => {
    for (const config of Object.values(VIDEO_PROVIDERS)) {
      expect(config.url).toMatch(/^https:\/\//);
    }
  });

  it('all providers have display names', () => {
    for (const config of Object.values(VIDEO_PROVIDERS)) {
      expect(config.displayName.length).toBeGreaterThan(0);
    }
  });

  it('veo does not require browser scraping', () => {
    expect(VIDEO_PROVIDERS.veo!.requiresBrowser).toBeUndefined();
  });

  it('most video providers require browser scraping', () => {
    const browserProviders = ['runway', 'sora', 'pika', 'kling', 'luma', 'minimax', 'seedance', 'fal'];
    for (const id of browserProviders) {
      expect(VIDEO_PROVIDERS[id]!.requiresBrowser).toBe(true);
    }
  });
});
