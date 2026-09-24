#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/fleet/dashboard-maturity-drift-monitor.json");
const outMd = path.join(root, "docs/fleet/dashboard-maturity-drift-monitor.md");

const sources = {
  operational: read("docs/design/dashboard-operational-maturity-packets.json"),
  fullyOperational: read("docs/fleet/dashboard-fully-operational-certification.json"),
  actionUnlock: read("docs/design/dashboard-action-unlock-ledger.json"),
  command: read("docs/design/dashboard-command-governance-ledger.json"),
  evidence: read("docs/design/generated-dashboard-route-evidence-bindings.json"),
  liveGaps: read("docs/design/dashboard-live-source-gap-ledger.json"),
  liveE2e: read("docs/design/dashboard-live-e2e-registry.json"),
  monitoring: read("docs/design/dashboard-monitoring-registry.json"),
  health: read("docs/design/dashboard-live-health-report.json"),
  visual: read("docs/design/dashboard-visual-coverage-report.json"),
  cert: read("docs/fleet/dashboard-certification-report.json"),
  ship: read("docs/fleet/fleet-ship-check.json"),
};

const signals = [
  signal("fully-operational", "Fully operational certification remains at 100%.", sources.fullyOperational.status === "fully-operational-certified" && sources.fullyOperational.score === 100, {
    status: sources.fullyOperational.status,
    score: sources.fullyOperational.score,
  }),
  signal("generated-route-coverage", "All generated routes remain fully specified.", sources.operational.totals?.fullySpecifiedCount === sources.operational.totals?.routeCount, {
    routes: sources.operational.totals?.routeCount ?? 0,
    fullySpecified: sources.operational.totals?.fullySpecifiedCount ?? 0,
  }),
  signal("action-classification", "All actions remain classified with zero unsafe mutations.", sources.actionUnlock.safeForFullyOperational === true && sources.actionUnlock.totals?.unknownActionCount === 0 && sources.actionUnlock.totals?.unsafeMutationCount === 0, {
    unknownActions: sources.actionUnlock.totals?.unknownActionCount ?? 0,
    unsafeMutations: sources.actionUnlock.totals?.unsafeMutationCount ?? 0,
  }),
  signal("command-governance", "Command governance keeps zero unsafe mutations and zero missing controls.", sources.command.safePosture === true && sources.command.totals?.unsafeMutationCount === 0 && sources.command.totals?.missingControlCount === 0, {
    unsafeMutations: sources.command.totals?.unsafeMutationCount ?? 0,
    missingControls: sources.command.totals?.missingControlCount ?? 0,
  }),
  signal("evidence-freshness", "Generated route evidence has no stale evidence.", (sources.evidence.totals?.staleEvidenceCount ?? 0) === 0, {
    staleEvidence: sources.evidence.totals?.staleEvidenceCount ?? 0,
  }),
  signal("source-gaps", "Live source gaps remain closed.", (sources.liveGaps.totals?.sourceGapCount ?? 0) === 0, {
    sourceGaps: sources.liveGaps.totals?.sourceGapCount ?? 0,
  }),
  signal("live-e2e", "All live E2E entries are current and passing.", allEntriesPassed(sources.liveE2e.entries, "latestRun"), {
    entries: sources.liveE2e.entries?.length ?? 0,
    failed: countNotPassed(sources.liveE2e.entries, "latestRun"),
  }),
  signal("monitoring", "All monitoring entries are current and passing.", allEntriesPassed(sources.monitoring.entries, "latestCheck"), {
    entries: sources.monitoring.entries?.length ?? 0,
    failed: countNotPassed(sources.monitoring.entries, "latestCheck"),
  }),
  signal("live-health", "All live health checks are passing.", healthPassed(sources.health), {
    checked: sources.health.checkedCount ?? sources.health.summary?.checked ?? 0,
    failed: sources.health.failedCount ?? sources.health.summary?.failed ?? 0,
  }),
  signal("visual-proof", "Production visual proof remains complete and fresh.", sources.visual.dashboardCount > 0 && sources.visual.coveredCount === sources.visual.dashboardCount && sources.visual.staleCount === 0, {
    dashboards: sources.visual.dashboardCount ?? 0,
    covered: sources.visual.coveredCount ?? 0,
    stale: sources.visual.staleCount ?? 0,
  }),
  signal("project-certification", "Project dashboard certification remains clean.", sources.cert.summary?.certified === sources.cert.summary?.totalProjects && sources.cert.summary?.review === 0 && sources.cert.summary?.blocked === 0, {
    total: sources.cert.summary?.totalProjects ?? 0,
    certified: sources.cert.summary?.certified ?? 0,
    review: sources.cert.summary?.review ?? 0,
    blocked: sources.cert.summary?.blocked ?? 0,
  }),
  signal("ship-check", "Fleet ship check remains safe.", sources.ship.safeToCommit === true && sources.ship.safeToDeploy === true && (sources.ship.failedSteps ?? 0) === 0, {
    safeToCommit: sources.ship.safeToCommit === true,
    safeToDeploy: sources.ship.safeToDeploy === true,
    failedSteps: sources.ship.failedSteps ?? 0,
  }),
];

const failed = signals.filter((item) => item.status !== "passing");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-maturity-drift-monitor.mjs",
  status: failed.length ? "drift-detected" : "stable",
  summary: {
    signalCount: signals.length,
    passing: signals.length - failed.length,
    failed: failed.length,
    highestSeverity: failed.some((item) => item.severity === "critical") ? "critical" : failed.length ? "warning" : "none",
  },
  signals,
  nextActions: failed.length
    ? failed.map((item) => `Resolve drift signal ${item.id}: ${item.description}`)
    : ["No maturity drift is active. Keep scheduled drift, visual, live, and certification checks running."],
};

fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard maturity drift monitor: ${report.status}, ${report.summary.passing}/${report.summary.signalCount} passing.`);
if (failed.length) process.exitCode = 1;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function signal(id, description, passing, evidence) {
  return { id, description, status: passing ? "passing" : "drift", severity: passing ? "none" : "critical", evidence };
}

function allEntriesPassed(entries = [], field) {
  return entries.length > 0 && entries.every((entry) => entry.status === "current" && entry[field]?.status === "passed");
}

function countNotPassed(entries = [], field) {
  return entries.filter((entry) => entry.status !== "current" || entry[field]?.status !== "passed").length;
}

function healthPassed(report) {
  if (report.status === "passed") return true;
  if (report.failedCount === 0 && (report.checkedCount ?? 0) > 0) return true;
  if (report.summary?.failed === 0 && (report.summary?.checked ?? 0) > 0) return true;
  if (Array.isArray(report.dashboards)) return report.dashboards.length > 0 && report.dashboards.every((item) => item.status === "passed" || item.ok === true);
  return false;
}

function renderMarkdown(report) {
  return [
    "# Dashboard Maturity Drift Monitor",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Passing: ${report.summary.passing}/${report.summary.signalCount}`,
    "",
    "## Signals",
    "",
    ...report.signals.map((item) => `- ${item.status === "passing" ? "PASS" : "DRIFT"} ${item.id}: ${item.description}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((item) => `- ${item}`),
    "",
  ].join("\n");
}
