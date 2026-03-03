import type { ExtractedModel } from './extractor';

export interface ModelVerdict {
  modelId: string;
  approved: boolean;
  reason?: string;
}

export interface AgentVerification {
  agentProvider: string;
  agentModel: string;
  verdicts: ModelVerdict[];
  usage: { inputTokens: number; outputTokens: number };
}

export type PriorFlagType = 'price_change' | 'new_model' | 'disappeared_model' | 'context_change';

export interface PriorConsistencyFlag {
  modelId: string;
  type: PriorFlagType;
  detail: string;
}

export type VerificationStatus = 'approved' | 'flagged';

export interface VerifiedModel extends ExtractedModel {
  status: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface VerificationResult {
  approved: VerifiedModel[];
  flagged: VerifiedModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
