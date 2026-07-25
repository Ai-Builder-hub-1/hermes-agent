import type { DashboardOperationalStatus, DashboardSnapshotContract } from "./contracts";
export type CapacityTimeWindow = "3d" | "7d" | "14d" | "30d" | "90d";
export interface CapacityCommandCenterTrendPoint {
    window: CapacityTimeWindow;
    tokensIn: number;
    tokensOut: number;
    estimatedCostUsd: number;
    apiCalls: number;
    storageGb: number;
    successfulOutputs: number;
}
export interface CapacityCommandCenterBreakdown {
    id: string;
    label: string;
    owner: string;
    tokensIn: number;
    tokensOut: number;
    estimatedCostUsd?: number;
    revenueUsd?: number;
    apiCalls?: number;
    storageGb?: number;
    status: DashboardOperationalStatus;
    trend?: "up" | "down" | "flat" | "unknown";
    dataTrust?: "live" | "estimated" | "partial" | "missing";
}
export interface CapacityCommandCenterInput {
    id?: string;
    generatedAt: string;
    businessUnits: CapacityCommandCenterBreakdown[];
    providers: CapacityCommandCenterBreakdown[];
    workflows: CapacityCommandCenterBreakdown[];
    trends: CapacityCommandCenterTrendPoint[];
    budgetUsd?: number;
    budgetUsedUsd?: number;
    lastRefreshAt?: string;
    missingFeeds?: string[];
}
export declare function buildCapacityCommandCenterSnapshot(input: CapacityCommandCenterInput): DashboardSnapshotContract;
export declare function buildSampleCapacityCommandCenterSnapshot(generatedAt?: string): DashboardSnapshotContract;
//# sourceMappingURL=capacity-command-center.d.ts.map