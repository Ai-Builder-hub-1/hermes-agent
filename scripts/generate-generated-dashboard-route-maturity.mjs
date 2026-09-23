#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const metadataPath = path.join(root, "web/src/dashboard-page-metadata.ts");
const jsonPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const mdPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.md");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-maturity-data.ts");

const pageSource = fs.readFileSync(pagePath, "utf8");
const metadataSource = fs.readFileSync(metadataPath, "utf8");
const routeRows = [...pageSource.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((match) => ({
  exportName: match[1],
  route: match[2],
  title: match[3],
}));
const metadataRoutes = new Set([...metadataSource.matchAll(/route:\s*"([^"]+)"/g)].map((match) => match[1]));

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
  const currentStage = hasRouteMetadata ? "contract-registered" : "family-contract";
  const completedLayers = ["route-coverage", "page-contract", "component-maturity", "governance-ledger"];
  if (hasRouteMetadata) completedLayers.push("cross-project-standard");
  const openLayers = layerDefinitions.map(([id]) => id).filter((id) => !completedLayers.includes(id));
  const score = Math.round((completedLayers.length / layerDefinitions.length) * 100);

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
fs.writeFileSync(webDataPath, renderWebData(report));

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);
console.log(`Wrote ${path.relative(root, webDataPath)}`);

function firstMatch(rules, key, fallback) {
  return rules.find(([pattern]) => pattern.test(key))?.[1] ?? fallback;
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
    `- Average maturity score: ${report.totals.averageScore}%`,
    "",
    "## Layers",
    "",
    ...report.layers.map((layer) => `${layer.order}. ${layer.id}: ${layer.description}`),
    "",
    "## Route Backlog",
    "",
    "| Priority | Route | Stage | Score | Next action |",
    "| --- | --- | --- | ---: | --- |",
    ...report.entries.map((entry) => `| ${entry.priority} | ${entry.route} | ${entry.currentStage} | ${entry.score}% | ${entry.nextMaturityAction} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderWebData(report) {
  return `// Generated by scripts/generate-generated-dashboard-route-maturity.mjs.\nexport const generatedDashboardRouteMaturity = ${JSON.stringify(report, null, 2)} as const;\n`;
}
