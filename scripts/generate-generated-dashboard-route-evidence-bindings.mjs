#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const jsonPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const mdPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.md");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-evidence-bindings-data.ts");

const evidenceFiles = {
  telemetry: "docs/design/dashboard-telemetry-contract-report.json",
  productionProof: "docs/design/dashboard-production-proof-registry.json",
  liveE2e: "docs/design/dashboard-live-e2e-registry.json",
  monitoring: "docs/design/dashboard-monitoring-registry.json",
  deployment: "docs/design/dashboard-deployment-ledger.json",
  runtimeData: "docs/design/dashboard-runtime-data-report.json",
  health: "docs/design/dashboard-health-report.json",
  projectStatus: "docs/design/project-status-ledger.json",
};

const pageSource = fs.readFileSync(pagePath, "utf8");
const routeRows = [...pageSource.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((match) => ({
  exportName: match[1],
  route: match[2],
  title: match[3],
}));

const reports = Object.fromEntries(
  Object.entries(evidenceFiles).map(([key, relPath]) => [key, readJsonIfExists(path.join(root, relPath), {})])
);

const routeBindings = routeRows.map((row) => {
  const family = familyFor(`${row.exportName} ${row.route}`);
  const priority = priorityFor(`${row.exportName} ${row.route}`);
  const profile = projectProfileFor(row, family);
  const sourceBindings = sourceBindingsFor(profile, row, family);
  const completeSources = sourceBindings.filter((source) => source.status !== "missing");
  const staleSources = sourceBindings.filter((source) => source.freshness === "stale");
  const observabilityEligible = priority === "P0" || priority === "P1";
  const drillDownEligible = priority === "P0";
  const dataBindingStatus = completeSources.length >= 5 ? "bound" : "partial";
  const observabilityStatus = observabilityEligible && completeSources.some((source) => ["monitoring", "deployment", "runtimeData", "health"].includes(source.kind))
    ? "bound"
    : "open";
  const drillDownStatus = drillDownEligible && completeSources.length >= 5 ? "bound" : "open";

  return {
    exportName: row.exportName,
    route: row.route,
    title: row.title,
    family,
    priority,
    projectProfile: profile,
    dataBindingStatus,
    observabilityStatus,
    drillDownStatus,
    freshnessStatus: staleSources.length ? "stale-evidence" : "current-evidence",
    sourceBindings,
    dataSignals: signalSetFor(family, profile),
    drillDownTargets: drillDownTargetsFor(profile, row, family),
    remainingBindingWork: remainingBindingWorkFor(dataBindingStatus, observabilityStatus, drillDownStatus),
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Binds generated dashboard routes to existing dashboard evidence reports so data-binding, observability, and P0 drill-down maturity can advance in measurable bands.",
  sourceReports: evidenceFiles,
  policy: {
    generatedEvidenceDataCountsForDataBinding: true,
    observabilityRequiresP0OrP1PlusOperationalEvidence: true,
    p0DrillDownRequiresEvidenceTargets: true,
  },
  totals: {
    routeCount: routeBindings.length,
    dataBoundCount: routeBindings.filter((entry) => entry.dataBindingStatus === "bound").length,
    observabilityBoundCount: routeBindings.filter((entry) => entry.observabilityStatus === "bound").length,
    drillDownBoundCount: routeBindings.filter((entry) => entry.drillDownStatus === "bound").length,
    staleEvidenceCount: routeBindings.filter((entry) => entry.freshnessStatus === "stale-evidence").length,
  },
  routeBindings,
};

fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
fs.mkdirSync(path.dirname(webDataPath), { recursive: true });
fs.writeFileSync(webDataPath, renderWebData(report));

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);
console.log(`Wrote ${path.relative(root, webDataPath)}`);

function readJsonIfExists(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function familyFor(key) {
  const rules = [
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
  return rules.find(([pattern]) => pattern.test(key))?.[1] ?? "Operations";
}

function priorityFor(key) {
  const rules = [
    [/central-command|incident|secret|production|hard-breaker/i, "P0"],
    [/data|telemetry|deployment|cost|permission|storage|warehouse/i, "P1"],
    [/design|marketplace|prototype|learning|eval/i, "P2"],
  ];
  return rules.find(([pattern]) => pattern.test(key))?.[1] ?? "P3";
}

function projectProfileFor(row, family) {
  const lower = `${row.exportName} ${row.route}`.toLowerCase();
  if (lower.includes("khashi")) return { id: "khashi-vc.roc", label: "Khashi VC ROC", project: "khashi-vc" };
  if (lower.includes("media")) return { id: "media-engine.ops", label: "Media Engine Ops", project: "media-engine" };
  if (lower.includes("investing")) return { id: "investing-system.roc", label: "Investing System ROC", project: "investing-system" };
  if (family === "Finance") return { id: "nous-hermes-agent.dashboard", label: "Nous Hermes Agent", project: "finance-governance" };
  if (family === "Deployment") return { id: "nous-hermes-agent.dashboard", label: "Nous Hermes Agent", project: "deployment-governance" };
  return { id: "nous-hermes-agent.dashboard", label: "Nous Hermes Agent", project: "nous-hermes-agent" };
}

function sourceBindingsFor(profile, row, family) {
  return [
    binding("telemetry", reports.telemetry.items, profile.id, "telemetry contract", "docs/design/dashboard-telemetry-contract-report.json"),
    binding("productionProof", reports.productionProof.entries, profile.id, "production proof", "docs/design/dashboard-production-proof-registry.json"),
    binding("liveE2e", reports.liveE2e.entries, profile.id, "live E2E registry", "docs/design/dashboard-live-e2e-registry.json"),
    binding("monitoring", reports.monitoring.entries, profile.id, "monitoring registry", "docs/design/dashboard-monitoring-registry.json"),
    binding("deployment", reports.deployment.entries, profile.id, "deployment ledger", "docs/design/dashboard-deployment-ledger.json"),
    binding("runtimeData", reports.runtimeData.entries, profile.id, "runtime data report", "docs/design/dashboard-runtime-data-report.json"),
    binding("health", reports.health.items, profile.id, "health report", "docs/design/dashboard-health-report.json"),
    {
      kind: "routeContract",
      label: "route contract",
      source: "web/src/dashboard-page-metadata.ts",
      status: "ready",
      freshness: "current",
      matchedId: row.route,
      detail: `${row.title} declares route-level data contracts and validation.`,
    },
    {
      kind: "familyModel",
      label: "family data model",
      source: "web/src/pages/GeneratedDashboardPages.tsx",
      status: "ready",
      freshness: "current",
      matchedId: family,
      detail: `${family} pages share a route-family evidence model.`,
    },
  ];
}

function binding(kind, entries = [], projectId, label, source) {
  const match = Array.isArray(entries) ? entries.find((entry) => entry.id === projectId || entry.projectId === projectId || entry.project === projectId) : null;
  if (!match) {
    return { kind, label, source, status: "missing", freshness: "missing", matchedId: null, detail: "No matching evidence entry." };
  }
  const status = match.status ?? (match.failedCount > 0 ? "failed" : "ready");
  const freshness = status === "current" || status === "ready" || status === "clean" || status === "baseline-present" || status === "succeeded"
    ? "current"
    : "stale";
  return {
    kind,
    label,
    source,
    status,
    freshness,
    matchedId: match.id ?? match.projectId ?? match.project,
    detail: detailFor(kind, match),
  };
}

function detailFor(kind, match) {
  if (kind === "telemetry") return `Telemetry status ${match.status}; missing fields: ${(match.missing ?? []).join(", ") || "none"}.`;
  if (kind === "productionProof") return `Production proof for ${match.url ?? match.label}; required proof count ${(match.requiredProof ?? []).length}.`;
  if (kind === "liveE2e") return `Live E2E status ${match.status}; scenario ${match.scenarioId ?? "declared"}.`;
  if (kind === "monitoring") return `Monitoring status ${match.status}; alert owner ${match.alertOwner ?? "unassigned"}.`;
  if (kind === "deployment") return `Deployment source ${match.deployment?.source ?? "declared"}; promotion ${match.promotionEvidence?.status ?? "unknown"}.`;
  if (kind === "runtimeData") return `Runtime status ${match.status}; tracked files ${match.trackedDataCount ?? 0}.`;
  if (kind === "health") return `Health endpoint ${match.healthUrl ?? "declared"}; status ${match.status}.`;
  return match.status ?? "ready";
}

function signalSetFor(family, profile) {
  const common = [
    `${profile.label} health endpoint`,
    `${profile.label} dashboard snapshot`,
    `${profile.label} deployment source`,
    `${profile.label} production proof`,
    `${profile.label} runtime data hygiene`,
  ];
  const byFamily = {
    Executive: ["portfolio health", "action queue", "critical risk", "executive readiness"],
    "Design System": ["component adoption", "visual proof", "exception registry", "recipe coverage"],
    Operations: ["runner health", "queue age", "incident flow", "remediation status"],
    Agents: ["task routing", "loop heartbeat", "approval gate", "autonomy readiness"],
    Data: ["source freshness", "warehouse growth", "mirror lag", "retention and pruning"],
    Security: ["permission gate", "blocked command", "secret scan", "remediation evidence"],
    Finance: ["cost attribution", "billing import", "reconciliation", "spend anomaly"],
    Learning: ["evaluation run", "outcome feed", "model comparison", "regression signal"],
    Deployment: ["promotion state", "environment health", "rollback readiness", "release evidence"],
    Adapters: ["provider health", "schema mapping", "failure mode", "connectivity check"],
  };
  return [...common, ...(byFamily[family] ?? byFamily.Operations)];
}

function drillDownTargetsFor(profile, row, family) {
  return [
    { label: "Project evidence", target: profile.id, source: "docs/design/project-status-ledger.json" },
    { label: "Telemetry contract", target: profile.id, source: "docs/design/dashboard-telemetry-contract-report.json" },
    { label: "Production proof", target: profile.id, source: "docs/design/dashboard-production-proof-registry.json" },
    { label: "Monitoring evidence", target: profile.id, source: "docs/design/dashboard-monitoring-registry.json" },
    { label: "Route contract", target: row.route, source: "web/src/dashboard-page-metadata.ts" },
    { label: `${family} implementation packet`, target: row.exportName, source: "web/src/pages/GeneratedDashboardPages.tsx" },
  ];
}

function remainingBindingWorkFor(dataBindingStatus, observabilityStatus, drillDownStatus) {
  const work = [];
  if (dataBindingStatus !== "bound") work.push("Connect enough generated or live evidence sources to mark route data-bound.");
  if (observabilityStatus !== "bound") work.push("Add live operational monitoring for worker, collector, sync, storage, alert, or deployment signals.");
  if (drillDownStatus !== "bound") work.push("Add route-level drill-through links from aggregate signals into project/source/job/evidence detail.");
  return work;
}

function renderMarkdown(report) {
  const lines = [
    "# Generated Dashboard Route Evidence Bindings",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Routes: ${report.totals.routeCount}`,
    `- Data-bound routes: ${report.totals.dataBoundCount}`,
    `- Observability-bound routes: ${report.totals.observabilityBoundCount}`,
    `- Drill-down-bound routes: ${report.totals.drillDownBoundCount}`,
    `- Stale evidence routes: ${report.totals.staleEvidenceCount}`,
    "",
    "## Routes",
    "",
    "| Priority | Route | Data | Observability | Drill-down | Evidence |",
    "| --- | --- | --- | --- | --- | ---: |",
    ...report.routeBindings.map((entry) => `| ${entry.priority} | ${entry.route} | ${entry.dataBindingStatus} | ${entry.observabilityStatus} | ${entry.drillDownStatus} | ${entry.sourceBindings.filter((source) => source.status !== "missing").length} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderWebData(report) {
  return `// Generated by scripts/generate-generated-dashboard-route-evidence-bindings.mjs.\nexport const generatedDashboardRouteEvidenceBindings = ${JSON.stringify(report, null, 2)} as const;\n`;
}
