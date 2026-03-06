import type { ExtractedTtsModel } from './tts-extractor';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedTtsModel extends ExtractedTtsModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface TtsVerificationResult {
  approved: VerifiedTtsModel[];
  flagged: VerifiedTtsModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
