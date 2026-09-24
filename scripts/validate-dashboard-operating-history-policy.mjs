#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "docs/fleet/dashboard-operating-history-policy.json");
const ledgerPath = path.join(root, "docs/fleet/dashboard-operating-history-ledger.json");
const issues = [];

if (!fs.existsSync(reportPath)) fail("Operating history policy report is missing.");
if (!fs.existsSync(ledgerPath)) fail("Operating history ledger is missing.");

if (!issues.length) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
  if (report.schemaVersion !== 1) fail("Operating history policy report has invalid schemaVersion.");
  if (ledger.schemaVersion !== 1) fail("Operating history ledger has invalid schemaVersion.");
  if (!report.generatedAt || !ledger.generatedAt) fail("Operating history outputs must include generatedAt.");
  if (report.status !== "inside-policy") fail("Operating history policy must be inside-policy.");
  if (!Array.isArray(report.objectives) || report.objectives.length < 6) fail("Operating history policy must include the core objectives.");
  if ((report.objectives ?? []).some((item) => item.status !== "inside-policy")) fail("Every operating objective must be inside policy.");
  if (!report.retention?.immutableArchiveRequired) fail("Operating history policy must require immutable archive readiness.");
  if (!Array.isArray(ledger.entries) || ledger.entries.length < 1) fail("Operating history ledger must contain at least one run entry.");
  if (!report.trend?.direction) fail("Operating history policy must include a trend direction.");
}

console.log(`Dashboard operating history policy validation: ${issues.length} error(s).`);
for (const item of issues) console.log(`- ERROR ${item}`);
if (issues.length) process.exit(1);

function fail(message) {
  issues.push(message);
}
