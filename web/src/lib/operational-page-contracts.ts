export type OperationalGroup = "operate" | "trading" | "system";
export type OperationalMaturity = "static" | "actionable" | "live" | "charted" | "controlled" | "intelligent";

export interface OperationalPageContract {
  route: string;
  group: OperationalGroup;
  label: string;
  purpose: string;
  maturity: OperationalMaturity;
  liveSources: string[];
  requiredSignals: string[];
  gaps: string[];
  safeActions: string[];
  evidence: string[];
}

export interface OperationalPageAudit {
  route: string;
  group: OperationalGroup;
  label: string;
  score: number;
  maturity: OperationalMaturity;
  status: "ready" | "partial" | "blocked";
  missing: string[];
  nextAction: string;
}

const REQUIRED_SURFACE_SIGNALS = [
  "current_state",
  "freshness",
  "trend",
  "coverage",
  "risk",
  "next_action",
  "evidence",
  "safe_controls",
  "audit_trail",
  "drilldown",
];

export const OPERATIONAL_PAGE_CONTRACTS: OperationalPageContract[] = [
  {
    route: "/system/warehouse",
    group: "system",
    label: "Data Warehouse",
    purpose: "Show capacity, ingest, freshness, mirror, retention, restore proof, jobs, and safe warehouse actions.",
    maturity: "charted",
    liveSources: [
      "/api/system/warehouse/summary",
      "/api/system/warehouse/sources",
      "/api/system/warehouse/series",
      "/api/system/warehouse/jobs",
    ],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["production collector history", "destructive prune approval flow", "external mirror job execution"],
    safeActions: ["/api/system/warehouse/sync", "/api/system/warehouse/restore-proof", "/api/system/warehouse/prune-dry-run"],
    evidence: ["operating-runtime catalog evidence", "restore proof manifest", "warehouse job records"],
  },
  {
    route: "/system/storage",
    group: "system",
    label: "Storage",
    purpose: "Show disk, object store, artifact retention, cleanup candidates, growth rate, and forecast.",
    maturity: "static",
    liveSources: ["/api/system/stats"],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["artifact backend usage", "growth series", "cleanup forecast", "retention by class"],
    safeActions: [],
    evidence: [],
  },
  {
    route: "/system/freshness",
    group: "system",
    label: "Freshness",
    purpose: "Show source freshness matrix, last successful checks, SLA breach, and stale trend.",
    maturity: "actionable",
    liveSources: ["/api/operating-runtime/data-sources", "/api/system/warehouse/sources"],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["unified freshness series", "SLO burn rate", "source-level acknowledgement"],
    safeActions: [],
    evidence: ["operating-runtime data source evidence"],
  },
  {
    route: "/system/workers",
    group: "system",
    label: "Workers",
    purpose: "Show worker status, last run, next run, duration, logs, failures, and rerun controls.",
    maturity: "actionable",
    liveSources: ["/api/operating-runtime/summary", "/api/operating-runtime/evidence"],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["scheduler run history", "duration series", "rerun audit action"],
    safeActions: [],
    evidence: ["operating-runtime loop evidence"],
  },
  {
    route: "/trading/strategies",
    group: "trading",
    label: "Strategies",
    purpose: "Show live strategy candidates, evidence, hypothesis state, backtest readiness, and promotion gates.",
    maturity: "static",
    liveSources: [],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["strategy candidate API", "strategy evidence ledger", "promotion action audit"],
    safeActions: [],
    evidence: [],
  },
  {
    route: "/trading/backtesting",
    group: "trading",
    label: "Backtesting",
    purpose: "Show backtest runs, datasets, assumptions, fees/slippage, results, failures, and comparisons.",
    maturity: "static",
    liveSources: [],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["backtest run API", "result series", "assumption registry", "comparison charts"],
    safeActions: [],
    evidence: [],
  },
  {
    route: "/operate/evidence",
    group: "operate",
    label: "Operate Evidence",
    purpose: "Browse evidence artifacts by blocker, action, incident, run, source, and page.",
    maturity: "static",
    liveSources: ["/api/operating-runtime/evidence", "/api/operating-runtime/audit"],
    requiredSignals: REQUIRED_SURFACE_SIGNALS,
    gaps: ["dedicated evidence route", "artifact previews", "proof hashes", "blocker/action backlinks"],
    safeActions: [],
    evidence: ["operating-runtime evidence"],
  },
];

export function auditOperationalContract(contract: OperationalPageContract): OperationalPageAudit {
  const missing: string[] = [];
  if (!contract.liveSources.length) missing.push("live data contract");
  if (!contract.evidence.length) missing.push("evidence source");
  if (!contract.safeActions.length && contract.maturity === "controlled") missing.push("safe action contract");
  for (const signal of REQUIRED_SURFACE_SIGNALS) {
    if (!contract.requiredSignals.includes(signal)) missing.push(signal);
  }
  const score = Math.max(0, Math.round(((REQUIRED_SURFACE_SIGNALS.length + 3 - missing.length) / (REQUIRED_SURFACE_SIGNALS.length + 3)) * 100));
  return {
    route: contract.route,
    group: contract.group,
    label: contract.label,
    maturity: contract.maturity,
    score,
    status: score >= 85 ? "ready" : score >= 55 ? "partial" : "blocked",
    missing,
    nextAction: contract.gaps[0] ?? "Maintain evidence and regression tests.",
  };
}

export function auditOperationalPages(group?: OperationalGroup): OperationalPageAudit[] {
  return OPERATIONAL_PAGE_CONTRACTS
    .filter((contract) => !group || contract.group === group)
    .map(auditOperationalContract)
    .sort((left, right) => left.score - right.score || left.route.localeCompare(right.route));
}

export function contractForRoute(route: string): OperationalPageContract | undefined {
  return OPERATIONAL_PAGE_CONTRACTS.find((contract) => contract.route === route);
}
