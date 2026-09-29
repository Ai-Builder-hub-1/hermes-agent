import { fetchJSON } from "@/lib/api";

const BASE = "/api/second-brain";

export interface BrainNode {
  id: string;
  type: string;
  title: string;
  summary: string;
  status: string;
  confidence?: number | null;
  source?: string | null;
  sourcePath?: string | null;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface BrainCandidate {
  id: string;
  sourceSystem: string;
  sourceType: string;
  suggestedType: string;
  title: string;
  summary: string;
  whyItMatters: string;
  status: string;
  promotionScore?: number | null;
  confidence?: number | null;
  policy?: {
    qualifies: boolean;
    approvalLevel: string;
    promotionScore: number;
    qualityScore: number;
    blockers: string[];
    reasons: string[];
    tags: string[];
    reviewAfter: string | null;
  };
}

export interface BrainAudit {
  generatedAt: string;
  counts: Record<string, number>;
  staleNodes: BrainNode[];
  contradictionEdges: Array<Record<string, unknown>>;
  candidatesNeedingReview: BrainCandidate[];
  coverage: Record<string, number>;
  findings: string[];
}

export interface SecondBrainSummary {
  contractVersion: string;
  generatedAt: string;
  health: {
    ok: boolean;
    repository: string;
    obsidian?: { configured: boolean; vaultRoot: string | null };
    warehouse?: { configured: boolean; warehouseRoot: string | null };
  };
  audit: BrainAudit;
  warehouse: {
    configured: boolean;
    warehouseRoot: string | null;
    events: Array<Record<string, unknown>>;
  };
}

export interface RestoreProof {
  ok: boolean;
  manifestHash: string | null;
  counts: Record<string, number>;
  findings: string[];
}

export interface CompoundingPhaseStatus {
  phase: number;
  id: string;
  title: string;
  goal: string;
  status: "ready" | "partial" | "blocked";
  score: number;
  evidence: string[];
  gaps: string[];
  nextActions: string[];
}

export interface CompoundingIntelligenceReport {
  generatedAt: string;
  maturityScore: number;
  status: "ready" | "partial" | "blocked";
  phases: CompoundingPhaseStatus[];
  sourceCoverage: Array<{
    sourceSystem: string;
    approvedNodes: number;
    pendingCandidates: number;
    openActions: number;
    status: "ready" | "partial" | "blocked";
  }>;
  retrievalReadiness: {
    activeNodes: number;
    citedNodes: number;
    graphLinkedNodes: number;
    actionableNodes: number;
  };
  operatingCadence: {
    staleNodes: number;
    pendingCandidates: number;
    contradictionEdges: number;
    openActions: number;
    lastWarehouseSyncAt: string | null;
  };
  findings: string[];
}

export interface MemoryRetrievalPack {
  generatedAt: string;
  query: string;
  context: Record<string, unknown>;
  nodes: Array<{
    node: BrainNode;
    reason: string;
    sources: number;
    outgoingEdges: number;
    incomingEdges: number;
  }>;
  actions: Array<Record<string, unknown>>;
  citations: string[];
  warnings: string[];
}

export interface EvidenceRef {
  sourceSystem: string;
  sourceType: string;
  sourceIdentifier: string;
  sourcePath?: string;
  sourceUrl?: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionAssumption {
  id: string;
  statement: string;
  confidence?: number | null;
  status: "active" | "changed" | "invalidated" | "unknown";
  evidenceRefs: EvidenceRef[];
  changedAt?: string | null;
  metadata: Record<string, unknown>;
}

export interface DecisionOutcome {
  status: "pending" | "on_track" | "off_track" | "succeeded" | "failed" | "unknown";
  summary: string;
  measuredAt?: string | null;
  evidenceRefs: EvidenceRef[];
  metadata: Record<string, unknown>;
}

export interface DecisionRecord {
  id: string;
  project: string;
  businessUnit: string;
  decisionType: string;
  title: string;
  summary: string;
  decidedAt: string;
  owner: string;
  status: string;
  riskClass: string;
  impactClass: string;
  sourceEvidenceRefs: EvidenceRef[];
  priorMemoryRefs: string[];
  assumptions: DecisionAssumption[];
  expectedOutcome: string;
  actualOutcome: DecisionOutcome | null;
  reviewState: string;
  stableWarehouseId: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface DecisionLineageEdge {
  id: string;
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  edgeType: string;
  confidence?: number | null;
  createdBy: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface DecisionLineageReport {
  decision: DecisionRecord;
  evidence: EvidenceRef[];
  priorMemories: BrainNode[];
  assumptions: DecisionAssumption[];
  outcome: DecisionOutcome | null;
  edges: DecisionLineageEdge[];
  whyBelieved: string[];
  whatChanged: string[];
  findings: string[];
}

export interface ContradictionRecord {
  id: string;
  type: string;
  severity: string;
  confidence: number;
  businessRisk: number;
  affectedProjects: string[];
  affectedDecisions: string[];
  conflictingNodeIds: string[];
  evidenceRefs: EvidenceRef[];
  summary: string;
  recommendedResolution: string;
  blocksHighImpactUse: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionReason?: string | null;
  auditTrail: Array<{
    action: string;
    actor: string;
    at: string;
    reason?: string | null;
    metadata: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
}

export interface ResearchTask {
  id: string;
  adapter: string;
  reason: string;
  sourceSystem: string;
  linkedMemoryId?: string | null;
  linkedDecisionId?: string | null;
  linkedContradictionId?: string | null;
  requiredEvidence: string[];
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  candidateId?: string | null;
  blocker?: string | null;
  evidenceRefs: EvidenceRef[];
  summary: string;
  metadata: Record<string, unknown>;
}

export async function fetchSecondBrainSummary(): Promise<SecondBrainSummary> {
  return fetchJSON<SecondBrainSummary>(`${BASE}/summary`);
}

export async function fetchSecondBrainCandidates(status?: string): Promise<{ candidates: BrainCandidate[] }> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJSON<{ candidates: BrainCandidate[] }>(`${BASE}/candidates${suffix}`);
}

export async function searchSecondBrain(q: string, includeStale = false): Promise<{ nodes: BrainNode[] }> {
  return fetchJSON<{ nodes: BrainNode[] }>(
    `${BASE}/search?q=${encodeURIComponent(q)}&includeStale=${includeStale ? "true" : "false"}`,
  );
}

export async function fetchCompoundingIntelligence(): Promise<CompoundingIntelligenceReport> {
  return fetchJSON<CompoundingIntelligenceReport>(`${BASE}/compounding-intelligence`);
}

export async function fetchMemoryRetrievalPack(params: {
  q: string;
  project?: string;
  businessUnit?: string;
  ticker?: string;
  strategy?: string;
  workflow?: string;
}): Promise<MemoryRetrievalPack> {
  const query = new URLSearchParams();
  query.set("q", params.q);
  for (const key of ["project", "businessUnit", "ticker", "strategy", "workflow"] as const) {
    if (params[key]) query.set(key, params[key]);
  }
  return fetchJSON<MemoryRetrievalPack>(`${BASE}/retrieval-pack?${query.toString()}`);
}

export async function fetchDecisionRecords(): Promise<{ decisions: DecisionRecord[] }> {
  return fetchJSON<{ decisions: DecisionRecord[] }>(`${BASE}/decisions`);
}

export async function fetchDecisionLineage(decisionId: string): Promise<DecisionLineageReport> {
  return fetchJSON<DecisionLineageReport>(`${BASE}/decisions/${encodeURIComponent(decisionId)}/lineage`);
}

export async function fetchContradictions(status?: string): Promise<{ contradictions: ContradictionRecord[] }> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJSON<{ contradictions: ContradictionRecord[] }>(`${BASE}/contradictions${suffix}`);
}

export async function detectContradictions(): Promise<{ contradictions: ContradictionRecord[] }> {
  return fetchJSON<{ contradictions: ContradictionRecord[] }>(`${BASE}/contradictions/detect`, { method: "POST" });
}

export async function fetchResearchTasks(status?: string): Promise<{ tasks: ResearchTask[] }> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJSON<{ tasks: ResearchTask[] }>(`${BASE}/research-tasks${suffix}`);
}

export async function generateResearchTasks(): Promise<{ tasks: ResearchTask[] }> {
  return fetchJSON<{ tasks: ResearchTask[] }>(`${BASE}/research-tasks/generate`, { method: "POST" });
}

export async function scanSecondBrainStaleness(): Promise<{ staleNodes: BrainNode[] }> {
  return fetchJSON<{ staleNodes: BrainNode[] }>(`${BASE}/staleness/scan`, { method: "POST" });
}

export async function syncSecondBrainWarehouse(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/warehouse/sync`, { method: "POST" });
}

export async function fetchSecondBrainRestoreProof(): Promise<RestoreProof> {
  return fetchJSON<RestoreProof>(`${BASE}/warehouse/restore-proof`);
}
