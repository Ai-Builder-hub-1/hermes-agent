#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/fleet/dashboard-operating-history-policy.json");
const outMd = path.join(root, "docs/fleet/dashboard-operating-history-policy.md");
const historyJson = path.join(root, "docs/fleet/dashboard-operating-history-ledger.json");

const daily = read("docs/fleet/dashboard-executive-daily-operating-view.json");
const drift = read("docs/fleet/dashboard-maturity-drift-monitor.json");
const visual = read("docs/design/dashboard-production-visual-gate.json");
const health = read("docs/design/dashboard-live-health-report.json");
const liveE2e = read("docs/design/dashboard-live-e2e-registry.json");
const monitoring = read("docs/design/dashboard-monitoring-registry.json");
const ship = read("docs/fleet/fleet-ship-check.json");

const objectives = [
  objective("dashboard-health", "Every dashboard health check passes.", health.failedCount === 0, { checked: health.checkedCount ?? 0, failed: health.failedCount ?? 0 }),
  objective("live-e2e", "Every dashboard has current live E2E proof.", allCurrent(liveE2e.entries, "latestRun"), { entries: liveE2e.entries?.length ?? 0 }),
  objective("monitoring", "Every dashboard has current monitoring proof.", allCurrent(monitoring.entries, "latestCheck"), { entries: monitoring.entries?.length ?? 0 }),
  objective("visual-proof", "Every dashboard passes production visual proof.", visual.status === "visual-gate-passed", visual.summary ?? {}),
  objective("maturity-drift", "Maturity drift remains stable.", drift.status === "stable", drift.summary ?? {}),
  objective("ship-readiness", "Fleet remains safe to commit and deploy.", ship.safeToCommit === true && ship.safeToDeploy === true, { safeToCommit: ship.safeToCommit, safeToDeploy: ship.safeToDeploy }),
];

const failed = objectives.filter((item) => item.status !== "inside-policy");
const snapshot = {
  capturedAt: new Date().toISOString(),
  status: failed.length ? "policy-attention" : "inside-policy",
  dashboardCount: daily.summary?.dashboardCount ?? 0,
  attentionCount: daily.summary?.attentionCount ?? 0,
  failedObjectiveCount: failed.length,
  driftStatus: drift.status,
  visualStatus: visual.status,
  healthFailures: health.failedCount ?? 0,
  safeToDeploy: ship.safeToDeploy === true,
};
const previousLedger = readOptional(historyJson, { schemaVersion: 1, generatedAt: null, retention: {}, entries: [] });
const entries = [...(previousLedger.entries ?? []), snapshot].slice(-672);
const trend = buildTrend(entries);
const report = {
  schemaVersion: 1,
  generatedAt: snapshot.capturedAt,
  source: "scripts/generate-dashboard-operating-history-policy.mjs",
  status: failed.length ? "policy-attention" : "inside-policy",
  retention: {
    latestEntriesRetained: 672,
    evidenceRunRetentionDays: 365,
    incidentRetentionDays: 730,
    immutableArchiveRequired: true,
  },
  objectives,
  trend,
  latestSnapshot: snapshot,
  nextActions: failed.length
    ? failed.map((item) => `Restore policy objective ${item.id}: ${item.description}`)
    : ["Keep scheduled evidence capture running and preserve each maturity run for trend review."],
};

const ledger = {
  schemaVersion: 1,
  generatedAt: snapshot.capturedAt,
  source: "scripts/generate-dashboard-operating-history-policy.mjs",
  retention: report.retention,
  entries,
};

fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(historyJson, `${JSON.stringify(ledger, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, historyJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard operating history policy: ${report.status}, ${objectives.length - failed.length}/${objectives.length} objectives inside policy.`);
if (failed.length) process.exitCode = 1;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function readOptional(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function objective(id, description, passing, evidence) {
  return { id, description, status: passing ? "inside-policy" : "outside-policy", evidence };
}

function allCurrent(entries = [], field) {
  return entries.length > 0 && entries.every((entry) => entry.status === "current" && entry[field]?.status === "passed");
}

function buildTrend(entries) {
  const current = entries.at(-1);
  const previous = entries.at(-2);
  const direction = !previous
    ? "baseline"
    : current.failedObjectiveCount < previous.failedObjectiveCount
      ? "improving"
      : current.failedObjectiveCount > previous.failedObjectiveCount
        ? "worsening"
        : "stable";
  return {
    direction,
    sampleCount: entries.length,
    latestAttentionCount: current?.attentionCount ?? 0,
    previousAttentionCount: previous?.attentionCount ?? null,
    latestFailedObjectiveCount: current?.failedObjectiveCount ?? 0,
    previousFailedObjectiveCount: previous?.failedObjectiveCount ?? null,
  };
}

function renderMarkdown(report) {
  return [
    "# Dashboard Operating History Policy",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    `Trend: ${report.trend.direction}`,
    "",
    "## Objectives",
    "",
    ...report.objectives.map((item) => `- ${item.status === "inside-policy" ? "PASS" : "WATCH"} ${item.id}: ${item.description}`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((item) => `- ${item}`),
    "",
  ].join("\n");
}
