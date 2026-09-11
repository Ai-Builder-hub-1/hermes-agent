/**
 * Trading Command Center — typed client and cash-provenance derivations.
 *
 * Contract source of truth is `hermes_cli/trading_intelligence.py`
 * (`trading_command_center`), served at `/api/trading-intelligence/command-center`.
 *
 * ── The one rule this module exists to enforce ─────────────────────────────
 *
 * `dailyMetrics.cashLeftUsd` is a plain sum across every source, regardless of
 * where that money lives. The backend says so itself, in the payload:
 *
 *   "Aggregate cash can include real broker cash and internal simulated
 *    bankrolls; inspect bySource before presenting it as withdrawable or
 *    live-trading cash."
 *
 * So this module never renders that field as a headline. It partitions
 * `bySource` by provenance and sums only *within* a class. Real broker cash,
 * Kalshi demo cash and an internal paper bankroll are three different kinds of
 * number and adding them produces a figure that is true of nothing.
 *
 * A source that reports cash without stating its provenance is `unknown`, not
 * real. That default is deliberate: the cost of under-claiming is a muted
 * number, and the cost of over-claiming is an operator sizing a live position
 * against simulated money.
 */
import { fetchJSON } from "@/lib/api";

const BASE = "/api/trading-intelligence";

export const COMMAND_CENTER_CONTRACT = "trading-command-center.v1";

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

export type Coverage = "known" | "partial" | "missing";
export type CommandStatus = "ready" | "watch" | "blocked" | (string & {});

export interface CoverageMap {
  cashLeft: Coverage;
  buyingPower: Coverage;
  totalEquity: Coverage;
  dailyPnl: Coverage;
  risk: Coverage;
}

export interface DailySourceRow {
  sourceProject: string;
  sourceLabel?: string;
  status: string;
  cashLeftUsd: number | null;
  cashLeftKnown: boolean;
  buyingPowerUsd: number | null;
  capitalSource: string | null;
  capitalSemantics: string | null;
  isRealBrokerCash: boolean | null;
  isKalshiDemoCash: boolean | null;
  kalshiProductionCashUsd: number | null;
  kalshiDemoCashUsd: number | null;
  paperBankrollUsd: number | null;
  totalEquityUsd: number | null;
  portfolioValueUsd: number | null;
  openRiskUsd: number | null;
  riskAdjustedCashLeftUsd: number | null;
  realizedPnlTodayUsd: number | null;
  realizedPnlUsd: number | null;
  unrealizedPnlUsd: number | null;
  netPnlUsd: number | null;
  openTrades: number | null;
  closedTrades: number | null;
  dailyLossLimitUsd: number | null;
  dailyLossRemainingUsd: number | null;
}

export interface DailyMetrics {
  date: string;
  generatedAt: string;
  cashLeftUsd: number | null;
  /** `any()`, not `all()`, in the backend — true with one of two sources
   *  reporting. `coverage.cashLeft` is the only trustworthy completeness
   *  signal; never gate a display on this flag alone. */
  cashLeftKnown: boolean;
  buyingPowerUsd: number | null;
  totalEquityUsd: number | null;
  portfolioValueUsd: number | null;
  openRiskUsd: number | null;
  riskAdjustedCashLeftUsd: number | null;
  realizedPnlTodayUsd: number | null;
  realizedPnlUsd: number | null;
  unrealizedPnlUsd: number | null;
  netPnlUsd: number | null;
  openTrades: number | null;
  closedTrades: number | null;
  eventsToday: number;
  humanActionsRequired: number;
  coverage: CoverageMap;
  capitalSemantics: {
    realBrokerCashSources: number;
    kalshiDemoCashSources: number;
    internalPaperBankrollSources: number;
    note: string;
  };
  bySource: DailySourceRow[];
}

export interface DailySeriesPoint {
  date: string;
  current: boolean;
  cashLeftUsd: number | null;
  cashLeftKnown: boolean;
  buyingPowerUsd: number | null;
  totalEquityUsd: number | null;
  portfolioValueUsd?: number | null;
  openRiskUsd: number | null;
  riskAdjustedCashLeftUsd: number | null;
  realizedPnlTodayUsd: number | null;
  realizedPnlUsd?: number | null;
  unrealizedPnlUsd?: number | null;
  netPnlUsd: number | null;
  openTrades: number | null;
  closedTrades: number | null;
  eventsToday: number | null;
  humanActionsRequired: number | null;
  coverage: CoverageMap;
  bySource: DailySourceRow[];
}

export interface DailySeries {
  id: string;
  granularity: "day";
  timezone: "UTC";
  historyStatus: "current_day_only" | "history_available";
  points: DailySeriesPoint[];
  recommendedCharts: Array<{ id: string; label: string; series: string[] }>;
}

export interface Lane {
  id: string;
  label: string;
  kind: string;
  sourceProject: string | null;
  sourceLabel: string | null;
  available: boolean;
  status: string;
  purpose: string;
  capitalKnown: boolean;
  liveTradingLocked: boolean;
  kpis: Record<string, number | string | boolean | null>;
  metricCoverage: { expected: string[]; present: string[]; missing: string[] };
  blockers: string[];
  recommendations: string[];
  sourceRoutes: Record<string, string>;
}

export interface TradingEvent {
  id: string;
  sourceProject: string;
  sourceSystem: string;
  stream: string;
  type: string;
  status: string;
  severity: string;
  title: string;
  occurredAt: string;
  instrument: string | null;
  summary: string;
  links: Record<string, string>;
  rawRef?: Record<string, unknown>;
}

export interface TradingControl {
  id: string;
  namespacedId: string;
  projectId: string;
  projectLabel: string;
  label: string;
  intent?: string;
  runbookCommand?: string;
  execution?: string;
  effect?: string;
  dangerous?: boolean;
  brokerMutation?: boolean;
  liveTradingLocked?: boolean;
  requiresServiceRestart?: boolean;
}

export interface ActionItem {
  id: string;
  type: "blocker_review" | "control_approval" | (string & {});
  status: string;
  severity: string;
  title: string;
  recommendedAction: string;
  sourceProject: string | null;
  control: TradingControl | null;
}

export interface FreshnessRow {
  sourceProject: string;
  available: boolean;
  status: string;
  latencyMs: number | null;
  generatedAt: string | null;
  latestMarketDataAt: string | null;
  latestAccountAt: string | null;
  latestStrategyAt: string | null;
  latestProofAt: string | null;
  sourceBaseUrl: string | null;
}

export interface SourceProject {
  projectId: string;
  label: string;
  sourceBaseUrl: string | null;
  available: boolean;
  httpStatus: number;
  latencyMs: number;
  error: string | null;
  status: string;
  liveTradingLocked: boolean;
  kpis: Record<string, number | string | boolean | null>;
  blockers: string[];
  recommendations: string[];
  sourceRoutes: Record<string, string>;
  summary: unknown;
}

export interface CommandSummary {
  totalCapitalKnown: boolean;
  activeSystems: number;
  blockedSystems: number;
  openPositions: number | null;
  openTrades: number | null;
  closedTrades: number | null;
  /** Always null in practice — resolved from the fleet KPI block, which
   *  publishes no cash fields. Use dailyMetrics for anything about money. */
  cashLeftUsd: number | null;
  cashLeftKnown: boolean;
  buyingPowerUsd: number | null;
  totalEquityUsd: number | null;
  openRiskUsd: number | null;
  realizedPnlTodayUsd: number | null;
  realizedPnlUsd: number | null;
  unrealizedPnlUsd: number | null;
  maxDrawdownUsd: number | null;
  strategyCandidates: number | null;
  humanActionsRequired: number;
}

export interface TradingCommandCenter {
  id: string;
  contractVersion: string;
  sourceContractVersion?: string;
  frontendContractVersion: string;
  title: string;
  generatedAt: string;
  status: CommandStatus;
  liveTradingLocked: boolean;
  summary: CommandSummary;
  lanes: Lane[];
  dailyMetrics: DailyMetrics;
  dailySeries: DailySeries;
  capital: Record<string, unknown>;
  pnl: Record<string, unknown>;
  risk: Record<string, unknown> & { blockers?: string[]; liveTradingLocked?: boolean };
  positions: { count: number; rows: unknown[]; coverage: string };
  strategies: { count: number; rows: unknown[]; coverage: string };
  recentEvents: TradingEvent[];
  actionQueue: ActionItem[];
  freshness: FreshnessRow[];
  blockers: string[];
  recommendations: string[];
  sourceProjects: SourceProject[];
  sourceRoutes: Record<string, string>;
  frontendBuildNotes: string[];
}

export interface ControlsResponse {
  safety: { liveTradingLocked: boolean; submitLiveOrderAvailable: boolean; projectOwnedControlsOnly: boolean; note: string };
  projects: Array<{ projectId: string; label: string; available: boolean; error: string | null; controls: TradingControl[] }>;
  controls: TradingControl[];
}

export interface ControlResponse {
  id: string;
  contractVersion: string;
  generatedAt: string;
  status: "proxied" | "failed" | "rejected" | (string & {});
  projectId?: string;
  action?: string;
  httpStatus?: number;
  error?: string | null;
  result?: unknown;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const fetchCommandCenter = (limit = 10) =>
  fetchJSON<TradingCommandCenter>(`${BASE}/command-center?limit=${Math.max(1, Math.min(50, Math.trunc(limit) || 10))}`);

export const fetchControls = () => fetchJSON<ControlsResponse>(`${BASE}/controls`);

export const requestControl = (input: { action: string; execute: boolean; reason: string }) =>
  fetchJSON<ControlResponse>(`${BASE}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      actorId: "nous-dashboard-operator",
      correlationId: `tcc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    }),
  });

// ---------------------------------------------------------------------------
// Number formatting — null is unknown, 0 is zero
// ---------------------------------------------------------------------------

export const NO_DATA = "No data";

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function formatUsd(v: unknown): string {
  if (!isNum(v)) return NO_DATA;
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? "−" : ""}$${abs}`;
}

/** Counts arrive as floats from the backend's `_first_present_number`; an
 *  "openTrades" of 3.0 must read "3", never "3.0". */
export function formatCount(v: unknown): string {
  if (!isNum(v)) return NO_DATA;
  return Math.round(v).toLocaleString("en-US");
}

export function formatPercent(v: unknown): string {
  return isNum(v) ? `${v.toFixed(1)}%` : NO_DATA;
}

export type PnlDirection = "up" | "down" | "flat" | "none";

export function pnlDirection(v: unknown): PnlDirection {
  if (!isNum(v)) return "none";
  return v > 0 ? "up" : v < 0 ? "down" : "flat";
}

// ---------------------------------------------------------------------------
// Cash provenance — the heart of this module
// ---------------------------------------------------------------------------

export type CapitalClass = "real-broker" | "kalshi-demo" | "internal-paper" | "not-configured" | "unknown";

export const CAPITAL_CLASS_LABEL: Record<CapitalClass, string> = {
  "real-broker": "Real broker cash",
  "kalshi-demo": "Kalshi demo funds",
  "internal-paper": "Simulated bankroll",
  "not-configured": "No cash configured",
  unknown: "Unclassified cash",
};

/** Longer-form copy for the one place each class is explained. */
export const CAPITAL_CLASS_NOTE: Record<CapitalClass, string> = {
  "real-broker": "Broker-account cash and buying power from a read-only source.",
  "kalshi-demo": "Official Kalshi demo funds — not withdrawable and not live-trading capital.",
  "internal-paper":
    "An internal simulation bankroll. This is not Kalshi cash, production or demo, and must never be sized against.",
  "not-configured": "This source contributes no cash.",
  unknown: "This source reported cash without stating its provenance, so it is not counted as real.",
};

/**
 * Classify one source row. Order matters: an explicit real-broker flag wins,
 * then demo, then anything that names itself paper/bankroll, then an explicit
 * not-configured, and finally unknown — which is where a row lands when it
 * reports cash but says nothing about where the cash lives.
 */
export function classifyCapital(row: Pick<DailySourceRow,
  "isRealBrokerCash" | "isKalshiDemoCash" | "capitalSource" | "paperBankrollUsd" | "cashLeftUsd">): CapitalClass {
  if (row.isRealBrokerCash === true) return "real-broker";
  if (row.isKalshiDemoCash === true) return "kalshi-demo";
  const source = String(row.capitalSource ?? "").toLowerCase();
  if (source === "not-configured") return "not-configured";
  if (source.includes("paper") || source.includes("bankroll") || source.includes("simulat")) return "internal-paper";
  if (isNum(row.paperBankrollUsd) && !isNum(row.cashLeftUsd)) return "internal-paper";
  if (!isNum(row.cashLeftUsd) && !isNum(row.paperBankrollUsd)) return "not-configured";
  return "unknown";
}

export interface CapitalBucket {
  capitalClass: CapitalClass;
  label: string;
  note: string;
  /** Sum *within* this class only. Never combined with another bucket. */
  cashUsd: number | null;
  buyingPowerUsd: number | null;
  openRiskUsd: number | null;
  riskAdjustedCashUsd: number | null;
  /** P/L and equity are money too, and `dailyMetrics` sums them across sources
   *  exactly the way it sums cash. A "+$124.40 realized today" that is entirely
   *  paper-bankroll profit, shown beside real broker cash, is the same lie in a
   *  different field — so these are kept per class as well. */
  realizedPnlTodayUsd: number | null;
  netPnlUsd: number | null;
  totalEquityUsd: number | null;
  sources: DailySourceRow[];
}

export interface CapitalSplit {
  buckets: CapitalBucket[];
  /** The bucket a headline may legitimately use, if there is one. */
  headline: CapitalBucket | null;
  /** True when something other than real broker cash contributes money —
   *  the case where a single summed figure would be a lie. */
  mixed: boolean;
  /** Rows with cash but no stated provenance. */
  unclassified: DailySourceRow[];
  coverage: Coverage;
}

const sumOf = (rows: DailySourceRow[], key: keyof DailySourceRow): number | null => {
  const nums = rows.map((r) => r[key]).filter(isNum);
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100 : null;
};

/**
 * Partition `bySource` by provenance. This replaces `dailyMetrics.cashLeftUsd`
 * as the page's source of truth for money.
 */
export function splitCapital(metrics: Pick<DailyMetrics, "bySource" | "coverage">): CapitalSplit {
  const rows = metrics.bySource ?? [];
  const byClass = new Map<CapitalClass, DailySourceRow[]>();
  for (const row of rows) {
    const cls = classifyCapital(row);
    byClass.set(cls, [...(byClass.get(cls) ?? []), row]);
  }

  const order: CapitalClass[] = ["real-broker", "kalshi-demo", "internal-paper", "unknown", "not-configured"];
  const buckets: CapitalBucket[] = order
    .filter((cls) => byClass.has(cls))
    .map((cls) => {
      const sources = byClass.get(cls) ?? [];
      const cash = cls === "internal-paper" ? (sumOf(sources, "cashLeftUsd") ?? sumOf(sources, "paperBankrollUsd")) : sumOf(sources, "cashLeftUsd");
      const risk = sumOf(sources, "openRiskUsd");
      return {
        capitalClass: cls,
        label: CAPITAL_CLASS_LABEL[cls],
        note: CAPITAL_CLASS_NOTE[cls],
        cashUsd: cash,
        buyingPowerUsd: sumOf(sources, "buyingPowerUsd"),
        openRiskUsd: risk,
        riskAdjustedCashUsd: isNum(cash) ? Math.round((cash - (risk ?? 0)) * 100) / 100 : null,
        realizedPnlTodayUsd: sumOf(sources, "realizedPnlTodayUsd") ?? sumOf(sources, "realizedPnlUsd"),
        netPnlUsd: sumOf(sources, "netPnlUsd"),
        totalEquityUsd: sumOf(sources, "totalEquityUsd") ?? sumOf(sources, "portfolioValueUsd"),
        sources,
      };
    });

  const headline = buckets.find((b) => b.capitalClass === "real-broker" && isNum(b.cashUsd)) ?? null;
  const moneyBuckets = buckets.filter((b) => isNum(b.cashUsd) && b.capitalClass !== "not-configured");
  return {
    buckets,
    headline,
    mixed: moneyBuckets.some((b) => b.capitalClass !== "real-broker"),
    unclassified: byClass.get("unknown") ?? [],
    coverage: metrics.coverage?.cashLeft ?? "missing",
  };
}

export interface MetricContribution {
  capitalClass: CapitalClass;
  /** Names the account, not the class, when one source is the whole bucket —
   *  "Khashi VC" is more use to an operator than "Not configured". */
  label: string;
  value: number;
}

export interface MetricSplit {
  /** The only contribution that may be presented as a real-money figure. */
  real: MetricContribution | null;
  /** Everything else, kept apart from `real` and from each other. */
  simulated: MetricContribution[];
  /** True when a single summed figure would cross a provenance boundary. */
  mixed: boolean;
}

const contributionLabel = (bucket: CapitalBucket): string =>
  bucket.sources.length === 1
    ? (bucket.sources[0].sourceLabel ?? bucket.sources[0].sourceProject)
    : bucket.label;

/**
 * The same partition applied to a money metric other than cash.
 *
 * `dailyMetrics.realizedPnlTodayUsd`, `netPnlUsd` and `totalEquityUsd` are
 * cross-source sums with no provenance attached, so they are never rendered
 * whole. Callers show `real` as the figure and list `simulated` beside it.
 */
export function splitMetric(
  split: CapitalSplit,
  key: "realizedPnlTodayUsd" | "netPnlUsd" | "totalEquityUsd" | "openRiskUsd",
): MetricSplit {
  const contributions = split.buckets
    .map((b) => ({ bucket: b, value: b[key] }))
    .filter((c): c is { bucket: CapitalBucket; value: number } => isNum(c.value))
    .map(({ bucket, value }) => ({
      capitalClass: bucket.capitalClass,
      label: contributionLabel(bucket),
      value,
    }));
  const real = contributions.find((c) => c.capitalClass === "real-broker") ?? null;
  const simulated = contributions.filter((c) => c.capitalClass !== "real-broker");
  return { real, simulated, mixed: simulated.length > 0 && real !== null };
}

/** The sentence the spec requires whenever Khashi contributes no cash. */
export const KHASHI_NO_CASH_NOTE =
  "Khashi cash not configured. Khashi metrics are shadow/paper/read-only trading metrics, not Kalshi cash.";

export function khashiCashNote(split: CapitalSplit): string | null {
  const khashi = split.buckets
    .flatMap((b) => b.sources.map((s) => ({ cls: b.capitalClass, s })))
    .find((x) => x.s.sourceProject === "khashi-vc");
  if (!khashi) return null;
  if (khashi.cls === "not-configured") return KHASHI_NO_CASH_NOTE;
  if (khashi.cls === "internal-paper") {
    return "Khashi is reporting an internal simulated bankroll, not Kalshi production or demo cash. It is shown separately and never added to broker cash.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Coverage, tone, status
// ---------------------------------------------------------------------------

export type Tone = "ready" | "watch" | "blocked" | "unavailable" | "unknown";

export function coverageTone(c: Coverage): Tone {
  return c === "known" ? "ready" : c === "partial" ? "watch" : "blocked";
}

export function coverageLabel(c: Coverage): string {
  return c === "known" ? "complete" : c === "partial" ? "partial" : "missing";
}

/** Which sources are not contributing a given metric — the "show which source
 *  is missing" requirement for partial coverage. */
export function missingSources(rows: DailySourceRow[], key: keyof DailySourceRow): string[] {
  return rows.filter((r) => !isNum(r[key])).map((r) => r.sourceLabel ?? r.sourceProject);
}

export function statusTone(status: string): Tone {
  const s = String(status);
  if (s === "ready") return "ready";
  if (s === "watch") return "watch";
  if (s === "blocked") return "blocked";
  if (s === "unavailable") return "unavailable";
  return "unknown";
}

export function severityTone(severity: string): Tone {
  const s = String(severity).toLowerCase();
  if (s === "critical" || s === "error" || s === "high") return "blocked";
  if (s === "warning" || s === "watch" || s === "medium") return "watch";
  if (s === "info" || s === "low") return "unknown";
  return "unknown";
}

/** §9-style rule carried over: a source_unavailable event reads critical even
 *  when the source's own severity disagrees. */
export function eventSeverity(e: Pick<TradingEvent, "type" | "severity">): string {
  return e.type === "source_unavailable" ? "critical" : String(e.severity || "info");
}

export function controlIsDangerous(c: TradingControl): boolean {
  return Boolean(c.dangerous || c.requiresServiceRestart || c.brokerMutation);
}

/** Never infer success from transport alone. */
export function controlSucceeded(res: ControlResponse): boolean {
  if (res.status !== "proxied") return false;
  const http = res.httpStatus ?? 0;
  if (http < 200 || http >= 300) return false;
  const result = res.result;
  if (!result || typeof result !== "object") return false;
  const status = (result as { status?: unknown }).status;
  return typeof status !== "string" || !["rejected", "failed", "error"].includes(status);
}

export function isStale(generatedAt: string, maxAgeSeconds: number): boolean {
  const t = new Date(generatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return (Date.now() - t) / 1000 > maxAgeSeconds;
}

/**
 * One point is not a trend. With `current_day_only` the page shows stat tiles
 * and says history is collecting, rather than drawing a line through a single
 * value and implying a shape that is not in the data.
 */
export function canChartHistory(series: Pick<DailySeries, "historyStatus" | "points">): boolean {
  return series.historyStatus === "history_available" && (series.points?.length ?? 0) >= 2;
}

export function sourceShort(projectId: string | null | undefined): string {
  if (projectId === "investing-system") return "INV";
  if (projectId === "khashi-vc") return "KHA";
  return "SRC";
}

export const EVENT_FILTERS: Array<{ id: string; label: string; test: (e: TradingEvent) => boolean }> = [
  { id: "all", label: "All", test: () => true },
  { id: "investing-system", label: "Investing", test: (e) => e.sourceProject === "investing-system" },
  { id: "khashi-vc", label: "Khashi", test: (e) => e.sourceProject === "khashi-vc" },
  { id: "errors", label: "Errors", test: (e) => ["error", "critical"].includes(eventSeverity(e)) },
  { id: "warnings", label: "Warnings", test: (e) => eventSeverity(e) === "warning" },
  { id: "trades", label: "Trades", test: (e) => /trade|execution|lifecycle|paper/i.test(`${e.stream} ${e.type}`) },
  { id: "controls", label: "Controls", test: (e) => /control/i.test(`${e.stream} ${e.type}`) },
];

export const POLL_COMMAND_MS = 30_000;
export const COMMAND_STALE_SECONDS = 90;
export const MIN_CONTROL_REASON = 8;
