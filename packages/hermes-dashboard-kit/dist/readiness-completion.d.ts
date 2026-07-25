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
}
export declare function buildHermesReadinessCompletionAssessment(): ReadinessCompletionAssessment;
//# sourceMappingURL=readiness-completion.d.ts.map