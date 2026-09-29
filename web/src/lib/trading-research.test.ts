import { describe, expect, it } from "vitest";
import { afterEach, vi } from "vitest";
import { fetchTradingEvidenceSnapshot, runOutcomeLearningReview, tradingResearchTone } from "./trading-research";

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

describe("trading research helpers", () => {
  it("maps research health to dashboard tones", () => {
    expect(tradingResearchTone("ready")).toBe("success");
    expect(tradingResearchTone("passed")).toBe("success");
    expect(tradingResearchTone("watch")).toBe("warning");
    expect(tradingResearchTone("waiting_for_data")).toBe("warning");
    expect(tradingResearchTone("blocked")).toBe("critical");
    expect(tradingResearchTone("unknown")).toBe("info");
  });

  it("loads outcome learning with the trading evidence snapshot", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url === "/api/trading-research/evidence/ledger") {
        return new Response(JSON.stringify({
          contractVersion: "2026-09-29",
          generatedAt: "2026-09-29T00:00:00.000Z",
          health: "ready",
          summary: { records: 0, sourceEvents: 0, strategies: 0, backtests: 0, missingProofHashes: 0 },
          records: [],
          blockers: [],
          recommendations: [],
        }), { headers: { "Content-Type": "application/json" }, status: 200 });
      }
      if (url.startsWith("/api/trading-research/evidence/series")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-09-29T00:00:00.000Z",
          window: "7d",
          historyStatus: "ready",
          points: [],
        }), { headers: { "Content-Type": "application/json" }, status: 200 });
      }
      return new Response(JSON.stringify({
        contractVersion: "2026-09-29",
        generatedAt: "2026-09-29T00:00:00.000Z",
        health: "ready",
        summary: {
          strategies: 0,
          backtestRuns: 0,
          passedBacktests: 0,
          evidenceRecords: 0,
          missingProofHashes: 0,
          reliabilityScore: 100,
          calibration: "ready",
        },
        signals: [],
        researchTasks: [],
        blockers: [],
        recommendations: [],
      }), { headers: { "Content-Type": "application/json" }, status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchTradingEvidenceSnapshot("7d");

    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toContain("/api/trading-research/outcomes/summary");
  });

  it("records an outcome learning review", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await runOutcomeLearningReview();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trading-research/outcomes/review",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
