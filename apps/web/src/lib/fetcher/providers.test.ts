import { describe, it, expect } from 'vitest';
import { PRICING_PROVIDERS } from './providers';

describe('PRICING_PROVIDERS', () => {
  it('exports configs for all 3 providers', () => {
    expect(Object.keys(PRICING_PROVIDERS)).toEqual(
      expect.arrayContaining(['openai', 'anthropic', 'google'])
    );
    expect(Object.keys(PRICING_PROVIDERS)).toHaveLength(3);
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
});
