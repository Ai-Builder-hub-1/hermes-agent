import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCompoundingIntelligence,
  detectContradictions,
  fetchContradictions,
  fetchDecisionLineage,
  fetchDecisionRecords,
  fetchMemoryRetrievalPack,
  fetchDecisionIntelligenceAuditPacket,
  fetchDecisionIntelligenceMetrics,
  fetchHighImpactWorkflowRegistry,
  fetchPreflightChecks,
  fetchResearchTasks,
  generateResearchTasks,
  resolveContradiction,
  runAgentPreflight,
  runPreflightCheck,
  runRegisteredWorkflowPreflight,
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

  it("loads and triggers contradiction detection through the proxy", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ contradictions: [] });
    vi.stubGlobal("fetch", fetchMock);

    await fetchContradictions("open");
    await detectContradictions();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/contradictions?status=open");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/second-brain/contradictions/detect");
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("resolves contradictions through the proxy", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ contradiction: { id: "contradiction/with space", status: "resolved" } });
    vi.stubGlobal("fetch", fetchMock);

    await resolveContradiction("contradiction/with space", {
      status: "resolved",
      actor: "nous-hermes-dashboard",
      reason: "Operator reviewed the evidence.",
      metadata: { route: "/contradictions" },
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/contradictions/contradiction%2Fwith%20space/resolve");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        status: "resolved",
        actor: "nous-hermes-dashboard",
        reason: "Operator reviewed the evidence.",
        metadata: { route: "/contradictions" },
      }),
    }));
  });

  it("loads and generates research tasks through the proxy", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ tasks: [] });
    vi.stubGlobal("fetch", fetchMock);

    await fetchResearchTasks("queued");
    await generateResearchTasks();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/research-tasks?status=queued");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/second-brain/research-tasks/generate");
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("runs and reads preflight checks through the sensitive proxy endpoints", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({ checks: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runPreflightCheck({
      task: "Deploy dashboard change",
      project: "nous-hermes-agent",
      workflow: "production-deploy",
      riskClass: "high",
      entities: ["dashboard"],
    });
    await fetchPreflightChecks();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/preflight");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        task: "Deploy dashboard change",
        project: "nous-hermes-agent",
        workflow: "production-deploy",
        riskClass: "high",
        entities: ["dashboard"],
      }),
    }));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/second-brain/preflight-checks");
  });

  it("runs automatic agent preflight through the normalized enforcement endpoint", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      check: {
        id: "preflight_1",
        request: {
          task: "Scale earnings backfill",
          project: "investing-system",
          workflow: "earnings-event-backfill",
          riskClass: "high",
          entities: ["earnings", "warehouse"],
        },
        policy: "warn",
        relevantMemories: [],
        relevantDecisions: [],
        contradictions: [],
        staleMemories: [],
        warnings: ["Use warehouse mirror proof."],
        requiredAcknowledgements: [],
        blockReasons: [],
        citations: [],
        createdAt: "2026-10-02T00:00:00.000Z",
        metadata: {},
      },
      injection: {
        policy: "warn",
        task: "Scale earnings backfill",
        workflow: "earnings-event-backfill",
        riskClass: "high",
        mustStop: false,
        mustAcknowledge: false,
        context: { memoryIds: [], decisionIds: [], contradictionIds: [], staleMemoryIds: [], citations: [] },
        warnings: ["Use warehouse mirror proof."],
        requiredAcknowledgements: [],
        blockReasons: [],
      },
      enforcement: {
        mode: "automatic-agent-preflight",
        mustStop: false,
        mustAcknowledge: false,
        proceedSilentlyAllowed: false,
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await runAgentPreflight({
      task: "Scale earnings backfill",
      project: "investing-system",
      workflow: "earnings-event-backfill",
      riskClass: "high",
      entities: ["earnings", "warehouse"],
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/agent-preflight");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        task: "Scale earnings backfill",
        project: "investing-system",
        workflow: "earnings-event-backfill",
        riskClass: "high",
        entities: ["earnings", "warehouse"],
      }),
    }));
  });

  it("loads the high-impact workflow preflight registry", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      workflows: [{
        id: "chat-high-impact-task",
        canonical_plan: "CP-03",
        adapter_class: "chat",
        project: "nous-hermes-agent",
        workflow: "high-impact-agent-task",
        risk_class: "high",
        posture: "preflight_required",
        endpoint: "/api/second-brain/agent-preflight",
        owner: "Nous Hermes",
        reason: "Chat tasks can trigger high-impact actions.",
        evidence_path: "docs/proofs/cp03-second-brain-production-readiness.md",
      }],
      summary: {
        total: 1,
        preflightRequired: 1,
        blockedUntilApproved: 0,
        exemptWithReason: 0,
        valid: true,
        errors: [],
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchHighImpactWorkflowRegistry();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/high-impact-workflows");
  });

  it("runs preflight for a registered high-impact workflow", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      workflow: {
        id: "chat-high-impact-task",
        canonical_plan: "CP-03",
        adapter_class: "chat",
        project: "nous-hermes-agent",
        workflow: "high-impact-agent-task",
        risk_class: "high",
        posture: "preflight_required",
        endpoint: "/api/second-brain/agent-preflight",
        owner: "Nous Hermes",
        reason: "Chat tasks can trigger high-impact actions.",
        evidence_path: "docs/proofs/cp03-second-brain-production-readiness.md",
      },
      check: null,
      injection: {
        policy: "pass",
        task: "Prepare deploy",
        workflow: "high-impact-agent-task",
        riskClass: "high",
        mustStop: false,
        mustAcknowledge: false,
        context: { memoryIds: [], decisionIds: [], contradictionIds: [], staleMemoryIds: [], citations: [] },
        warnings: [],
        requiredAcknowledgements: [],
        blockReasons: [],
      },
      enforcement: {
        mode: "registered-workflow-preflight",
        mustStop: false,
        mustAcknowledge: false,
        proceedSilentlyAllowed: false,
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await runRegisteredWorkflowPreflight("chat-high-impact-task", {
      task: "Prepare deploy",
      actor: "dashboard",
      entities: ["deploy"],
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/high-impact-workflows/chat-high-impact-task/preflight");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        task: "Prepare deploy",
        actor: "dashboard",
        entities: ["deploy"],
      }),
    }));
  });

  it("loads decision intelligence metrics and audit packets through protected proxy routes", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = jsonFetchMock({
      generatedAt: "2026-09-29T00:00:00.000Z",
      status: "ready",
      counts: {
        memories: 1,
        decisions: 1,
        decisionsWithLineage: 1,
        contradictionsOpen: 0,
        contradictionsBlocking: 0,
        researchTasksOpen: 0,
        staleResearchTasks: 0,
        preflightChecks: 1,
        memoryPoorProjects: 0,
      },
      lineageCoverage: { decisions: 1, covered: 1, percent: 100, missingDecisionIds: [] },
      contradictionsByRisk: {},
      researchAge: { oldestOpenTaskAgeHours: null, averageOpenTaskAgeHours: null, staleTaskIds: [] },
      preflightRates: { pass: 1, warn: 0, acknowledge: 0, block: 0, total: 1 },
      memoryUsefulness: {
        memoriesWithSources: 1,
        memoriesLinkedToDecisions: 1,
        decisionsWithOutcomeFollowUp: 1,
        percentWithSources: 100,
        percentLinkedToDecisions: 100,
        percentDecisionsWithOutcomeFollowUp: 100,
      },
      sourceCoverage: [],
      slo: {
        lineageCoverageTargetPercent: 80,
        staleResearchTaskMaxAgeHours: 48,
        blockingContradictionTarget: 0,
        memorySourceCoverageTargetPercent: 80,
        breaches: [],
      },
      findings: [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchDecisionIntelligenceMetrics();
    await fetchDecisionIntelligenceAuditPacket({ recordType: "decision", recordId: "decision/with space" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/second-brain/decision-intelligence/metrics");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/second-brain/decision-intelligence/audit-packet?recordType=decision&recordId=decision%2Fwith+space");
  });
});
