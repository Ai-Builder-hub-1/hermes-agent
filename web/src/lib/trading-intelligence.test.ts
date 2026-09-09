import { describe, expect, it } from "vitest";
import {
  NO_DATA,
  controlExecutionSucceeded,
  controlRequiresConfirmation,
  controlRiskLevel,
  eventSeverity,
  fleetKpiCards,
  formatCount,
  formatCurrency,
  humanizeKpiKey,
  isSignedPnlKey,
  isStale,
  pnlDirection,
  severityTone,
  statusTone,
  type ControlResponse,
  type TradingControl,
  type TradingKpis,
} from "./trading-intelligence";

const control = (over: Partial<TradingControl>): TradingControl => ({
  id: "x",
  namespacedId: "khashi-vc:x",
  projectId: "khashi-vc",
  projectLabel: "Khashi VC",
  label: "X",
  ...over,
});

describe("null vs zero", () => {
  // The whole point of the `_first_number` backend fix: a source that reports
  // a real 0 must not be rendered the same as a source that reports nothing.
  it("renders a real zero as 0 and a null as 'No data'", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCount(null)).toBe(NO_DATA);
    expect(formatCurrency(null)).toBe(NO_DATA);
    expect(formatCount(undefined)).toBe(NO_DATA);
  });

  it("treats non-finite numbers as missing rather than printing NaN", () => {
    expect(formatCount(Number.NaN)).toBe(NO_DATA);
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe(NO_DATA);
  });

  it("formats negative currency with a minus sign, not a bare dash", () => {
    expect(formatCurrency(-412.5)).toBe("−$412.50");
    expect(formatCurrency(124.4)).toBe("$124.40");
  });

  it("keeps null KPIs out of the fleet ribbon as 'No data'", () => {
    const kpis: TradingKpis = {
      projectsAvailable: 2,
      projectsTotal: 2,
      openTrades: 0,
      closedTrades: null,
      realizedPnlUsd: 0,
      openRiskUsd: null,
      liveMarkets: null,
      strategyCandidates: null,
      liveTradingLocked: true,
      blockers: 0,
    };
    const byKey = Object.fromEntries(fleetKpiCards(kpis).map((c) => [c.key, c.value]));
    expect(byKey.openTrades).toBe("0");
    expect(byKey.realizedPnlUsd).toBe("$0.00");
    expect(byKey.closedTrades).toBe(NO_DATA);
    expect(byKey.openRiskUsd).toBe(NO_DATA);
    expect(byKey.projectsAvailable).toBe("2/2");
  });
});

describe("colour semantics", () => {
  it("only treats signed P/L keys as directional", () => {
    expect(isSignedPnlKey("realizedPnlUsd")).toBe(true);
    expect(isSignedPnlKey("strategyGrossPnl")).toBe(true);
    // green on "open risk" would read as good news
    expect(isSignedPnlKey("openRiskUsd")).toBe(false);
    expect(isSignedPnlKey("openTrades")).toBe(false);
  });

  it("gives a flat zero no direction", () => {
    expect(pnlDirection(0)).toBe("flat");
    expect(pnlDirection(1)).toBe("up");
    expect(pnlDirection(-1)).toBe("down");
    expect(pnlDirection(null)).toBe("none");
  });
});

describe("open status strings", () => {
  it("normalises the four known statuses and falls back for anything else", () => {
    expect(statusTone("ready")).toBe("ready");
    expect(statusTone("blocked")).toBe("blocked");
    // _normalize_project_status passes unmatched source values straight through
    expect(statusTone("collecting-shadow")).toBe("unknown");
    expect(statusTone("")).toBe("unknown");
  });
});

describe("event severity", () => {
  it("forces source_unavailable to critical even when the source disagrees", () => {
    expect(eventSeverity({ type: "source_unavailable", severity: "info" })).toBe("critical");
    expect(severityTone(eventSeverity({ type: "source_unavailable", severity: "info" }))).toBe("blocked");
  });

  it("passes ordinary severities through", () => {
    expect(eventSeverity({ type: "paper_trade_closed", severity: "info" })).toBe("info");
    expect(severityTone("warning")).toBe("watch");
    expect(severityTone("error")).toBe("blocked");
    expect(severityTone("chatter")).toBe("unknown");
  });
});

describe("derived control risk", () => {
  it("derives risk from the fields the sources actually publish", () => {
    expect(controlRiskLevel(control({ id: "refresh_daily_ops", execution: "available" }))).toBe("low");
    expect(controlRiskLevel(control({ dangerous: true }))).toBe("high");
    expect(controlRiskLevel(control({ requiresServiceRestart: true }))).toBe("high");
    expect(controlRiskLevel(control({ execution: "runbook-required" }))).toBe("medium");
    expect(controlRiskLevel(control({ execution: "host_orchestrator_required" }))).toBe("medium");
    expect(controlRiskLevel(control({ brokerMutation: true }))).toBe("critical");
    expect(controlRiskLevel(control({ id: "emergency_lock_trading" }))).toBe("critical");
  });

  it("prefers an explicit riskLevel if a source ever starts publishing one", () => {
    expect(controlRiskLevel(control({ riskLevel: "critical", execution: "available" }))).toBe("critical");
  });

  it("requires confirmation for anything above low risk", () => {
    expect(controlRequiresConfirmation(control({ execution: "available" }))).toBe(false);
    expect(controlRequiresConfirmation(control({ dangerous: true }))).toBe(true);
    expect(controlRequiresConfirmation(control({ requiresConfirmation: true, execution: "available" }))).toBe(true);
  });
});

describe("execution success", () => {
  const base: ControlResponse = {
    id: "trading-intelligence-control-plane-control",
    contractVersion: "trading-intelligence-control-plane.v1",
    generatedAt: new Date().toISOString(),
    status: "proxied",
    httpStatus: 200,
    result: { status: "recorded" },
  };

  it("accepts a proxied 2xx whose source result is not itself a failure", () => {
    expect(controlExecutionSucceeded(base)).toBe(true);
  });

  it("never claims success from transport alone", () => {
    expect(controlExecutionSucceeded({ ...base, status: "failed" })).toBe(false);
    expect(controlExecutionSucceeded({ ...base, httpStatus: 500 })).toBe(false);
    // proxied 200, but the source rejected the action
    expect(controlExecutionSucceeded({ ...base, result: { status: "rejected" } })).toBe(false);
    expect(controlExecutionSucceeded({ ...base, result: undefined })).toBe(false);
  });
});

describe("freshness", () => {
  it("marks a payload older than its poll window as stale", () => {
    const fresh = new Date(Date.now() - 5_000).toISOString();
    const old = new Date(Date.now() - 600_000).toISOString();
    expect(isStale(fresh, 120)).toBe(false);
    expect(isStale(old, 120)).toBe(true);
  });

  it("treats an unparseable timestamp as stale rather than fresh", () => {
    expect(isStale("not-a-date", 120)).toBe(true);
  });
});

describe("kpi labels", () => {
  it("humanises camelCase source keys", () => {
    expect(humanizeKpiKey("realizedPnlUsd")).toBe("Realized P/L USD");
    expect(humanizeKpiKey("learningProgressPct")).toBe("Learning Progress %");
    expect(humanizeKpiKey("openTrades")).toBe("Open Trades");
  });
});
