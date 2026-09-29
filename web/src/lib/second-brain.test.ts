import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCompoundingIntelligence,
  fetchDecisionLineage,
  fetchDecisionRecords,
  fetchMemoryRetrievalPack,
} from "./second-brain";

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

describe("second brain API client", () => {
  it("loads compounding intelligence through the Nous backend proxy", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      generatedAt: "2026-09-29T00:00:00.000Z",
      maturityScore: 75,
      status: "partial",
      phases: [],
      sourceCoverage: [],
      retrievalReadiness: {
        activeNodes: 0,
        citedNodes: 0,
        graphLinkedNodes: 0,
        actionableNodes: 0,
      },
      operatingCadence: {
        staleNodes: 0,
        pendingCandidates: 0,
        contradictionEdges: 0,
        openActions: 0,
        lastWarehouseSyncAt: null,
      },
      findings: [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCompoundingIntelligence();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/second-brain/compounding-intelligence",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("builds retrieval-pack query params for the proxy endpoint", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      generatedAt: "2026-09-29T00:00:00.000Z",
      query: "warehouse sync",
      context: {},
      nodes: [],
      actions: [],
      citations: [],
      warnings: [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchMemoryRetrievalPack({
      q: "warehouse sync",
      project: "nous-hermes-agent",
      businessUnit: "TLC Capital",
      ticker: "AAPL",
      strategy: "second brain",
      workflow: "operator-preview",
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.startsWith("/api/second-brain/retrieval-pack?")).toBe(true);
    expect(url).toContain("q=warehouse+sync");
    expect(url).toContain("project=nous-hermes-agent");
    expect(url).toContain("businessUnit=TLC+Capital");
    expect(url).toContain("ticker=AAPL");
    expect(url).toContain("strategy=second+brain");
    expect(url).toContain("workflow=operator-preview");
  });

  it("loads decision records and lineage through the proxy", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      decisions: [{
        id: "decision_1",
        project: "nous-hermes-agent",
        businessUnit: "Operations",
        decisionType: "operations",
        title: "Runtime wiring",
        summary: "Hermes Brain should back the dashboard.",
        decidedAt: "2026-09-29T00:00:00.000Z",
        owner: "hq",
        status: "decided",
        riskClass: "medium",
        impactClass: "high",
        sourceEvidenceRefs: [],
        priorMemoryRefs: [],
        assumptions: [],
        expectedOutcome: "Live dashboard context.",
        actualOutcome: null,
        reviewState: "current",
        stableWarehouseId: "warehouse-decision_1",
        createdAt: "2026-09-29T00:00:00.000Z",
        updatedAt: "2026-09-29T00:00:00.000Z",
        metadata: {},
      }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchDecisionRecords();
    await fetchDecisionLineage("decision/with space");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/decisions");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/second-brain/decisions/decision%2Fwith%20space/lineage");
  });
});
