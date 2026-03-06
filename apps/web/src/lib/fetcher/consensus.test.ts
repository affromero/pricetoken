import { describe, it, expect } from 'vitest';
import { buildConsensus, shouldApprove } from './consensus';
import type { AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { ExtractedModel } from './extractor';

function makeModel(id: string): ExtractedModel {
  return {
    modelId: id,
    displayName: id,
    inputPerMTok: 1,
    outputPerMTok: 2,
  };
}

function makeAgent(
  provider: string,
  verdicts: Array<{ modelId: string; approved: boolean }>
): AgentVerification {
  return {
    agentProvider: provider,
    agentModel: `${provider}-model`,
    verdicts: verdicts.map((v) => ({ ...v })),
    usage: { inputTokens: 100, outputTokens: 50 },
  };
}

describe('shouldApprove', () => {
  it('approves with 2/3 agents agreeing', () => {
    expect(shouldApprove(2, 1, 3, false)).toBe(true);
  });

  it('approves with 3/3 agents agreeing', () => {
    expect(shouldApprove(3, 0, 3, false)).toBe(true);
  });

  it('rejects with 1/3 agents agreeing', () => {
    expect(shouldApprove(1, 2, 3, false)).toBe(false);
  });

  it('rejects with 0/3 agents agreeing', () => {
    expect(shouldApprove(0, 3, 3, false)).toBe(false);
  });

  it('approves when price_change flag is present with unanimous approval', () => {
    expect(shouldApprove(3, 0, 3, true)).toBe(true);
  });

  it('rejects when price_change flag is present without unanimous approval', () => {
    expect(shouldApprove(2, 1, 3, true)).toBe(false);
  });

  it('rejects when price_change flag is present with no agents', () => {
    expect(shouldApprove(0, 0, 0, true)).toBe(false);
  });

  it('requires all agents when fewer than 3 (2/2)', () => {
    expect(shouldApprove(2, 0, 2, false)).toBe(true);
    expect(shouldApprove(1, 1, 2, false)).toBe(false);
  });

  it('requires all agents when only 1 (1/1)', () => {
    expect(shouldApprove(1, 0, 1, false)).toBe(true);
    expect(shouldApprove(0, 1, 1, false)).toBe(false);
  });

  it('rejects when no agents available', () => {
    expect(shouldApprove(0, 0, 0, false)).toBe(false);
  });
});

describe('buildConsensus', () => {
  it('approves models with 2/3 agent approval and no price flags', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('openai', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('google', [{ modelId: 'gpt-4.1', approved: false }]),
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.approved).toHaveLength(1);
    expect(result.flagged).toHaveLength(0);
    expect(result.approved[0]!.agentApprovals).toBe(2);
    expect(result.approved[0]!.agentRejections).toBe(1);
  });

  it('flags models with majority rejection', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: false }]),
      makeAgent('openai', [{ modelId: 'gpt-4.1', approved: false }]),
      makeAgent('google', [{ modelId: 'gpt-4.1', approved: true }]),
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.approved).toHaveLength(0);
    expect(result.flagged).toHaveLength(1);
  });

  it('approves models with price_change flag when all agents unanimously approve', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('openai', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('google', [{ modelId: 'gpt-4.1', approved: true }]),
    ];
    const flags: PriorConsistencyFlag[] = [
      { modelId: 'gpt-4.1', type: 'price_change', detail: 'Price changed >50%' },
    ];

    const result = buildConsensus(models, agents, flags);
    expect(result.approved).toHaveLength(1);
    expect(result.flagged).toHaveLength(0);
    expect(result.approved[0]!.priorFlags).toHaveLength(1);
  });

  it('flags models with price_change flag when agents disagree', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('openai', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('google', [{ modelId: 'gpt-4.1', approved: false }]),
    ];
    const flags: PriorConsistencyFlag[] = [
      { modelId: 'gpt-4.1', type: 'price_change', detail: 'Price changed >50%' },
    ];

    const result = buildConsensus(models, agents, flags);
    expect(result.approved).toHaveLength(0);
    expect(result.flagged).toHaveLength(1);
  });

  it('does NOT block new_model flags', () => {
    const models = [makeModel('new-model')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'new-model', approved: true }]),
      makeAgent('openai', [{ modelId: 'new-model', approved: true }]),
      makeAgent('google', [{ modelId: 'new-model', approved: true }]),
    ];
    const flags: PriorConsistencyFlag[] = [
      { modelId: 'new-model', type: 'new_model', detail: 'New model' },
    ];

    const result = buildConsensus(models, agents, flags);
    expect(result.approved).toHaveLength(1);
    expect(result.flagged).toHaveLength(0);
  });

  it('handles multiple models with mixed results', () => {
    const models = [makeModel('model-a'), makeModel('model-b')];
    const agents = [
      makeAgent('anthropic', [
        { modelId: 'model-a', approved: true },
        { modelId: 'model-b', approved: false },
      ]),
      makeAgent('openai', [
        { modelId: 'model-a', approved: true },
        { modelId: 'model-b', approved: false },
      ]),
      makeAgent('google', [
        { modelId: 'model-a', approved: true },
        { modelId: 'model-b', approved: true },
      ]),
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.approved).toHaveLength(1);
    expect(result.approved[0]!.modelId).toBe('model-a');
    expect(result.flagged).toHaveLength(1);
    expect(result.flagged[0]!.modelId).toBe('model-b');
  });

  it('handles empty agent results by flagging all models', () => {
    const models = [makeModel('gpt-4.1')];
    const result = buildConsensus(models, [], []);
    expect(result.approved).toHaveLength(0);
    expect(result.flagged).toHaveLength(1);
  });

  it('handles agent that did not vote on a model (counts only voting agents)', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('openai', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('google', []), // no verdict — abstention, not rejection
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.approved).toHaveLength(1);
    expect(result.approved[0]!.agentApprovals).toBe(2);
  });

  it('approves when only 1 of 3 agents returns a verdict and approves', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: true }]),
      makeAgent('openai', []), // truncated output
      makeAgent('google', []), // truncated output
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.approved).toHaveLength(1);
  });

  it('flags when only 1 of 3 agents returns a verdict and rejects', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', [{ modelId: 'gpt-4.1', approved: false }]),
      makeAgent('openai', []),
      makeAgent('google', []),
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.flagged).toHaveLength(1);
  });

  it('flags when no agent returns a verdict for a model', () => {
    const models = [makeModel('gpt-4.1')];
    const agents = [
      makeAgent('anthropic', []),
      makeAgent('openai', []),
      makeAgent('google', []),
    ];

    const result = buildConsensus(models, agents, []);
    expect(result.flagged).toHaveLength(1);
  });
});
