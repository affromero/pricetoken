import type { ExtractedModel } from './extractor';
import type {
  AgentVerification,
  PriorConsistencyFlag,
  VerifiedModel,
  VerificationResult,
} from './verification-types';

export function buildConsensus(
  models: ExtractedModel[],
  agentResults: AgentVerification[],
  priorFlags: PriorConsistencyFlag[]
): VerificationResult {
  const approved: VerifiedModel[] = [];
  const flagged: VerifiedModel[] = [];
  const totalAgents = agentResults.length;
  const priorFlagsByModel = groupFlagsByModel(priorFlags);

  for (const model of models) {
    const { approvals, rejections } = countVotes(model.modelId, agentResults);
    const modelPriorFlags = priorFlagsByModel.get(model.modelId) ?? [];
    const hasPriceChangeFlag = modelPriorFlags.some((f) => f.type === 'price_change');
    const isApproved = shouldApprove(approvals, rejections, totalAgents, hasPriceChangeFlag);

    const verified: VerifiedModel = {
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

export function shouldApprove(
  approvals: number,
  rejections: number,
  totalAgents: number,
  hasPriceChangeFlag: boolean
): boolean {
  // No agents available — cannot verify, flag for review
  if (totalAgents === 0) return false;

  // Price change requires strong majority (2/3) to confirm it's legitimate
  if (hasPriceChangeFlag) {
    if (totalAgents < 3) return rejections === 0 && approvals === totalAgents;
    return approvals >= Math.ceil((totalAgents * 2) / 3) && approvals > rejections;
  }

  // Require all remaining agents to agree if fewer than 3
  if (totalAgents < 3) return rejections === 0 && approvals === totalAgents;

  // Standard: 2/3 agents must approve
  return approvals >= 2 && approvals > rejections;
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
