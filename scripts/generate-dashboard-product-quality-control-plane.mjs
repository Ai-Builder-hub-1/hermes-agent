#!/usr/bin/env node
import path from "node:path";
import { designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const generatedAt = new Date().toISOString();
const registryPath = path.join(designDir, "dashboard-product-quality-control-plane.json");
const mdPath = path.join(designDir, "dashboard-product-quality-control-plane.md");
const reportPath = path.join(designDir, "dashboard-product-quality-control-plane-report.json");
const reportMdPath = path.join(designDir, "dashboard-product-quality-control-plane-report.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-product-quality-control-plane-data.ts");

const capabilities = [
  {
    id: "autonomous-product-architect",
    status: "defined",
    purpose: "Infer product surface type, operator workflow, required components, applicable standards, and proof needs before implementation starts.",
    requiredInputs: ["route manifest", "screen intent", "data contract", "operator workflow", "target tier"],
    outputs: ["recommended blueprint", "required components", "proof plan", "known risks"]
  },
  {
    id: "design-system-dependency-graph",
    status: "defined",
    purpose: "Track how every route depends on components, tokens, charts, tables, data contracts, and proof routes.",
    requiredInputs: ["component import scan", "surface manifest", "route registry", "dashboard-kit version"],
    outputs: ["blast radius", "stale component usage", "local override risk", "upgrade order"]
  },
  {
    id: "component-health-scores",
    status: "defined",
    purpose: "Score shared components by proof coverage, usage, accessibility, interaction completeness, defects, and overrides.",
    requiredInputs: ["component registry", "test evidence", "visual baselines", "project usage"],
    outputs: ["component health", "certification status", "replacement candidates"]
  },
  {
    id: "real-user-ux-analytics",
    status: "defined",
    purpose: "Measure production operator behavior, failures, slow paths, and ignored UI regions.",
    requiredInputs: ["runtime telemetry", "route events", "workflow events", "error logs"],
    outputs: ["abandonment signals", "dead-click signals", "slow-route signals", "workflow friction"]
  },
  {
    id: "design-regression-root-cause",
    status: "defined",
    purpose: "Explain why a rendered UI regressed by linking screenshots to component, token, data, viewport, or shell changes.",
    requiredInputs: ["visual diff", "git diff", "dependency graph", "route manifest"],
    outputs: ["probable cause", "affected routes", "safe fix candidates"]
  },
  {
    id: "automated-component-upgrade-campaigns",
    status: "defined",
    purpose: "Generate ordered project migrations when the dashboard kit adds better certified components.",
    requiredInputs: ["component health", "project usage", "deprecated patterns", "proof commands"],
    outputs: ["migration campaign", "project patch queue", "proof checklist"]
  },
  {
    id: "cross-fleet-ux-benchmarking",
    status: "defined",
    purpose: "Compare similar surfaces across projects and promote the strongest implementation as the fleet reference.",
    requiredInputs: ["route intent map", "visual scores", "workflow proof", "human review"],
    outputs: ["best-of-fleet reference", "reuse candidates", "upgrade targets"]
  },
  {
    id: "reference-driven-generation",
    status: "defined",
    purpose: "Convert approved reference patterns into component anatomy, layout constraints, state coverage, and acceptance criteria.",
    requiredInputs: ["reference intake", "screen intent", "blueprint", "taste memory"],
    outputs: ["layout anatomy", "component variants", "acceptance criteria"]
  },
  {
    id: "operator-persona-modeling",
    status: "defined",
    purpose: "Adjust dashboard density, defaults, copy, and proof by operator persona.",
    requiredInputs: ["operator persona", "workflow type", "route blueprint"],
    outputs: ["density decision", "navigation priority", "default state"]
  },
  {
    id: "workflow-outcome-learning",
    status: "defined",
    purpose: "Learn which UI patterns reduce decision time, dead clicks, and manual workarounds.",
    requiredInputs: ["workflow telemetry", "review outcomes", "route history"],
    outputs: ["pattern effectiveness", "recommended replacements", "operator outcome score"]
  },
  {
    id: "design-experiment-framework",
    status: "defined",
    purpose: "Run governed UI experiments for layout, chart, table, sidebar, drawer, and copy variations.",
    requiredInputs: ["experiment hypothesis", "baseline proof", "success metric", "rollback plan"],
    outputs: ["experiment result", "approved pattern", "rejected pattern"]
  },
  {
    id: "acceptance-criteria-generator",
    status: "active",
    purpose: "Generate required visibility, interaction, data-state, screenshot, and workflow proof criteria for every dashboard change.",
    requiredInputs: ["route intent", "blueprint", "component list", "target tier"],
    outputs: ["acceptance checklist", "test commands", "proof artifacts"]
  },
  {
    id: "product-quality-ledger",
    status: "active",
    purpose: "Persist what changed, why it changed, proof before/after, user feedback, regression risk, and follow-up obligations.",
    requiredInputs: ["git diff", "proof output", "review decision", "deployment metadata"],
    outputs: ["quality history", "regression notes", "follow-up queue"]
  },
  {
    id: "self-healing-ui-layer",
    status: "defined",
    purpose: "Automatically apply safe repairs for known issues like missing pagination, duplicate helper text, deprecated classes, and old sidebar patterns.",
    requiredInputs: ["pattern deprecation registry", "design debt registry", "surface validator"],
    outputs: ["safe patch plan", "applied fix", "proof rerun"]
  },
  {
    id: "org-level-design-governance",
    status: "active",
    purpose: "Expose TLC-level ownership, exceptions, release gates, signoffs, and design-system roadmap across all products.",
    requiredInputs: ["fleet registry", "exceptions", "approval states", "release plan"],
    outputs: ["governance state", "blocked promotions", "release readiness"]
  }
];

const fleetRoutes = [
  ["nous-hermes-agent.dashboard", "control-plane", "command-cockpit", "V4", "own the fleet quality console and review state"],
  ["media-engine.ops", "media-operations", "approval-queue", "V3", "prove package generation, approval, rejection, and posting status"],
  ["media-business-operations.main", "media-business", "research-workspace", "V3", "prove project creation, evidence review, and story workflow"],
  ["meal-assistant.main", "household-planning", "planner-workspace", "V3", "prove month calendar, multi-day planning, drawer save, and checklist export"],
  ["khashi-vc.roc", "market-intelligence", "market-browser", "V3", "prove category browse, live chart data, stale states, and pagination"],
  ["investing-system.roc", "trading", "trading-terminal", "V3", "prove chart, indicators, paper execution, risk gate, and no live trade without promotion"],
  ["tlc-capital-group-os.main", "holding-company", "okr-kpi-cockpit", "V3", "prove OKR/KPI hierarchy, ownership, task attribution, and review cadence"],
  ["business-mapper.workspace", "mapping", "research-workspace", "V3", "prove graph workspace, validation queue, deliverables, and advisory flow"],
  ["hermes-os.main", "platform", "command-cockpit", "V3", "prove deployment, routing, health, and adoption governance"],
  ["rinseables-os.main", "commerce-ops", "command-cockpit", "V3", "prove operations cockpit and proof route"]
].map(([routeId, domain, intent, targetTier, proofFocus]) => ({
  routeId,
  domain,
  intent,
  targetTier,
  proofFocus,
  requiredControlPlaneSignals: [
    "route registered",
    "component dependencies known",
    "visual score known",
    "workflow proof known",
    "design debt known",
    "promotion blockers known"
  ]
}));

const gates = [
  {
    id: "pre-build-quality-plan",
    stage: "before-build",
    blocksPromotion: true,
    checks: ["route intent selected", "blueprint selected", "required components listed", "proof plan generated"]
  },
  {
    id: "implementation-quality-gate",
    stage: "during-build",
    blocksPromotion: true,
    checks: ["package-native components used", "local overrides justified", "data states implemented", "workflow controls clickable"]
  },
  {
    id: "rendered-proof-gate",
    stage: "after-build",
    blocksPromotion: true,
    checks: ["screenshots captured", "visual score meets target", "overflow scan clean", "sidebar states clean"]
  },
  {
    id: "production-quality-gate",
    stage: "after-deploy",
    blocksPromotion: true,
    checks: ["proof route fresh", "production load healthy", "runtime errors clean", "workflow telemetry available"]
  },
  {
    id: "human-taste-gate",
    stage: "promotion",
    blocksPromotion: true,
    checks: ["approved or excepted review decision", "rejections recorded", "preference memory updated"]
  }
];

const registry = {
  schemaVersion: 1,
  version: "V1",
  generatedAt,
  title: "Dashboard Product Quality Control Plane",
  status: "active",
  owner: "nous-hermes-agent",
  purpose: "Coordinate autonomous product architecture, dependency mapping, component health, UX telemetry, regression root-cause, upgrade campaigns, reference-driven generation, persona modeling, workflow learning, experiments, acceptance criteria, quality ledger, self-healing repairs, and org-level design governance across the dashboard fleet.",
  policy: {
    everyRouteRequiresControlPlaneSignals: true,
    tier3RequiresQualityGatePass: true,
    productionPromotionRequiresFreshProof: true,
    componentChangesRequireBlastRadius: true,
    safeAutopatchesRequireProofRerun: true,
    userRejectedPatternsBecomeFleetMemory: true
  },
  capabilities,
  fleetRoutes,
  gates
};

const report = {
  schemaVersion: 1,
  version: registry.version,
  generatedAt,
  summary: {
    capabilityCount: capabilities.length,
    activeCapabilityCount: capabilities.filter((item) => item.status === "active").length,
    definedCapabilityCount: capabilities.filter((item) => item.status === "defined").length,
    fleetRouteCount: fleetRoutes.length,
    gateCount: gates.length,
    blockingGateCount: gates.filter((gate) => gate.blocksPromotion).length,
    target: "Move dashboard quality from standards enforcement to a closed-loop product-quality control plane."
  },
  nextActions: [
    "Generate route-level acceptance criteria before each dashboard build.",
    "Create component dependency graphs from import and surface manifests.",
    "Attach rendered visual proof, workflow proof, and human review state to every route.",
    "Score component health and use it to drive upgrade campaigns.",
    "Promote approved project patterns into the dashboard kit and deprecate local imitations."
  ],
  capabilityStatus: capabilities.map((item) => ({
    id: item.id,
    status: item.status,
    purpose: item.purpose
  })),
  fleetRoutes,
  gates
};

writeJson(registryPath, registry);
writeJson(reportPath, report);
writeMarkdown(mdPath, `# Dashboard Product Quality Control Plane

Generated: ${generatedAt}

Purpose: ${registry.purpose}

## Policy

${markdownTable(
  ["Rule", "Required"],
  Object.entries(registry.policy).map(([key, value]) => [key, value ? "yes" : "no"])
)}

## Capabilities

${markdownTable(
  ["Capability", "Status", "Purpose", "Outputs"],
  capabilities.map((item) => [item.id, item.status, item.purpose, item.outputs.join(", ")])
)}

## Fleet Routes

${markdownTable(
  ["Route", "Domain", "Intent", "Target", "Proof focus"],
  fleetRoutes.map((route) => [route.routeId, route.domain, route.intent, route.targetTier, route.proofFocus])
)}

## Gates

${markdownTable(
  ["Gate", "Stage", "Blocks", "Checks"],
  gates.map((gate) => [gate.id, gate.stage, gate.blocksPromotion ? "yes" : "no", gate.checks.join(", ")])
)}
`);

writeMarkdown(reportMdPath, `# Dashboard Product Quality Control Plane Report

Generated: ${generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.summary).map(([key, value]) => [key, value])
)}

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}

## Blocking Gates

${markdownTable(
  ["Gate", "Stage", "Checks"],
  gates.filter((gate) => gate.blocksPromotion).map((gate) => [gate.id, gate.stage, gate.checks.join(", ")])
)}
`);

writeMarkdown(webDataPath, `// Generated by scripts/generate-dashboard-product-quality-control-plane.mjs.
export const dashboardProductQualityControlPlaneGeneratedAt = ${JSON.stringify(generatedAt)};
export const dashboardProductQualityControlPlaneSummary = ${JSON.stringify(report.summary, null, 2)} as const;
export const dashboardProductQualityControlPlaneCapabilities = ${JSON.stringify(capabilities, null, 2)} as const;
export const dashboardProductQualityControlPlaneFleetRoutes = ${JSON.stringify(fleetRoutes, null, 2)} as const;
export const dashboardProductQualityControlPlaneGates = ${JSON.stringify(gates, null, 2)} as const;
`);

console.log(`Dashboard product quality control plane generated: ${capabilities.length} capabilities, ${fleetRoutes.length} routes, ${gates.length} gates.`);
console.log(`Wrote ${path.relative(root, registryPath)}, ${path.relative(root, reportPath)}, and ${path.relative(root, webDataPath)}`);
