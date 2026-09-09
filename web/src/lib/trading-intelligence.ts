/**
 * Trading Intelligence Control Plane — typed client.
 *
 * Contract source of truth is `hermes_cli/trading_intelligence.py`, which
 * aggregates two projects. Field names below follow the actual producers:
 *   investing-system : src/trading-desk/oanda.ts
 *   khashi-vc        : src/web/roc-api.ts
 *
 * Every request goes through `fetchJSON`, never bare `fetch`: it attaches the
 * `X-Hermes-Session-Token` header for the loopback path, sends cookies for the
 * gated path, and prefixes `window.__HERMES_BASE_PATH__` for reverse-proxy
 * deployments. A hand-rolled `fetch(..., {credentials: "same-origin"})` 401s
 * locally and 404s behind a prefix.
 */
import { fetchJSON } from "@/lib/api";

const BASE = "/api/trading-intelligence";

export const TRADING_INTELLIGENCE_CONTRACT = "trading-intelligence-control-plane.v1";

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

/** The four values the aggregator normalises to. `_normalize_project_status`
 *  passes unmatched source strings straight through, so this is a hint, not a
 *  closed union — always handle the `string` fallback. */
export type KnownStatus = "ready" | "watch" | "blocked" | "unavailable";
export type ProjectStatus = KnownStatus | (string & {});

export type TradingProjectId = "investing-system" | "khashi-vc" | (string & {});

export type KpiValue = number | string | boolean | null;

export interface TradingKpis {
  projectsAvailable: number;
  projectsTotal: number;
  openTrades: number | null;
  closedTrades: number | null;
  realizedPnlUsd: number | null;
  openRiskUsd: number | null;
  liveMarkets: number | null;
  strategyCandidates: number | null;
  liveTradingLocked: boolean;
  blockers: number;
}

export interface TradingProjectTab {
  id: string;
  label?: string;
  status?: ProjectStatus;
  sourceRoutes?: string[];
}

export interface TradingProjectSummary {
  projectId: TradingProjectId;
  label: string;
  sourceBaseUrl: string | null;
  available: boolean;
  httpStatus: number;
  /** Cumulative across base-URL fallback attempts — not a clean source RTT. */
  latencyMs: number;
  error: string | null;
  status: ProjectStatus;
  liveTradingLocked: boolean;
  kpis: Record<string, KpiValue>;
  tabs: TradingProjectTab[];
  blockers: string[];
  recommendations: string[];
  sourceRoutes: Record<string, string>;
  summary: unknown;
}

export interface TradingControlPlaneTab {
  id: string;
  label: string;
  status: ProjectStatus;
  projectIds: string[];
}

export interface TradingIntelligenceSummary {
  id: string;
  contractVersion: string;
  frontendContractVersion: string;
  title: string;
  generatedAt: string;
  status: ProjectStatus;
  liveTradingLocked: boolean;
  kpis: TradingKpis;
  projects: TradingProjectSummary[];
  tabs: TradingControlPlaneTab[];
  blockers: string[];
  recommendations: string[];
}

export type TradingEventSeverity = "info" | "warning" | "error" | "critical" | (string & {});

export interface TradingEvent {
  id: string;
  sourceProject: TradingProjectId;
  sourceSystem: string;
  stream: string;
  type: string;
  status: string;
  severity: TradingEventSeverity;
  title: string;
  occurredAt: string;
  instrument: string | null;
  summary: string;
  links: Record<string, string>;
  rawRef: Record<string, unknown>;
}

export interface TradingEventsResponse {
  id: string;
  contractVersion: string;
  title: string;
  generatedAt: string;
  limit: number;
  events: TradingEvent[];
}

/** Neither source publishes `riskLevel` or `requiresConfirmation` — both are
 *  derived here from the fields that ARE published. investing-system emits
 *  `dangerous`/`execution`/`effect`; khashi-vc emits `runbookCommand`/
 *  `requiresServiceRestart`/`brokerMutation`. */
export interface TradingControl {
  id: string;
  namespacedId: string;
  projectId: TradingProjectId;
  projectLabel: string;
  label: string;
  intent?: string;
  description?: string;
  runbookCommand?: string;
  execution?: string;
  effect?: string;
  dangerous?: boolean;
  brokerMutation?: boolean;
  liveTradingLocked?: boolean;
  requiresServiceRestart?: boolean;
  riskLevel?: string;
  requiresConfirmation?: boolean;
}

export interface TradingControlsResponse {
  id: string;
  contractVersion: string;
  title: string;
  generatedAt: string;
  safety: {
    liveTradingLocked: boolean;
    submitLiveOrderAvailable: boolean;
    projectOwnedControlsOnly: boolean;
    note: string;
  };
  projects: Array<{
    projectId: TradingProjectId;
    label: string;
    available: boolean;
    error: string | null;
    safety: Record<string, unknown>;
    controls: TradingControl[];
  }>;
  controls: TradingControl[];
}

export interface ControlRequest {
  action: string;
  execute?: boolean;
  reason?: string;
  actorId?: string;
  correlationId?: string;
}

export interface ControlResponse {
  id: string;
  contractVersion: string;
  generatedAt: string;
  status: "proxied" | "failed" | "rejected" | (string & {});
  projectId?: string;
  action?: string;
  httpStatus?: number;
  sourceBaseUrl?: string | null;
  error?: string | null;
  result?: unknown;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export function fetchTradingSummary(signal?: AbortSignal) {
  return fetchJSON<TradingIntelligenceSummary>(`${BASE}/summary`, { signal });
}

export function fetchTradingEvents(limit = 10, signal?: AbortSignal) {
  const bounded = Math.max(1, Math.min(50, Math.trunc(limit) || 10));
  return fetchJSON<TradingEventsResponse>(`${BASE}/events?limit=${bounded}`, { signal });
}

export function fetchTradingControls(signal?: AbortSignal) {
  return fetchJSON<TradingControlsResponse>(`${BASE}/controls`, { signal });
}

export function requestTradingControl(input: ControlRequest, signal?: AbortSignal) {
  return fetchJSON<ControlResponse>(`${BASE}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

/** Preview-first: the first request for any control is always execute:false. */
export function buildControlRequest(
  control: TradingControl,
  opts: { execute: boolean; reason: string },
): ControlRequest {
  return {
    action: control.namespacedId,
    execute: opts.execute,
    reason: opts.reason.trim() || undefined,
    actorId: "nous-dashboard-operator",
    correlationId: `ti-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

// ---------------------------------------------------------------------------
// Derivations — pure, unit-testable
// ---------------------------------------------------------------------------

export const NO_DATA = "No data";

export function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * `null` means the field is absent from the contract; `0` means the source
 * reported zero. They are different answers and must never render the same.
 */
export function formatCount(v: unknown): string {
  return isNum(v) ? v.toLocaleString("en-US") : NO_DATA;
}

export function formatCurrency(v: unknown): string {
  if (!isNum(v)) return NO_DATA;
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${v < 0 ? "−" : ""}$${abs}`;
}

export function formatPercent(v: unknown): string {
  return isNum(v) ? `${v.toFixed(1)}%` : NO_DATA;
}

export function formatRatio(a: unknown, b: unknown): string {
  return isNum(a) && isNum(b) ? `${a}/${b}` : NO_DATA;
}

/** Only signed P/L earns up/down colour. Risk and exposure stay neutral —
 *  green on "open risk $260" reads as good news, which it is not. */
export function isSignedPnlKey(key: string): boolean {
  return /pnl/i.test(key) && !/risk/i.test(key);
}

export type PnlDirection = "up" | "down" | "flat" | "none";

export function pnlDirection(v: unknown): PnlDirection {
  if (!isNum(v)) return "none";
  return v > 0 ? "up" : v < 0 ? "down" : "flat";
}

export function humanizeKpiKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\bPnl\b/gi, "P/L")
    .replace(/\bPct\b/gi, "%")
    .replace(/\bUsd\b/gi, "USD")
    .replace(/^./, (c) => c.toUpperCase());
}

export function statusTone(status: ProjectStatus): KnownStatus | "unknown" {
  const s = String(status);
  return s === "ready" || s === "watch" || s === "blocked" || s === "unavailable" ? s : "unknown";
}

/** §9: a source_unavailable event is critical even when the source's own
 *  severity field disagrees. */
export function eventSeverity(ev: Pick<TradingEvent, "type" | "severity">): TradingEventSeverity {
  return ev.type === "source_unavailable" ? "critical" : String(ev.severity || "info");
}

export function severityTone(sev: TradingEventSeverity): KnownStatus | "unknown" {
  const s = String(sev);
  if (s === "critical" || s === "error") return "blocked";
  if (s === "warning") return "watch";
  return "unknown";
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export function controlRiskLevel(c: TradingControl): RiskLevel {
  if (c.riskLevel === "low" || c.riskLevel === "medium" || c.riskLevel === "high" || c.riskLevel === "critical") {
    return c.riskLevel;
  }
  if (c.brokerMutation || c.id === "emergency_lock_trading") return "critical";
  if (c.dangerous || c.requiresServiceRestart) return "high";
  if (c.execution === "host_orchestrator_required" || c.execution === "runbook-required") return "medium";
  return "low";
}

export function riskTone(risk: RiskLevel): KnownStatus {
  return risk === "critical" || risk === "high" ? "blocked" : risk === "medium" ? "watch" : "ready";
}

export function controlRequiresConfirmation(c: TradingControl): boolean {
  if (typeof c.requiresConfirmation === "boolean") return c.requiresConfirmation;
  return controlRiskLevel(c) !== "low";
}

/**
 * §20: never assume a control executed. `status: "proxied"` only means Nous
 * reached the source — the source's own result still has to say it worked.
 */
export function controlExecutionSucceeded(res: ControlResponse): boolean {
  if (res.status !== "proxied") return false;
  const http = res.httpStatus ?? 0;
  if (http < 200 || http >= 300) return false;
  const result = res.result;
  if (!result || typeof result !== "object") return false;
  const status = (result as { status?: unknown }).status;
  return typeof status !== "string" || !["rejected", "failed", "error"].includes(status);
}

/** Data-freshness rule: a payload older than its poll window is stale, and
 *  the operator has to be told rather than shown numbers that have moved. */
export function isStale(generatedAt: string, maxAgeSeconds: number): boolean {
  const t = new Date(generatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return (Date.now() - t) / 1000 > maxAgeSeconds;
}

export const EVENT_FILTERS: Array<{ id: string; label: string; test: (e: TradingEvent) => boolean }> = [
  { id: "all", label: "All", test: () => true },
  { id: "investing-system", label: "Investing System", test: (e) => e.sourceProject === "investing-system" },
  { id: "khashi-vc", label: "Khashi VC", test: (e) => e.sourceProject === "khashi-vc" },
  { id: "warnings", label: "Warnings", test: (e) => eventSeverity(e) === "warning" },
  { id: "errors", label: "Errors", test: (e) => ["error", "critical"].includes(String(eventSeverity(e))) },
  { id: "trades", label: "Trades", test: (e) => /trade|execution|lifecycle|paper/i.test(`${e.stream} ${e.type}`) },
  { id: "controls", label: "Controls", test: (e) => /control/i.test(`${e.stream} ${e.type}`) },
  { id: "strategy", label: "Strategy", test: (e) => /strategy|exit|indicator|shadow/i.test(`${e.stream} ${e.type}`) },
  { id: "source-health", label: "Source Health", test: (e) => /source|health|freshness|collection/i.test(`${e.stream} ${e.type}`) },
];

/** The fleet ribbon, in the order §7 specifies. `note` names which source a
 *  figure can come from — several KPIs are published by only one project. */
export function fleetKpiCards(k: TradingKpis) {
  return [
    { key: "projectsAvailable", label: "Projects available", value: formatRatio(k.projectsAvailable, k.projectsTotal), tone: k.projectsAvailable === k.projectsTotal ? ("ready" as const) : ("blocked" as const), note: "sources reachable" },
    { key: "openTrades", label: "Open trades", value: formatCount(k.openTrades), note: "both systems" },
    { key: "closedTrades", label: "Closed / reviewed", value: formatCount(k.closedTrades), note: "closedTrades or reviewedTrades" },
    { key: "realizedPnlUsd", label: "Realized P/L", value: formatCurrency(k.realizedPnlUsd), pnl: k.realizedPnlUsd, note: "today, attributed" },
    { key: "openRiskUsd", label: "Open risk", value: formatCurrency(k.openRiskUsd), note: "khashi-vc only" },
    { key: "liveMarkets", label: "Live markets", value: formatCount(k.liveMarkets), note: "khashi-vc only" },
    { key: "strategyCandidates", label: "Strategy candidates", value: formatCount(k.strategyCandidates), note: "paper candidates" },
    { key: "blockers", label: "Blockers", value: formatCount(k.blockers), tone: k.blockers > 0 ? ("blocked" as const) : ("ready" as const), note: "across the fleet" },
  ];
}

export function projectShortCode(id: TradingProjectId): string {
  return id === "investing-system" ? "INV" : id === "khashi-vc" ? "KHA" : "SRC";
}

/** Poll windows from the handoff §17. */
export const POLL_SUMMARY_MS = 45_000;
export const POLL_EVENTS_MS = 20_000;
export const SUMMARY_STALE_SECONDS = 120;
export const EVENTS_STALE_SECONDS = 90;
