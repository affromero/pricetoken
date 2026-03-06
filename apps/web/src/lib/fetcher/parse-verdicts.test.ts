import { describe, it, expect } from 'vitest';
import { extractJson, parseVerdicts } from './parse-verdicts';

describe('extractJson', () => {
  it('extracts fenced JSON', () => {
    const input = '```json\n[{"a":1}]\n```';
    expect(extractJson(input)).toBe('[{"a":1}]');
  });

  it('extracts array from surrounding text', () => {
    const input = 'Here are the results:\n[{"a":1}]\nDone.';
    expect(extractJson(input)).toBe('[{"a":1}]');
  });

  it('returns truncated array when no closing bracket', () => {
    const input = 'Results:\n[{"a":1},{"b":2';
    expect(extractJson(input)).toBe('[{"a":1},{"b":2');
  });

  it('returns trimmed text when no array found', () => {
    expect(extractJson('  hello  ')).toBe('hello');
  });
});

describe('parseVerdicts', () => {
  it('parses valid JSON array', () => {
    const input = '[{"modelId":"a","approved":true},{"modelId":"b","approved":false}]';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ modelId: 'a', approved: true });
    expect(result[1]).toEqual({ modelId: 'b', approved: false });
  });

  it('parses fenced JSON', () => {
    const input = '```json\n[{"modelId":"a","approved":true}]\n```';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(1);
    expect(result[0]!.modelId).toBe('a');
  });

  it('extracts complete objects from truncated array', () => {
    const input = '[{"modelId":"a","approved":true},{"modelId":"b","approved":false},{"modelId":"c","approved":tr';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(2);
    expect(result[0]!.modelId).toBe('a');
    expect(result[1]!.modelId).toBe('b');
  });

  it('handles truncated array with reason fields', () => {
    const input = '[{"modelId":"a","approved":true,"reason":"matches"},{"modelId":"b","approved":false,"reason":"Raw text shows cont';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(1);
    expect(result[0]!.modelId).toBe('a');
  });

  it('returns empty array when no complete objects exist', () => {
    const input = '[{"modelId":"a","approved":tr';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for non-array JSON', () => {
    const input = '{"modelId":"a","approved":true}';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(0);
  });

  it('filters out invalid objects from valid array', () => {
    const input = '[{"modelId":"a","approved":true},{"invalid":true},{"modelId":"b","approved":false}]';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for completely invalid input', () => {
    const result = parseVerdicts('not json at all');
    expect(result).toHaveLength(0);
  });

  it('handles JSON with surrounding prose', () => {
    const input = 'Here are my verdicts:\n[{"modelId":"x","approved":true}]\nLet me know if you need more.';
    const result = parseVerdicts(input);
    expect(result).toHaveLength(1);
    expect(result[0]!.modelId).toBe('x');
  });
});
