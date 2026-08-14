#!/usr/bin/env node
import path from "node:path";
import { designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const generatedAt = new Date().toISOString();
const registryPath = path.join(designDir, "dashboard-design-intelligence-registry.json");
const mdPath = path.join(designDir, "dashboard-design-intelligence-registry.md");
const reportPath = path.join(designDir, "dashboard-design-intelligence-report.json");
const reportMdPath = path.join(designDir, "dashboard-design-intelligence-report.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-design-intelligence-data.ts");

const screenIntents = [
  {
    id: "command-cockpit",
    label: "Command cockpit",
    density: "standard",
    primaryQuestion: "What needs attention now?",
    requiredBlueprints: ["command-center", "proof-strip", "priority-queue"],
    forbiddenPatterns: ["fat-repeated-banner", "debug-first-layout", "equal-weight-card-wall"]
  },
  {
    id: "planner-workspace",
    label: "Planner workspace",
    density: "comfortable",
    primaryQuestion: "What is being planned, for whom, and what happens next?",
    requiredBlueprints: ["calendar-planner", "right-drawer-workflow", "checklist-export"],
    forbiddenPatterns: ["compact-ops-density", "card-calendar-grid", "unpersisted-form"]
  },
  {
    id: "research-workspace",
    label: "Research workspace",
    density: "comfortable",
    primaryQuestion: "What is the project, what evidence exists, and what decision is next?",
    requiredBlueprints: ["project-navigator", "evidence-board", "inspector-drawer"],
    forbiddenPatterns: ["static-report-only", "unclickable-action-card", "hidden-evidence"]
  },
  {
    id: "approval-queue",
    label: "Approval queue",
    density: "standard",
    primaryQuestion: "What is waiting for review and what can be approved, revised, or declined?",
    requiredBlueprints: ["review-queue", "state-tabs", "decision-buttons"],
    forbiddenPatterns: ["missing-pagination", "visible-long-helper-copy", "duplicate-table-header"]
  },
  {
    id: "market-browser",
    label: "Market browser",
    density: "standard",
    primaryQuestion: "Which market/category should be inspected and why?",
    requiredBlueprints: ["category-browser", "detail-drawer", "live-chart-panel"],
    forbiddenPatterns: ["search-only-default", "blank-selected-state", "hand-drawn-chart"]
  },
  {
    id: "trading-terminal",
    label: "Trading terminal",
    density: "compact",
    primaryQuestion: "What is the instrument state, strategy signal, risk state, and execution state?",
    requiredBlueprints: ["terminal-chart", "watchlist-rail", "order-ticket", "risk-panel"],
    forbiddenPatterns: ["small-chart-in-card", "axisless-financial-chart", "unconfirmed-execution"]
  },
  {
    id: "okr-kpi-cockpit",
    label: "OKR/KPI cockpit",
    density: "standard",
    primaryQuestion: "Are objectives on track, what changed, and who owns the next action?",
    requiredBlueprints: ["objective-tree", "key-result-scorecard", "task-attribution"],
    forbiddenPatterns: ["metric-only-dashboard", "no-owner-governance", "stale-progress"]
  }
];

const blueprints = [
  {
    id: "command-center",
    intent: "command-cockpit",
    requiredSections: ["decision summary", "priority queue", "proof/freshness", "current blockers"],
    optionalSections: ["trend chart", "recent activity", "drilldown drawer"],
    requiredComponents: ["DashboardShell", "MetricCard", "ActionQueue", "ProofStrip", "DataFreshnessStrip"],
    proofRequirements: ["desktop screenshot", "collapsed-sidebar screenshot", "priority action click proof", "stale/error state proof"]
  },
  {
    id: "calendar-planner",
    intent: "planner-workspace",
    requiredSections: ["month grid", "selection state", "right drawer", "library/search", "export checklist"],
    optionalSections: ["generation rules", "household preferences", "pantry state"],
    requiredComponents: ["MealPlannerCalendar", "MealWeekDrawer", "MealLibrary", "ShoppingListExportPanel"],
    proofRequirements: ["month screenshot", "drawer-open screenshot", "multi-select proof", "save/reload proof"]
  },
  {
    id: "research-desk",
    intent: "research-workspace",
    requiredSections: ["project navigator", "active project brief", "evidence board", "workflow actions", "inspector"],
    optionalSections: ["story tree", "source map", "quote bank", "clip list"],
    requiredComponents: ["ResearchDeskWorkspace", "DrilldownPanel", "DataTable", "AlertQueue"],
    proofRequirements: ["new project proof", "resume project proof", "evidence review proof", "workflow save proof"]
  },
  {
    id: "review-queue",
    intent: "approval-queue",
    requiredSections: ["queue status", "tabs", "full-width table", "decision controls", "posting/result status"],
    optionalSections: ["trend chart", "brand filter", "rejection reason drawer"],
    requiredComponents: ["ContentPackageWorkspace", "DataTable", "TimeWindowSelector", "StatePanel"],
    proofRequirements: ["approval screenshot", "decline reason proof", "pagination proof", "post result proof"]
  },
  {
    id: "market-browser",
    intent: "market-browser",
    requiredSections: ["category rail", "market list", "live chart/detail", "freshness/stale state", "pagination"],
    optionalSections: ["stream capacity", "category heatmap", "opportunity matrix"],
    requiredComponents: ["PremiumMarketBrowser", "DataTable", "LineChart", "Drawer", "ProofStrip"],
    proofRequirements: ["category navigation proof", "market selection proof", "real-data chart proof", "insufficient-data state proof"]
  },
  {
    id: "trading-terminal",
    intent: "trading-terminal",
    requiredSections: ["instrument toolbar", "primary chart", "watchlist", "order ticket", "risk/signal sidecar", "positions"],
    optionalSections: ["indicator library", "strategy simulator", "paper/live gate"],
    requiredComponents: ["CandlestickChart", "TradingTerminal", "ActionQueue", "ProofStrip", "DataTable"],
    proofRequirements: ["chart screenshot", "indicator toggle proof", "paper-order rehearsal proof", "risk gate proof"]
  }
];

const maturityLayers = [
  ["design-intent-engine", "Infer screen intent before judging layout.", "Every primary route declares intent, density, primary question, and forbidden patterns."],
  ["experience-blueprints", "Use canonical page/workflow blueprints instead of one-off route structures.", "Each Tier 3 route maps to an approved blueprint."],
  ["component-recommendation-system", "Recommend required kit components and missing component families for a route.", "Migration packets list required/missing components before build."],
  ["design-memory", "Persist approved and rejected user design preferences.", "Preference memory is loaded by review packets and validation."],
  ["taste-calibration-loop", "Turn screenshot approvals/rejections into future acceptance criteria.", "Every material redesign records feedback as repeat/block rules."],
  ["screenshot-aware-review", "Review rendered screenshots, not only DOM/source markers.", "Screenshots are required before visual promotion."],
  ["reference-matching", "Map route intent to Mobbin/reference families automatically.", "Blueprints cite reference families and extraction notes."],
  ["visual-diff-intelligence", "Summarize visual changes and regressions between captures.", "Review packets include before/after delta notes."],
  ["design-system-ci-blockers", "Block promotion when visual intelligence requirements are missing.", "Validation fails when Tier 3 routes lack intent/blueprint/proof."],
  ["production-ux-monitoring", "Track slow loads, stale states, dead clicks, and proof freshness.", "Production UX metrics feed scorecards and stale queues."],
  ["design-debt-autopatcher", "Generate concrete safe patches for known visual debt.", "Next-action reports include patchable selectors and component replacements."],
  ["cross-project-pattern-reuse", "Propagate a fixed pattern to similar routes in other projects.", "Reusable learnings are promoted into dashboard kit then fleet packets."],
  ["product-workflow-proof", "Prove the route supports its core task end to end.", "Primary workflows have executable proof scripts or explicit manual proof."],
  ["design-to-data-contract", "Tie visual components to required data shapes and states.", "Components declare data contracts, freshness, empty, partial, and error states."],
  ["operator-outcome-metrics", "Judge dashboards by decision speed, trust, recovery, and workflow completion.", "Scorecards include outcome metrics beyond visual pass/fail."],
  ["auto-tier-promotion", "Promote only when technical, visual, workflow, production, and human gates pass.", "Tier approval command consumes all required evidence."],
  ["design-system-release-train", "Version design-system standards and migration requirements.", "Kit releases include affected projects and adoption deadlines."],
  ["project-creation-gate", "Prevent new dashboards from starting without blueprint, data, and proof contracts.", "Starter generator requires intent, target tier, and proof route."],
  ["autonomous-fleet-refactor-loop", "Scan fleet, rank safe patches, and produce deployable migration packets.", "Fleet backlog ranks redesign debt by severity and expected score gain."],
  ["human-taste-console", "Expose screenshots, approvals, rejections, and preferences in a review UI.", "Dashboard Kit Gallery shows queue, memory, rubric, blueprints, and decisions."]
].map(([id, purpose, acceptance], index) => ({
  id,
  number: index + 1,
  status: index < 10 ? "active" : "defined",
  purpose,
  acceptance,
  sourceArtifacts: [
    "docs/design/dashboard-design-intelligence-registry.json",
    "docs/design/dashboard-design-preference-memory.json",
    "docs/design/dashboard-visual-maturity-rubric.json",
    "docs/design/dashboard-visual-review-queue.json"
  ],
  enforcementSignals: [
    "intent declared",
    "blueprint mapped",
    "required components listed",
    "proof requirements declared",
    "human review status known"
  ]
}));

const routeIntentMap = [
  ["meal-assistant.main", "planner-workspace", "calendar-planner", "comfortable", "V3"],
  ["media-engine.ops", "approval-queue", "review-queue", "standard", "V3"],
  ["media-business-operations.main", "research-workspace", "research-desk", "comfortable", "V3"],
  ["khashi-vc.roc", "market-browser", "market-browser", "standard", "V3"],
  ["investing-system.roc", "trading-terminal", "trading-terminal", "compact", "V3"],
  ["tlc-capital-group-os.main", "okr-kpi-cockpit", "command-center", "standard", "V3"],
  ["nous-hermes-agent.dashboard", "command-cockpit", "command-center", "standard", "V4"]
].map(([routeId, intent, blueprint, density, targetVisualTier]) => ({
  routeId,
  intent,
  blueprint,
  density,
  targetVisualTier,
  status: "mapped",
  pageContract: {
    requiredForEveryProductionPage: true,
    requiresRouteRegistration: true,
    requiresSpacingTokenProof: true,
    requiresCardDensityProof: true,
    requiresTableContainmentProof: true,
    requiresDrawerAndOverlayProof: true,
    requiresScreenshotStates: ["desktop-expanded", "desktop-collapsed", "overflow-scan", "primary-workflow"]
  },
  nextProof: "capture screenshot, score rubric, run workflow proof, record approval state, prove page-level spacing and card-density contract"
}));

const registry = {
  schemaVersion: 1,
  version: "V1",
  generatedAt,
  title: "Dashboard Design Intelligence Registry",
  status: "active",
  owner: "nous-hermes-agent",
  purpose: "Make visual quality enforce screen intent, experience blueprints, taste memory, reference matching, workflow proof, production UX monitoring, and auto-promotion across the dashboard fleet.",
  promotionPolicy: {
    tier3RequiresIntent: true,
    tier3RequiresBlueprint: true,
    tier3RequiresPageRegistration: true,
    tier3RequiresSpacingContract: true,
    tier3RequiresCardDensityContract: true,
    tier3RequiresTableContainmentContract: true,
    tier3RequiresWorkflowProof: true,
    tier3RequiresScreenshotReview: true,
    tier3RequiresHumanDecision: true,
    tier4RequiresReusablePatternPromotion: true
  },
  screenIntents,
  blueprints,
  maturityLayers,
  routeIntentMap
};

const report = {
  schemaVersion: 1,
  version: registry.version,
  generatedAt,
  summary: {
    layerCount: maturityLayers.length,
    activeLayerCount: maturityLayers.filter((layer) => layer.status === "active").length,
    definedLayerCount: maturityLayers.filter((layer) => layer.status === "defined").length,
    screenIntentCount: screenIntents.length,
    blueprintCount: blueprints.length,
    mappedRouteCount: routeIntentMap.length,
    target: "Move from component presence to experience correctness."
  },
  nextActions: [
    "Require every Tier 3 route to declare screen intent and blueprint.",
    "Add workflow proof scripts for mapped primary routes.",
    "Connect screenshot review results to preference memory.",
    "Promote approved project patterns into @hermes/dashboard-kit.",
    "Use the route intent map to generate project-specific redesign packets."
  ],
  routeIntentMap,
  maturityLayers: maturityLayers.map((layer) => ({
    id: layer.id,
    status: layer.status,
    acceptance: layer.acceptance
  }))
};

writeJson(registryPath, registry);
writeJson(reportPath, report);
writeMarkdown(mdPath, `# Dashboard Design Intelligence Registry

Generated: ${generatedAt}

Purpose: ${registry.purpose}

## Promotion Policy

${markdownTable(
  ["Gate", "Required"],
  Object.entries(registry.promotionPolicy).map(([key, value]) => [key, value ? "yes" : "no"])
)}

## Screen Intents

${markdownTable(
  ["Intent", "Density", "Primary question", "Required blueprints"],
  screenIntents.map((intent) => [intent.label, intent.density, intent.primaryQuestion, intent.requiredBlueprints.join(", ")])
)}

## Blueprints

${markdownTable(
  ["Blueprint", "Intent", "Required sections", "Components", "Proof"],
  blueprints.map((blueprint) => [
    blueprint.id,
    blueprint.intent,
    blueprint.requiredSections.join(", "),
    blueprint.requiredComponents.join(", "),
    blueprint.proofRequirements.join(", ")
  ])
)}

## Maturity Layers

${markdownTable(
  ["#", "Layer", "Status", "Purpose", "Acceptance"],
  maturityLayers.map((layer) => [layer.number, layer.id, layer.status, layer.purpose, layer.acceptance])
)}

## Route Intent Map

${markdownTable(
  ["Route", "Intent", "Blueprint", "Density", "Target"],
  routeIntentMap.map((route) => [route.routeId, route.intent, route.blueprint, route.density, route.targetVisualTier])
)}
`);

writeMarkdown(reportMdPath, `# Dashboard Design Intelligence Report

Generated: ${generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.summary).map(([key, value]) => [key, value])
)}

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}

## Route Intent Map

${markdownTable(
  ["Route", "Intent", "Blueprint", "Density", "Status", "Next proof"],
  routeIntentMap.map((route) => [route.routeId, route.intent, route.blueprint, route.density, route.status, route.nextProof])
)}
`);

writeMarkdown(webDataPath, `// Generated by scripts/generate-dashboard-design-intelligence-system.mjs.
export const dashboardDesignIntelligenceGeneratedAt = ${JSON.stringify(generatedAt)};
export const dashboardDesignIntelligenceSummary = ${JSON.stringify(report.summary, null, 2)} as const;
export const dashboardDesignIntelligenceScreenIntents = ${JSON.stringify(screenIntents, null, 2)} as const;
export const dashboardDesignIntelligenceBlueprints = ${JSON.stringify(blueprints, null, 2)} as const;
export const dashboardDesignIntelligenceLayers = ${JSON.stringify(maturityLayers, null, 2)} as const;
export const dashboardDesignIntelligenceRouteMap = ${JSON.stringify(routeIntentMap, null, 2)} as const;
`);

console.log(`Dashboard design intelligence system generated: ${maturityLayers.length} layers, ${screenIntents.length} intents, ${blueprints.length} blueprints.`);
console.log(`Wrote ${path.relative(root, registryPath)}, ${path.relative(root, reportPath)}, and ${path.relative(root, webDataPath)}`);
