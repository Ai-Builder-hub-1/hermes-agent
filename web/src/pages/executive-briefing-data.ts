import type {
  BusinessUnitReportContract,
  ExecutiveBriefingContract,
  ExecutiveDecisionRequest,
  ExecutiveEvidenceRef,
  OfficerReportContract,
} from "@hermes/dashboard-kit";
import {
  aggregateExecutiveBriefingStatus,
  executiveDecisionQueue,
} from "@hermes/dashboard-kit";

const generatedAt = "2026-07-25T12:00:00.000Z";

function evidence(id: string, label: string, kind: ExecutiveEvidenceRef["kind"], href?: string): ExecutiveEvidenceRef {
  return {
    id,
    label,
    kind,
    href,
    freshness: href ? "aging" : "unknown",
    confidence: href ? "medium" : "low",
  };
}

function decision(
  id: string,
  title: string,
  risk: ExecutiveDecisionRequest["risk"],
  summary: string,
  recommendation: string,
  evidenceIds: string[] = [],
): ExecutiveDecisionRequest {
  return {
    id,
    title,
    owner: "Human Co-CEO",
    risk,
    requestedByRole: "chief_of_staff",
    summary,
    recommendation,
    approvalRequired: risk === "high" || risk === "critical",
    evidenceIds,
  };
}

function officerReport(input: Omit<OfficerReportContract, "generatedAt">): OfficerReportContract {
  return { ...input, generatedAt };
}

const sharedEvidence = [
  evidence(
    "hermes-handoff",
    "Hermes OS handoff and readiness assessment",
    "report",
    "/docs/hermes-os-handoff-readiness-assessment.md",
  ),
  evidence(
    "federated-coceo-contract",
    "Federated CoCEO operating contract",
    "report",
    "../hermes/docs/federated-coceo-operating-contract.md",
  ),
  evidence(
    "capacity-cockpit-v2",
    "Mobbin-informed cost cockpit V2 prototype",
    "dashboard",
    "/command-model-cost-cockpit-v2.html",
  ),
];

const mediaEngineOfficerReports: OfficerReportContract[] = [
  officerReport({
    id: "media-engine-coceo-24h",
    businessUnitId: "media-engine",
    role: "business_unit_coceo",
    roleLabel: "Business Unit Co-CEO",
    period: "24h",
    status: "watch",
    summary: "Generation workflows exist and are improving, but platform readiness, cost telemetry, and publish-package review remain the main management concerns.",
    wins: ["Human-recorded video package plan is trackable.", "Brand operations and package generation have clearer contracts."],
    blockers: ["Live platform credentials and social connection status still require operator-owned setup."],
    risks: ["Autopilot publishing should remain gated until channel readiness and cost signals are reliable."],
    recommendedActions: ["Keep direct publishing deferred.", "Prioritize daily output summaries and cost feeds before adding more channels."],
    metrics: [
      { id: "media-engine-output", label: "Output posture", value: "manual-review", status: "watch" },
      { id: "media-engine-cost", label: "Cost posture", value: "partial", status: "watch" },
    ],
    decisionsNeeded: [],
    evidence: [sharedEvidence[0]],
    confidence: "medium",
  }),
  officerReport({
    id: "media-engine-cmo-24h",
    businessUnitId: "media-engine",
    role: "cmo",
    roleLabel: "CMO",
    period: "24h",
    status: "watch",
    summary: "Brand output needs consistency first: clean Discord summaries, reliable package creation, and platform readiness visibility.",
    wins: ["The system now distinguishes package generation from direct publishing."],
    blockers: ["Some channel readiness still depends on external platform configuration."],
    risks: ["Threads and social permission differences can create false issue noise if acknowledgements are not retained."],
    recommendedActions: ["Keep bypass acknowledgements recorded.", "Show postable/not-postable status by brand and platform."],
    metrics: [
      { id: "brand-readiness", label: "Brand readiness", value: "partial", status: "watch" },
      { id: "platform-readiness", label: "Platform readiness", value: "mixed", status: "watch" },
    ],
    decisionsNeeded: [],
    evidence: [],
    confidence: "medium",
  }),
];

const khashiOfficerReports: OfficerReportContract[] = [
  officerReport({
    id: "khashi-coceo-24h",
    businessUnitId: "khashi-vc",
    role: "business_unit_coceo",
    roleLabel: "Business Unit Co-CEO",
    period: "24h",
    status: "watch",
    summary: "The project has shifted from broad experiment generation toward market cartography and learning-first scan coverage.",
    wins: ["Market scanner and segment intelligence direction are clearer.", "Experiment capacity is no longer the only route to learning."],
    blockers: ["Dashboard data must distinguish scans, snapshots, experiments, and resolved-market reconciliation."],
    risks: ["Restarting high-volume experiments before the scanner produces useful market rankings can waste capacity."],
    recommendedActions: ["Hold broad experiment auto-start.", "Build scan-history and tag/category opportunity summaries first."],
    metrics: [
      { id: "khashi-experiment-mode", label: "Experiment mode", value: "paused/redirected", status: "watch" },
      { id: "khashi-learning-mode", label: "Learning mode", value: "market scans", status: "healthy" },
    ],
    decisionsNeeded: [
      decision(
        "khashi-experiment-restart-threshold",
        "Define when Khashi experiments should restart",
        "medium",
        "The scanner can collect useful market data before experiments restart, but the threshold for moving back into experiments is not defined.",
        "Wait until scan-history can rank tags/categories by liquidity, activity, movement, and data confidence.",
      ),
    ],
    evidence: [],
    confidence: "medium",
  }),
];

const hermesOfficerReports: OfficerReportContract[] = [
  officerReport({
    id: "hermes-technical-controller-24h",
    businessUnitId: "hermes-os",
    role: "cto_operator",
    roleLabel: "Technical Controller",
    period: "24h",
    status: "watch",
    summary: "Local technical control-plane machinery in the Hermes project is strong. The open gap is enterprise/live production integration, not another local planning pass.",
    wins: ["Separate Hermes project confirms local technical control plane and central command contract are mature.", "Handoff now accounts for existing Hermes queue, agent, workflow, CoCEO, and deploy-spine code."],
    blockers: ["Production SSH/drills, central logs, external secret rails, and TLC authority matrix remain external/system integration work."],
    risks: ["Future agents may rebuild working Hermes internals in Nous unless the handoff stays visible."],
    recommendedActions: ["Reuse projects/hermes implementations.", "Connect through contracts and feeds rather than copying logic."],
    metrics: [
      { id: "hermes-local-readiness", label: "Local readiness", value: "5/5", status: "healthy" },
      { id: "hermes-enterprise-readiness", label: "Enterprise integration", value: "2.5/5", status: "watch" },
    ],
    decisionsNeeded: [],
    evidence: [sharedEvidence[0], sharedEvidence[1]],
    confidence: "high",
  }),
];

function businessUnit(input: Omit<BusinessUnitReportContract, "generatedAt">): BusinessUnitReportContract {
  return { ...input, generatedAt };
}

const businessUnits: BusinessUnitReportContract[] = [
  businessUnit({
    id: "hermes-os-24h",
    businessUnitId: "hermes-os",
    businessUnitName: "Hermes OS",
    period: "24h",
    status: "watch",
    readinessPercent: 58,
    summary: "Strong local technical control plane; live enterprise integration and always-on runtime remain open.",
    coceoRead: "Use Hermes as the technical builder rail. Do not treat it as a normal revenue-owning business unit.",
    currentFocus: ["executive reporting", "project feeds", "production evidence", "safe runtime"],
    blockers: ["TLC authority matrix", "production SSH/drills", "central logs", "external secret rails"],
    risks: ["Rebuilding existing Hermes internals in Nous", "Mistaking static dashboards for live operations"],
    costPosture: "watch",
    revenuePosture: "not_applicable",
    officerReports: hermesOfficerReports,
    decisionsNeeded: [],
    evidence: [sharedEvidence[0], sharedEvidence[1]],
  }),
  businessUnit({
    id: "media-engine-24h",
    businessUnitId: "media-engine",
    businessUnitName: "Media Engine",
    period: "24h",
    status: "watch",
    readinessPercent: 72,
    summary: "Generation/package infrastructure is useful, but platform readiness and cost telemetry must become more reliable before deeper autonomy.",
    coceoRead: "Stabilize package output and reporting before direct publishing automation.",
    currentFocus: ["brand output consistency", "platform readiness", "cost feed", "manual upload package"],
    blockers: ["provider credentials", "social account status", "platform postability feeds"],
    risks: ["Discord noise", "unbounded generated assets", "publishing before channel readiness"],
    costPosture: "watch",
    revenuePosture: "unknown",
    officerReports: mediaEngineOfficerReports,
    decisionsNeeded: [],
    evidence: [],
  }),
  businessUnit({
    id: "khashi-vc-24h",
    businessUnitId: "khashi-vc",
    businessUnitName: "Khashi VC",
    period: "24h",
    status: "watch",
    readinessPercent: 68,
    summary: "The best current direction is scanner-led market intelligence before restarting broad experiments.",
    coceoRead: "Use broad market scans to identify worthwhile tags/categories, then restart experiments with evidence.",
    currentFocus: ["market cartography", "tag/category ranking", "resolved-market reconciliation", "experiment restart criteria"],
    blockers: ["scan-history UX", "data usefulness summaries", "resolution reconciliation"],
    risks: ["Wasting capacity on flat or dead markets", "over-indexing on 2-7d buckets"],
    costPosture: "healthy",
    revenuePosture: "known",
    officerReports: khashiOfficerReports,
    decisionsNeeded: [
      decision(
        "khashi-experiment-restart-threshold-unit",
        "Approve Khashi experiment restart criteria",
        "medium",
        "Experiments should not restart automatically until market scanner evidence produces useful rankings.",
        "Define minimum scan coverage and liquidity/activity thresholds.",
      ),
    ],
    evidence: [],
  }),
  businessUnit({
    id: "tlc-capital-group-os-24h",
    businessUnitId: "tlc-capital-group-os",
    businessUnitName: "TLC Capital Group OS",
    period: "24h",
    status: "watch",
    readinessPercent: 88,
    summary: "TLC OS is the enterprise authority layer; it needs to consume Hermes and business-unit reports without owning low-level runtime execution.",
    coceoRead: "Finish authority and portfolio-feed adoption so Hermes can report upward cleanly.",
    currentFocus: ["business-unit readiness", "enterprise authority", "portfolio rollup", "backlog governance"],
    blockers: ["authority matrix", "business-unit feed consistency"],
    risks: ["Duplicating command center responsibilities across projects"],
    costPosture: "unknown",
    revenuePosture: "pending",
    officerReports: [],
    decisionsNeeded: [
      decision(
        "tlc-authority-matrix",
        "Finalize TLC authority matrix",
        "high",
        "Hermes can enforce technical gates, but enterprise approval ownership must be confirmed in TLC OS.",
        "Define owners for production, spend, external publishing, destructive actions, and business strategy approvals.",
        ["federated-coceo-contract"],
      ),
    ],
    evidence: [sharedEvidence[1]],
  }),
  businessUnit({
    id: "rinseables-os-24h",
    businessUnitId: "rinseables-os",
    businessUnitName: "Rinseables OS",
    period: "24h",
    status: "unknown",
    readinessPercent: 40,
    summary: "Rinseables OS is recognized as a business-unit/product OS, but its current feed into Hermes is not yet standardized.",
    coceoRead: "Add scoped readiness and CoCEO summaries when that project becomes active again.",
    currentFocus: ["naming alignment", "readiness feed", "product operating model"],
    blockers: ["missing standardized report feed"],
    risks: ["Legacy Principles naming may confuse future agents"],
    costPosture: "unknown",
    revenuePosture: "unknown",
    officerReports: [],
    decisionsNeeded: [],
    evidence: [],
  }),
];

export const sampleExecutiveBriefing: ExecutiveBriefingContract = {
  id: "tlc-executive-briefing-2026-07-25",
  organizationId: "tlc-capital-group",
  organizationName: "TLC Capital Group",
  period: "24h",
  status: "watch",
  summary: "The system is ready for executive reporting contracts and project-feed standardization. Local Hermes technical control-plane capability is stronger than previously reflected, but production integration and live operating feeds are still the main gap.",
  whatChanged: [
    "The handoff now accounts for the separate projects/hermes implementation.",
    "Overall readiness moved from 52% to 58% after recognizing local technical control-plane maturity.",
    "Cost cockpit V2 gives the target shape for business-unit spend and provider attribution.",
  ],
  topPriorities: [
    "Create structured co-CEO and officer reports.",
    "Roll out standard project outcome/report feeds.",
    "Build the Executive Briefing Room as the first-screen operating layer.",
    "Keep production actions and paid-provider fallbacks approval-gated.",
  ],
  decisionsNeeded: [
    decision(
      "production-rails-window",
      "Pick an approved window for production drills",
      "high",
      "Hetzner promotion, restore drills, and live checks need operator-approved production access and timing.",
      "Defer until report/feed layer is stable unless production incidents force it.",
    ),
  ],
  businessUnits,
  evidence: sharedEvidence,
  generatedAt,
};

export function buildExecutiveBriefingViewModel(briefing = sampleExecutiveBriefing) {
  const decisions = executiveDecisionQueue(briefing);
  const atRiskUnits = briefing.businessUnits.filter((unit) => ["watch", "degraded", "blocked"].includes(unit.status));
  const unknownUnits = briefing.businessUnits.filter((unit) => unit.status === "unknown");
  const officerReportCount = briefing.businessUnits.reduce((total, unit) => total + unit.officerReports.length, 0);
  const readinessValues = briefing.businessUnits
    .map((unit) => unit.readinessPercent)
    .filter((value): value is number => typeof value === "number");
  const averageReadiness = readinessValues.length
    ? Math.round(readinessValues.reduce((total, value) => total + value, 0) / readinessValues.length)
    : 0;
  return {
    briefing,
    status: aggregateExecutiveBriefingStatus(briefing),
    decisions,
    atRiskUnits,
    unknownUnits,
    officerReportCount,
    averageReadiness,
  };
}

