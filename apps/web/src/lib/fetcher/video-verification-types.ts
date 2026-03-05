import type { ExtractedVideoModel } from './video-extractor';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedVideoModel extends ExtractedVideoModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface VideoVerificationResult {
  approved: VerifiedVideoModel[];
  flagged: VerifiedVideoModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
