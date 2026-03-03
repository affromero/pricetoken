export interface ProviderConfig {
  url: string;
  displayName: string;
}

export const PRICING_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    url: 'https://platform.openai.com/docs/pricing',
    displayName: 'OpenAI',
  },
  anthropic: {
    url: 'https://docs.anthropic.com/en/docs/about-claude/models',
    displayName: 'Anthropic',
  },
  google: {
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    displayName: 'Google',
  },
};
