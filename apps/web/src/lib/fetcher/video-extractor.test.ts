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

import { extractVideoPricing } from './video-extractor';
import { getFetcherConfig } from '@/lib/fetcher-config';

describe('extractVideoPricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('parses valid JSON response with video models', async () => {
    const mockModels = [
      { modelId: 'runway-gen4-720p', displayName: 'Runway Gen-4 720p', costPerMinute: 7.2, resolution: '720p', maxDuration: 10 },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.modelId).toBe('runway-gen4-720p');
    expect(result.models[0]!.costPerMinute).toBe(7.2);
    expect(result.usage.inputTokens).toBe(100);
  });

  it('returns empty models array for non-array response', async () => {
    mockExtract.mockResolvedValue({
      content: '{"not": "an array"}',
      usage: { inputTokens: 50, outputTokens: 20 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models).toHaveLength(0);
  });

  it('returns empty models array for malformed JSON', async () => {
    mockExtract.mockResolvedValue({
      content: 'not valid json at all',
      usage: { inputTokens: 50, outputTokens: 20 },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it('filters out entries missing required fields', async () => {
    const mockData = [
      { modelId: 'valid', displayName: 'Valid', costPerMinute: 7.2 },
      { modelId: 'missing-price', displayName: 'Bad' },
      { displayName: 'No ID', costPerMinute: 5 },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockData),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.modelId).toBe('valid');
  });

  it('throws when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(extractVideoPricing('runway', 'text')).rejects.toThrow('ANTHROPIC_API_KEY');
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

    await extractVideoPricing('runway', 'x'.repeat(1000));

    const userPrompt = mockExtract.mock.calls[0]![3] as string;
    expect(userPrompt).toContain('x'.repeat(50));
    expect(userPrompt).not.toContain('x'.repeat(51));
  });

  it('extracts launchDate when present', async () => {
    const mockModels = [
      { modelId: 'runway-gen4-720p', displayName: 'Gen-4', costPerMinute: 7.2, launchDate: '2025-03-31' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models[0]!.launchDate).toBe('2025-03-31');
  });

  it('strips invalid launchDate format', async () => {
    const mockModels = [
      { modelId: 'runway-gen4-720p', displayName: 'Gen-4', costPerMinute: 7.2, launchDate: 'March 2025' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models[0]!.launchDate).toBeUndefined();
  });

  it('strips invalid status values', async () => {
    const mockModels = [
      { modelId: 'runway-gen4-720p', displayName: 'Gen-4', costPerMinute: 7.2, status: 'unknown' },
    ];

    mockExtract.mockResolvedValue({
      content: JSON.stringify(mockModels),
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const result = await extractVideoPricing('runway', 'some page text');
    expect(result.models[0]!.status).toBeUndefined();
  });

  it('throws descriptive error when extraction fails', async () => {
    mockExtract.mockRejectedValue(new Error('API rate limited'));

    await expect(extractVideoPricing('runway', 'text')).rejects.toThrow(
      'Video extraction failed with anthropic/claude-haiku-4-5-20251001: API rate limited'
    );
  });
});
