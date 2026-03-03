import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

import { extractPricing } from './extractor';

describe('extractPricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('parses valid JSON response', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8 },
    ];

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockModels) }],
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result).toHaveLength(1);
    expect(result[0]!.modelId).toBe('gpt-4.1');
  });

  it('returns empty array for non-array response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"not": "an array"}' }],
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result).toHaveLength(0);
  });

  it('returns empty array for malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json at all' }],
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await extractPricing('openai', 'some page text');
    expect(result).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it('filters out entries missing required fields', async () => {
    const mockData = [
      { modelId: 'valid', displayName: 'Valid', inputPerMTok: 1, outputPerMTok: 2 },
      { modelId: 'missing-price', displayName: 'Bad' },
      { displayName: 'No ID', inputPerMTok: 1, outputPerMTok: 2 },
    ];

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockData) }],
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result).toHaveLength(1);
    expect(result[0]!.modelId).toBe('valid');
  });

  it('throws when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(extractPricing('openai', 'text')).rejects.toThrow('ANTHROPIC_API_KEY');
  });
});
