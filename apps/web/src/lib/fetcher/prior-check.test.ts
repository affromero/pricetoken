import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQueryRaw = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

import { checkPriorConsistency } from './prior-check';
import type { ExtractedModel } from './extractor';

function makeModel(overrides: Partial<ExtractedModel> & { modelId: string }): ExtractedModel {
  return {
    displayName: overrides.modelId,
    inputPerMTok: 1,
    outputPerMTok: 2,
    ...overrides,
  };
}

describe('checkPriorConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no prior snapshots exist', async () => {
    mockQueryRaw.mockResolvedValue([]);
    const flags = await checkPriorConsistency('openai', [makeModel({ modelId: 'gpt-4.1' })]);
    expect(flags).toHaveLength(0);
  });

  it('flags new models not seen in prior snapshots', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 },
    ]);

    const models = [
      makeModel({ modelId: 'gpt-4.1', inputPerMTok: 2, outputPerMTok: 8 }),
      makeModel({ modelId: 'gpt-4.1-turbo', inputPerMTok: 1, outputPerMTok: 4 }),
    ];

    const flags = await checkPriorConsistency('openai', models);
    expect(flags).toContainEqual(
      expect.objectContaining({ modelId: 'gpt-4.1-turbo', type: 'new_model' })
    );
  });

  it('flags price changes exceeding 50%', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 },
    ]);

    const models = [makeModel({ modelId: 'gpt-4.1', inputPerMTok: 0.5, outputPerMTok: 8 })];
    const flags = await checkPriorConsistency('openai', models);
    expect(flags).toContainEqual(
      expect.objectContaining({ modelId: 'gpt-4.1', type: 'price_change' })
    );
  });

  it('does not flag price changes under 50%', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 },
    ]);

    const models = [makeModel({ modelId: 'gpt-4.1', inputPerMTok: 1.5, outputPerMTok: 7 })];
    const flags = await checkPriorConsistency('openai', models);
    const priceFlags = flags.filter((f) => f.type === 'price_change');
    expect(priceFlags).toHaveLength(0);
  });

  it('flags disappeared models', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 },
      { modelId: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini', inputPerMTok: 0.4, outputPerMTok: 1.6, contextWindow: 128000 },
    ]);

    const models = [makeModel({ modelId: 'gpt-4.1', inputPerMTok: 2, outputPerMTok: 8 })];
    const flags = await checkPriorConsistency('openai', models);
    expect(flags).toContainEqual(
      expect.objectContaining({ modelId: 'gpt-4.1-mini', type: 'disappeared_model' })
    );
  });

  it('flags context window changes', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 },
    ]);

    const models = [
      makeModel({ modelId: 'gpt-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 256000 }),
    ];
    const flags = await checkPriorConsistency('openai', models);
    expect(flags).toContainEqual(
      expect.objectContaining({ modelId: 'gpt-4.1', type: 'context_change' })
    );
  });

  it('does not flag context change when prior has no context window', async () => {
    mockQueryRaw.mockResolvedValue([
      { modelId: 'gpt-4.1', displayName: 'GPT-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: null },
    ]);

    const models = [
      makeModel({ modelId: 'gpt-4.1', inputPerMTok: 2, outputPerMTok: 8, contextWindow: 128000 }),
    ];
    const flags = await checkPriorConsistency('openai', models);
    const contextFlags = flags.filter((f) => f.type === 'context_change');
    expect(contextFlags).toHaveLength(0);
  });
});
