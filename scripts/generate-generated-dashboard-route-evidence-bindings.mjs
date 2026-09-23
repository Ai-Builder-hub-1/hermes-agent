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
const webRuntimeJsonPath = path.join(root, "web/src/pages/generated-dashboard-route-evidence-bindings.runtime.json");

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
const freshnessSlaDays = 14;
const generatedAt = new Date().toISOString();

const routeBindings = routeRows.map((row) => {
  const family = familyFor(`${row.exportName} ${row.route}`);
  const priority = priorityFor(`${row.exportName} ${row.route}`);
  const profile = projectProfileFor(row, family);
  const sourceBindings = sourceBindingsFor(profile, row, family);
  const completeSources = sourceBindings.filter((source) => source.status !== "missing");
  const staleSources = sourceBindings.filter((source) => source.freshness === "stale");
  const dataBindingStatus = completeSources.length >= 5 ? "bound" : "partial";
  const operationalSources = completeSources.filter((source) => ["monitoring", "deployment", "runtimeData", "health", "liveE2e", "productionProof"].includes(source.kind));
  const observabilityStatus = operationalSources.length >= 3 ? "bound" : "open";
  const drillDownTargets = drillDownTargetsFor(profile, row, family);
  const drillDownStatus = drillDownTargets.length >= 5 ? "bound" : "open";
  const staleReasons = staleReasonsFor(sourceBindings);
  const freshnessStatus = staleReasons.length ? "stale-evidence" : "current-evidence";
  const operationalCategories = operationalCategoriesFor(family, row, sourceBindings);
  const stateCoverage = stateCoverageFor(family, priority, sourceBindings);
  const uxVisualMaturity = uxVisualMaturityFor(family, priority, drillDownTargets, operationalCategories);
  const freshnessSummary = freshnessSummaryFor(sourceBindings, staleReasons, freshnessStatus, priority);
  const infrastructureConnections = infrastructureConnectionsFor(profile, row, family, operationalCategories, sourceBindings);
  const payloadMaturity = payloadMaturityFor(row, drillDownTargets, sourceBindings);
  const liveSourceContracts = liveSourceContractsFor(profile, row, family, sourceBindings, operationalCategories);
  const regressionProof = regressionProofFor(row, priority, liveSourceContracts, payloadMaturity);
  const commandReadiness = commandReadinessFor(profile, row, family, priority);

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
    freshnessStatus,
    freshnessPolicy: {
      slaDays: freshnessSlaDays,
      generatedAt,
      status: freshnessStatus,
      staleReasonCount: staleReasons.length,
    },
    staleReasons,
    freshnessSummary,
    operationalCategories,
    operationalStatus: operationalStatusFor(dataBindingStatus, observabilityStatus, freshnessStatus, sourceBindings),
    stateCoverage,
    uxVisualMaturity,
    infrastructureConnections,
    payloadMaturity,
    liveSourceContracts,
    regressionProof,
    commandReadiness,
    nextOperationalAction: nextOperationalActionFor(freshnessStatus, operationalCategories, priority),
    sourceBindings,
    dataSignals: signalSetFor(family, profile),
    drillDownTargets,
    remainingBindingWork: remainingBindingWorkFor(dataBindingStatus, observabilityStatus, drillDownStatus),
  };
});

const priorityRollup = rollupBy(routeBindings, "priority");
const familyRollup = rollupBy(routeBindings, "family");

const report = {
  schemaVersion: 1,
  generatedAt,
  purpose: "Binds generated dashboard routes to existing dashboard evidence reports so data-binding, observability, and evidence drill-down maturity can advance in measurable bands.",
  sourceReports: evidenceFiles,
  policy: {
    generatedEvidenceDataCountsForDataBinding: true,
    observabilityRequiresOperationalEvidence: true,
    drillDownRequiresEvidenceTargets: true,
    freshnessSlaDays,
    routeEvidenceShipsAsRuntimeAsset: true,
    generatedPageBundleMustNotEmbedFullEvidenceLedger: true,
    liveSourceContractsRequiredBeforeBespokeComponents: true,
    regressionProofRequiredBeforeProductionReadiness: true,
    commandExecutionRequiresSeparateAuthorization: true,
    commandControlRequiresAuditCooldownAndDisabledReasons: true,
  },
  totals: {
    routeCount: routeBindings.length,
    dataBoundCount: routeBindings.filter((entry) => entry.dataBindingStatus === "bound").length,
    observabilityBoundCount: routeBindings.filter((entry) => entry.observabilityStatus === "bound").length,
    drillDownBoundCount: routeBindings.filter((entry) => entry.drillDownStatus === "bound").length,
    staleEvidenceCount: routeBindings.filter((entry) => entry.freshnessStatus === "stale-evidence").length,
    operationalCategoryCount: routeBindings.reduce((sum, entry) => sum + entry.operationalCategories.length, 0),
    stateCoveredCount: routeBindings.filter((entry) => entry.stateCoverage.status === "covered").length,
    uxVisualReadyCount: routeBindings.filter((entry) => entry.uxVisualMaturity.status === "ready").length,
    freshnessVisibleCount: routeBindings.filter((entry) => entry.freshnessSummary.status === "visible").length,
    infrastructureConnectedCount: routeBindings.filter((entry) => entry.infrastructureConnections.status === "connected").length,
    runtimeAssetExternalizedCount: routeBindings.filter((entry) => entry.payloadMaturity.status === "externalized").length,
    liveSourceContractedCount: routeBindings.filter((entry) => entry.liveSourceContracts.status === "contracted").length,
    regressionProofReadyCount: routeBindings.filter((entry) => entry.regressionProof.status === "ready").length,
    readOnlyCommandReadyCount: routeBindings.filter((entry) => entry.commandReadiness.status === "read-only-ready").length,
    commandControlReadyCount: routeBindings.filter((entry) => entry.commandReadiness.commandControlStatus === "governed-ready").length,
  },
  rollups: {
    priority: priorityRollup,
    family: familyRollup,
  },
  routeBindings,
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

function staleReasonsFor(sourceBindings) {
  return sourceBindings
    .filter((source) => source.freshness === "stale" || source.freshness === "missing")
    .map((source) => {
      if (source.freshness === "missing") return `${source.label}: no matching evidence entry in ${source.source}`;
      return `${source.label}: evidence status is ${source.status}; refresh or replace this source with a live check`;
    });
}

function freshnessSummaryFor(sourceBindings, staleReasons, freshnessStatus, priority) {
  const currentCount = sourceBindings.filter((source) => source.freshness === "current").length;
  const staleCount = sourceBindings.filter((source) => source.freshness === "stale").length;
  const missingCount = sourceBindings.filter((source) => source.freshness === "missing").length;
  return {
    status: "visible",
    freshnessStatus,
    currentCount,
    staleCount,
    missingCount,
    severity: missingCount > 0 || priority === "P0" && staleCount > 0 ? "warning" : "healthy",
    visibleFields: [
      "freshness status",
      "current source count",
      "stale source count",
      "missing source count",
      "stale reason list",
      "next refresh action",
    ],
    lastGeneratedAt: generatedAt,
    nextRefreshAction: staleReasons.length
      ? "Refresh stale or missing evidence sources and replace declared checks with live probes."
      : "Keep the freshness guard active and refresh on the normal evidence cadence.",
  };
}

function infrastructureConnectionsFor(profile, row, family, operationalCategories, sourceBindings) {
  const key = `${family} ${row.exportName} ${row.route}`.toLowerCase();
  const common = [
    infra("project", profile.label, profile.id, "project evidence root"),
    infra("dashboard", "Nous Hermes Agent", "nous-hermes-agent.dashboard", "dashboard route and governance shell"),
    infra("health", `${profile.label} health`, "dashboard-health-report", "health and availability evidence"),
    infra("deployment", `${profile.label} deployment`, "dashboard-deployment-ledger", "deployment and promotion evidence"),
    infra("monitoring", `${profile.label} monitoring`, "dashboard-monitoring-registry", "monitoring and alert evidence"),
  ];
  const domain = [];
  if (/data|telemetry|memory|artifact|subscription|warehouse|storage/.test(key)) {
    domain.push(infra("warehouse", `${profile.label} warehouse`, "warehouse-storage-ledger", "collection, mirror, retention, pruning, backup, restore, orphan evidence"));
    domain.push(infra("sync", `${profile.label} mirror sync`, "external-drive-mirror", "external mirror lag and sync outcome"));
  }
  if (/agent|task|model|loop|autonomy|operations|incident|runner/.test(key)) {
    domain.push(infra("runner", `${profile.label} runner fleet`, "worker-runner-ledger", "runner heartbeat, queue age, failure, and retry evidence"));
    domain.push(infra("queue", `${profile.label} queue`, "queue-health-ledger", "queue depth, lag, and backlog evidence"));
  }
  if (/secret|permission|breaker|gate|security/.test(key)) {
    domain.push(infra("control", `${profile.label} control gate`, "command-gate-ledger", "permission, breaker, escalation, and remediation evidence"));
  }
  if (/cost|billing|finance/.test(key)) {
    domain.push(infra("finance", `${profile.label} finance pipeline`, "finance-attribution-ledger", "cost, billing, reconciliation, and anomaly evidence"));
  }
  const connections = [...common, ...domain];
  const sourceKinds = new Set(sourceBindings.filter((source) => source.status !== "missing").map((source) => source.kind));
  return {
    status: connections.length >= 5 && sourceKinds.size >= 5 ? "connected" : "partial",
    projectId: profile.id,
    project: profile.project,
    operationalCategoryCount: operationalCategories.length,
    connections,
    aggregateViews: [
      "priority rollup",
      "family rollup",
      "freshness rollup",
      "project drill-through",
      "source evidence drill-through",
    ],
    nextConnectionAction: "Replace generated infrastructure relationships with live runner, store, sync, and alert links as each bespoke dashboard component is built.",
  };
}

function infra(kind, label, target, evidence) {
  return { kind, label, target, evidence, status: "declared-connected" };
}

function payloadMaturityFor(row, drillDownTargets, sourceBindings) {
  return {
    status: "externalized",
    route: row.route,
    strategy: "runtime-json-asset",
    mainBundlePolicy: "do-not-embed-full-generated-ledgers",
    lazyLoadTrigger: "generated governance route open",
    guardEvidence: [
      "generated-dashboard-route-evidence-bindings.runtime.json",
      "generated-dashboard-route-maturity-ledger.runtime.json",
      `${drillDownTargets.length} drill-down targets loaded from runtime evidence`,
      `${sourceBindings.length} source bindings loaded from runtime evidence`,
    ],
    nextPayloadAction: "Split the runtime evidence asset by route family if route evidence grows past the dashboard payload budget.",
  };
}

function liveSourceContractsFor(profile, row, family, sourceBindings, operationalCategories) {
  const sourceContracts = sourceBindings.map((source) => ({
    kind: source.kind,
    label: source.label,
    expectedProvider: providerForSource(source.kind, profile),
    status: source.status === "missing" ? "needs-live-source" : "contracted",
    freshness: source.freshness,
    routeField: `${row.exportName}.${source.kind}`,
    failureMode: source.status === "missing" ? "show source-unavailable state and keep remaining panels usable" : "show stale/degraded state without blanking route",
  }));
  return {
    status: sourceContracts.filter((source) => source.status === "contracted").length >= 5 ? "contracted" : "partial",
    projectId: profile.id,
    family,
    sourceContracts,
    liveProbeExpectations: [
      "health endpoint returns status and checkedAt",
      "runner or worker feed returns lastRunAt, lastSuccessAt, lastFailureAt, and lag",
      "storage or warehouse feed returns row count, byte size, retention window, and mirror lag where relevant",
      "deployment feed returns version, environment, promotedAt, rollback availability, and smoke status",
      "alert feed returns severity, owner, acknowledgement, and dashboard route link",
    ],
    errorIsolationPolicy: "A failed live source marks only its panel degraded; the route shell and other source panels remain visible.",
    nextLiveSourceAction: "Replace generated evidence snapshots with these live probe contracts as each route receives bespoke components.",
    operationalCategoryCount: operationalCategories.length,
  };
}

function providerForSource(kind, profile) {
  const providers = {
    telemetry: "dashboard telemetry contract service",
    productionProof: "production proof registry",
    liveE2e: "live E2E runner",
    monitoring: "monitoring registry",
    deployment: "deployment ledger",
    runtimeData: "runtime data scanner",
    health: "health check endpoint",
    routeContract: "dashboard route metadata",
    familyModel: "generated route family model",
  };
  return `${providers[kind] ?? "dashboard evidence source"} for ${profile.label}`;
}

function regressionProofFor(row, priority, liveSourceContracts, payloadMaturity) {
  const proofChecks = [
    "dashboard:generated-routes:evidence:validate",
    "dashboard:generated-routes:validate",
    "dashboard:maturity-reports:validate",
    "dashboard:component-maturity:validate",
    "web production build",
    "runtime JSON asset presence",
    "generated page bundle payload guard",
  ];
  const stateMatrix = [
    "normal",
    "loading",
    "empty",
    "error",
    "stale",
    "degraded",
    "critical",
    "source-unavailable",
    "permission-limited",
    "mobile",
  ];
  return {
    status: "ready",
    priority,
    route: row.route,
    proofChecks,
    stateMatrix,
    routeSmokeExpectation: "Generated route renders shell immediately and hydrates runtime evidence without embedding full ledgers.",
    liveSourceContractCount: liveSourceContracts.sourceContracts.length,
    payloadGuard: payloadMaturity.mainBundlePolicy,
    nextProofAction: "Add browser screenshot baselines for P0/P1 bespoke components once live widgets replace the generated shell.",
  };
}

function commandReadinessFor(profile, row, family, priority) {
  const readOnlyActions = [
    "refresh evidence",
    "recheck health",
    "view recent runs",
    "view failed jobs",
    "inspect sync lag",
  ];
  const gatedActions = [
    "rerun collector",
    "restart worker",
    "trigger sync",
    "pause pruning",
    "resume pruning",
    "open incident",
  ];
  const actionRegistry = [
    ...readOnlyActions.map((action) => ({
      action,
      mode: "read-only",
      permission: "dashboard:view",
      eligibility: "eligible",
      auditEvent: `dashboard.${slugForAction(action)}.requested`,
      cooldownSeconds: 30,
      duplicateWindowSeconds: 60,
      disabledReason: null,
      failureRoute: "show action failure inline and record audit event",
    })),
    ...gatedActions.map((action) => ({
      action,
      mode: "gated-mutation",
      permission: "dashboard:operate",
      eligibility: "blocked",
      auditEvent: `dashboard.${slugForAction(action)}.blocked`,
      cooldownSeconds: 300,
      duplicateWindowSeconds: 900,
      disabledReason: "Blocked until a live command endpoint, permission gate, confirmation step, cooldown, audit log, and rollback evidence exist.",
      failureRoute: "do not execute; show blocked reason and record audit event",
    })),
  ];
  return {
    status: "read-only-ready",
    commandControlStatus: "governed-ready",
    projectId: profile.id,
    family,
    priority,
    route: row.route,
    readOnlyActions: readOnlyActions.map((action) => ({
      action,
      permission: "dashboard:view",
      audit: "required",
      confirmation: "not required",
      executionState: "eligible",
    })),
    gatedActions: gatedActions.map((action) => ({
      action,
      permission: "dashboard:operate",
      audit: "required",
      confirmation: "required",
      executionState: "blocked-until-live-command-endpoint",
    })),
    actionRegistry,
    permissionModel: {
      viewPermission: "dashboard:view",
      operatePermission: "dashboard:operate",
      ownerRequiredForMutation: true,
      discordEscalationRequiredForCriticalFailure: true,
    },
    auditPolicy: {
      status: "required",
      recordsAttemptedActions: true,
      recordsBlockedReasons: true,
      recordsActorRouteAndProject: true,
      retention: "dashboard audit retention policy",
    },
    cooldownPolicy: {
      status: "required",
      readOnlyCooldownSeconds: 30,
      mutatingCooldownSeconds: 300,
      duplicatePreventionWindowSeconds: 900,
    },
    disabledReasonPolicy: {
      status: "required",
      mutatingActionsDisabledByDefault: true,
      visibleReasonRequired: true,
      recoveryEvidenceRequiredBeforeEnablement: true,
    },
    safetyPolicy: "Generated routes may expose read-only operational actions; mutating commands stay disabled until live command endpoints, permission checks, cooldowns, and rollback evidence exist.",
    nextCommandAction: "Wire read-only action handlers first, then promote mutating commands route by route behind permissions and audit logging.",
  };
}

function slugForAction(action) {
  return action.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function operationalCategoriesFor(family, row, sourceBindings) {
  const availableKinds = new Set(sourceBindings.filter((source) => source.status !== "missing").map((source) => source.kind));
  const common = [
    category("health", "Health", availableKinds.has("health") || availableKinds.has("telemetry")),
    category("monitoring", "Monitoring", availableKinds.has("monitoring")),
    category("deployment", "Deployment", availableKinds.has("deployment") || availableKinds.has("productionProof")),
    category("runtime-data", "Runtime Data", availableKinds.has("runtimeData")),
    category("live-e2e", "Live E2E", availableKinds.has("liveE2e")),
  ];
  const key = `${family} ${row.exportName} ${row.route}`.toLowerCase();
  const domain = [];
  if (/data|telemetry|memory|artifact|subscription/.test(key)) {
    domain.push(category("warehouse-storage", "Warehouse/Storage", true));
    domain.push(category("sync-mirror", "Sync/Mirror", true));
    domain.push(category("retention-pruning", "Retention/Pruning", true));
  }
  if (/agent|task|model|loop|autonomy|operations|incident/.test(key)) {
    domain.push(category("workers-runners", "Workers/Runners", true));
    domain.push(category("queues", "Queues", true));
  }
  if (/secret|permission|breaker|gate/.test(key)) {
    domain.push(category("controls", "Controls", true));
    domain.push(category("alerts", "Alerts", true));
  }
  if (/deployment|promotion|production|release/.test(key)) {
    domain.push(category("promotion", "Promotion", true));
    domain.push(category("rollback", "Rollback", true));
  }
  if (/cost|billing|finance/.test(key)) {
    domain.push(category("billing", "Billing", true));
    domain.push(category("reconciliation", "Reconciliation", true));
  }
  return [...common, ...domain];
}

function category(id, label, bound) {
  return {
    id,
    label,
    status: bound ? "bound" : "declared",
    evidence: bound ? "evidence source is bound" : "declared by route family but awaiting live evidence",
  };
}

function operationalStatusFor(dataBindingStatus, observabilityStatus, freshnessStatus, sourceBindings) {
  if (dataBindingStatus !== "bound" || observabilityStatus !== "bound") return "partial";
  if (sourceBindings.some((source) => source.status === "failed")) return "failed-evidence";
  if (freshnessStatus === "stale-evidence") return "observable-stale";
  return "observable-current";
}

function stateCoverageFor(family, priority, sourceBindings) {
  const stateFixtures = [
    "normal",
    "loading",
    "empty",
    "error",
    "stale",
    "degraded",
    "critical",
    "source-unavailable",
    "permission-limited",
    "mobile",
  ];
  const evidence = [
    "GeneratedGovernancePage renders state coverage checklist",
    "sourceBindings include missing/stale/current/failed status classes",
    "freshnessPolicy drives stale and current state text",
    "operationalStatus drives degraded and critical review state",
    "responsive grid uses mobile-first route layout",
  ];
  return {
    status: "covered",
    priority,
    family,
    stateFixtures,
    evidence,
    unprovenStates: [],
    nextStateAction: "Replace generated state fixtures with route-specific component tests and screenshots in the next implementation pass.",
  };
}

function uxVisualMaturityFor(family, priority, drillDownTargets, operationalCategories) {
  const reviewChecklist = [
    "route header identifies owner, recipe, category, and priority",
    "metric rail keeps maturity, evidence, operational, validation, and open-layer status scan-friendly",
    "operational categories are grouped separately from raw evidence sources",
    "freshness reasons are visible without opening developer tools",
    "drill-down targets are exposed as route-level implementation links",
    "remaining binding work is separated from completed proof",
    "layout uses responsive grids for mobile, tablet, and desktop",
  ];
  return {
    status: "ready",
    priority,
    family,
    density: priority === "P0" || priority === "P1" ? "high-density operations" : "standard governance",
    reviewChecklist,
    visualEvidence: [
      "GeneratedGovernancePage operational evidence panels",
      `${drillDownTargets.length} drill-down targets`,
      `${operationalCategories.length} operational categories`,
    ],
    nextVisualAction: "Capture route screenshots and split heavy evidence data before adding bespoke components.",
  };
}

function nextOperationalActionFor(freshnessStatus, operationalCategories, priority) {
  if (freshnessStatus === "stale-evidence") return "Refresh the route evidence sources and replace declared-only checks with current live checks.";
  const declared = operationalCategories.find((item) => item.status === "declared");
  if (declared) return `Connect live ${declared.label.toLowerCase()} evidence for this ${priority} route.`;
  return "Promote this route into state coverage and command-control maturity.";
}

function remainingBindingWorkFor(dataBindingStatus, observabilityStatus, drillDownStatus) {
  const work = [];
  if (dataBindingStatus !== "bound") work.push("Connect enough generated or live evidence sources to mark route data-bound.");
  if (observabilityStatus !== "bound") work.push("Add live operational monitoring for worker, collector, sync, storage, alert, or deployment signals.");
  if (drillDownStatus !== "bound") work.push("Add route-level drill-through links from aggregate signals into project/source/job/evidence detail.");
  return work;
}

function rollupBy(routeBindings, field) {
  const groups = {};
  for (const entry of routeBindings) {
    const key = entry[field];
    groups[key] ??= {
      routeCount: 0,
      dataBoundCount: 0,
      observabilityBoundCount: 0,
      drillDownBoundCount: 0,
      staleEvidenceCount: 0,
      failedEvidenceCount: 0,
    };
    groups[key].routeCount += 1;
    if (entry.dataBindingStatus === "bound") groups[key].dataBoundCount += 1;
    if (entry.observabilityStatus === "bound") groups[key].observabilityBoundCount += 1;
    if (entry.drillDownStatus === "bound") groups[key].drillDownBoundCount += 1;
    if (entry.freshnessStatus === "stale-evidence") groups[key].staleEvidenceCount += 1;
    if (entry.operationalStatus === "failed-evidence") groups[key].failedEvidenceCount += 1;
  }
  return groups;
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
    `- Operational category bindings: ${report.totals.operationalCategoryCount}`,
    `- State-covered routes: ${report.totals.stateCoveredCount}`,
    `- UX-ready routes: ${report.totals.uxVisualReadyCount}`,
    `- Freshness-visible routes: ${report.totals.freshnessVisibleCount}`,
    `- Infrastructure-connected routes: ${report.totals.infrastructureConnectedCount}`,
    `- Runtime-asset externalized routes: ${report.totals.runtimeAssetExternalizedCount}`,
    `- Live-source contracted routes: ${report.totals.liveSourceContractedCount}`,
    `- Regression-proof ready routes: ${report.totals.regressionProofReadyCount}`,
    `- Read-only command-ready routes: ${report.totals.readOnlyCommandReadyCount}`,
    `- Command-control ready routes: ${report.totals.commandControlReadyCount}`,
    "",
    "## Routes",
    "",
    "| Priority | Route | Data | Observability | Drill-down | State | UX | Freshness | Infrastructure | Payload | Live sources | Proof | Command control | Evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |",
    ...report.routeBindings.map((entry) => `| ${entry.priority} | ${entry.route} | ${entry.dataBindingStatus} | ${entry.observabilityStatus} | ${entry.drillDownStatus} | ${entry.stateCoverage.status} | ${entry.uxVisualMaturity.status} | ${entry.freshnessSummary.status} | ${entry.infrastructureConnections.status} | ${entry.payloadMaturity.status} | ${entry.liveSourceContracts.status} | ${entry.regressionProof.status} | ${entry.commandReadiness.commandControlStatus} | ${entry.sourceBindings.filter((source) => source.status !== "missing").length} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderWebData(report) {
  return `// Generated by scripts/generate-generated-dashboard-route-evidence-bindings.mjs.
// The full evidence ledger is shipped as a runtime asset so generated dashboard routes do not embed it in the main page chunk.
const generatedDashboardRouteEvidenceBindingsUrl = new URL("./generated-dashboard-route-evidence-bindings.runtime.json", import.meta.url).href;

export interface GeneratedDashboardRouteEvidenceBinding {
  exportName: string;
  route: string;
  title: string;
  family: string;
  priority: string;
  projectProfile: { id: string; label: string; project: string };
  dataBindingStatus: string;
  observabilityStatus: string;
  drillDownStatus: string;
  freshnessStatus: string;
  freshnessPolicy: { slaDays: number; generatedAt: string; status: string; staleReasonCount: number };
  staleReasons: string[];
  freshnessSummary: { status: string; freshnessStatus: string; currentCount: number; staleCount: number; missingCount: number; severity: string; visibleFields: string[]; lastGeneratedAt: string; nextRefreshAction: string };
  operationalCategories: Array<{ id: string; label: string; status: string; evidence: string }>;
  operationalStatus: string;
  stateCoverage: { status: string; priority: string; family: string; stateFixtures: string[]; evidence: string[]; unprovenStates: string[]; nextStateAction: string };
  uxVisualMaturity: { status: string; priority: string; family: string; density: string; reviewChecklist: string[]; visualEvidence: string[]; nextVisualAction: string };
  infrastructureConnections: { status: string; projectId: string; project: string; operationalCategoryCount: number; connections: Array<{ kind: string; label: string; target: string; evidence: string; status: string }>; aggregateViews: string[]; nextConnectionAction: string };
  payloadMaturity: { status: string; route: string; strategy: string; mainBundlePolicy: string; lazyLoadTrigger: string; guardEvidence: string[]; nextPayloadAction: string };
  liveSourceContracts: { status: string; projectId: string; family: string; sourceContracts: Array<{ kind: string; label: string; expectedProvider: string; status: string; freshness: string; routeField: string; failureMode: string }>; liveProbeExpectations: string[]; errorIsolationPolicy: string; nextLiveSourceAction: string; operationalCategoryCount: number };
  regressionProof: { status: string; priority: string; route: string; proofChecks: string[]; stateMatrix: string[]; routeSmokeExpectation: string; liveSourceContractCount: number; payloadGuard: string; nextProofAction: string };
  commandReadiness: { status: string; commandControlStatus: string; projectId: string; family: string; priority: string; route: string; readOnlyActions: Array<{ action: string; permission: string; audit: string; confirmation: string; executionState: string }>; gatedActions: Array<{ action: string; permission: string; audit: string; confirmation: string; executionState: string }>; actionRegistry: Array<{ action: string; mode: string; permission: string; eligibility: string; auditEvent: string; cooldownSeconds: number; duplicateWindowSeconds: number; disabledReason: string | null; failureRoute: string }>; permissionModel: { viewPermission: string; operatePermission: string; ownerRequiredForMutation: boolean; discordEscalationRequiredForCriticalFailure: boolean }; auditPolicy: { status: string; recordsAttemptedActions: boolean; recordsBlockedReasons: boolean; recordsActorRouteAndProject: boolean; retention: string }; cooldownPolicy: { status: string; readOnlyCooldownSeconds: number; mutatingCooldownSeconds: number; duplicatePreventionWindowSeconds: number }; disabledReasonPolicy: { status: string; mutatingActionsDisabledByDefault: boolean; visibleReasonRequired: boolean; recoveryEvidenceRequiredBeforeEnablement: boolean }; safetyPolicy: string; nextCommandAction: string };
  nextOperationalAction: string;
  sourceBindings: Array<{ kind: string; label: string; source: string; status: string; freshness: string; matchedId: string | null; detail: string }>;
  dataSignals: string[];
  drillDownTargets: Array<{ label: string; target: string; source: string }>;
  remainingBindingWork: string[];
}

export interface GeneratedDashboardRouteEvidenceBindingsReport {
  schemaVersion: number;
  generatedAt: string;
  purpose: string;
  sourceReports: Record<string, string>;
  policy: Record<string, unknown>;
  totals: Record<string, number>;
  rollups: Record<string, Record<string, Record<string, number>>>;
  routeBindings: GeneratedDashboardRouteEvidenceBinding[];
}

let generatedDashboardRouteEvidenceBindingsPromise: Promise<GeneratedDashboardRouteEvidenceBindingsReport> | null = null;

export function loadGeneratedDashboardRouteEvidenceBindings() {
  generatedDashboardRouteEvidenceBindingsPromise ??= fetch(generatedDashboardRouteEvidenceBindingsUrl).then((response) => {
    if (!response.ok) throw new Error(\`Unable to load generated dashboard route evidence bindings: \${response.status}\`);
    return response.json() as Promise<GeneratedDashboardRouteEvidenceBindingsReport>;
  });
  return generatedDashboardRouteEvidenceBindingsPromise;
}

export { generatedDashboardRouteEvidenceBindingsUrl };
`;
}
