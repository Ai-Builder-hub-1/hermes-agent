#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "docs/fleet/dashboard-predictive-causal-intelligence.json");
const issues = [];

if (!fs.existsSync(reportPath)) {
  fail("Predictive causal intelligence report is missing.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) fail("Predictive causal intelligence has invalid schemaVersion.");
  if (!report.generatedAt) fail("Predictive causal intelligence is missing generatedAt.");
  if (report.status !== "low-risk") fail("Predictive causal intelligence must be low-risk.");
  if (!["baseline-only", "trend-backed"].includes(report.confidence)) fail("Predictive causal intelligence must expose confidence.");
  if ((report.summary?.forecastCount ?? 0) < 6) fail("Predictive causal intelligence must include the core forecasts.");
  if ((report.summary?.elevatedRisk ?? 1) !== 0) fail("Predictive causal intelligence must have zero elevated forecasts.");
  if ((report.summary?.causalPlaybookCount ?? 0) < 6) fail("Predictive causal intelligence must include causal playbooks.");
  if (!Array.isArray(report.forecasts) || report.forecasts.some((item) => item.risk !== "low")) fail("Every forecast must be low risk.");
}

console.log(`Dashboard predictive causal intelligence validation: ${issues.length} error(s).`);
for (const item of issues) console.log(`- ERROR ${item}`);
if (issues.length) process.exit(1);

function fail(message) {
  issues.push(message);
}
