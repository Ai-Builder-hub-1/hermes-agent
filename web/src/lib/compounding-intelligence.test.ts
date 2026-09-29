import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCompoundingSummary, runCompoundingReview } from "./compounding-intelligence";

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

describe("compounding intelligence API client", () => {
  it("loads the local compounding summary contract", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      contractVersion: "2026-09-29",
      generatedAt: "2026-09-29T00:00:00.000Z",
      health: "ready",
      summary: {
        proposals: 0,
        blocked: 0,
        requiresApproval: 0,
        experiments: 0,
        promotionReviews: 0,
        demotionReviews: 0,
        liveTradingLocked: true,
        executionEnabled: false,
      },
      proposals: [],
      committeePacket: {
        title: "Compounding review",
        generatedAt: "2026-09-29T00:00:00.000Z",
        decisionMode: "operator_review_only",
        sections: [],
        proposals: [],
        approvalRequired: false,
        executionEnabled: false,
        liveTradingLocked: true,
      },
      evidence: {},
      blockers: [],
      recommendations: [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCompoundingSummary();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/compounding-intelligence/summary",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("records a compounding review without enabling execution", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await runCompoundingReview();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/compounding-intelligence/review",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
