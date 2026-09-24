#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const paths = {
  operational: "docs/design/dashboard-operational-maturity-packets.json",
  actionUnlock: "docs/design/dashboard-action-unlock-ledger.json",
  command: "docs/design/dashboard-command-governance-ledger.json",
  liveE2e: "docs/design/dashboard-live-e2e-registry.json",
  monitoring: "docs/design/dashboard-monitoring-registry.json",
  health: "docs/design/dashboard-live-health-report.json",
  visual: "docs/design/dashboard-visual-coverage-report.json",
  certification: "docs/fleet/dashboard-certification-report.json",
  ship: "docs/fleet/fleet-ship-check.json",
};
const outputJson = path.join(root, "docs/fleet/dashboard-fully-operational-certification.json");
const outputMd = path.join(root, "docs/fleet/dashboard-fully-operational-certification.md");
const data = Object.fromEntries(Object.entries(paths).map(([key, rel]) => [key, readJson(rel)]));

const checks = [
  check("operational-packets", "Generated routes have complete ten-layer operational packets.", data.operational.totals?.routeCount >= 1 && data.operational.totals?.fullySpecifiedCount === data.operational.totals?.routeCount, {
    routes: data.operational.totals?.routeCount ?? 0,
    fullySpecified: data.operational.totals?.fullySpecifiedCount ?? 0,
  }),
  check("action-unlock-ledger", "All dashboard actions are classified and safe for the fully-operational posture.", data.actionUnlock.safeForFullyOperational === true && data.actionUnlock.totals?.unknownActionCount === 0 && data.actionUnlock.totals?.unsafeMutationCount === 0, {
    actionInstances: data.actionUnlock.totals?.actionInstanceCount ?? 0,
    controlledMutations: data.actionUnlock.totals?.controlledMutationCount ?? 0,
    unknownActions: data.actionUnlock.totals?.unknownActionCount ?? 0,
    unsafeMutations: data.actionUnlock.totals?.unsafeMutationCount ?? 0,
  }),
  check("command-governance", "Command governance has zero unsafe mutations and zero missing controls.", data.command.safePosture === true && data.command.totals?.unsafeMutationCount === 0 && data.command.totals?.missingControlCount === 0, {
    safePosture: data.command.safePosture === true,
    unsafeMutations: data.command.totals?.unsafeMutationCount ?? 0,
    missingControls: data.command.totals?.missingControlCount ?? 0,
  }),
  check("live-e2e", "All project dashboards have current live E2E proof.", allCurrent(data.liveE2e.entries, "status") && allPassed(data.liveE2e.entries, "latestRun"), {
    total: data.liveE2e.entries?.length ?? 0,
    current: (data.liveE2e.entries ?? []).filter((entry) => entry.status === "current").length,
  }),
  check("monitoring", "All project dashboards have current monitoring proof.", allCurrent(data.monitoring.entries, "status") && allPassed(data.monitoring.entries, "latestCheck"), {
    total: data.monitoring.entries?.length ?? 0,
    current: (data.monitoring.entries ?? []).filter((entry) => entry.status === "current").length,
  }),
  check("live-health", "All live dashboard health checks pass.", healthPassed(data.health), {
    checked: data.health.checkedCount ?? data.health.summary?.checked ?? data.health.dashboards?.length ?? 0,
    failed: data.health.failedCount ?? data.health.summary?.failed ?? 0,
  }),
  check("visual-proof", "All project dashboards have fresh visual proof.", data.visual.dashboardCount >= 1 && data.visual.coveredCount === data.visual.dashboardCount && data.visual.staleCount === 0, {
    dashboards: data.visual.dashboardCount ?? 0,
    covered: data.visual.coveredCount ?? 0,
    stale: data.visual.staleCount ?? 0,
  }),
  check("project-certification", "All project dashboards are certified with no review or blocked items.", data.certification.summary?.certified === data.certification.summary?.totalProjects && data.certification.summary?.review === 0 && data.certification.summary?.blocked === 0, {
    totalProjects: data.certification.summary?.totalProjects ?? 0,
    certified: data.certification.summary?.certified ?? 0,
    review: data.certification.summary?.review ?? 0,
    blocked: data.certification.summary?.blocked ?? 0,
  }),
  check("ship-check", "Fleet ship check is safe to commit and deploy.", data.ship.safeToCommit === true && data.ship.safeToDeploy === true && (data.ship.failedSteps ?? 0) === 0, {
    safeToCommit: data.ship.safeToCommit === true,
    safeToDeploy: data.ship.safeToDeploy === true,
    failedSteps: data.ship.failedSteps ?? 0,
  }),
];

const passed = checks.filter((item) => item.status === "passed").length;
const failed = checks.length - passed;
const score = Math.round((passed / checks.length) * 100);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-fully-operational-certification.mjs",
  standard: "docs/design/dashboard-fully-operational-standard.md",
  status: failed === 0 ? "fully-operational-certified" : "needs-operational-work",
  score,
  summary: {
    checks: checks.length,
    passed,
    failed,
    generatedRoutes: data.operational.totals?.routeCount ?? 0,
    projectDashboards: data.certification.summary?.totalProjects ?? 0,
    actionInstances: data.actionUnlock.totals?.actionInstanceCount ?? 0,
    controlledMutations: data.actionUnlock.totals?.controlledMutationCount ?? 0,
    unsafeMutations: data.actionUnlock.totals?.unsafeMutationCount ?? 0,
  },
  checks,
  residualRisk: [
    "Mutating actions are certified as controlled, not blindly enabled; approval-required and maintenance-window actions must remain blocked until their live endpoint, approval, audit, cooldown, and recovery proof exists.",
    "Production visual proof is ledger-backed; full multi-page browser screenshot refresh should run after deployment for release evidence.",
    "The fully-operational gate certifies the standard and evidence posture; domain teams should still continue replacing generic packet panels with richer bespoke workflow components where useful.",
  ],
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outputMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outputJson)}`);
console.log(`Wrote ${path.relative(root, outputMd)}`);
console.log(`Dashboard fully operational certification: ${report.status}, score=${report.score}, failed=${failed}.`);
if (failed) process.exitCode = 1;

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function check(id, description, passed, evidence) {
  return { id, description, status: passed ? "passed" : "failed", evidence };
}

function allCurrent(entries = [], field) {
  return entries.length > 0 && entries.every((entry) => entry[field] === "current");
}

function allPassed(entries = [], field) {
  return entries.length > 0 && entries.every((entry) => entry[field]?.status === "passed");
}

function healthPassed(report) {
  if (report.status === "passed") return true;
  if (report.failedCount === 0 && (report.checkedCount ?? 0) > 0) return true;
  if (report.summary?.failed === 0 && (report.summary?.checked ?? 0) > 0) return true;
  if (Array.isArray(report.dashboards)) return report.dashboards.length > 0 && report.dashboards.every((item) => item.status === "passed" || item.ok === true);
  return false;
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Fully Operational Certification",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: ${report.status}`,
    `Score: ${report.score}%`,
    "",
    "## Summary",
    "",
    `- Checks: ${report.summary.checks}`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    `- Generated routes: ${report.summary.generatedRoutes}`,
    `- Project dashboards: ${report.summary.projectDashboards}`,
    `- Action instances: ${report.summary.actionInstances}`,
    `- Controlled mutations: ${report.summary.controlledMutations}`,
    `- Unsafe mutations: ${report.summary.unsafeMutations}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((item) => `- ${item.status === "passed" ? "PASS" : "FAIL"} ${item.id}: ${item.description}`),
    "",
    "## Residual Risk",
    "",
    ...report.residualRisk.map((item) => `- ${item}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}
