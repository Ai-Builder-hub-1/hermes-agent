import { describe, expect, it } from "vitest";
import {
  KHASHI_NO_CASH_NOTE,
  NO_DATA,
  canChartHistory,
  classifyCapital,
  controlSucceeded,
  coverageTone,
  eventSeverity,
  formatCount,
  formatUsd,
  khashiCashNote,
  missingSources,
  pnlDirection,
  splitCapital,
  splitMetric,
  type ControlResponse,
  type DailySourceRow,
} from "./trading-command-center";

const row = (over: Partial<DailySourceRow>): DailySourceRow => ({
  sourceProject: "investing-system",
  sourceLabel: "Investing System",
  status: "watch",
  cashLeftUsd: null,
  cashLeftKnown: false,
  buyingPowerUsd: null,
  capitalSource: null,
  capitalSemantics: null,
  isRealBrokerCash: null,
  isKalshiDemoCash: null,
  kalshiProductionCashUsd: null,
  kalshiDemoCashUsd: null,
  paperBankrollUsd: null,
  totalEquityUsd: null,
  portfolioValueUsd: null,
  openRiskUsd: null,
  riskAdjustedCashLeftUsd: null,
  realizedPnlTodayUsd: null,
  realizedPnlUsd: null,
  unrealizedPnlUsd: null,
  netPnlUsd: null,
  openTrades: null,
  closedTrades: null,
  dailyLossLimitUsd: null,
  dailyLossRemainingUsd: null,
  ...over,
});

const REAL = row({ sourceProject: "investing-system", cashLeftUsd: 12_400, cashLeftKnown: true, isRealBrokerCash: true, capitalSource: "oanda-practice-account", openRiskUsd: 260 });
const PAPER = row({ sourceProject: "khashi-vc", sourceLabel: "Khashi VC", cashLeftUsd: 5_000, cashLeftKnown: true, capitalSource: "internal-khashi-paper-bankroll", paperBankrollUsd: 5_000, isRealBrokerCash: false });
const DEMO = row({ sourceProject: "khashi-vc", sourceLabel: "Khashi VC", cashLeftUsd: 1_000, cashLeftKnown: true, isKalshiDemoCash: true, kalshiDemoCashUsd: 1_000 });
const NOT_CONFIGURED = row({ sourceProject: "khashi-vc", sourceLabel: "Khashi VC", capitalSource: "not-configured" });
const UNSTATED = row({ sourceProject: "khashi-vc", sourceLabel: "Khashi VC", cashLeftUsd: 900, cashLeftKnown: true });

const split = (rows: DailySourceRow[], cashLeft: "known" | "partial" | "missing" = "known") =>
  splitCapital({ bySource: rows, coverage: { cashLeft, buyingPower: cashLeft, totalEquity: cashLeft, dailyPnl: cashLeft, risk: cashLeft } });

describe("capital classification", () => {
  it("trusts an explicit real-broker flag", () => {
    expect(classifyCapital(REAL)).toBe("real-broker");
  });

  it("recognises Kalshi demo funds as their own class", () => {
    expect(classifyCapital(DEMO)).toBe("kalshi-demo");
  });

  it("recognises an internal bankroll by capitalSource", () => {
    expect(classifyCapital(PAPER)).toBe("internal-paper");
    expect(classifyCapital(row({ capitalSource: "some-simulated-bankroll", cashLeftUsd: 10 }))).toBe("internal-paper");
  });

  it("treats a source that states nothing as unknown, never as real", () => {
    // The whole point: over-claiming here means sizing a live position against
    // money that may not exist.
    expect(classifyCapital(UNSTATED)).toBe("unknown");
    expect(classifyCapital(row({ cashLeftUsd: 5, isRealBrokerCash: false }))).toBe("unknown");
  });

  it("treats an explicit not-configured source, and a source with no money at all, as contributing nothing", () => {
    expect(classifyCapital(NOT_CONFIGURED)).toBe("not-configured");
    expect(classifyCapital(row({}))).toBe("not-configured");
  });
});

describe("the split never adds across classes", () => {
  it("keeps real broker cash and a simulated bankroll apart", () => {
    const s = split([REAL, PAPER]);
    const real = s.buckets.find((b) => b.capitalClass === "real-broker");
    const paper = s.buckets.find((b) => b.capitalClass === "internal-paper");
    expect(real?.cashUsd).toBe(12_400);
    expect(paper?.cashUsd).toBe(5_000);
    // 17,400 is the number the raw backend field would have produced
    expect(s.buckets.map((b) => b.cashUsd)).not.toContain(17_400);
    expect(s.headline?.cashUsd).toBe(12_400);
    expect(s.mixed).toBe(true);
  });

  it("does not flag mixed when only real broker cash is present", () => {
    const s = split([REAL, NOT_CONFIGURED]);
    expect(s.mixed).toBe(false);
    expect(s.headline?.cashUsd).toBe(12_400);
  });

  it("keeps demo funds out of the real headline", () => {
    const s = split([REAL, DEMO]);
    expect(s.headline?.cashUsd).toBe(12_400);
    expect(s.buckets.find((b) => b.capitalClass === "kalshi-demo")?.cashUsd).toBe(1_000);
    expect(s.mixed).toBe(true);
  });

  it("offers no headline at all when nothing is real broker cash", () => {
    const s = split([PAPER]);
    expect(s.headline).toBeNull();
    expect(s.mixed).toBe(true);
  });

  it("surfaces unclassified cash rather than absorbing it", () => {
    const s = split([REAL, UNSTATED]);
    expect(s.unclassified.map((r) => r.sourceProject)).toEqual(["khashi-vc"]);
    expect(s.headline?.cashUsd).toBe(12_400);
  });

  it("subtracts risk only within a class", () => {
    const s = split([REAL, PAPER]);
    expect(s.buckets.find((b) => b.capitalClass === "real-broker")?.riskAdjustedCashUsd).toBe(12_140);
    // the paper bucket carries no risk figure, so its adjusted value equals its cash
    expect(s.buckets.find((b) => b.capitalClass === "internal-paper")?.riskAdjustedCashUsd).toBe(5_000);
  });

  it("sums multiple sources within the same class", () => {
    const second = row({ sourceProject: "other", cashLeftUsd: 100, isRealBrokerCash: true });
    expect(split([REAL, second]).headline?.cashUsd).toBe(12_500);
  });
});

describe("the split covers every money metric, not just cash", () => {
  // A source can report no cash at all and still report P/L. Khashi's paper
  // profit landing in the headline "realized P/L today" is the cash bug in a
  // different field.
  const REAL_PNL = row({ sourceProject: "investing-system", sourceLabel: "Investing System", isRealBrokerCash: true, cashLeftUsd: 12_400, realizedPnlTodayUsd: 0, totalEquityUsd: 15_800, openRiskUsd: 260 });
  const PAPER_PNL = row({ sourceProject: "khashi-vc", sourceLabel: "Khashi VC", capitalSource: "internal-khashi-paper-bankroll", paperBankrollUsd: 5_000, cashLeftUsd: 5_000, realizedPnlTodayUsd: 124.4, openRiskUsd: 260 });

  it("keeps paper profit out of the real P/L figure", () => {
    const m = splitMetric(split([REAL_PNL, PAPER_PNL]), "realizedPnlTodayUsd");
    expect(m.real?.value).toBe(0);
    expect(m.simulated.map((c) => c.value)).toEqual([124.4]);
    // 124.4 is what dailyMetrics.realizedPnlTodayUsd reports
    expect(m.real?.value).not.toBe(124.4);
    expect(m.mixed).toBe(true);
  });

  it("names the account rather than the class when one source is the bucket", () => {
    const m = splitMetric(split([REAL_PNL, PAPER_PNL]), "realizedPnlTodayUsd");
    expect(m.simulated[0].label).toBe("Khashi VC");
  });

  it("offers no real figure when only simulated sources report one", () => {
    const m = splitMetric(split([PAPER_PNL]), "realizedPnlTodayUsd");
    expect(m.real).toBeNull();
    expect(m.simulated).toHaveLength(1);
    // nothing to blend, so nothing to warn about
    expect(m.mixed).toBe(false);
  });

  it("splits equity and risk the same way", () => {
    const s = split([REAL_PNL, PAPER_PNL]);
    expect(splitMetric(s, "totalEquityUsd").real?.value).toBe(15_800);
    expect(splitMetric(s, "totalEquityUsd").simulated).toEqual([]);
    expect(splitMetric(s, "openRiskUsd").real?.value).toBe(260);
    expect(splitMetric(s, "openRiskUsd").simulated.map((c) => c.value)).toEqual([260]);
  });

  it("reports a metric a source never sent as absent, not zero", () => {
    const m = splitMetric(split([REAL_PNL]), "netPnlUsd");
    expect(m.real).toBeNull();
    expect(m.simulated).toEqual([]);
  });
});

describe("khashi cash copy", () => {
  it("uses the exact required sentence when Khashi contributes no cash", () => {
    expect(khashiCashNote(split([REAL, NOT_CONFIGURED]))).toBe(KHASHI_NO_CASH_NOTE);
  });

  it("says plainly that a bankroll is not Kalshi cash", () => {
    expect(khashiCashNote(split([REAL, PAPER]))).toMatch(/not Kalshi production or demo cash/);
  });

  it("stays quiet when Khashi reports genuine demo funds", () => {
    expect(khashiCashNote(split([REAL, DEMO]))).toBeNull();
  });
});

describe("coverage", () => {
  it("tones partial coverage as a warning, not a pass", () => {
    expect(coverageTone("known")).toBe("ready");
    expect(coverageTone("partial")).toBe("watch");
    expect(coverageTone("missing")).toBe("blocked");
  });

  it("names which source is missing a metric", () => {
    expect(missingSources([REAL, NOT_CONFIGURED], "cashLeftUsd")).toEqual(["Khashi VC"]);
    expect(missingSources([REAL, PAPER], "cashLeftUsd")).toEqual([]);
  });

  it("carries coverage through the split", () => {
    expect(split([REAL, NOT_CONFIGURED], "partial").coverage).toBe("partial");
  });
});

describe("numbers", () => {
  it("separates unknown from zero", () => {
    expect(formatUsd(null)).toBe(NO_DATA);
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatCount(null)).toBe(NO_DATA);
    expect(formatCount(0)).toBe("0");
  });

  it("renders float counts as integers", () => {
    // _first_present_number returns floats; "3.0 open trades" is wrong
    expect(formatCount(3.0)).toBe("3");
    expect(formatCount(1462)).toBe("1,462");
  });

  it("signs negative currency", () => {
    expect(formatUsd(-412.5)).toBe("−$412.50");
    expect(pnlDirection(0)).toBe("flat");
    expect(pnlDirection(-1)).toBe("down");
    expect(pnlDirection(null)).toBe("none");
  });
});

describe("history", () => {
  it("refuses to chart a single day", () => {
    expect(canChartHistory({ historyStatus: "current_day_only", points: [{ current: true } as never] })).toBe(false);
  });

  it("refuses to chart one point even when history is claimed", () => {
    expect(canChartHistory({ historyStatus: "history_available", points: [{ current: true } as never] })).toBe(false);
  });

  it("charts once there are at least two real points", () => {
    expect(canChartHistory({ historyStatus: "history_available", points: [{} as never, {} as never] })).toBe(true);
  });
});

describe("events and controls", () => {
  it("forces source_unavailable to critical", () => {
    expect(eventSeverity({ type: "source_unavailable", severity: "info" })).toBe("critical");
    expect(eventSeverity({ type: "paper_trade_closed", severity: "info" })).toBe("info");
  });

  it("never claims a control succeeded from transport alone", () => {
    const base: ControlResponse = {
      id: "x", contractVersion: "v", generatedAt: "", status: "proxied", httpStatus: 200, result: { status: "recorded" },
    };
    expect(controlSucceeded(base)).toBe(true);
    expect(controlSucceeded({ ...base, status: "failed" })).toBe(false);
    expect(controlSucceeded({ ...base, httpStatus: 500 })).toBe(false);
    expect(controlSucceeded({ ...base, result: { status: "rejected" } })).toBe(false);
    expect(controlSucceeded({ ...base, result: undefined })).toBe(false);
  });
});
