#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const routeMaturityPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const evidenceBindingsPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const liveSourceGapPath = path.join(root, "docs/design/dashboard-live-source-gap-ledger.json");
const commandGovernancePath = path.join(root, "docs/design/dashboard-command-governance-ledger.json");
const jsonPath = path.join(root, "docs/design/dashboard-operational-maturity-packets.json");
const mdPath = path.join(root, "docs/design/dashboard-operational-maturity-packets.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-operational-maturity-packets-data.ts");
const webRuntimeJsonPath = path.join(root, "web/src/pages/dashboard-operational-maturity-packets.runtime.json");

const pageSource = fs.readFileSync(pagePath, "utf8");
const routeRows = [...pageSource.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((match) => ({
  exportName: match[1],
  route: match[2],
  title: match[3],
}));
const routeMaturity = readJson(routeMaturityPath, { entries: [] });
const evidenceBindings = readJson(evidenceBindingsPath, { routeBindings: [] });
const liveSourceGapLedger = readJson(liveSourceGapPath, { routeGaps: [] });
const commandGovernanceLedger = readJson(commandGovernancePath, { routes: [], routeGovernance: [] });
const maturityByRoute = new Map((routeMaturity.entries ?? []).map((entry) => [entry.route, entry]));
const evidenceByRoute = new Map((evidenceBindings.routeBindings ?? []).map((entry) => [entry.route, entry]));
const liveGapByRoute = new Map((liveSourceGapLedger.routeGaps ?? []).map((entry) => [entry.route, entry]));
const commandByRoute = new Map([...(commandGovernanceLedger.routes ?? []), ...(commandGovernanceLedger.routeGovernance ?? [])].map((entry) => [entry.route, entry]));

const operationalLayers = [
  {
    id: "access-recovery",
    order: 1,
    label: "Access and recovery",
    objective: "The production page can be reached, authenticated, monitored, and recovered without guessing.",
    acceptance: [
      "Production route responds and is included in uptime monitoring.",
      "Login, logout, protected-route behavior, and password reset are verified.",
      "External service-down checks alert when the page is unreachable.",
    ],
    testProof: ["production smoke", "auth smoke", "monitoring contract"],
  },
  {
    id: "purpose-orientation",
    order: 2,
    label: "Purpose and orientation",
    objective: "The first screen makes the page purpose, owner, environment, decisions, and failure states clear.",
    acceptance: [
      "Header declares owner, environment, maturity state, last update, and primary question.",
      "The page identifies top operator decisions and critical failure states.",
      "Related pages and runbook/evidence links are present.",
    ],
    testProof: ["route metadata", "copy audit", "responsive screenshot"],
  },
  {
    id: "live-data-contract",
    order: 3,
    label: "Live data contract",
    objective: "The page consumes a standard live payload with freshness, source, ownership, incidents, and links.",
    acceptance: [
      "Payload includes status, freshness, lastUpdatedAt, source, owner, environment, and criticalCounts.",
      "Payload includes recentRuns, nextExpectedRun, activeIncidents, staleInputs, dataQuality, and links.",
      "Schema validation covers stale, empty, partial-failure, and permission-limited states.",
    ],
    testProof: ["schema validation", "fixture matrix", "runtime source binding"],
  },
  {
    id: "operational-summary",
    order: 4,
    label: "Operational summary",
    objective: "The first screen answers whether the system is okay, what changed, and what needs attention.",
    acceptance: [
      "Health, freshness, last successful run, blockers, throughput, failures, and stale source counts are visible.",
      "Needs-attention and recently-changed sections are severity ordered.",
      "Loading, degraded, stale, empty, and error states remain composed.",
    ],
    testProof: ["state fixtures", "visual proof", "summary contract"],
  },
  {
    id: "drilldowns",
    order: 5,
    label: "Drilldowns",
    objective: "No important card is a dead end; every summary signal can be investigated.",
    acceptance: [
      "Health cards, failed jobs, stale sources, incidents, metrics, workers, and routes link to detail.",
      "Filters, search, row detail, back navigation, and deep links work.",
      "Detail targets expose evidence, owner, timestamp, and next action.",
    ],
    testProof: ["drilldown target registry", "route smoke", "link validation"],
  },
  {
    id: "history-trends",
    order: 6,
    label: "History and trends",
    objective: "The page can explain whether things are improving, slowing, or silently degrading.",
    acceptance: [
      "Health, freshness, job runs, deployments, incidents, data volume, and storage snapshots are persisted.",
      "24h, 7d, and 30d trend views are available where the domain needs them.",
      "Slowdown, drift, failure-rate, and growth-rate baselines are visible.",
    ],
    testProof: ["snapshot ledger", "trend fixture", "baseline comparison"],
  },
  {
    id: "governed-actions",
    order: 7,
    label: "Governed actions",
    objective: "The page can safely operate the system through permissioned, audited, reversible actions.",
    acceptance: [
      "Actions are classified as safe, risky, destructive, or approval-required.",
      "Permissions, confirmations, dry-run/preview, audit log, result state, and retry behavior are implemented.",
      "Rollback or remediation guidance exists for high-impact actions.",
    ],
    testProof: ["command governance ledger", "permission test", "audit event proof"],
  },
  {
    id: "incidents-alerts",
    order: 8,
    label: "Incidents and alerts",
    objective: "The page tells the operator what broke, why it matters, and what to do next.",
    acceptance: [
      "Alerts include severity, start time, owner, blast radius, recommended next action, and evidence.",
      "Acknowledge, snooze, escalate, dedupe, timeline, and post-incident note paths are represented.",
      "Discord or notification routing exists for material failures.",
    ],
    testProof: ["alert rule registry", "notification evidence", "incident fixture"],
  },
  {
    id: "business-workflow",
    order: 9,
    label: "Business workflow",
    objective: "The page is domain-specific enough to run the actual project or system area.",
    acceptance: [
      "Domain panels, queues, KPIs, exceptions, approvals, exports, and next actions are defined.",
      "The page surfaces project-specific operating language, not generic route maturity text.",
      "Workflow tests cover the natural operator path for the domain.",
    ],
    testProof: ["domain component coverage", "workflow smoke", "operator path evidence"],
  },
  {
    id: "rollup-certification",
    order: 10,
    label: "Rollup and certification",
    objective: "The page feeds the executive rollup and cannot claim fully operational without proof.",
    acceptance: [
      "Health, action-required, stale-data, failed-job, incident, deployment, and trend signals feed the rollup.",
      "Automated certification checks live data, drilldowns, actions, alerts, trends, accessibility, screenshots, and smoke tests.",
      "Owner signoff and post-deploy verification are recorded.",
    ],
    testProof: ["operational maturity packet", "certification report", "post-deploy verification"],
  },
];

const packets = routeRows.map((row) => {
  const evidence = evidenceByRoute.get(row.route);
  const maturity = maturityByRoute.get(row.route);
  const liveGap = liveGapByRoute.get(row.route);
  const command = commandByRoute.get(row.route);
  const family = maturity?.family ?? familyFor(`${row.exportName} ${row.route}`);
  const priority = maturity?.priority ?? priorityFor(`${row.exportName} ${row.route}`);
  const domain = domainFor(row, family);
  const routeStatus = evidence?.productionReadiness?.status === "ready" && evidence?.dataBindingStatus === "bound" ? "ready-to-operationalize" : "needs-foundation";
  const layers = operationalLayers.map((layer) => buildLayer(row, layer, family, domain, evidence, maturity, liveGap, command));
  const totals = {
    layerCount: layers.length,
    readyLayerCount: layers.filter((layer) => layer.status === "ready").length,
    evidenceLayerCount: layers.filter((layer) => layer.evidence.length > 0).length,
    buildWorkCount: layers.reduce((sum, layer) => sum + layer.buildWork.length, 0),
    acceptanceCount: layers.reduce((sum, layer) => sum + layer.acceptance.length, 0),
    testProofCount: layers.reduce((sum, layer) => sum + layer.testProof.length, 0),
  };
  const score = Math.round((totals.readyLayerCount / Math.max(1, totals.layerCount)) * 100);
  return {
    exportName: row.exportName,
    route: row.route,
    title: row.title,
    family,
    priority,
    domain,
    routeStatus,
    operationalStage: score === 100 ? "fully-specified" : "needs-operational-build",
    score,
    primaryQuestion: primaryQuestionFor(row.title, family, domain),
    operatorDecisions: operatorDecisionsFor(family, domain),
    criticalFailureStates: criticalFailureStatesFor(family, domain),
    sharedComponents: sharedComponentsFor(family),
    dataContracts: dataContractsFor(family, domain),
    rollupSignals: rollupSignalsFor(family, domain),
    totals,
    layers,
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-operational-maturity-packets.mjs",
  policy: {
    requiredLayerCount: operationalLayers.length,
    requiredBuildWorkPerLayer: 3,
    requiredAcceptancePerLayer: 3,
    requiredTestProofPerLayer: 3,
    fullyOperationalRequiresAllLayersReady: true,
    routeCertificationIsNotOperationalCertification: true,
  },
  layers: operationalLayers,
  totals: {
    routeCount: packets.length,
    fullySpecifiedCount: packets.filter((packet) => packet.operationalStage === "fully-specified").length,
    p0Count: packets.filter((packet) => packet.priority === "P0").length,
    p1Count: packets.filter((packet) => packet.priority === "P1").length,
    layerCount: operationalLayers.length,
    buildWorkCount: packets.reduce((sum, packet) => sum + packet.totals.buildWorkCount, 0),
    acceptanceCount: packets.reduce((sum, packet) => sum + packet.totals.acceptanceCount, 0),
    testProofCount: packets.reduce((sum, packet) => sum + packet.totals.testProofCount, 0),
    averageScore: Math.round(packets.reduce((sum, packet) => sum + packet.score, 0) / Math.max(1, packets.length)),
  },
  packets,
};

fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.mkdirSync(path.dirname(webDataPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
fs.writeFileSync(webRuntimeJsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(webDataPath, renderWebData());

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);
console.log(`Wrote ${path.relative(root, webDataPath)}`);
console.log(`Wrote ${path.relative(root, webRuntimeJsonPath)}`);

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function buildLayer(row, layer, family, domain, evidence, maturity, liveGap, command) {
  const baseEvidence = evidenceForLayer(layer.id, row, evidence, maturity, liveGap, command);
  return {
    ...layer,
    status: baseEvidence.length ? "ready" : "specified",
    buildWork: buildWorkForLayer(layer.id, row.title, family, domain),
    components: componentsForLayer(layer.id, family),
    dataRequirements: dataRequirementsForLayer(layer.id, family, domain),
    drilldowns: drilldownsForLayer(layer.id, family, domain),
    actions: actionsForLayer(layer.id, family, domain),
    acceptance: layer.acceptance,
    testProof: layer.testProof,
    evidence: baseEvidence,
  };
}

function evidenceForLayer(id, row, evidence, maturity, liveGap, command) {
  const items = [];
  if (id === "access-recovery") {
    if (evidence?.productionReadiness?.status === "ready") items.push(`production readiness: ${evidence.productionReadiness.status}`);
    if (evidence?.productionReadiness?.releaseGate?.status) items.push(`release gate: ${evidence.productionReadiness.releaseGate.status}`);
    if (evidence?.productionReadiness?.recoveryPath?.status) items.push(`recovery path: ${evidence.productionReadiness.recoveryPath.status}`);
  }
  if (id === "purpose-orientation") {
    if (maturity?.hasRouteMetadata) items.push("route metadata registered");
    items.push(`route identity: ${row.route}`);
  }
  if (id === "live-data-contract") {
    if (evidence?.dataBindingStatus === "bound") items.push("data binding: bound");
    if (evidence?.liveSourceContracts?.status) items.push(`live source contract: ${evidence.liveSourceContracts.status}`);
    if (evidence?.sourceBindings?.length) items.push(`${evidence.sourceBindings.length} source bindings`);
  }
  if (id === "operational-summary") {
    if (evidence?.operationalCategories?.length) items.push(`${evidence.operationalCategories.length} operational categories`);
    if (evidence?.freshnessSummary?.status) items.push(`freshness: ${evidence.freshnessSummary.status}`);
    if (evidence?.stateCoverage?.status) items.push(`state coverage: ${evidence.stateCoverage.status}`);
  }
  if (id === "drilldowns") {
    if (evidence?.drillDownStatus === "bound") items.push("drill-down binding: bound");
    if (evidence?.drillDownTargets?.length) items.push(`${evidence.drillDownTargets.length} drill-down targets`);
  }
  if (id === "history-trends") {
    if (evidence?.infrastructureConnections?.status) items.push(`infrastructure: ${evidence.infrastructureConnections.status}`);
    if (liveGap?.sourceGapCount !== undefined) items.push(`${liveGap.sourceGapCount} live-source gaps tracked`);
    if (evidence?.payloadMaturity?.status) items.push(`payload maturity: ${evidence.payloadMaturity.status}`);
  }
  if (id === "governed-actions") {
    if (evidence?.commandReadiness?.commandControlStatus) items.push(`command control: ${evidence.commandReadiness.commandControlStatus}`);
    if (evidence?.commandReadiness?.actionRegistry?.length) items.push(`${evidence.commandReadiness.actionRegistry.length} actions registered`);
    if (command?.safePosture === true || command?.routeStatus === "safe") items.push("command posture: safe");
  }
  if (id === "incidents-alerts") {
    if (evidence?.freshnessSummary?.severity) items.push(`freshness severity: ${evidence.freshnessSummary.severity}`);
    if (liveGap?.blockedMutatingActionCount !== undefined) items.push(`${liveGap.blockedMutatingActionCount} blocked mutating actions tracked`);
    if (evidence?.productionReadiness?.sla) items.push(`SLA: ${evidence.productionReadiness.sla}`);
  }
  if (id === "business-workflow") {
    if (evidence?.uxVisualMaturity?.status) items.push(`UX workflow status: ${evidence.uxVisualMaturity.status}`);
    if (evidence?.dataSignals?.length) items.push(`${evidence.dataSignals.length} domain data signals`);
    if (maturity?.nextMaturityAction) items.push(maturity.nextMaturityAction);
  }
  if (id === "rollup-certification") {
    if (maturity?.score === 100) items.push("route maturity score: 100");
    if (evidence?.regressionProof?.status) items.push(`regression proof: ${evidence.regressionProof.status}`);
    if (evidence?.productionReadiness?.productionProof?.length) items.push(`${evidence.productionReadiness.productionProof.length} production proof checks`);
  }
  return items;
}

function buildWorkForLayer(id, title, family, domain) {
  const common = {
    "access-recovery": [
      `Bind ${title} to external uptime, route smoke, auth smoke, and recovery-path status.`,
      "Surface login/reset state and unreachable-service fallback without requiring SSH.",
      "Add Discord or external notification evidence for reachability failures.",
    ],
    "purpose-orientation": [
      `Write the ${domain.label} primary question, owner, environment, maturity state, and runbook links into the page header.`,
      "List the top operator decisions and critical failure states above the fold.",
      "Connect related page links so the operator can move between rollup, project, evidence, and runbook context.",
    ],
    "live-data-contract": [
      `Create the ${domain.contractName} live payload adapter for this page.`,
      "Validate freshness, active incidents, stale inputs, recent runs, next expected run, data quality, and drilldown links.",
      "Provide typed fixtures for normal, empty, stale, degraded, error, and permission-limited states.",
    ],
    "operational-summary": [
      "Replace passive evidence blocks with health, freshness, blockers, failures, throughput, and recently changed panels.",
      "Sort needs-attention items by severity, owner, and age.",
      "Keep skeleton, empty, partial, stale, and error summaries composed on mobile and desktop.",
    ],
    drilldowns: [
      "Add detail routes or expandable rows for every health card, stale source, failed job, metric, incident, and action.",
      "Preserve filters, search, breadcrumbs, back navigation, and deep-link targets.",
      "Expose evidence, timestamp, owner, raw source, and next action at the detail level.",
    ],
    "history-trends": [
      `Persist ${domain.label} snapshots for health, freshness, run history, incidents, deployment, and data/storage movement.`,
      "Render 24h, 7d, and 30d trend views with baseline comparison.",
      "Flag drift, slowdown, failure-rate, storage-growth, and freshness-regression changes.",
    ],
    "governed-actions": [
      "Inventory safe, risky, destructive, and approval-required page actions.",
      "Add permission checks, confirmation, command preview or dry-run, audit events, result states, and retries.",
      "Show rollback or remediation guidance before high-impact actions run.",
    ],
    "incidents-alerts": [
      `Define ${domain.label} alert rules, severities, dedupe, owners, and escalation routes.`,
      "Render alert age, blast radius, recommended action, related logs, and incident timeline.",
      "Add acknowledge, snooze, escalate, and post-incident note paths where appropriate.",
    ],
    "business-workflow": [
      `Build ${domain.label} domain panels, queues, KPIs, approvals, exceptions, reports, and exports.`,
      "Replace generic maturity language with operator language for the page domain.",
      "Add workflow smoke tests for the natural operator path.",
    ],
    "rollup-certification": [
      "Feed project health, action-required, stale-data, failed-job, incident, deployment, and trend signals into the executive rollup.",
      "Gate fully-operational status on live data, drilldowns, governed actions, alerts, trends, accessibility, screenshots, and smoke tests.",
      "Record owner signoff and post-deploy verification evidence.",
    ],
  };
  return common[id] ?? [`Complete ${family} operational build work.`];
}

function componentsForLayer(id, family) {
  const shared = {
    "access-recovery": ["RouteHealthStrip", "AuthRecoveryPanel", "ExternalMonitorBadge"],
    "purpose-orientation": ["PagePurposeHeader", "OperatorDecisionRail", "FailureStateList"],
    "live-data-contract": ["LiveDataBoundary", "FreshnessStrip", "DataQualityBadge"],
    "operational-summary": ["HealthSummaryGrid", "NeedsAttentionQueue", "RecentlyChangedList"],
    drilldowns: ["DrilldownTable", "EvidenceDrawer", "DeepLinkBreadcrumbs"],
    "history-trends": ["TrendRangeTabs", "SnapshotTimeline", "BaselineDeltaCard"],
    "governed-actions": ["GovernedActionPanel", "CommandPreview", "AuditResultTimeline"],
    "incidents-alerts": ["IncidentPanel", "AlertTimeline", "EscalationControls"],
    "business-workflow": [`${family.replace(/\s+/g, "")}WorkflowPanel`, "DomainQueue", "OperatorKpiGrid"],
    "rollup-certification": ["RollupSignalEmitter", "OperationalCertificationCard", "PostDeployProofPanel"],
  };
  return shared[id] ?? [];
}

function dataRequirementsForLayer(id, family, domain) {
  const byLayer = {
    "access-recovery": ["route health", "auth state", "reset channel", "external monitor"],
    "purpose-orientation": ["owner", "environment", "primary question", "runbook", "related routes"],
    "live-data-contract": [domain.contractName, "freshness", "recent runs", "active incidents", "links"],
    "operational-summary": ["health", "blockers", "throughput", "failures", "stale sources", "recent changes"],
    drilldowns: ["card detail", "job detail", "source detail", "metric detail", "incident detail"],
    "history-trends": ["health snapshots", "freshness snapshots", "job history", "incident history", "storage history"],
    "governed-actions": ["action registry", "permissions", "audit events", "cooldowns", "rollback hints"],
    "incidents-alerts": ["alert rules", "severity", "blast radius", "notification channel", "timeline"],
    "business-workflow": domain.dataRequirements,
    "rollup-certification": ["rollup health", "certification checks", "screenshot proof", "post-deploy proof"],
  };
  return byLayer[id] ?? [`${family} operational data`];
}

function drilldownsForLayer(id, family, domain) {
  if (id === "business-workflow") return domain.drilldowns;
  const byLayer = {
    "access-recovery": ["health check detail", "auth reset runbook", "container/proxy status"],
    "purpose-orientation": ["owner page", "runbook", "related dashboard route"],
    "live-data-contract": ["raw payload", "source detail", "schema validation detail"],
    "operational-summary": ["blocker detail", "failed run detail", "stale source detail"],
    drilldowns: ["evidence detail", "route detail", "job detail", "source detail", "incident detail"],
    "history-trends": ["snapshot detail", "baseline detail", "drift detail"],
    "governed-actions": ["command audit detail", "permission detail", "result detail"],
    "incidents-alerts": ["incident timeline", "alert evidence", "notification detail"],
    "rollup-certification": ["executive rollup", "certification report", "post-deploy evidence"],
  };
  return byLayer[id] ?? [`${family} detail`];
}

function actionsForLayer(id, family, domain) {
  const byLayer = {
    "access-recovery": ["run route smoke", "send reset link", "open recovery runbook"],
    "purpose-orientation": ["open related page", "open owner context", "open runbook"],
    "live-data-contract": ["refresh payload", "validate schema", "open raw source"],
    "operational-summary": ["acknowledge blocker", "filter attention queue", "open changed item"],
    drilldowns: ["open detail", "copy deep link", "export evidence"],
    "history-trends": ["change time range", "compare baseline", "export trend"],
    "governed-actions": ["preview command", "request approval", "retry safe action"],
    "incidents-alerts": ["acknowledge alert", "snooze alert", "escalate incident"],
    "business-workflow": domain.actions,
    "rollup-certification": ["run certification", "request owner signoff", "open rollup"],
  };
  return byLayer[id] ?? [`operate ${family}`];
}

function domainFor(row, family) {
  const key = `${row.exportName} ${row.route} ${row.title}`.toLowerCase();
  if (key.includes("khashi")) return domain("Khashi investment operations", "KhashiOperationalSnapshot", ["collection health", "market intelligence", "portfolio signals", "warehouse freshness"], ["source coverage", "symbol detail", "filing/news source", "portfolio signal"], ["trigger collection refresh", "open opportunity review", "request data repair"]);
  if (key.includes("media")) return domain("Media operations", "MediaOperationalSnapshot", ["publishing queue", "asset pipeline", "channel readiness", "failed exports"], ["content item", "asset job", "channel health", "export failure"], ["retry export", "open content review", "request channel repair"]);
  if (key.includes("theme") || key.includes("design")) return domain("dashboard design system", "ThemeSystemSnapshot", ["component quality", "visual drift", "screenshot coverage", "accessibility"], ["component detail", "token usage", "screenshot proof", "a11y finding"], ["run visual check", "open component proof", "request exception retirement"]);
  if (family === "Data") return domain("data operations", "DataOperationsSnapshot", ["source freshness", "warehouse growth", "mirror lag", "retention proof"], ["source detail", "table detail", "mirror job", "retention policy"], ["run sync check", "open stale source", "request pruning review"]);
  if (family === "Deployment") return domain("deployment operations", "DeploymentOperationsSnapshot", ["promotion state", "release proof", "environment health", "rollback readiness"], ["release evidence", "environment detail", "rollback proof"], ["run smoke check", "promote release", "open rollback runbook"]);
  if (family === "Security") return domain("security controls", "SecurityControlsSnapshot", ["permission coverage", "blocked commands", "secret scans", "remediation evidence"], ["control detail", "blocked action", "secret finding"], ["request approval", "open remediation", "rerun scan"]);
  if (family === "Finance") return domain("finance controls", "FinanceControlsSnapshot", ["cost attribution", "billing reconciliation", "budget guardrails", "anomalies"], ["provider bill", "project cost", "anomaly detail"], ["run reconciliation", "open anomaly", "request budget approval"]);
  if (family === "Learning") return domain("learning and evaluations", "LearningOperationsSnapshot", ["eval runs", "outcome feeds", "model comparisons", "regressions"], ["eval detail", "outcome feed", "model comparison"], ["rerun eval", "open regression", "promote candidate"]);
  if (family === "Agents") return domain("agent operations", "AgentOperationsSnapshot", ["routing health", "loop runs", "approval gates", "autonomy readiness"], ["agent route", "loop run", "approval item"], ["reroute work", "request approval", "pause loop"]);
  if (family === "Adapters") return domain("provider adapter operations", "AdapterOperationsSnapshot", ["provider health", "rate limits", "rollout status", "failure modes"], ["provider detail", "adapter rollout", "failure mode"], ["test connectivity", "pause adapter", "open fallback"]);
  if (family === "Executive") return domain("executive operating rollup", "ExecutiveOperationsSnapshot", ["project health", "action queue", "risk map", "fleet changes"], ["project detail", "incident detail", "action item"], ["open priority", "acknowledge risk", "request status"]);
  return domain("operations control", "OperationsSnapshot", ["runner health", "queue state", "SLA breaches", "remediation"], ["runner detail", "queue item", "incident"], ["retry safe job", "open incident", "request review"]);
}

function domain(label, contractName, dataRequirements, drilldowns, actions) {
  return { label, contractName, dataRequirements, drilldowns, actions };
}

function familyFor(key) {
  if (/design|theme|prototype|marketplace/i.test(key)) return "Design System";
  if (/executive|cockpit|business-os|central-command|hermes-os/i.test(key)) return "Executive";
  if (/secret|permission|breaker|gate/i.test(key)) return "Security";
  if (/cost|billing|finance/i.test(key)) return "Finance";
  if (/learning|eval|outcome/i.test(key)) return "Learning";
  if (/adapter|provider|ssh|network/i.test(key)) return "Adapters";
  if (/data|telemetry|memory|artifact|subscription/i.test(key)) return "Data";
  if (/deployment|promotion|production|release/i.test(key)) return "Deployment";
  if (/agent|task|model|loop|autonomy/i.test(key)) return "Agents";
  return "Operations";
}

function priorityFor(key) {
  if (/central-command|incident|secret|production|hard-breaker/i.test(key)) return "P0";
  if (/data|telemetry|deployment|cost|permission|storage|warehouse/i.test(key)) return "P1";
  if (/design|marketplace|prototype|learning|eval/i.test(key)) return "P2";
  return "P3";
}

function primaryQuestionFor(title, family, domain) {
  if (family === "Executive") return `What needs leadership attention across ${domain.label} right now?`;
  if (family === "Design System") return `Is ${title} visually consistent, accessible, and backed by proof?`;
  return `Is ${domain.label} healthy, fresh, and safe to operate right now?`;
}

function operatorDecisionsFor(family, domain) {
  return [
    `Do I need to intervene in ${domain.label} now?`,
    "Which stale, failed, blocked, or high-risk item should be handled first?",
    "Is it safe to trigger a dashboard action, or does it require approval?",
  ];
}

function criticalFailureStatesFor(family, domain) {
  return [
    `${domain.label} route unreachable or auth recovery unavailable`,
    "Live data stale past its materiality threshold",
    "Failed jobs, blocked commands, or incidents have no owner or recovery path",
  ];
}

function sharedComponentsFor(family) {
  return [
    "PagePurposeHeader",
    "FreshnessStrip",
    "HealthSummaryGrid",
    "DrilldownTable",
    "TrendPanel",
    "GovernedActionPanel",
    "IncidentPanel",
    `${family.replace(/\s+/g, "")}WorkflowPanel`,
    "OperationalCertificationCard",
  ];
}

function dataContractsFor(family, domain) {
  return [domain.contractName, "DashboardHealth", "FreshnessSummary", "IncidentSummary[]", "GovernedAction[]", "TrendSnapshot[]", "RollupSignal[]"];
}

function rollupSignalsFor(family, domain) {
  return [
    `${domain.label} health`,
    "action required count",
    "stale data count",
    "failed job count",
    "active incident count",
    "deployment state",
    "trend delta",
  ];
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Operational Maturity Packets",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Policy",
    "",
    `- Required layers per page: ${report.policy.requiredLayerCount}`,
    `- Minimum build work per layer: ${report.policy.requiredBuildWorkPerLayer}`,
    `- Route certification is operational certification: ${report.policy.routeCertificationIsNotOperationalCertification ? "no" : "yes"}`,
    "",
    "## Totals",
    "",
    `- Routes: ${report.totals.routeCount}`,
    `- Fully specified: ${report.totals.fullySpecifiedCount}`,
    `- Average score: ${report.totals.averageScore}%`,
    `- Build work items: ${report.totals.buildWorkCount}`,
    `- Acceptance checks: ${report.totals.acceptanceCount}`,
    `- Test proof requirements: ${report.totals.testProofCount}`,
    "",
    "## Layer Model",
    "",
    ...report.layers.map((layer) => `- ${layer.order}. ${layer.label}: ${layer.objective}`),
    "",
    "## Route Packets",
    "",
  ];
  for (const packet of report.packets) {
    lines.push(`### ${packet.title}`);
    lines.push("");
    lines.push(`- Route: ${packet.route}`);
    lines.push(`- Family: ${packet.family}`);
    lines.push(`- Priority: ${packet.priority}`);
    lines.push(`- Domain: ${packet.domain.label}`);
    lines.push(`- Score: ${packet.score}%`);
    lines.push(`- Primary question: ${packet.primaryQuestion}`);
    lines.push("");
    for (const layer of packet.layers) {
      lines.push(`- ${layer.order}. ${layer.label}: ${layer.buildWork.length} build item(s), ${layer.acceptance.length} acceptance check(s), ${layer.testProof.length} proof item(s).`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderWebData() {
  return `// Generated by scripts/generate-dashboard-operational-maturity-packets.mjs.\n// The full operational maturity packet ledger is shipped as a runtime asset so generated dashboard routes do not embed it in the main page chunk.\nconst dashboardOperationalMaturityPacketsUrl = new URL("./dashboard-operational-maturity-packets.runtime.json", import.meta.url).href;\n\nexport interface DashboardOperationalMaturityLayer {\n  id: string;\n  order: number;\n  label: string;\n  objective: string;\n  status: string;\n  buildWork: string[];\n  components: string[];\n  dataRequirements: string[];\n  drilldowns: string[];\n  actions: string[];\n  acceptance: string[];\n  testProof: string[];\n  evidence: string[];\n}\n\nexport interface DashboardOperationalMaturityPacket {\n  exportName: string;\n  route: string;\n  title: string;\n  family: string;\n  priority: string;\n  domain: { label: string; contractName: string; dataRequirements: string[]; drilldowns: string[]; actions: string[] };\n  routeStatus: string;\n  operationalStage: string;\n  score: number;\n  primaryQuestion: string;\n  operatorDecisions: string[];\n  criticalFailureStates: string[];\n  sharedComponents: string[];\n  dataContracts: string[];\n  rollupSignals: string[];\n  totals: { layerCount: number; readyLayerCount: number; evidenceLayerCount: number; buildWorkCount: number; acceptanceCount: number; testProofCount: number };\n  layers: DashboardOperationalMaturityLayer[];\n}\n\nexport interface DashboardOperationalMaturityPacketsReport {\n  schemaVersion: number;\n  generatedAt: string;\n  source: string;\n  policy: Record<string, unknown>;\n  layers: Array<{ id: string; order: number; label: string; objective: string; acceptance: string[]; testProof: string[] }>;\n  totals: Record<string, number>;\n  packets: DashboardOperationalMaturityPacket[];\n}\n\nlet dashboardOperationalMaturityPacketsPromise: Promise<DashboardOperationalMaturityPacketsReport> | null = null;\n\nexport function loadDashboardOperationalMaturityPackets() {\n  dashboardOperationalMaturityPacketsPromise ??= fetch(dashboardOperationalMaturityPacketsUrl).then((response) => {\n    if (!response.ok) throw new Error(\`Unable to load dashboard operational maturity packets: \${response.status}\`);\n    return response.json() as Promise<DashboardOperationalMaturityPacketsReport>;\n  });\n  return dashboardOperationalMaturityPacketsPromise;\n}\n\nexport { dashboardOperationalMaturityPacketsUrl };\n`;
}
