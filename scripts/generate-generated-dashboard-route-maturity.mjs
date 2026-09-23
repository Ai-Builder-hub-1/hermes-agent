#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const metadataPath = path.join(root, "web/src/dashboard-page-metadata.ts");
const evidenceBindingsPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const jsonPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const mdPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.md");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-maturity-data.ts");
const webRuntimeJsonPath = path.join(root, "web/src/pages/generated-dashboard-route-maturity-ledger.runtime.json");

const pageSource = fs.readFileSync(pagePath, "utf8");
const metadataSource = fs.readFileSync(metadataPath, "utf8");
const routeRows = [...pageSource.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((match) => ({
  exportName: match[1],
  route: match[2],
  title: match[3],
}));
const metadataRoutes = new Set([...metadataSource.matchAll(/route:\s*"([^"]+)"/g)].map((match) => match[1]));
const evidenceBindings = readJsonIfExists(evidenceBindingsPath, { routeBindings: [] });
const evidenceByRoute = new Map((evidenceBindings.routeBindings ?? []).map((entry) => [entry.route, entry]));

const layerDefinitions = [
  ["route-coverage", "Route resolves to a real dashboard page and has an owner, priority, and route identity."],
  ["page-contract", "Page declares purpose, target user, data contracts, required states, validation, and proof expectations."],
  ["data-binding", "Page is wired to live API, warehouse, or generated evidence data with source and freshness context."],
  ["state-coverage", "Page renders normal, loading, empty, error, stale, degraded, critical, permission-limited, and mobile states."],
  ["observability", "Page shows worker, collector, runner, sync, storage, alert, or deployment status where relevant."],
  ["drill-down", "Aggregate signals link to project, source, worker, job, table, event, alert, or evidence-level detail."],
  ["cross-project-standard", "Infrastructure telemetry uses shared fleet schemas and can be compared across projects."],
  ["command-control", "Operational commands are permissioned, audited, confirmed, and tied to rollback or recovery evidence."],
  ["alerting-escalation", "Warnings and critical alerts have thresholds, dedupe, ownership, dashboard links, and resolution tracking."],
  ["warehouse-storage", "Collection, database growth, external mirror, retention, pruning, backup, restore, and orphan evidence are visible."],
  ["component-maturity", "Page uses dashboard-kit or approved domain components with no static placeholder surface."],
  ["ux-visual-maturity", "Layout, density, filters, responsive behavior, severity language, and empty states are production-quality."],
  ["testing-proof", "Build, route smoke, contract, state, permission, command, screenshot, and production smoke proof exists."],
  ["governance-ledger", "Route status, blockers, evidence, and next maturity action are recorded in this ledger."],
  ["production-readiness", "Route is data-bound, tested, deployed, observable, actionable, and regression-protected."],
];

const priorityRules = [
  [/central-command|incident|secret|production|hard-breaker/i, "P0"],
  [/data|telemetry|deployment|cost|permission|storage|warehouse/i, "P1"],
  [/design|marketplace|prototype|learning|eval/i, "P2"],
];

const familyRules = [
  [/design|theme|prototype|marketplace/i, "Design System"],
  [/executive|cockpit|business-os|central-command|hermes-os/i, "Executive"],
  [/secret|permission|breaker|gate/i, "Security"],
  [/cost|billing|finance/i, "Finance"],
  [/learning|eval|outcome/i, "Learning"],
  [/adapter|provider|ssh|network/i, "Adapters"],
  [/data|telemetry|memory|artifact|subscription/i, "Data"],
  [/deployment|promotion|production|release/i, "Deployment"],
  [/agent|task|model|loop|autonomy/i, "Agents"],
];

const entries = routeRows.map((row) => {
  const key = `${row.exportName} ${row.route}`;
  const family = firstMatch(familyRules, key, "Operations");
  const priority = firstMatch(priorityRules, key, "P3");
  const hasRouteMetadata = metadataRoutes.has(row.route);
  const evidenceBinding = evidenceByRoute.get(row.route);
  const currentStage = hasRouteMetadata ? "contract-registered" : "family-contract";
  const completedLayers = ["route-coverage", "page-contract", "component-maturity", "governance-ledger"];
  if (hasRouteMetadata) completedLayers.push("cross-project-standard");
  if (evidenceBinding?.dataBindingStatus === "bound") completedLayers.push("data-binding");
  if (evidenceBinding?.observabilityStatus === "bound") completedLayers.push("observability");
  if (evidenceBinding?.drillDownStatus === "bound") completedLayers.push("drill-down");
  if (evidenceBinding?.stateCoverage?.status === "covered") completedLayers.push("state-coverage");
  if (evidenceBinding?.uxVisualMaturity?.status === "ready") completedLayers.push("ux-visual-maturity");
  if (evidenceBinding?.freshnessSummary?.status === "visible") completedLayers.push("alerting-escalation");
  if (evidenceBinding?.infrastructureConnections?.status === "connected" && evidenceBinding?.payloadMaturity?.status === "externalized") completedLayers.push("warehouse-storage");
  if (evidenceBinding?.regressionProof?.status === "ready" && evidenceBinding?.liveSourceContracts?.status === "contracted") completedLayers.push("testing-proof");
  if (evidenceBinding?.commandReadiness?.commandControlStatus === "governed-ready") completedLayers.push("command-control");
  const openLayers = layerDefinitions.map(([id]) => id).filter((id) => !completedLayers.includes(id));
  const nextOpenLayer = openLayers[0] ?? "production-readiness";
  const score = Math.round((completedLayers.length / layerDefinitions.length) * 100);
  const layerStatus = layerDefinitions.map(([id, description], index) => ({
    id,
    order: index + 1,
    description,
    status: completedLayers.includes(id) ? "complete" : "open",
    evidence: completedLayers.includes(id) ? evidenceForLayer(id, row.route, hasRouteMetadata) : [],
    blocker: completedLayers.includes(id) ? null : blockerForLayer(id, family),
  }));

  return {
    exportName: row.exportName,
    route: row.route,
    title: row.title,
    family,
    priority,
    currentStage,
    score,
    hasRouteMetadata,
    completedLayers,
    openLayers,
    nextOpenLayer,
    layerStatus,
    evidenceBinding: evidenceBinding ? {
      dataBindingStatus: evidenceBinding.dataBindingStatus,
      observabilityStatus: evidenceBinding.observabilityStatus,
      drillDownStatus: evidenceBinding.drillDownStatus,
      freshnessStatus: evidenceBinding.freshnessStatus,
      sourceCount: evidenceBinding.sourceBindings.filter((source) => source.status !== "missing").length,
      signalCount: evidenceBinding.dataSignals.length,
      drillDownCount: evidenceBinding.drillDownTargets.length,
      stateCoverageStatus: evidenceBinding.stateCoverage.status,
      stateFixtureCount: evidenceBinding.stateCoverage.stateFixtures.length,
      uxVisualStatus: evidenceBinding.uxVisualMaturity.status,
      uxChecklistCount: evidenceBinding.uxVisualMaturity.reviewChecklist.length,
      freshnessVisibilityStatus: evidenceBinding.freshnessSummary.status,
      infrastructureConnectionStatus: evidenceBinding.infrastructureConnections.status,
      infrastructureConnectionCount: evidenceBinding.infrastructureConnections.connections.length,
      payloadMaturityStatus: evidenceBinding.payloadMaturity.status,
      liveSourceContractStatus: evidenceBinding.liveSourceContracts.status,
      liveSourceContractCount: evidenceBinding.liveSourceContracts.sourceContracts.length,
      regressionProofStatus: evidenceBinding.regressionProof.status,
      regressionProofCheckCount: evidenceBinding.regressionProof.proofChecks.length,
      commandReadinessStatus: evidenceBinding.commandReadiness.status,
      commandControlStatus: evidenceBinding.commandReadiness.commandControlStatus,
      actionRegistryCount: evidenceBinding.commandReadiness.actionRegistry.length,
      readOnlyCommandCount: evidenceBinding.commandReadiness.readOnlyActions.length,
      gatedCommandCount: evidenceBinding.commandReadiness.gatedActions.length,
      auditPolicyStatus: evidenceBinding.commandReadiness.auditPolicy.status,
      cooldownPolicyStatus: evidenceBinding.commandReadiness.cooldownPolicy.status,
      disabledReasonPolicyStatus: evidenceBinding.commandReadiness.disabledReasonPolicy.status,
    } : null,
    nextMaturityAction: nextActionFor(family),
    proofRequired: proofFor(family),
  };
});

const totals = {
  routeCount: entries.length,
  registeredContractCount: entries.filter((entry) => entry.hasRouteMetadata).length,
  familyContractCount: entries.filter((entry) => !entry.hasRouteMetadata).length,
  p0Count: entries.filter((entry) => entry.priority === "P0").length,
  p1Count: entries.filter((entry) => entry.priority === "P1").length,
  p0OpenLayerCount: entries.filter((entry) => entry.priority === "P0").reduce((sum, entry) => sum + entry.openLayers.length, 0),
  p1OpenLayerCount: entries.filter((entry) => entry.priority === "P1").reduce((sum, entry) => sum + entry.openLayers.length, 0),
  dataBoundCount: entries.filter((entry) => entry.completedLayers.includes("data-binding")).length,
  observabilityBoundCount: entries.filter((entry) => entry.completedLayers.includes("observability")).length,
  drillDownBoundCount: entries.filter((entry) => entry.completedLayers.includes("drill-down")).length,
  stateCoveredCount: entries.filter((entry) => entry.completedLayers.includes("state-coverage")).length,
  uxVisualReadyCount: entries.filter((entry) => entry.completedLayers.includes("ux-visual-maturity")).length,
  freshnessVisibleCount: entries.filter((entry) => entry.completedLayers.includes("alerting-escalation")).length,
  infrastructureConnectedCount: entries.filter((entry) => entry.completedLayers.includes("warehouse-storage")).length,
  runtimePayloadExternalizedCount: entries.filter((entry) => entry.evidenceBinding?.payloadMaturityStatus === "externalized").length,
  liveSourceContractedCount: entries.filter((entry) => entry.evidenceBinding?.liveSourceContractStatus === "contracted").length,
  regressionProofReadyCount: entries.filter((entry) => entry.completedLayers.includes("testing-proof")).length,
  readOnlyCommandReadyCount: entries.filter((entry) => entry.evidenceBinding?.commandReadinessStatus === "read-only-ready").length,
  commandControlReadyCount: entries.filter((entry) => entry.completedLayers.includes("command-control")).length,
  averageScore: Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, entries.length)),
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "web/src/pages/GeneratedDashboardPages.tsx",
  policy: {
    placeholderRoutesAllowed: false,
    requiredLayerCount: layerDefinitions.length,
    productionReadyRequiresAllLayers: true,
  },
  layers: layerDefinitions.map(([id, description], index) => ({ id, order: index + 1, description })),
  totals,
  entries,
};

fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
fs.mkdirSync(path.dirname(webDataPath), { recursive: true });
fs.writeFileSync(webRuntimeJsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(webDataPath, renderWebData(report));

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);
console.log(`Wrote ${path.relative(root, webDataPath)}`);
console.log(`Wrote ${path.relative(root, webRuntimeJsonPath)}`);

function firstMatch(rules, key, fallback) {
  return rules.find(([pattern]) => pattern.test(key))?.[1] ?? fallback;
}

function readJsonIfExists(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function nextActionFor(family) {
  const actions = {
    Executive: "Bind portfolio summaries, action queues, and executive drill-throughs.",
    "Design System": "Connect adoption registry, visual proof, and exception retirement data.",
    Operations: "Wire runner health, queue status, incident flow, and remediation actions.",
    Agents: "Bind task routing, loop runs, model routing, approvals, and autonomy gates.",
    Data: "Wire source freshness, warehouse growth, external mirror lag, retention, pruning, and restore proof.",
    Security: "Connect permission gates, secret scans, blocked commands, and remediation evidence.",
    Finance: "Bind cost attribution, billing provider data, reconciliation status, and anomaly review.",
    Learning: "Wire golden evals, model comparisons, outcomes, regressions, and learning feeds.",
    Deployment: "Connect promotion state, environment health, rollback readiness, and release evidence.",
    Adapters: "Bind provider health, credentials posture, rollout state, and failure-mode proof.",
  };
  return actions[family] ?? actions.Operations;
}

function proofFor(family) {
  const proof = {
    Executive: ["portfolio health data", "action queue data", "drill-through screenshots", "production smoke"],
    "Design System": ["adoption report", "exception register", "visual screenshots", "component validation"],
    Operations: ["worker run ledger", "queue telemetry", "incident evidence", "command audit"],
    Agents: ["routing ledger", "loop heartbeats", "approval audit", "autonomy gate results"],
    Data: ["freshness ledger", "storage growth ledger", "mirror verification", "retention and pruning evidence"],
    Security: ["permission coverage", "secret scan results", "blocked-command ledger", "remediation proof"],
    Finance: ["provider billing import", "attribution ledger", "reconciliation proof", "anomaly review"],
    Learning: ["eval run output", "outcome feed", "regression report", "model comparison evidence"],
    Deployment: ["release artifact", "smoke test", "rollback plan", "environment health"],
    Adapters: ["provider contract", "connectivity check", "failure-mode test", "rollout evidence"],
  };
  return proof[family] ?? proof.Operations;
}

function renderMarkdown(report) {
  const lines = [
    "# Generated Dashboard Route Maturity Ledger",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Routes: ${report.totals.routeCount}`,
    `- Registered contracts: ${report.totals.registeredContractCount}`,
    `- Family contracts: ${report.totals.familyContractCount}`,
    `- P0 routes: ${report.totals.p0Count}`,
    `- P1 routes: ${report.totals.p1Count}`,
    `- P0 open layers: ${report.totals.p0OpenLayerCount}`,
    `- P1 open layers: ${report.totals.p1OpenLayerCount}`,
    `- Data-bound routes: ${report.totals.dataBoundCount}`,
    `- Observability-bound routes: ${report.totals.observabilityBoundCount}`,
    `- Drill-down-bound routes: ${report.totals.drillDownBoundCount}`,
    `- State-covered routes: ${report.totals.stateCoveredCount}`,
    `- UX-ready routes: ${report.totals.uxVisualReadyCount}`,
    `- Freshness-visible routes: ${report.totals.freshnessVisibleCount}`,
    `- Infrastructure-connected routes: ${report.totals.infrastructureConnectedCount}`,
    `- Runtime-payload externalized routes: ${report.totals.runtimePayloadExternalizedCount}`,
    `- Live-source contracted routes: ${report.totals.liveSourceContractedCount}`,
    `- Regression-proof ready routes: ${report.totals.regressionProofReadyCount}`,
    `- Read-only command-ready routes: ${report.totals.readOnlyCommandReadyCount}`,
    `- Command-control ready routes: ${report.totals.commandControlReadyCount}`,
    `- Average maturity score: ${report.totals.averageScore}%`,
    "",
    "## Layers",
    "",
    ...report.layers.map((layer) => `${layer.order}. ${layer.id}: ${layer.description}`),
    "",
    "## Route Backlog",
    "",
    "| Priority | Route | Stage | Score | Next layer | Next action |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...report.entries.map((entry) => `| ${entry.priority} | ${entry.route} | ${entry.currentStage} | ${entry.score}% | ${entry.nextOpenLayer} | ${entry.nextMaturityAction} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderWebData(report) {
  return `// Generated by scripts/generate-generated-dashboard-route-maturity.mjs.\n// The full maturity ledger is shipped as a runtime asset so generated dashboard routes do not embed it in the main page chunk.\nconst generatedDashboardRouteMaturityUrl = new URL("./generated-dashboard-route-maturity-ledger.runtime.json", import.meta.url).href;\n\nexport interface GeneratedDashboardRouteMaturityEntry {\n  exportName: string;\n  route: string;\n  title: string;\n  family: string;\n  priority: string;\n  currentStage: string;\n  score: number;\n  hasRouteMetadata: boolean;\n  completedLayers: string[];\n  openLayers: string[];\n  nextOpenLayer: string;\n  layerStatus: Array<{ id: string; order: number; description: string; status: string; evidence: string[]; blocker: string | null }>;\n  evidenceBinding: {\n    dataBindingStatus: string;\n    observabilityStatus: string;\n    drillDownStatus: string;\n    freshnessStatus: string;\n    sourceCount: number;\n    signalCount: number;\n    drillDownCount: number;\n    stateCoverageStatus: string;\n    stateFixtureCount: number;\n    uxVisualStatus: string;\n    uxChecklistCount: number;\n    freshnessVisibilityStatus: string;\n    infrastructureConnectionStatus: string;\n    infrastructureConnectionCount: number;\n    payloadMaturityStatus: string;\n  } | null;\n  nextMaturityAction: string;\n  proofRequired: string[];\n}\n\nexport interface GeneratedDashboardRouteMaturityReport {\n  schemaVersion: number;\n  generatedAt: string;\n  source: string;\n  policy: Record<string, unknown>;\n  layers: Array<{ id: string; order: number; description: string }>;\n  totals: Record<string, number>;\n  entries: GeneratedDashboardRouteMaturityEntry[];\n}\n\nlet generatedDashboardRouteMaturityPromise: Promise<GeneratedDashboardRouteMaturityReport> | null = null;\n\nexport function loadGeneratedDashboardRouteMaturity() {\n  generatedDashboardRouteMaturityPromise ??= fetch(generatedDashboardRouteMaturityUrl).then((response) => {\n    if (!response.ok) throw new Error(\`Unable to load generated dashboard route maturity ledger: \${response.status}\`);\n    return response.json() as Promise<GeneratedDashboardRouteMaturityReport>;\n  });\n  return generatedDashboardRouteMaturityPromise;\n}\n\nexport { generatedDashboardRouteMaturityUrl };\n`;
}

function evidenceForLayer(layer, route, hasRouteMetadata) {
  const evidenceBinding = evidenceByRoute.get(route);
  const evidence = {
    "route-coverage": ["web/src/pages/GeneratedDashboardPages.tsx", `generated route row ${route}`],
    "page-contract": hasRouteMetadata ? ["web/src/dashboard-page-metadata.ts"] : ["family contract fallback"],
    "data-binding": evidenceBinding ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.sourceBindings.filter((source) => source.status !== "missing").length} evidence sources`, `${evidenceBinding.dataSignals.length} data signals`] : [],
    "state-coverage": evidenceBinding?.stateCoverage?.status === "covered" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.stateCoverage.stateFixtures.length} generated state fixtures`, ...evidenceBinding.stateCoverage.evidence.slice(0, 3)] : [],
    "observability": evidenceBinding?.observabilityStatus === "bound" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", "P0/P1 operational evidence binding", `${evidenceBinding.sourceBindings.filter((source) => ["monitoring", "deployment", "runtimeData", "health"].includes(source.kind) && source.status !== "missing").length} operational sources`] : [],
    "drill-down": evidenceBinding?.drillDownStatus === "bound" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.drillDownTargets.length} evidence drill-down targets`] : [],
    "cross-project-standard": hasRouteMetadata ? ["route-specific metadata contract"] : [],
    "command-control": evidenceBinding?.commandReadiness?.commandControlStatus === "governed-ready" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.commandReadiness.actionRegistry.length} governed actions`, `audit policy: ${evidenceBinding.commandReadiness.auditPolicy.status}`, `cooldown policy: ${evidenceBinding.commandReadiness.cooldownPolicy.status}`, `disabled reason policy: ${evidenceBinding.commandReadiness.disabledReasonPolicy.status}`] : [],
    "alerting-escalation": evidenceBinding?.freshnessSummary?.status === "visible" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.freshnessSummary.staleCount} stale sources surfaced`, `${evidenceBinding.freshnessSummary.missingCount} missing sources surfaced`, evidenceBinding.freshnessSummary.nextRefreshAction] : [],
    "warehouse-storage": evidenceBinding?.infrastructureConnections?.status === "connected" && evidenceBinding?.payloadMaturity?.status === "externalized" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.infrastructureConnections.connections.length} infrastructure relationships`, evidenceBinding.payloadMaturity.strategy, evidenceBinding.payloadMaturity.mainBundlePolicy] : [],
    "component-maturity": ["GeneratedGovernancePage shell", "dashboard:component-maturity:validate"],
    "ux-visual-maturity": evidenceBinding?.uxVisualMaturity?.status === "ready" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.uxVisualMaturity.reviewChecklist.length} UX review checks`, ...evidenceBinding.uxVisualMaturity.visualEvidence] : [],
    "testing-proof": evidenceBinding?.regressionProof?.status === "ready" ? ["docs/design/generated-dashboard-route-evidence-bindings.json", `${evidenceBinding.regressionProof.proofChecks.length} regression checks`, `${evidenceBinding.regressionProof.stateMatrix.length} state proof matrix entries`, evidenceBinding.regressionProof.payloadGuard] : [],
    "governance-ledger": ["docs/design/generated-dashboard-route-maturity-ledger.json", "web/src/pages/generated-dashboard-route-maturity-data.ts"],
  };
  return evidence[layer] ?? [];
}

function blockerForLayer(layer, family) {
  const blockers = {
    "data-binding": "Needs live API, warehouse, or generated evidence binding with freshness and source lineage.",
    "state-coverage": "Needs route-level fixtures or tests proving loading, empty, error, stale, degraded, critical, permission-limited, and mobile states.",
    "observability": `Needs ${family.toLowerCase()} telemetry panels backed by live worker, collector, sync, storage, alert, or deployment signals.`,
    "drill-down": "Needs aggregate cards to link into project, source, worker, job, table, alert, or evidence-level detail.",
    "cross-project-standard": "Needs route-specific dashboard metadata so infrastructure signals can be compared across projects.",
    "command-control": "Needs permissioned commands with confirmation, audit logging, and rollback or recovery proof.",
    "alerting-escalation": "Needs warning/critical thresholds, dedupe, owner routing, dashboard link-back, and resolution tracking.",
    "warehouse-storage": "Needs collection, database growth, mirror lag, retention, pruning, backup, restore, orphan, and duplicate evidence where relevant.",
    "ux-visual-maturity": "Needs route-specific layout, filters, density, responsive review, severity styling, and screenshot evidence.",
    "testing-proof": "Needs route smoke, contract, state, permission, command, mobile, visual, and production smoke proof.",
    "production-readiness": "Needs live data, passing checks, screenshots, deployment proof, alerting, drill-downs, commands where relevant, and regression protection.",
  };
  return blockers[layer] ?? "Needs route-specific implementation evidence.";
}
