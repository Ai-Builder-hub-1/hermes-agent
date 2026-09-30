export type ExecutivePhaseStatus = "ready" | "guarded" | "blocked";
export type ExecutivePhaseRisk = "low" | "medium" | "high" | "critical";

export interface ExecutiveMaturityPhase {
  phase: number;
  id: string;
  title: string;
  objective: string;
  operatingQuestion: string;
  status: ExecutivePhaseStatus;
  score: number;
  risk: ExecutivePhaseRisk;
  owner: string;
  evidence: string[];
  gates: string[];
  metrics: Array<{
    label: string;
    value: string | number;
    target: string;
  }>;
  actions: string[];
  dashboardSurfaces: string[];
}

export interface ExecutiveIntelligenceMaturityPlan {
  generatedAt: string;
  maturityScore: number;
  status: ExecutivePhaseStatus;
  summary: {
    phases: number;
    ready: number;
    guarded: number;
    blocked: number;
    executiveQuestions: number;
    openActions: number;
    evidenceItems: number;
  };
  phases: ExecutiveMaturityPhase[];
  decisionAgenda: Array<{
    id: string;
    title: string;
    urgency: ExecutivePhaseRisk;
    owner: string;
    sourcePhase: string;
    nextStep: string;
  }>;
  operatingCadence: Array<{
    cadence: string;
    ritual: string;
    owner: string;
    output: string;
  }>;
  boardNarrative: string[];
}

export const EXECUTIVE_INTELLIGENCE_PHASES: ExecutiveMaturityPhase[] = [
  {
    phase: 1,
    id: "mission-context",
    title: "Mission And Portfolio Context",
    objective: "Set the executive frame for TLC Capital Group OS across projects, business units, and active operating goals.",
    operatingQuestion: "What are we trying to accomplish, which systems matter, and where should executive attention go first?",
    status: "ready",
    score: 100,
    risk: "medium",
    owner: "TLC Capital Group OS",
    evidence: ["project registry", "business-unit map", "active route inventory", "current maturity ledgers"],
    gates: ["Every tracked project has owner, purpose, production URL, and maturity posture."],
    metrics: [
      { label: "Business units", value: 5, target: "all active units visible" },
      { label: "Tracked systems", value: "Nous, Kashi, Investing, Media, Brain", target: "complete fleet" },
    ],
    actions: ["Review portfolio health before approving new maturity work.", "Keep project purpose and owner current."],
    dashboardSurfaces: ["/operate", "/fleet-maturity-review", "/executive-cockpit"],
  },
  {
    phase: 2,
    id: "source-integration",
    title: "Source Integration Map",
    objective: "Show which production systems feed executive intelligence and whether their data is fresh enough to trust.",
    operatingQuestion: "Are Kashi, Investing System, Media Engine, Hermes Brain, and Nous sending usable data?",
    status: "ready",
    score: 100,
    risk: "high",
    owner: "Operations",
    evidence: ["service health checks", "API proxy contracts", "warehouse sync status", "OAuth connection health"],
    gates: ["No source can be marked trusted without freshness, ownership, and failure visibility."],
    metrics: [
      { label: "Source classes", value: 6, target: "health, cost, trading, media, memory, deploy" },
      { label: "Freshness posture", value: "visible", target: "material slowdowns surfaced" },
    ],
    actions: ["Surface stale sources in the executive cockpit.", "Escalate blocked source feeds to System Workers."],
    dashboardSurfaces: ["/system/freshness", "/system/warehouse", "/second-brain"],
  },
  {
    phase: 3,
    id: "kpi-ontology",
    title: "Executive KPI Ontology",
    objective: "Normalize project signals into comparable executive metrics without flattening domain-specific meaning.",
    operatingQuestion: "Which numbers tell us whether each operating system is healthy, improving, or creating risk?",
    status: "ready",
    score: 100,
    risk: "medium",
    owner: "Hermes",
    evidence: ["operating item summary", "system runtime state", "project maturity tracker", "provider eval metrics"],
    gates: ["Each KPI must name source, freshness, owner, and expected decision use."],
    metrics: [
      { label: "Core KPI groups", value: 8, target: "health, freshness, storage, cost, outcomes, blockers, deploys, learning" },
      { label: "Decision use", value: "required", target: "no vanity-only metrics" },
    ],
    actions: ["Tie every executive metric to a decision or watch condition.", "Retire metrics with no owner."],
    dashboardSurfaces: ["/operate", "/system/analytics", "/provider-eval-execution"],
  },
  {
    phase: 4,
    id: "decision-agenda",
    title: "Decision Agenda",
    objective: "Turn executive intelligence into a prioritized list of decisions, approvals, and blocked calls.",
    operatingQuestion: "What needs a human decision now, what can wait, and what cannot proceed silently?",
    status: "ready",
    score: 100,
    risk: "high",
    owner: "Executive Operator",
    evidence: ["approval queue", "decision lineage", "command gates", "operator queue"],
    gates: ["High-impact work requires cited context, risk class, and explicit approval state."],
    metrics: [
      { label: "Decision classes", value: 5, target: "approve, reject, defer, research, unblock" },
      { label: "Silent proceed risk", value: "blocked", target: "critical memory gaps stop work" },
    ],
    actions: ["Review approval agenda daily.", "Require cited memory before major decisions."],
    dashboardSurfaces: ["/operate/approvals", "/decision-lineage", "/preflight"],
  },
  {
    phase: 5,
    id: "risk-blocker-office",
    title: "Risk And Blocker Office",
    objective: "Rank blockers by business risk and show what action unblocks them.",
    operatingQuestion: "Which blockers materially stop the business, and what exact proof or action clears them?",
    status: "ready",
    score: 100,
    risk: "critical",
    owner: "Operations",
    evidence: ["blocker taxonomy", "incident queue", "risk policy", "production verification"],
    gates: ["Critical blockers require owner, resolution path, proof, and stale date."],
    metrics: [
      { label: "Blocker classes", value: 8, target: "config, source, auth, deploy, warehouse, capacity, policy, evidence" },
      { label: "Risk rank", value: "business impact", target: "ordered by impact, not count" },
    ],
    actions: ["Separate informational blockers from operational blockers.", "Add resolution proof before closing blockers."],
    dashboardSurfaces: ["/operate/blockers", "/operate/incidents", "/production-verification"],
  },
  {
    phase: 6,
    id: "financial-cost-intelligence",
    title: "Financial And Cost Intelligence",
    objective: "Expose cost, provider usage, storage pressure, and return-on-effort in a CEO-readable way.",
    operatingQuestion: "What are we spending, what is expensive, and which work creates measurable leverage?",
    status: "ready",
    score: 100,
    risk: "high",
    owner: "Finance Operations",
    evidence: ["provider usage feeds", "storage usage reports", "resource governance", "cost attribution"],
    gates: ["Cost signals must distinguish run cost, storage growth, provider spend, and wasted work."],
    metrics: [
      { label: "Cost lenses", value: 4, target: "provider, infra, storage, labor proxy" },
      { label: "Resource alerts", value: "actionable", target: "critical alerts explain cause and next step" },
    ],
    actions: ["Tie Discord resource alerts to executive cost posture.", "Show cost trend beside outcomes."],
    dashboardSurfaces: ["/cost-attribution-engine", "/system/storage", "/system/warehouse"],
  },
  {
    phase: 7,
    id: "warehouse-freshness",
    title: "Warehouse And Freshness Intelligence",
    objective: "Make collection, retention, warehouse sync, restore proof, and source freshness visible at executive level.",
    operatingQuestion: "Are we collecting the right data, retaining it safely, and noticing collection slowdowns?",
    status: "ready",
    score: 100,
    risk: "critical",
    owner: "Data Operations",
    evidence: ["warehouse manifests", "sync ledgers", "freshness reports", "restore proof", "retention gates"],
    gates: ["Data is not executive-trusted without freshness status and restore evidence."],
    metrics: [
      { label: "Warehouse dimensions", value: 5, target: "collect, store, prune, mirror, restore" },
      { label: "Freshness SLA", value: "material drift visible", target: "slowdowns trigger attention" },
    ],
    actions: ["Display last successful sync per source.", "Escalate missing restore proof."],
    dashboardSurfaces: ["/system/warehouse", "/system/freshness", "/second-brain"],
  },
  {
    phase: 8,
    id: "trading-investing-intelligence",
    title: "Trading And Investing Intelligence",
    objective: "Roll up Kashi VC, Investing System, OANDA, strategy quality, and research readiness without merging execution authority.",
    operatingQuestion: "What is trade-ready, research-ready, blocked, or explicitly locked from live execution?",
    status: "ready",
    score: 100,
    risk: "critical",
    owner: "Head Trader",
    evidence: ["trading control plane", "portfolio risk office", "strategy backtest lineage", "candidate screen queue"],
    gates: ["Live execution stays locked unless risk, account, promotion, and operator gates all pass."],
    metrics: [
      { label: "Execution authority", value: "separated", target: "research, paper, shadow, live kept distinct" },
      { label: "Deep dives", value: "operator decided", target: "no score-only promotion" },
    ],
    actions: ["Show strategy quality before promotion.", "Route candidate deep dives through operator decision."],
    dashboardSurfaces: ["/trading/head-trader", "/trading/backtesting", "/trading/risk"],
  },
  {
    phase: 9,
    id: "media-audience-intelligence",
    title: "Media And Audience Intelligence",
    objective: "Connect Media Engine output, YouTube analytics, content learning, and production readiness to executive decisions.",
    operatingQuestion: "Which content is working, what audience signal changed, and what should the team produce next?",
    status: "ready",
    score: 100,
    risk: "medium",
    owner: "Media Operations",
    evidence: ["YouTube analytics report", "publishing queue", "story development desk", "production packages"],
    gates: ["Audience claims require source, freshness, and platform context."],
    metrics: [
      { label: "Audience sources", value: "YouTube plus publishing", target: "top-line analytics visible" },
      { label: "Production handoff", value: "packaged", target: "story, evidence, owner, VA, editor queues" },
    ],
    actions: ["Feed YouTube analytics into executive narrative.", "Compare content output with audience response."],
    dashboardSurfaces: ["/operate/evidence", "/learning-engine", "/executive-cockpit"],
  },
  {
    phase: 10,
    id: "memory-lineage",
    title: "Memory, Lineage, And Contradictions",
    objective: "Use Hermes Brain and second-brain data to explain why decisions were made and what changed.",
    operatingQuestion: "Why did we believe this, what evidence supported it, and are any memories stale or contradictory?",
    status: "ready",
    score: 100,
    risk: "high",
    owner: "Hermes Brain",
    evidence: ["decision lineage", "contradiction intelligence", "retrieval packs", "warehouse sync"],
    gates: ["High-impact work cannot use stale or contradicted memory without warning."],
    metrics: [
      { label: "Lineage chain", value: "source to result", target: "source, memory, decision, outcome" },
      { label: "Contradiction rank", value: "business risk", target: "ranked before reuse" },
    ],
    actions: ["Inject relevant memory before major tasks.", "Trigger research when memory goes stale."],
    dashboardSurfaces: ["/decision-lineage", "/contradictions", "/compounding-intelligence"],
  },
  {
    phase: 11,
    id: "automation-governance",
    title: "Automation And Governance",
    objective: "Define what Hermes can do automatically, what requires review, and what must remain locked.",
    operatingQuestion: "Which loops can run on cadence, which actions require approval, and where are circuit breakers active?",
    status: "ready",
    score: 100,
    risk: "critical",
    owner: "Governance",
    evidence: ["cron status", "command gates", "circuit breakers", "release train", "approval policy"],
    gates: ["Automation must name allowed action, rollback, evidence, and approval tier."],
    metrics: [
      { label: "Automation classes", value: 4, target: "observe, refresh, propose, execute" },
      { label: "Execution lock", value: "explicit", target: "dangerous actions gated" },
    ],
    actions: ["Keep observe/refresh loops separate from execution loops.", "Review breaker policy after incidents."],
    dashboardSurfaces: ["/system/automations", "/command-gates", "/release-train-execution"],
  },
  {
    phase: 12,
    id: "board-narrative-cadence",
    title: "Board Narrative And Operating Cadence",
    objective: "Generate a daily and weekly executive story that summarizes health, decisions, risks, costs, and learning.",
    operatingQuestion: "What changed, why does it matter, what are we doing next, and what needs the executive owner?",
    status: "ready",
    score: 100,
    risk: "medium",
    owner: "Executive Operator",
    evidence: ["daily briefing", "weekly narrative", "decision agenda", "outcome learning", "board-ready summary"],
    gates: ["Narratives must cite source surfaces and separate fact, inference, and recommendation."],
    metrics: [
      { label: "Cadences", value: 3, target: "daily, weekly, incident-triggered" },
      { label: "Narrative sections", value: 6, target: "health, changes, decisions, risks, costs, learning" },
    ],
    actions: ["Publish daily executive briefing.", "Archive weekly board narrative with cited evidence."],
    dashboardSurfaces: ["/executive-cockpit", "/operate", "/decision-lineage"],
  },
];

export function buildExecutiveIntelligenceMaturityPlan(now = new Date()): ExecutiveIntelligenceMaturityPlan {
  const phases =
    EXECUTIVE_INTELLIGENCE_PHASES;
  const ready =
    phases.filter((phase) => phase.status === "ready").length;
  const guarded =
    phases.filter((phase) => phase.status === "guarded").length;
  const blocked =
    phases.filter((phase) => phase.status === "blocked").length;
  const evidenceItems =
    phases.reduce((total, phase) => total + phase.evidence.length, 0);
  const openActions =
    phases.reduce((total, phase) => total + phase.actions.length, 0);
  const maturityScore =
    Math.round(phases.reduce((total, phase) => total + phase.score, 0) / phases.length);

  return {
    generatedAt:
      now.toISOString(),
    maturityScore,
    status:
      blocked ? "blocked" : guarded ? "guarded" : "ready",
    summary: {
      phases:
        phases.length,
      ready,
      guarded,
      blocked,
      executiveQuestions:
        phases.length,
      openActions,
      evidenceItems,
    },
    phases,
    decisionAgenda: [
      {
        id:
          "approve-critical-unblockers",
        title:
          "Resolve critical blockers before expanding automation",
        urgency:
          "critical",
        owner:
          "Executive Operator",
        sourcePhase:
          "risk-blocker-office",
        nextStep:
          "Review critical blockers, assign owner, and require proof before closure.",
      },
      {
        id:
          "verify-warehouse-trust",
        title:
          "Confirm warehouse freshness and restore proof",
        urgency:
          "high",
        owner:
          "Data Operations",
        sourcePhase:
          "warehouse-freshness",
        nextStep:
          "Review sync, retention, and restore evidence before trusting executive rollups.",
      },
      {
        id:
          "review-trading-authority",
        title:
          "Keep trading research, paper, and live authority separated",
        urgency:
          "critical",
        owner:
          "Head Trader",
        sourcePhase:
          "trading-investing-intelligence",
        nextStep:
          "Use Head Trader and portfolio risk gates before any promotion decision.",
      },
    ],
    operatingCadence: [
      {
        cadence:
          "Daily",
        ritual:
          "Executive health and blocker review",
        owner:
          "Executive Operator",
        output:
          "Decision agenda with critical changes and stale sources.",
      },
      {
        cadence:
          "Weekly",
        ritual:
          "Board narrative and outcome learning review",
        owner:
          "TLC Capital Group OS",
        output:
          "Cited narrative covering progress, costs, risks, and learning.",
      },
      {
        cadence:
          "Incident-triggered",
        ritual:
          "Breaker and rollback review",
        owner:
          "Operations",
        output:
          "Incident decision record with cause, action, proof, and follow-up.",
      },
    ],
    boardNarrative: [
      "Portfolio context explains what systems matter and why.",
      "Source freshness decides whether executive intelligence can be trusted.",
      "Decision agenda separates approval work from blocked work.",
      "Warehouse, cost, trading, media, and memory signals each keep their own evidence trail.",
      "Automation remains governed by action class, approval tier, rollback, and proof.",
      "The weekly narrative must separate fact, inference, recommendation, and open risk.",
    ],
  };
}
