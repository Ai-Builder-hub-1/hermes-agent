import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPortfolioIntelligenceSummary } from "./portfolio-intelligence";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function jsonFetchMock(body: unknown = { ok: true }) {
  return vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
  );
}

describe("portfolio intelligence API client", () => {
  it("loads the portfolio risk office contract", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      contractVersion: "2026-09-29",
      generatedAt: "2026-09-29T00:00:00.000Z",
      health: "ready",
      liveTradingLocked: true,
      summary: {
        capitalKnown: true,
        cashLeftUsd: 100,
        buyingPowerUsd: 100,
        realBrokerCashUsd: 100,
        internalPaperBankrollUsd: 0,
        openRiskUsd: 0,
        riskAdjustedCashLeftUsd: 100,
        knownExposureUsd: 0,
        exposureCoverage: "known",
        brokerCoverage: "known",
        concentrationRisk: "low",
        allocationPosture: "ready",
      },
      exposures: [],
      riskOffice: {
        status: "ready",
        liveTradingLocked: true,
        killSwitchStatus: "locked",
        dailyLossLimitStatus: "ready",
        weeklyLossLimitStatus: "ready",
        maxConcurrentExposureStatus: "ready",
        blockers: [],
      },
      brokerCoverage: {
        status: "ready",
        brokers: 1,
        configured: 1,
        accountVisible: 1,
        stale: 0,
        liveSubmitEnabled: false,
      },
      concentration: {
        risk: "low",
        largestSourceProject: "investing-system",
        largestShare: 1,
      },
      allocationRecommendations: [],
      dissentingEvidence: [],
      sourceRoutes: {},
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPortfolioIntelligenceSummary();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trading-intelligence/portfolio/summary",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
