import type { DashboardOperationalStatus } from "./contracts";
export type ExecutiveReportPeriod = "24h" | "7d" | "30d" | "90d" | "quarter" | "ad_hoc";
export type ExecutiveReportRole = "tlc_coceo" | "business_unit_coceo" | "cmo" | "cto_operator" | "cfo_cost" | "research_lead" | "product_lead" | "chief_of_staff";
export type ExecutiveReportConfidence = "high" | "medium" | "low" | "unknown";
export type ExecutiveDecisionRisk = "low" | "medium" | "high" | "critical";
export interface ExecutiveEvidenceRef {
    id: string;
    label: string;
    kind: "dashboard" | "report" | "metric" | "incident" | "deployment" | "artifact" | "cost_record" | "source" | "manual_note";
    href?: string;
    sourceProjectId?: string;
    freshness?: "fresh" | "aging" | "stale" | "unknown";
    confidence?: ExecutiveReportConfidence;
}
export interface ExecutiveMetricRef {
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    trend?: "up" | "down" | "flat" | "unknown";
    status?: DashboardOperationalStatus;
    evidenceIds?: string[];
}
export interface ExecutiveDecisionRequest {
    id: string;
    title: string;
    owner: string;
    risk: ExecutiveDecisionRisk;
    requestedByRole: ExecutiveReportRole;
    summary: string;
    recommendation: string;
    approvalRequired: boolean;
    dueAt?: string;
    evidenceIds?: string[];
}
export interface OfficerReportContract {
    id: string;
    businessUnitId: string;
    role: ExecutiveReportRole;
    roleLabel: string;
    period: ExecutiveReportPeriod;
    status: DashboardOperationalStatus;
    summary: string;
    wins: string[];
    blockers: string[];
    risks: string[];
    recommendedActions: string[];
    metrics: ExecutiveMetricRef[];
    decisionsNeeded: ExecutiveDecisionRequest[];
    evidence: ExecutiveEvidenceRef[];
    confidence: ExecutiveReportConfidence;
    generatedAt: string;
}
export interface BusinessUnitReportContract {
    id: string;
    businessUnitId: string;
    businessUnitName: string;
    period: ExecutiveReportPeriod;
    status: DashboardOperationalStatus;
    readinessPercent?: number;
    summary: string;
    coceoRead: string;
    currentFocus: string[];
    blockers: string[];
    risks: string[];
    costPosture: "healthy" | "watch" | "unknown" | "over_budget";
    revenuePosture: "known" | "pending" | "unknown" | "not_applicable";
    officerReports: OfficerReportContract[];
    decisionsNeeded: ExecutiveDecisionRequest[];
    evidence: ExecutiveEvidenceRef[];
    generatedAt: string;
}
export interface ExecutiveBriefingContract {
    id: string;
    organizationId: string;
    organizationName: string;
    period: ExecutiveReportPeriod;
    status: DashboardOperationalStatus;
    summary: string;
    whatChanged: string[];
    topPriorities: string[];
    decisionsNeeded: ExecutiveDecisionRequest[];
    businessUnits: BusinessUnitReportContract[];
    evidence: ExecutiveEvidenceRef[];
    generatedAt: string;
}
export declare function reportStatusRank(status: DashboardOperationalStatus): number;
export declare function worstReportStatus(statuses: DashboardOperationalStatus[]): DashboardOperationalStatus;
export declare function aggregateExecutiveBriefingStatus(briefing: ExecutiveBriefingContract): DashboardOperationalStatus;
export declare function executiveDecisionQueue(briefing: ExecutiveBriefingContract): ExecutiveDecisionRequest[];
export declare function decisionRiskRank(risk: ExecutiveDecisionRisk): number;
//# sourceMappingURL=executive-reports.d.ts.map