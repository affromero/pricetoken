import type { ExtractedSttModel } from './stt-extractor';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedSttModel extends ExtractedSttModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface SttVerificationResult {
  approved: VerifiedSttModel[];
  flagged: VerifiedSttModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
