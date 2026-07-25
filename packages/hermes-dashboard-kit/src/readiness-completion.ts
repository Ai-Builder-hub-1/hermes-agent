import type { DashboardOperationalStatus } from "./contracts";

export type ReadinessCompletionKind =
  | "local-complete"
  | "local-buildable"
  | "downstream-needed"
  | "external-blocked";

export interface ReadinessCompletionArea {
  id: string;
  label: string;
  ownerProjectId: string;
  status: DashboardOperationalStatus;
  kind: ReadinessCompletionKind;
  previousPercent: number;
  currentPercent: number;
  targetPercent: number;
  evidence: string[];
  remainingLocalWork: string[];
  externalBlockers: string[];
}

export interface ReadinessCompletionAssessment {
  id: string;
  generatedAt: string;
  previousOverallPercent: number;
  currentOverallPercent: number;
  localSurfacePercent: number;
  externalIntegrationPercent: number;
  summary: string;
  completedLocalCapabilities: string[];
  nextLocalBuildQueue: string[];
  externalBlockers: string[];
  downstreamProjectWork: string[];
  areas: ReadinessCompletionArea[];
}

const generatedAt = "2026-07-25T18:00:00.000Z";

export function buildHermesReadinessCompletionAssessment(): ReadinessCompletionAssessment {
  const areas: ReadinessCompletionArea[] = [
    {
      id: "executive-cockpit",
      label: "Executive Cockpit",
      ownerProjectId: "nous-hermes-agent",
      status: "watch",
      kind: "local-buildable",
      previousPercent: 55,
      currentPercent: 68,
      targetPercent: 90,
      evidence: [
        "Executive Briefing Room route",
        "Executive reporting contract",
        "Decision queue and evidence rollups",
      ],
      remainingLocalWork: [
        "Add project adapter ingestion status to the daily briefing.",
        "Expose launch/fix actions behind approval gates.",
      ],
      externalBlockers: [
        "Live project feeds are not standardized across every OS.",
      ],
    },
    {
      id: "business-unit-readiness-hub",
      label: "Business-Unit Readiness Hub",
      ownerProjectId: "tlc-capital-group-os",
      status: "watch",
      kind: "downstream-needed",
      previousPercent: 60,
      currentPercent: 68,
      targetPercent: 90,
      evidence: [
        "Project plan command center",
        "TLC portfolio/reporting contract direction",
        "Per-unit briefing cards",
      ],
      remainingLocalWork: [
        "Keep a registry-backed list of business units and shared capabilities.",
      ],
      externalBlockers: [
        "TLC authority matrix and per-project feed publishing need downstream implementation.",
      ],
    },
    {
      id: "cost-capacity-observability",
      label: "Cost/Capacity Observability",
      ownerProjectId: "nous-hermes-agent",
      status: "watch",
      kind: "external-blocked",
      previousPercent: 45,
      currentPercent: 58,
      targetPercent: 90,
      evidence: [
        "Capacity command center prototype",
        "Model cost cockpit V2",
        "Provider attribution target model",
      ],
      remainingLocalWork: [
        "Normalize provider cost events into one dashboard feed.",
      ],
      externalBlockers: [
        "OpenAI admin billing access",
        "Google Cloud Billing export credentials",
        "Gemini billing/export source",
        "DeepSeek/Fireworks balance or invoice feeds",
      ],
    },
    {
      id: "project-context-engine",
      label: "Project Context Engine",
      ownerProjectId: "nous-hermes-agent",
      status: "watch",
      kind: "local-buildable",
      previousPercent: 58,
      currentPercent: 63,
      targetPercent: 85,
      evidence: [
        "Plan document indexer",
        "Project plan command center",
        "Command-center dashboard summaries",
      ],
      remainingLocalWork: [
        "Store plan index snapshots as durable artifacts.",
        "Add stale-plan and blocker classification fields.",
      ],
      externalBlockers: [
        "Some project repositories still need plan feeds and report conventions.",
      ],
    },
    {
      id: "production-operations",
      label: "Production Operations",
      ownerProjectId: "hermes",
      status: "watch",
      kind: "external-blocked",
      previousPercent: 45,
      currentPercent: 45,
      targetPercent: 85,
      evidence: [
        "Hermes deploy spine",
        "Hetzner scripts",
        "Promotion and rollback concepts",
      ],
      remainingLocalWork: [
        "Surface production state and last drill evidence in the command center.",
      ],
      externalBlockers: [
        "Approved production SSH windows",
        "Live restore drill evidence",
        "Secret and environment variable rails",
      ],
    },
    {
      id: "multi-agent-execution",
      label: "Multi-Agent Execution",
      ownerProjectId: "hermes",
      status: "watch",
      kind: "external-blocked",
      previousPercent: 35,
      currentPercent: 35,
      targetPercent: 80,
      evidence: [
        "Hermes queue and agent role foundations",
        "Delegation and communication modules",
      ],
      remainingLocalWork: [
        "Display dispatch readiness and queued agent work in the dashboard.",
      ],
      externalBlockers: [
        "Always-on worker runtime",
        "Merge coordination",
        "Review and promotion enforcement",
      ],
    },
  ];

  return {
    id: "hermes-readiness-completion-2026-07-25",
    generatedAt,
    previousOverallPercent: 58,
    currentOverallPercent: 64,
    localSurfacePercent: 76,
    externalIntegrationPercent: 49,
    summary:
      "Nous Hermes now has the local executive command-center surface, reporting contract, plan intelligence, and readiness boundary model needed for the first operating layer. The remaining gap is mostly live feed integration, production evidence, provider billing access, and always-on execution.",
    completedLocalCapabilities: [
      "Main Hermes command dashboard prototype",
      "Executive Briefing Room route",
      "Project plan command center",
      "Executive reporting contract",
      "Capacity command center prototype",
      "Readiness completion boundary model",
    ],
    nextLocalBuildQueue: [
      "Project feed adapter registry",
      "Action launcher approval gates",
      "Durable plan/readiness snapshot artifacts",
      "Production state evidence cards",
    ],
    externalBlockers: [
      "Provider billing credentials and exports",
      "Live project report feeds from every OS",
      "Production SSH/drill windows",
      "TLC authority matrix signoff",
      "Always-on multi-agent runtime",
    ],
    downstreamProjectWork: [
      "TLC Capital Group OS: authority matrix and portfolio governance feed",
      "Hermes: always-on worker dispatch and production drill evidence",
      "Media Engine: platform readiness, provider cost, and publishing package feeds",
      "Khashi VC: scanner history and experiment restart criteria feed",
      "Rinseables OS: standardized business/product OS report feed",
    ],
    areas,
  };
}
