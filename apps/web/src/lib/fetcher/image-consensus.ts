import type { ExtractedImageModel } from './image-store';
import type {
  AgentVerification,
  PriorConsistencyFlag,
} from './verification-types';
import type { VerifiedImageModel, ImageVerificationResult } from './image-verification-types';
import { shouldApprove } from './consensus';

export function buildImageConsensus(
  models: ExtractedImageModel[],
  agentResults: AgentVerification[],
  priorFlags: PriorConsistencyFlag[]
): ImageVerificationResult {
  const approved: VerifiedImageModel[] = [];
  const flagged: VerifiedImageModel[] = [];
  const priorFlagsByModel = groupFlagsByModel(priorFlags);

  for (const model of models) {
    const { approvals, rejections, votingAgents } = countVotes(model.modelId, agentResults);
    const modelPriorFlags = priorFlagsByModel.get(model.modelId) ?? [];
    const hasPriceChangeFlag = modelPriorFlags.some((f) => f.type === 'price_change');
    const isApproved = shouldApprove(approvals, rejections, votingAgents, hasPriceChangeFlag);

    const verified: VerifiedImageModel = {
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
): { approvals: number; rejections: number; votingAgents: number } {
  let approvals = 0;
  let rejections = 0;
  let votingAgents = 0;

  for (const agent of agentResults) {
    const verdict = agent.verdicts.find((v) => v.modelId === modelId);
    if (verdict) {
      votingAgents++;
      if (verdict.approved) {
        approvals++;
      } else {
        rejections++;
      }
    }
  }

  return { approvals, rejections, votingAgents };
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
