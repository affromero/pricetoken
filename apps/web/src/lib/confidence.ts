export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FreshnessInfo {
  lastVerified: string;
  ageHours: number;
  stale: boolean;
}

const SOURCE_PRIORS: Record<string, number> = {
  verified: 2.2,
  admin: 1.73,
  seed: 0.2,
  fetched: -0.41,
  carried: -1.1,
};

const STALE_THRESHOLD_HOURS = 48;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function agentLLR(approvals: number | null, total: number | null): number {
  if (approvals == null || total == null || total === 0) return 0;
  return (approvals / total - 0.5) * 3.0;
}

function ageLLR(createdAt: Date): number {
  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(-1.5, Math.min(1.0, 1.0 - ageDays / 7.0));
}

function stabilityLLR(priceUnchanged: boolean): number {
  return priceUnchanged ? 0.3 : -0.3;
}

export function computeConfidenceScore(params: {
  source: string;
  createdAt: Date;
  agentApprovals: number | null;
  agentTotal: number | null;
  priceUnchanged: boolean;
}): number {
  const prior = SOURCE_PRIORS[params.source] ?? SOURCE_PRIORS.fetched!;
  const logitScore =
    prior +
    agentLLR(params.agentApprovals, params.agentTotal) +
    ageLLR(params.createdAt) +
    stabilityLLR(params.priceUnchanged);

  return Math.round(sigmoid(logitScore) * 100);
}

export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function computeConfidenceReason(
  source: string,
  freshness: FreshnessInfo,
  confidenceLevel: ConfidenceLevel,
): string {
  if (confidenceLevel === 'high') return 'Price verified recently';
  const reasons: string[] = [];
  if (source === 'carried') reasons.push('Price carried forward from a previous day');
  else if (source === 'flagged') reasons.push('Price discrepancy detected during verification');
  else if (source === 'seed') reasons.push('Price from initial seed data, not yet verified');
  else if (source === 'fetched') reasons.push('Price extracted but not fully verified');
  if (freshness.stale) reasons.push('Data may be outdated');
  return reasons.join('. ') || 'Confidence could not be determined';
}

export function computeFreshness(createdAt: Date): FreshnessInfo {
  const ageMs = Date.now() - createdAt.getTime();
  const ageHours = Math.round(ageMs / (1000 * 60 * 60));
  return {
    lastVerified: createdAt.toISOString(),
    ageHours,
    stale: ageHours > STALE_THRESHOLD_HOURS,
  };
}
