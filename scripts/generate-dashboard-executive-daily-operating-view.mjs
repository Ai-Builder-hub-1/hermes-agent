#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/fleet/dashboard-executive-daily-operating-view.json");
const outMd = path.join(root, "docs/fleet/dashboard-executive-daily-operating-view.md");
const outTs = path.join(root, "web/src/pages/dashboard-executive-daily-operating-data.ts");

const sources = {
  certification: read("docs/fleet/dashboard-fully-operational-certification.json"),
  drift: read("docs/fleet/dashboard-maturity-drift-monitor.json"),
  visualGate: read("docs/design/dashboard-production-visual-gate.json"),
  actionUnlock: read("docs/design/dashboard-action-unlock-ledger.json"),
  command: read("docs/design/dashboard-command-governance-ledger.json"),
  liveE2e: read("docs/design/dashboard-live-e2e-registry.json"),
  monitoring: read("docs/design/dashboard-monitoring-registry.json"),
  health: read("docs/design/dashboard-live-health-report.json"),
  visualCoverage: read("docs/design/dashboard-visual-coverage-report.json"),
  projectCertification: read("docs/fleet/dashboard-certification-report.json"),
  ship: read("docs/fleet/fleet-ship-check.json"),
  operatingHistory: read("docs/fleet/dashboard-operating-history-policy.json"),
  predictive: read("docs/fleet/dashboard-predictive-causal-intelligence.json"),
  recovery: read("docs/fleet/dashboard-governed-recovery-audit.json"),
  dataOps: readOptional(process.env.DATA_OPS_MATURITY_REPORT ?? "/data/data-ops-maturity/latest.json"),
};

const healthById = new Map((sources.health.items ?? []).map((item) => [item.id, item]));
const visualById = new Map((sources.visualGate.items ?? sources.visualCoverage.items ?? []).map((item) => [item.dashboardId, item]));
const monitoringByProject = new Map((sources.monitoring.entries ?? []).map((item) => [item.projectId, item]));
const certProjects = sources.projectCertification.projects ?? [];
const certBySlug = new Map(certProjects.flatMap((item) => keysFor(item.project ?? item.projectId ?? item.name ?? item.label).map((key) => [key, item])));

const dashboards = (sources.liveE2e.entries ?? []).map((entry) => {
  const health = findByLabelOrProject(healthById, sources.health.items ?? [], entry);
  const visual = findByLabelOrProject(visualById, sources.visualGate.items ?? sources.visualCoverage.items ?? [], entry);
  const monitoring = monitoringByProject.get(entry.projectId);
  const certification = findCertification(entry);
  const signals = [
    signal("live-e2e", entry.status === "current" && entry.latestRun?.status === "passed", "Live operator flow passed."),
    signal("monitoring", monitoring?.status === "current" && monitoring?.latestCheck?.status === "passed", "Monitoring check passed."),
    signal("health", health?.status === "ok" || health?.status === "passed", "Health endpoint passed."),
    signal("visual", visual?.status === "visual-gate-passed" || visual?.status === "covered", "Visual proof passed."),
    signal("certification", certification?.verdict === "certified" || certification?.status === "certified" || certification?.certificationStatus === "certified", "Project certification passed."),
  ];
  const failing = signals.filter((item) => item.status !== "passing");
  return {
    projectId: entry.projectId,
    dashboardId: visual?.dashboardId ?? health?.id ?? entry.projectId,
    label: entry.label,
    status: failing.length ? "needs-attention" : "operational",
    route: entry.route ?? visual?.url ?? null,
    proofUrl: entry.proofUrl ?? visual?.proofUrl ?? null,
    healthUrl: entry.healthUrl ?? health?.healthUrl ?? monitoring?.healthUrl ?? null,
    snapshotUrl: entry.snapshotUrl ?? monitoring?.snapshotUrl ?? null,
    latestE2eAt: entry.latestRun?.capturedAt ?? null,
    latestMonitoringAt: monitoring?.latestCheck?.capturedAt ?? null,
    visualQualityScore: visual?.visualQualityScore ?? null,
    signals,
    nextAction: failing.length
      ? `Resolve ${failing.map((item) => item.id).join(", ")} evidence for ${entry.label}.`
      : "Keep live checks, monitoring, health, and visual proof current.",
  };
});

const attentionDashboards = dashboards.filter((item) => item.status !== "operational");
const unsafeMutations = sources.actionUnlock.totals?.unsafeMutationCount ?? sources.command.totals?.unsafeMutationCount ?? 0;
const unknownActions = sources.actionUnlock.totals?.unknownActionCount ?? 0;
const controlledMutations = sources.actionUnlock.totals?.controlledMutationCount ?? sources.certification.summary?.controlledMutations ?? 0;
const approvalRequired = sources.actionUnlock.totals?.approvalRequiredCount ?? 0;
const maintenanceWindowOnly = sources.actionUnlock.totals?.maintenanceWindowOnlyCount ?? 0;
const critical =
  sources.certification.status !== "fully-operational-certified" ||
  sources.drift.status !== "stable" ||
  sources.visualGate.status !== "visual-gate-passed" ||
  sources.dataOps?.status === "blocked" ||
  !sources.dataOps ||
  sources.ship.safeToCommit !== true ||
  sources.ship.safeToDeploy !== true ||
  sources.operatingHistory.status !== "inside-policy" ||
  sources.predictive.status !== "low-risk" ||
  sources.recovery.status !== "recovery-ready" ||
  unsafeMutations !== 0 ||
  unknownActions !== 0 ||
  attentionDashboards.length > 0;

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-executive-daily-operating-view.mjs",
  status: critical ? "needs-attention" : "clear",
  summary: {
    dashboardCount: dashboards.length,
    attentionCount: attentionDashboards.length,
    fullyOperationalScore: sources.certification.score ?? 0,
    driftStatus: sources.drift.status,
    visualStatus: sources.visualGate.status,
    liveE2eCurrent: (sources.liveE2e.entries ?? []).filter((item) => item.status === "current").length,
    monitoringCurrent: (sources.monitoring.entries ?? []).filter((item) => item.status === "current").length,
    healthFailures: sources.health.failedCount ?? 0,
    safeToCommit: sources.ship.safeToCommit === true,
    safeToDeploy: sources.ship.safeToDeploy === true,
    policyStatus: sources.operatingHistory.status,
    trendDirection: sources.operatingHistory.trend?.direction ?? "unknown",
    forecastStatus: sources.predictive.status,
    forecastConfidence: sources.predictive.confidence,
    recoveryStatus: sources.recovery.status,
    dataOpsStatus: sources.dataOps?.status ?? "missing",
    dataOpsScore: sources.dataOps?.score ?? 0,
    dataOpsBlockedLayers: sources.dataOps?.blockedLayers?.length ?? 0,
    dataOpsWatchLayers: sources.dataOps?.watchLayers?.length ?? 0,
  },
  actionPosture: {
    actionInstances: sources.certification.summary?.actionInstances ?? sources.actionUnlock.totals?.actionInstanceCount ?? 0,
    controlledMutations,
    approvalRequired,
    maintenanceWindowOnly,
    unsafeMutations,
    unknownActions,
    commandSafePosture: sources.command.safePosture === true,
  },
  maturityLayers: [
    layer("Operating History", sources.operatingHistory.status, sources.operatingHistory.trend?.direction ?? "unknown", "Keeps policy objectives and rolling run history visible."),
    layer("Predictive Causal Intelligence", sources.predictive.status, sources.predictive.confidence, "Forecasts drift risk and maps symptoms to likely causes."),
    layer("Governed Recovery", sources.recovery.status, `${sources.recovery.summary?.autoSafeCount ?? 0} auto-safe`, "Separates safe recovery from approval, maintenance-window, and blocked actions."),
    layer("Data Operations", sources.dataOps?.status ?? "missing", `${sources.dataOps?.score ?? 0}/100`, "Tracks collection freshness, warehouse growth, archive readiness, backups, and external sync."),
  ],
  dataOperations: summarizeDataOps(sources.dataOps),
  topPriorities: buildTopPriorities(),
  dashboards,
  evidenceLinks: [
    evidence("Fully Operational Certification", "docs/fleet/dashboard-fully-operational-certification.json", sources.certification.status),
    evidence("Maturity Drift Monitor", "docs/fleet/dashboard-maturity-drift-monitor.json", sources.drift.status),
    evidence("Production Visual Gate", "docs/design/dashboard-production-visual-gate.json", sources.visualGate.status),
    evidence("Live E2E Registry", "docs/design/dashboard-live-e2e-registry.json", `${dashboards.length} dashboards`),
    evidence("Monitoring Registry", "docs/design/dashboard-monitoring-registry.json", `${sources.monitoring.entries?.length ?? 0} checks`),
    evidence("Fleet Ship Check", "docs/fleet/fleet-ship-check.json", sources.ship.safeToDeploy ? "deploy-ready" : "blocked"),
    evidence("Operating History Policy", "docs/fleet/dashboard-operating-history-policy.json", sources.operatingHistory.status),
    evidence("Predictive Causal Intelligence", "docs/fleet/dashboard-predictive-causal-intelligence.json", sources.predictive.status),
    evidence("Governed Recovery Audit", "docs/fleet/dashboard-governed-recovery-audit.json", sources.recovery.status),
    evidence("Data Operations Maturity", process.env.DATA_OPS_MATURITY_REPORT ?? "/data/data-ops-maturity/latest.json", sources.dataOps?.status ?? "missing"),
  ],
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.mkdirSync(path.dirname(outTs), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
fs.writeFileSync(outTs, renderTypescript(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Wrote ${path.relative(root, outTs)}`);
console.log(`Dashboard executive daily operating view: ${report.status}, ${report.summary.dashboardCount} dashboard(s), ${report.summary.attentionCount} attention item(s).`);

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function readOptional(targetPath) {
  try {
    return JSON.parse(fs.readFileSync(path.isAbsolute(targetPath) ? targetPath : path.join(root, targetPath), "utf8"));
  } catch {
    return null;
  }
}

function slug(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function keysFor(value = "") {
  const base = slug(value);
  const aliases = new Set([base]);
  if (base === "hermes-os") aliases.add("hermes");
  if (base === "hermes-workspace") aliases.add("hermes-os");
  if (base === "media-business-operations") aliases.add("media-business-os");
  if (base === "media-business-os") aliases.add("media-business-operations");
  if (base === "business-mapper-consulting") aliases.add("business-mapper");
  if (base === "business-mapper-workspace") aliases.add("business-mapper");
  if (base === "khashi-vc-roc") aliases.add("khashi-vc");
  if (base === "kashi-vc") aliases.add("khashi-vc");
  if (base === "khashi-vc") aliases.add("kashi-vc");
  if (base === "investing-system-roc") aliases.add("investing-system");
  if (base === "media-engine-ops") aliases.add("media-engine");
  return [...aliases];
}

function findByLabelOrProject(map, items, entry) {
  const keys = [...keysFor(entry.projectId), ...keysFor(entry.label)];
  for (const key of keys) {
    const direct = map.get(key) ?? map.get(`${key}.dashboard`) ?? map.get(`${key}.main`) ?? map.get(`${key}.roc`) ?? map.get(`${key}.ops`) ?? map.get(`${key}.workspace`);
    if (direct) return direct;
  }
  return items.find((item) => keysFor(item.label).some((key) => keys.includes(key))) ??
    items.find((item) => keysFor(item.dashboardId ?? item.id ?? "").some((key) => keys.includes(key) || keys.some((entryKey) => key.includes(entryKey))));
}

function findCertification(entry) {
  const keys = [...keysFor(entry.projectId), ...keysFor(entry.label)];
  for (const key of keys) {
    const item = certBySlug.get(key);
    if (item) return item;
  }
  return certProjects.find((item) => keysFor(item.project ?? item.name ?? "").some((key) => keys.includes(key)));
}

function signal(id, passing, description) {
  return { id, description, status: passing ? "passing" : "attention" };
}

function evidence(label, pathValue, status) {
  return { label, path: pathValue, status };
}

function buildTopPriorities() {
  const priorities = [];
  if (sources.drift.status !== "stable") priorities.push("Resolve maturity drift before further dashboard promotion.");
  if (sources.visualGate.status !== "visual-gate-passed") priorities.push("Refresh production visual proof and baselines.");
  if (attentionDashboards.length) priorities.push(`Clear dashboard evidence attention on ${attentionDashboards.length} dashboard(s).`);
  if (unsafeMutations || unknownActions) priorities.push("Block unsafe or unknown actions before enabling operator commands.");
  if (sources.ship.safeToDeploy !== true) priorities.push("Unblock fleet ship check before production deployment.");
  if (sources.operatingHistory.status !== "inside-policy") priorities.push("Restore operating policy objectives before trusting trend history.");
  if (sources.predictive.status !== "low-risk") priorities.push("Investigate elevated forecast risk before approving automated recovery.");
  if (sources.recovery.status !== "recovery-ready") priorities.push("Resolve governed recovery audit failures before enabling new action classes.");
  if (!sources.dataOps) priorities.push("Restore the cross-project data operations maturity report feed.");
  if (sources.dataOps?.status === "blocked") priorities.push(`Resolve ${sources.dataOps.blockedLayers?.length ?? 0} blocked data operations layer(s) across Khashi VC and Investing System.`);
  if (sources.dataOps?.status === "watch") priorities.push("Review data operations watch items before the next warehouse mirror or pruning window.");
  if (!priorities.length) {
    priorities.push("No active maturity drift is present.");
    priorities.push("Review the controlled mutation queue before approving operator write actions.");
    priorities.push("Keep visual proof, live E2E, monitoring, and health checks fresh on the daily cadence.");
  }
  return priorities;
}

function layer(label, status, detail, description) {
  return { label, status, detail, description };
}

function summarizeDataOps(dataOps) {
  if (!dataOps) {
    return {
      status: "missing",
      score: 0,
      generatedAt: null,
      blockedLayers: [],
      watchLayers: [],
      projects: [],
      nextActions: ["Restore /data/data-ops-maturity/latest.json generation."],
    };
  }
  return {
    status: dataOps.status ?? "unknown",
    score: dataOps.score ?? 0,
    generatedAt: dataOps.generatedAt ?? null,
    blockedLayers: dataOps.blockedLayers ?? [],
    watchLayers: dataOps.watchLayers ?? [],
    projects: (dataOps.projects ?? []).map((project) => ({
      id: project.id,
      label: project.label,
      status: project.status,
      score: project.score,
      checkedAt: project.checkedAt,
    })),
    nextActions: dataOps.nextActions ?? [],
  };
}

function renderMarkdown(report) {
  return [
    "# Dashboard Executive Daily Operating View",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Summary",
    "",
    `- Dashboards: ${report.summary.dashboardCount}`,
    `- Attention: ${report.summary.attentionCount}`,
    `- Fully operational score: ${report.summary.fullyOperationalScore}`,
    `- Drift: ${report.summary.driftStatus}`,
    `- Visual: ${report.summary.visualStatus}`,
    `- Safe to deploy: ${report.summary.safeToDeploy}`,
    `- Policy: ${report.summary.policyStatus}`,
    `- Forecast: ${report.summary.forecastStatus}`,
    `- Recovery: ${report.summary.recoveryStatus}`,
    `- Data operations: ${report.summary.dataOpsStatus} (${report.summary.dataOpsScore}/100)`,
    `- Data operations blocked layers: ${report.summary.dataOpsBlockedLayers}`,
    "",
    "## Top Priorities",
    "",
    ...report.topPriorities.map((item) => `- ${item}`),
    "",
    "## Dashboard Posture",
    "",
    ...report.dashboards.map((item) => `- ${item.status === "operational" ? "PASS" : "WATCH"} ${item.label}: ${item.nextAction}`),
    "",
    "## Data Operations",
    "",
    `- Status: ${report.dataOperations.status}`,
    `- Score: ${report.dataOperations.score}/100`,
    `- Generated: ${report.dataOperations.generatedAt ?? "unknown"}`,
    ...(report.dataOperations.blockedLayers.length
      ? report.dataOperations.blockedLayers.map((item) => `- BLOCKED ${item.project}: ${item.id} - ${item.evidence}`)
      : ["- No blocked data operations layers."]),
    "",
  ].join("\n");
}

function renderTypescript(report) {
  return `// Generated by scripts/generate-dashboard-executive-daily-operating-view.mjs
export const dashboardExecutiveDailyOperatingView = ${JSON.stringify(report, null, 2)} as const;

export type DashboardExecutiveDailyOperatingView = typeof dashboardExecutiveDailyOperatingView;
`;
}
