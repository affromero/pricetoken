import type { ExtractedAvatarModel } from './avatar-extractor';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedAvatarModel extends ExtractedAvatarModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface AvatarVerificationResult {
  approved: VerifiedAvatarModel[];
  flagged: VerifiedAvatarModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
