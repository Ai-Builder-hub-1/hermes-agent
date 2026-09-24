#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "docs/fleet/dashboard-executive-daily-operating-view.json");
const issues = [];

if (!fs.existsSync(reportPath)) {
  fail("Executive daily operating view is missing.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) fail("Executive daily operating view has invalid schemaVersion.");
  if (!report.generatedAt) fail("Executive daily operating view is missing generatedAt.");
  if (!["clear", "needs-attention"].includes(report.status)) fail("Executive daily operating view has invalid status.");
  if ((report.summary?.dashboardCount ?? 0) < 1) fail("Executive daily operating view must include dashboards.");
  if (!Array.isArray(report.dashboards) || report.dashboards.length !== report.summary.dashboardCount) fail("Dashboard list must match summary dashboard count.");
  if (!Array.isArray(report.topPriorities) || report.topPriorities.length < 1) fail("Executive daily operating view must include priorities.");
  if (!Array.isArray(report.evidenceLinks) || report.evidenceLinks.length < 5) fail("Executive daily operating view must include evidence links.");
  if ((report.actionPosture?.unsafeMutations ?? 1) !== 0) fail("Executive daily operating view must show zero unsafe mutations.");
  if ((report.actionPosture?.unknownActions ?? 1) !== 0) fail("Executive daily operating view must show zero unknown actions.");
  if (report.actionPosture?.commandSafePosture !== true) fail("Executive daily operating view must show safe command posture.");
  if (report.status === "clear") {
    if ((report.summary?.attentionCount ?? 1) !== 0) fail("Clear executive daily operating view must have zero attention dashboards.");
    if (report.summary?.driftStatus !== "stable") fail("Clear executive daily operating view requires stable drift status.");
    if (report.summary?.visualStatus !== "visual-gate-passed") fail("Clear executive daily operating view requires visual gate pass.");
    if (report.summary?.safeToDeploy !== true) fail("Clear executive daily operating view requires deploy-ready ship check.");
  }
  for (const dashboard of report.dashboards ?? []) {
    if (!dashboard.projectId || !dashboard.label) fail("Every dashboard entry must include projectId and label.");
    if (!Array.isArray(dashboard.signals) || dashboard.signals.length < 5) fail(`Dashboard ${dashboard.label ?? dashboard.projectId} must include the core operating signals.`);
    if (dashboard.status === "operational" && dashboard.signals.some((item) => item.status !== "passing")) fail(`Operational dashboard ${dashboard.label} has a failing signal.`);
  }
}

console.log(`Dashboard executive daily operating view validation: ${issues.length} error(s).`);
for (const item of issues) console.log(`- ERROR ${item}`);
if (issues.length) process.exit(1);

function fail(message) {
  issues.push(message);
}
