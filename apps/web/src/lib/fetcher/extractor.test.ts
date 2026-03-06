import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExtract = vi.fn();

vi.mock('@/lib/usage-logger', () => ({
  logUsage: vi.fn(),
}));

vi.mock('./ai-registry', () => ({
  EXTRACTION_PROVIDERS: {
    anthropic: {
      displayName: 'Anthropic',
      envKey: 'ANTHROPIC_API_KEY',
      models: [{ id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', costPer1kInput: 0.001, costPer1kOutput: 0.005 }],
      extract: (...args: unknown[]) => mockExtract(...args),
    },
    openai: {
      displayName: 'OpenAI',
      envKey: 'OPENAI_API_KEY',
      models: [{ id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', costPer1kInput: 0.0004, costPer1kOutput: 0.0016 }],
      extract: (...args: unknown[]) => mockExtract(...args),
    },
    'claude-code': {
      displayName: 'Claude Code (Max)',
      envKey: 'CLAUDE_CODE_ENABLED',
      models: [{ id: 'sonnet', name: 'Claude Sonnet (via CLI)', costPer1kInput: 0, costPer1kOutput: 0 }],
      extract: (...args: unknown[]) => mockExtract(...args),
    },
  },
  getModelCosts: vi.fn().mockReturnValue({ costPer1kInput: 0.001, costPer1kOutput: 0.005 }),
}));

vi.mock('@/lib/fetcher-config', () => ({
  getFetcherConfig: vi.fn().mockResolvedValue({
    id: 'singleton',
    extractionProvider: 'anthropic',
    extractionModel: 'claude-haiku-4-5-20251001',
    verificationAgents: [],
    maxTextLength: 8000,
    enabled: true,
    updatedAt: new Date(),
  }),
}));

import { extractPricing } from './extractor';
import { getFetcherConfig } from '@/lib/fetcher-config';

describe('extractPricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  it('parses valid JSON response', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8 },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.modelId).toBe('gpt-4.1');
    expect(result.usage.inputTokens).toBe(100);
    expect(result.provider).toBe('anthropic');
  });

  it('returns empty models array for non-array response', async () => {
    mockExtract.mockResolvedValue({
      content: '{"not": "an array"}',
      usage: { inputTokens: 50, outputTokens: 20 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(0);
  });

  it('returns empty models array for malformed JSON', async () => {
    mockExtract.mockResolvedValue({
      content: 'not valid json at all',
      usage: { inputTokens: 50, outputTokens: 20 },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it('filters out entries missing required fields', async () => {
    const mockData = [
      { modelId: 'valid', displayName: 'Valid', inputPerMTok: 1, outputPerMTok: 2 },
      { modelId: 'missing-price', displayName: 'Bad' },
      { displayName: 'No ID', inputPerMTok: 1, outputPerMTok: 2 },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockData),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.modelId).toBe('valid');
  });

  it('throws when API key is missing for selected provider', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(extractPricing('openai', 'text')).rejects.toThrow('ANTHROPIC_API_KEY');
  });

  it('uses configured extraction provider', async () => {
    vi.mocked(getFetcherConfig).mockResolvedValue({
      id: 'singleton',
      extractionProvider: 'openai',
      extractionModel: 'gpt-4.1-mini',
      verificationAgents: [],
      maxTextLength: 8000,
      enabled: true,
      updatedAt: new Date(),
    });

    mockExtract.mockResolvedValue({
      content: JSON.stringify([{ modelId: 'test', displayName: 'Test', inputPerMTok: 1, outputPerMTok: 2 }]),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('anthropic', 'some page text');
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4.1-mini');
  });

  it('truncates page text to maxTextLength', async () => {
    vi.mocked(getFetcherConfig).mockResolvedValue({
      id: 'singleton',
      extractionProvider: 'anthropic',
      extractionModel: 'claude-haiku-4-5-20251001',
      verificationAgents: [],
      maxTextLength: 50,
      enabled: true,
      updatedAt: new Date(),
    });

    mockExtract.mockResolvedValue({
      content: '[]',
      usage: { inputTokens: 10, outputTokens: 5 },
    });

    await extractPricing('openai', 'x'.repeat(1000));

    const userPrompt = mockExtract.mock.calls[0]![3] as string;
    // The truncated text portion should be 50 chars, not 1000
    expect(userPrompt).toContain('x'.repeat(50));
    expect(userPrompt).not.toContain('x'.repeat(51));
  });

  it('extracts status field when present', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, status: 'active' },
      { modelId: 'gpt-3.5', displayName: 'GPT-3.5', inputPerMTok: 0.5, outputPerMTok: 1.5, status: 'deprecated' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(2);
    expect(result.models[0]!.status).toBe('active');
    expect(result.models[1]!.status).toBe('deprecated');
  });

  it('strips invalid status values', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, status: 'unknown' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models[0]!.status).toBeUndefined();
  });

  it('extracts launchDate when present', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, launchDate: '2025-04-14' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models[0]!.launchDate).toBe('2025-04-14');
  });

  it('strips invalid launchDate format', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, launchDate: 'April 2025' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models[0]!.launchDate).toBeUndefined();
  });

  it('handles missing status gracefully', async () => {
    const mockModels = [
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8 },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractPricing('openai', 'some page text');
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.status).toBeUndefined();
  });

  it('throws descriptive error when extraction fails', async () => {
    mockExtract.mockRejectedValue(new Error('API rate limited'));

    await expect(extractPricing('openai', 'text')).rejects.toThrow(
      'Extraction failed with anthropic/claude-haiku-4-5-20251001: API rate limited'
    );
  });

  it('uses claude-code provider when configured', async () => {
    process.env.CLAUDE_CODE_ENABLED = 'true';
    vi.mocked(getFetcherConfig).mockResolvedValue({
      id: 'singleton',
      extractionProvider: 'claude-code',
      extractionModel: 'sonnet',
      verificationAgents: [],
      maxTextLength: 8000,
      enabled: true,
      updatedAt: new Date(),
    });

    mockExtract.mockResolvedValue({
      content: JSON.stringify([{ modelId: 'test', displayName: 'Test', inputPerMTok: 1, outputPerMTok: 2 }]),
      usage: { inputTokens: 0, outputTokens: 0 },
    });

    const result = await extractPricing('anthropic', 'some page text');
    expect(result.provider).toBe('claude-code');
    expect(result.model).toBe('sonnet');
    expect(result.usage.inputTokens).toBe(0);
    expect(result.usage.outputTokens).toBe(0);
  });

  it('throws when CLAUDE_CODE_ENABLED is not set', async () => {
    delete process.env.CLAUDE_CODE_ENABLED;
    vi.mocked(getFetcherConfig).mockResolvedValue({
      id: 'singleton',
      extractionProvider: 'claude-code',
      extractionModel: 'sonnet',
      verificationAgents: [],
      maxTextLength: 8000,
      enabled: true,
      updatedAt: new Date(),
    });

    await expect(extractPricing('openai', 'text')).rejects.toThrow('CLAUDE_CODE_ENABLED');
  });
});
