import type { ExtractedMusicModel } from './music-extractor';
import type { ModelVerdict, AgentVerification, PriorConsistencyFlag } from './verification-types';
import type { VerificationStatus } from './verification-types';

export type { ModelVerdict, AgentVerification, PriorConsistencyFlag };

export interface VerifiedMusicModel extends ExtractedMusicModel {
  verificationStatus: VerificationStatus;
  agentApprovals: number;
  agentRejections: number;
  priorFlags: PriorConsistencyFlag[];
}

export interface MusicVerificationResult {
  approved: VerifiedMusicModel[];
  flagged: VerifiedMusicModel[];
  agentResults: AgentVerification[];
  priorFlags: PriorConsistencyFlag[];
}
