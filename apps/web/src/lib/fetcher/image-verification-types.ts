import type { ExtractedImageModel } from './image-store';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedImageModel extends ExtractedImageModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface ImageVerificationResult {
  approved: VerifiedImageModel[];
  flagged: VerifiedImageModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
