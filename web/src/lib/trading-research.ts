import { fetchJSON } from "@/lib/api";
import type { WarehouseWindow } from "@/lib/system-warehouse";

export type TradingResearchHealth = "ready" | "warning" | "critical" | "watch" | "blocked" | string;

export interface TradingResearchSeries {
  generatedAt: string;
  window: WarehouseWindow;
  historyStatus: string;
  points: Array<Record<string, number | string>>;
}

export interface StrategySummary {
  contractVersion: string;
  generatedAt: string;
  health: TradingResearchHealth;
  summary: {
    candidates: number;
    ready: number;
    watch: number;
    blocked: number;
    sourceProjects: number;
  };
  candidates: Array<{
    id: string;
    sourceProject: string;
    hypothesis: string;
    status: TradingResearchHealth;
    expectedEdge: string;
    falsificationCriteria: string;
    evidenceCount: number;
    winRate: number | null;
    expectancy: number | null;
    maxDrawdown: number | null;
    promotionGate: string;
  }>;
  sourceCoverage: Array<{
    projectId: string;
    label: string;
    available: boolean;
    status: string;
    blockers: string[];
  }>;
  recommendations: string[];
  blockers: string[];
}

export interface StrategyLifecycleSummary {
  contractVersion: string;
  generatedAt: string;
  health: TradingResearchHealth;
  summary: {
    strategies: number;
    ready: number;
    review: number;
    blocked: number;
    promotionCandidates: number;
    active: number;
    retired: number;
  };
  stages: Array<{
    id: string;
    label: string;
    count: number;
    blocked: number;
  }>;
  strategies: Array<{
    id: string;
    strategyId: string;
    sourceProject: string;
    hypothesis: string;
    stage: string;
    state: TradingResearchHealth;
    evidenceCount: number;
    backtestStatus: string;
    promotionGate: string;
    winRate: number | null;
    expectancy: number | null;
    maxDrawdown: number | null;
    datasetWindow: string;
    falsificationCriteria: string;
    blockers: string[];
    nextActions: string[];
    liveTradingLocked: boolean;
  }>;
  blockers: string[];
  recommendations: string[];
}

export interface BacktestingSummary {
  contractVersion: string;
  generatedAt: string;
  health: TradingResearchHealth;
  summary: {
    runs: number;
    passed: number;
    review: number;
    blocked: number;
  };
  runs: Array<{
    id: string;
    strategyId: string;
    sourceProject: string;
    datasetWindow: string;
    status: string;
    assumptions: string[];
    trades: number;
    winRate: number | null;
    expectancy: number | null;
    maxDrawdown: number | null;
    failure: string;
    promotionGate: string;
  }>;
  comparison: { bestCandidate: string; coverage: string };
  blockers: string[];
  recommendations: string[];
}

export interface TradingEvidenceLedger {
  contractVersion: string;
  generatedAt: string;
  health: TradingResearchHealth;
  summary: {
    records: number;
    sourceEvents: number;
    strategies: number;
    backtests: number;
    missingProofHashes: number;
  };
  records: Array<{
    id: string;
    kind: string;
    sourceProject: string;
    subject: string;
    status: string;
    occurredAt: string;
    proofHash: string;
    artifact: string;
    detail: string;
  }>;
  blockers: string[];
  recommendations: string[];
}

export interface OutcomeLearningSummary {
  contractVersion: string;
  generatedAt: string;
  health: TradingResearchHealth;
  summary: {
    strategies: number;
    backtestRuns: number;
    passedBacktests: number;
    evidenceRecords: number;
    missingProofHashes: number;
    reliabilityScore: number;
    calibration: "ready" | "watch" | "blocked" | string;
  };
  signals: Array<{ id: string; status: string; detail: string }>;
  researchTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    evidence: string[];
    nextAction: string;
    liveTradingLocked: boolean;
  }>;
  blockers: string[];
  recommendations: string[];
}

export interface StrategySnapshot {
  summary: StrategySummary;
  series: TradingResearchSeries;
  lifecycle: StrategyLifecycleSummary;
}

export interface BacktestingSnapshot {
  summary: BacktestingSummary;
  series: TradingResearchSeries;
}

export interface TradingEvidenceSnapshot {
  ledger: TradingEvidenceLedger;
  series: TradingResearchSeries;
  outcome: OutcomeLearningSummary;
}

export async function fetchStrategySnapshot(window: WarehouseWindow = "24h"): Promise<StrategySnapshot> {
  const [summary, series, lifecycle] = await Promise.all([
    fetchJSON<StrategySummary>("/api/trading-research/strategies/summary"),
    fetchJSON<TradingResearchSeries>(`/api/trading-research/strategies/series?window=${encodeURIComponent(window)}`),
    fetchJSON<StrategyLifecycleSummary>("/api/trading-research/strategies/lifecycle"),
  ]);
  return { summary, series, lifecycle };
}

export async function fetchBacktestingSnapshot(window: WarehouseWindow = "24h"): Promise<BacktestingSnapshot> {
  const [summary, series] = await Promise.all([
    fetchJSON<BacktestingSummary>("/api/trading-research/backtesting/summary"),
    fetchJSON<TradingResearchSeries>(`/api/trading-research/backtesting/series?window=${encodeURIComponent(window)}`),
  ]);
  return { summary, series };
}

export async function fetchTradingEvidenceSnapshot(window: WarehouseWindow = "24h"): Promise<TradingEvidenceSnapshot> {
  const [ledger, series, outcome] = await Promise.all([
    fetchJSON<TradingEvidenceLedger>("/api/trading-research/evidence/ledger"),
    fetchJSON<TradingResearchSeries>(`/api/trading-research/evidence/series?window=${encodeURIComponent(window)}`),
    fetchJSON<OutcomeLearningSummary>("/api/trading-research/outcomes/summary"),
  ]);
  return { ledger, series, outcome };
}

export function runStrategyReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/trading-research/strategies/review", { method: "POST" });
}

export function runBacktestReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/trading-research/backtesting/review", { method: "POST" });
}

export function runTradingEvidenceReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/trading-research/evidence/review", { method: "POST" });
}

export function runOutcomeLearningReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/trading-research/outcomes/review", { method: "POST" });
}

export function tradingResearchTone(health: string): "success" | "warning" | "critical" | "info" {
  if (health === "ready" || health === "passed") return "success";
  if (health === "critical" || health === "blocked" || health === "failed") return "critical";
  if (health === "warning" || health === "watch" || health === "review" || health === "waiting_for_data") return "warning";
  return "info";
}
