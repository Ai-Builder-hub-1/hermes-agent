import type { DashboardOperationalStatus } from "./contracts";
export type ReadinessCompletionKind = "local-complete" | "local-buildable" | "downstream-needed" | "external-blocked";
export interface ReadinessCompletionArea {
    id: string;
    label: string;
    ownerProjectId: string;
    status: DashboardOperationalStatus;
    kind: ReadinessCompletionKind;
    previousPercent: number;
    currentPercent: number;
    targetPercent: number;
    evidence: string[];
    remainingLocalWork: string[];
    externalBlockers: string[];
}
export interface ReadinessCompletionAssessment {
    id: string;
    generatedAt: string;
    previousOverallPercent: number;
    currentOverallPercent: number;
    localSurfacePercent: number;
    externalIntegrationPercent: number;
    summary: string;
    completedLocalCapabilities: string[];
    nextLocalBuildQueue: string[];
    externalBlockers: string[];
    downstreamProjectWork: string[];
    areas: ReadinessCompletionArea[];
    projectFeedAdapters: ProjectFeedAdapterReadiness[];
    actionGates: CommandCenterActionGate[];
    productionEvidence: ProductionEvidenceReadiness[];
    humanIntegrationChecklist: HumanIntegrationChecklistItem[];
}
export type ProjectFeedState = "ready" | "manual-sample" | "stubbed" | "blocked";
export type ActionGateState = "ready" | "approval-required" | "blocked";
export type EvidenceState = "available" | "planned" | "blocked" | "stale";
export interface ProjectFeedAdapterReadiness {
    id: string;
    projectId: string;
    projectName: string;
    role: "enterprise" | "technical-control" | "business-unit" | "shared-capability";
    state: ProjectFeedState;
    expectedContract: string;
    source: string;
    confidence: "high" | "medium" | "low";
    nextStep: string;
    blocker?: string;
}
export interface CommandCenterActionGate {
    id: string;
    label: string;
    category: "build" | "deploy" | "cost" | "incident" | "agent" | "governance";
    state: ActionGateState;
    risk: "low" | "medium" | "high" | "critical";
    canAutoPrepare: boolean;
    requiresHumanApproval: boolean;
    commandTarget: string;
    nextStep: string;
}
export interface ProductionEvidenceReadiness {
    id: string;
    label: string;
    environment: "local" | "production" | "provider" | "cross-project";
    state: EvidenceState;
    currentEvidence: string;
    requiredEvidence: string;
    nextStep: string;
}
export interface HumanIntegrationChecklistItem {
    id: string;
    label: string;
    owner: "human-coceo" | "tlc-capital-group-os" | "project-owner";
    priority: "critical" | "high" | "medium";
    destination: string;
    requiredValues: string[];
    unlocks: string[];
}
export declare function buildHermesReadinessCompletionAssessment(): ReadinessCompletionAssessment;
//# sourceMappingURL=readiness-completion.d.ts.map