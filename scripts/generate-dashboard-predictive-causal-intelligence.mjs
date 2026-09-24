#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/fleet/dashboard-predictive-causal-intelligence.json");
const outMd = path.join(root, "docs/fleet/dashboard-predictive-causal-intelligence.md");

const daily = read("docs/fleet/dashboard-executive-daily-operating-view.json");
const history = read("docs/fleet/dashboard-operating-history-policy.json");
const drift = read("docs/fleet/dashboard-maturity-drift-monitor.json");
const visual = read("docs/design/dashboard-production-visual-gate.json");
const health = read("docs/design/dashboard-live-health-report.json");
const liveE2e = read("docs/design/dashboard-live-e2e-registry.json");
const monitoring = read("docs/design/dashboard-monitoring-registry.json");
const ship = read("docs/fleet/fleet-ship-check.json");

const forecasts = [
  forecast("maturity-drift", "Maturity drift forecast", drift.status === "stable" && history.trend?.direction !== "worsening", "low", "Drift is stable and history trend is not worsening."),
  forecast("visual-regression", "Visual regression forecast", visual.status === "visual-gate-passed" && visual.summary?.staleScreenshots === 0, "low", "Visual proof is complete, fresh, and baseline-ready."),
  forecast("health-degradation", "Health degradation forecast", health.failedCount === 0, "low", "All health endpoints are currently passing."),
  forecast("live-e2e-degradation", "Live E2E degradation forecast", currentCount(liveE2e.entries, "latestRun") === (liveE2e.entries?.length ?? 0), "low", "All live E2E entries are current and passing."),
  forecast("monitoring-gap", "Monitoring gap forecast", currentCount(monitoring.entries, "latestCheck") === (monitoring.entries?.length ?? 0), "low", "Monitoring is current across the dashboard fleet."),
  forecast("ship-blocker", "Ship blocker forecast", ship.safeToCommit === true && ship.safeToDeploy === true, "low", "Ship-check is safe to commit and deploy."),
];

const causalMap = [
  cause("stale-dashboard", "Dashboard appears stale", "snapshot/proof job delay", "Check snapshot URL, proof freshness, and latest monitoring run."),
  cause("blank-or-broken-page", "Dashboard route loads incorrectly", "front-end route or data binding regression", "Run live E2E and visual regression for the affected dashboard."),
  cause("visual-drift", "Page looks wrong but health is green", "CSS/component/layout regression", "Compare production screenshot against visual baseline matrix."),
  cause("collector-slowdown", "Data volume slows or stops", "collector/worker/database write path lag", "Check collection cadence, database write lag, and warehouse mirror backlog."),
  cause("resource-critical", "Discord reports resources critical", "disk, memory, CPU, or worker backlog threshold crossing", "Correlate resource alert timestamp with health latency, job backlog, and storage growth."),
  cause("unsafe-command", "Operator command is blocked", "approval or maintenance-window policy", "Review command governance and action unlock ledgers before enabling execution."),
];

const elevated = forecasts.filter((item) => item.risk !== "low");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-predictive-causal-intelligence.mjs",
  status: elevated.length ? "risk-watch" : "low-risk",
  confidence: history.trend?.sampleCount > 7 ? "trend-backed" : "baseline-only",
  limitations: history.trend?.sampleCount > 7
    ? []
    : ["Forecast confidence is baseline-only until the operating history ledger has more scheduled run samples."],
  summary: {
    forecastCount: forecasts.length,
    lowRisk: forecasts.filter((item) => item.risk === "low").length,
    elevatedRisk: elevated.length,
    causalPlaybookCount: causalMap.length,
    historySamples: history.trend?.sampleCount ?? 0,
    dailyStatus: daily.status,
  },
  forecasts,
  causalMap,
  nextActions: elevated.length
    ? elevated.map((item) => `Investigate elevated forecast ${item.id}: ${item.explanation}`)
    : ["Keep scheduled maturity runs active until forecasts become trend-backed instead of baseline-only."],
};

fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard predictive causal intelligence: ${report.status}, ${report.summary.lowRisk}/${report.summary.forecastCount} low risk.`);
if (elevated.length) process.exitCode = 1;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function currentCount(entries = [], field) {
  return entries.filter((entry) => entry.status === "current" && entry[field]?.status === "passed").length;
}

function forecast(id, label, lowRisk, lowRiskLabel, explanation) {
  return { id, label, risk: lowRisk ? lowRiskLabel : "elevated", explanation };
}

function cause(id, symptom, likelyCause, firstCheck) {
  return { id, symptom, likelyCause, firstCheck };
}

function renderMarkdown(report) {
  return [
    "# Dashboard Predictive Causal Intelligence",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    `Confidence: ${report.confidence}`,
    "",
    "## Forecasts",
    "",
    ...report.forecasts.map((item) => `- ${item.risk === "low" ? "LOW" : "WATCH"} ${item.label}: ${item.explanation}`),
    "",
    "## Causal Map",
    "",
    ...report.causalMap.map((item) => `- ${item.symptom}: likely ${item.likelyCause}; first check ${item.firstCheck}`),
    "",
  ].join("\n");
}
