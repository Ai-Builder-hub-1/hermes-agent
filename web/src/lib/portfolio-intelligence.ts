import { fetchJSON } from "@/lib/api";

export type PortfolioHealth = "ready" | "warning" | "critical" | string;

export interface PortfolioExposure {
  id: string;
  sourceProject: string;
  label: string;
  assetClass: string;
  coverage: string;
  capitalType: string;
  capitalSemantics: string;
  cashLeftUsd: number | null;
  buyingPowerUsd: number | null;
  knownValueUsd: number | null;
  openRiskUsd: number | null;
  netPnlUsd: number | null;
  openPositions: number;
  liveTradingLocked: boolean;
}

export interface AllocationRecommendation {
  id: string;
  title: string;
  priority: string;
  confidence: string;
  requiresApproval: boolean;
  liveTradingLocked: boolean;
}

export interface PortfolioIntelligenceSummary {
  contractVersion: string;
  generatedAt: string;
  health: PortfolioHealth;
  liveTradingLocked: boolean;
  summary: {
    capitalKnown: boolean;
    cashLeftUsd: number | null;
    buyingPowerUsd: number | null;
    realBrokerCashUsd: number | null;
    internalPaperBankrollUsd: number | null;
    openRiskUsd: number | null;
    riskAdjustedCashLeftUsd: number | null;
    knownExposureUsd: number | null;
    exposureCoverage: string;
    brokerCoverage: string;
    concentrationRisk: string;
    allocationPosture: string;
  };
  exposures: PortfolioExposure[];
  riskOffice: {
    status: string;
    liveTradingLocked: boolean;
    killSwitchStatus: string;
    dailyLossLimitStatus: string;
    weeklyLossLimitStatus: string;
    maxConcurrentExposureStatus: string;
    blockers: string[];
  };
  brokerCoverage: {
    status: string;
    brokers: number;
    configured: number;
    accountVisible: number;
    stale: number;
    liveSubmitEnabled: boolean;
  };
  concentration: {
    risk: string;
    largestSourceProject: string;
    largestShare: number | null;
  };
  allocationRecommendations: AllocationRecommendation[];
  dissentingEvidence: string[];
  sourceRoutes: Record<string, string>;
}

export function fetchPortfolioIntelligenceSummary(): Promise<PortfolioIntelligenceSummary> {
  return fetchJSON<PortfolioIntelligenceSummary>("/api/trading-intelligence/portfolio/summary");
}
