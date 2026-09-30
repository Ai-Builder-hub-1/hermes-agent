import { fetchJSON } from "@/lib/api";

export type CompoundingHealth = "ready" | "warning" | "critical" | string;

export interface CompoundingProposal {
  id: string;
  type: string;
  title: string;
  priority: string;
  risk: string;
  confidence: string;
  evidence: string[];
  nextAction: string;
  sizing: string;
  policyAction: string;
  executionEnabled: boolean;
  liveTradingLocked: boolean;
  policy: {
    actionClass: string;
    risk: string;
    approval: string;
    proofRequired: string;
    rollbackRequired: boolean;
    liveEffect: boolean;
  };
  requiresApproval: boolean;
  status: string;
}

export interface CompoundingCommitteePacket {
  title: string;
  generatedAt: string;
  decisionMode: string;
  sections: Array<{
    id: string;
    health: string;
    summary: Record<string, unknown>;
  }>;
  proposals: string[];
  approvalRequired: boolean;
  executionEnabled: boolean;
  liveTradingLocked: boolean;
}

export interface CompoundingSummary {
  contractVersion: string;
  generatedAt: string;
  health: CompoundingHealth;
  summary: {
    proposals: number;
    blocked: number;
    requiresApproval: number;
    experiments: number;
    promotionReviews: number;
    demotionReviews: number;
    evidenceCaptures: number;
    sloBreaches: number;
    forecasts: number;
    causalChains: number;
    causalGraphNodes: number;
    triagePackets: number;
    playbooks: number;
    runbookHistory: number;
    businessDomains: number;
    selfAuditGaps: number;
    regressionActions: number;
    fleetControls: number;
    visualBaselines: number;
    interactionRoutes: number;
    launchSystems: number;
    launchReady: number;
    liveTradingLocked: boolean;
    executionEnabled: boolean;
  };
  proposals: CompoundingProposal[];
  committeePacket: CompoundingCommitteePacket;
  automatedEvidence: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      captures: number;
      objectives: number;
      breaches: number;
      burnRate: number;
      dedupeKey: string;
      retention: string;
      historyPoints: number;
    };
    captures: Array<Record<string, string | number | boolean>>;
    slos: {
      objectives: Array<{
        id: string;
        title: string;
        status: string;
        measurement: string;
        severity: string;
        burnRate: number;
        approval: string;
        nextAction: string;
      }>;
      breaches: Array<{
        id: string;
        title: string;
        status: string;
        measurement: string;
        severity: string;
        burnRate: number;
        approval: string;
        nextAction: string;
      }>;
      summary: {
        objectives: number;
        breaches: number;
        burnRate: number;
      };
    };
    sloHistory: {
      contractVersion: string;
      storageMode: string;
      status: string;
      generatedAt: string;
      summary: {
        points: number;
        sources: number;
        liveSeriesConnected: boolean;
      };
      points: Array<Record<string, string | number | boolean>>;
    };
  };
  predictiveIntelligence: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      forecasts: number;
      critical: number;
      causalChains: number;
      graphNodes: number;
      graphEdges: number;
      correlationId: string;
    };
    forecasts: Array<{
      id: string;
      title: string;
      signal: number;
      severity: string;
      confidence: string;
      horizon: string;
      reason: string;
      nextAction: string;
    }>;
    causalChains: Array<{
      id: string;
      correlationId: string;
      nodes: string[];
      summary: string;
      weight: number;
      nextAction: string;
    }>;
    causalGraph: {
      contractVersion: string;
      storageMode: string;
      status: string;
      correlationId: string;
      summary: {
        nodes: number;
        edges: number;
        liveEventJoinsConnected: boolean;
      };
      nodes: Array<Record<string, string | number | boolean>>;
      edges: Array<Record<string, string | number | boolean>>;
    };
  };
  remediation: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      playbooks: number;
      triagePackets: number;
      runbookHistory: number;
      approvalRequired: number;
      executionEnabled: boolean;
    };
    playbooks: Array<{
      id: string;
      title: string;
      mode: string;
      policyAction: string;
      approval: string;
      executionEnabled: boolean;
      steps: string[];
    }>;
    triagePackets: Array<{
      id: string;
      title: string;
      severity: string;
      status: string;
      evidence: string[];
      recommendedAction: string;
      playbookId: string;
      approval: string;
      executionEnabled: boolean;
      suggestedCommand: string;
    }>;
    runbookHistory: Array<{
      id: string;
      playbookId: string;
      status: string;
      observedRuns: number;
      pendingPackets: number;
      lastOutcome: string;
      executionEnabled: boolean;
      nextAction: string;
    }>;
  };
  businessReliabilityCost: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      domains: number;
      criticalDomains: number;
      averageReliability: number;
      costRecommendations: number;
      selfAuditGaps: number;
      regressionActions: number;
    };
    domains: Array<{
      id: string;
      label: string;
      businessUnit: string;
      health: string;
      impact: string;
      openRisks: number;
      nextAction: string;
    }>;
    reliability: Array<{
      id: string;
      domainId: string;
      label: string;
      score: number;
      trend: string;
      driver: string;
    }>;
    costRecommendations: Array<{
      id: string;
      title: string;
      bucket: string;
      signal: number;
      recommendation: string;
      confidence: string;
    }>;
    selfAudit: Array<{
      id: string;
      title: string;
      status: string;
      severity: string;
      nextAction: string;
    }>;
    regressionActions: Array<{
      id: string;
      sourceGap: string;
      title: string;
      status: string;
      approval: string;
      executionEnabled: boolean;
      recommendedAction: string;
      closeoutRequired: boolean;
    }>;
  };
  fleetGovernance: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      controls: number;
      ready: number;
      guarded: number;
      blocked: number;
      explicitPolicies: number;
      businessDomains: number;
      visualBaselines: number;
      executionEnabled: boolean;
    };
    controls: Array<{
      id: string;
      title: string;
      status: string;
      proof: string;
      nextAction: string;
      executionEnabled: boolean;
    }>;
    visualBaselines: Array<{
      id: string;
      route: string;
      label: string;
      status: string;
      captureCommand: string;
      comparisonStorage: string;
    }>;
    autonomy: {
      mode: string;
      executionEnabled: boolean;
      dangerousActions: string;
      nextApprovalGate: string;
    };
  };
  launchReadiness: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      systems: number;
      ready: number;
      guarded: number;
      blocked: number;
      businessDomains: number;
      outcomeReliability?: number;
      executionEnabled: boolean;
    };
    systems: Array<{
      id: string;
      label: string;
      status: string;
      gates: string[];
      evidence: string[];
      nextAction: string;
      executionEnabled: boolean;
    }>;
    decision: {
      launchMode: string;
      executionEnabled: boolean;
      nextAction: string;
    };
  };
  interactionMaturity: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      routes: number;
      windows: number;
      visualStates: number;
      baselineStorageConnected: boolean;
    };
    routes: Array<{
      route: string;
      surface: string;
      status: string;
      windows: string[];
      defaultWindow: string;
      states: string[];
    }>;
    visualStates: Array<{
      id: string;
      status: string;
      surface: string;
    }>;
    remainingLiveWork: string;
  };
  evidence: Record<string, {
    contractVersion?: string;
    health?: string;
    generatedAt?: string;
    summary?: Record<string, unknown>;
  }>;
  blockers: string[];
  recommendations: string[];
}

export function fetchCompoundingSummary(): Promise<CompoundingSummary> {
  return fetchJSON<CompoundingSummary>("/api/compounding-intelligence/summary");
}

export function runCompoundingReview(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/compounding-intelligence/review", { method: "POST" });
}
