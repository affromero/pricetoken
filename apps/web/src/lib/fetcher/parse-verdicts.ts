import type { ModelVerdict } from './verification-types';

export function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenced) return fenced[1]!.trim();
  const first = trimmed.indexOf('[');
  const last = trimmed.lastIndexOf(']');
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  if (first !== -1) return trimmed.slice(first);
  return trimmed;
}

export function parseVerdicts(text: string, label = 'verification'): ModelVerdict[] {
  const json = extractJson(text);
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return filterVerdicts(parsed);
  } catch {
    const objects: ModelVerdict[] = [];
    const objectPattern = /\{[^{}]*"modelId"\s*:\s*"[^"]+"\s*,[^{}]*"approved"\s*:\s*(true|false)[^{}]*\}/g;
    let match;
    while ((match = objectPattern.exec(json)) !== null) {
      try {
        const obj: unknown = JSON.parse(match[0]);
        if (isVerdict(obj)) objects.push(obj);
      } catch { /* skip malformed object */ }
    }
    if (objects.length === 0) {
      console.warn(`Failed to parse ${label} verdicts:`, text.slice(0, 200));
    }
    return objects;
  }
}

function isVerdict(v: unknown): v is ModelVerdict {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).modelId === 'string' &&
    typeof (v as Record<string, unknown>).approved === 'boolean'
  );
}

function filterVerdicts(arr: unknown[]): ModelVerdict[] {
  return arr.filter(isVerdict);
}
