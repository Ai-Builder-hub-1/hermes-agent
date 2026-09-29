import { fetchJSON } from "@/lib/api";

export type CompoundingHealth = "ready" | "warning" | "critical" | string;

export interface CompoundingProposal {
  id: string;
  type: string;
  title: string;
  priority: string;
  risk: string;
  confidence: string;
  evidence: string[];
  nextAction: string;
  sizing: string;
  policyAction: string;
  executionEnabled: boolean;
  liveTradingLocked: boolean;
  policy: {
    actionClass: string;
    risk: string;
    approval: string;
    proofRequired: string;
    rollbackRequired: boolean;
    liveEffect: boolean;
  };
  requiresApproval: boolean;
  status: string;
}

export interface CompoundingCommitteePacket {
  title: string;
  generatedAt: string;
  decisionMode: string;
  sections: Array<{
    id: string;
    health: string;
    summary: Record<string, unknown>;
  }>;
  proposals: string[];
  approvalRequired: boolean;
  executionEnabled: boolean;
  liveTradingLocked: boolean;
}

export interface CompoundingSummary {
  contractVersion: string;
  generatedAt: string;
  health: CompoundingHealth;
  summary: {
    proposals: number;
    blocked: number;
    requiresApproval: number;
    experiments: number;
    promotionReviews: number;
    demotionReviews: number;
    liveTradingLocked: boolean;
    executionEnabled: boolean;
  };
  proposals: CompoundingProposal[];
  committeePacket: CompoundingCommitteePacket;
  evidence: Record<string, {
    contractVersion?: string;
    health?: string;
    generatedAt?: string;
    summary?: Record<string, unknown>;
  }>;
  blockers: string[];
  recommendations: string[];
}

export function fetchCompoundingSummary(): Promise<CompoundingSummary> {
  return fetchJSON<CompoundingSummary>("/api/compounding-intelligence/summary");
}

export function runCompoundingReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/compounding-intelligence/review", { method: "POST" });
}
