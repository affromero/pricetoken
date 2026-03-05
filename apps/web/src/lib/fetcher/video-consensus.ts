import type { ExtractedVideoModel } from './video-extractor';
import type {
  AgentVerification,
  PriorConsistencyFlag,
} from './verification-types';
import type { VerifiedVideoModel, VideoVerificationResult } from './video-verification-types';
import { shouldApprove } from './consensus';

export function buildVideoConsensus(
  models: ExtractedVideoModel[],
  agentResults: AgentVerification[],
  priorFlags: PriorConsistencyFlag[]
): VideoVerificationResult {
  const approved: VerifiedVideoModel[] = [];
  const flagged: VerifiedVideoModel[] = [];
  const totalAgents = agentResults.length;
  const priorFlagsByModel = groupFlagsByModel(priorFlags);

  for (const model of models) {
    const { approvals, rejections } = countVotes(model.modelId, agentResults);
    const modelPriorFlags = priorFlagsByModel.get(model.modelId) ?? [];
    const hasPriceChangeFlag = modelPriorFlags.some((f) => f.type === 'price_change');
    const isApproved = shouldApprove(approvals, rejections, totalAgents, hasPriceChangeFlag);

    const verified: VerifiedVideoModel = {
      ...model,
      verificationStatus: isApproved ? 'approved' : 'flagged',
      agentApprovals: approvals,
      agentRejections: rejections,
      priorFlags: modelPriorFlags,
    };

    if (isApproved) {
      approved.push(verified);
    } else {
      flagged.push(verified);
    }
  }

  return { approved, flagged, agentResults, priorFlags };
}

function countVotes(
  modelId: string,
  agentResults: AgentVerification[]
): { approvals: number; rejections: number } {
  let approvals = 0;
  let rejections = 0;

  for (const agent of agentResults) {
    const verdict = agent.verdicts.find((v) => v.modelId === modelId);
    if (verdict) {
      if (verdict.approved) {
        approvals++;
      } else {
        rejections++;
      }
    }
  }

  return { approvals, rejections };
}

function groupFlagsByModel(
  flags: PriorConsistencyFlag[]
): Map<string, PriorConsistencyFlag[]> {
  const map = new Map<string, PriorConsistencyFlag[]>();
  for (const flag of flags) {
    const existing = map.get(flag.modelId);
    if (existing) {
      existing.push(flag);
    } else {
      map.set(flag.modelId, [flag]);
    }
  }
  return map;
}
