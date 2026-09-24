#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "docs/fleet/dashboard-governed-recovery-audit.json");
const issues = [];

if (!fs.existsSync(reportPath)) {
  fail("Governed recovery audit report is missing.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) fail("Governed recovery audit has invalid schemaVersion.");
  if (!report.generatedAt) fail("Governed recovery audit is missing generatedAt.");
  if (report.status !== "recovery-ready") fail("Governed recovery audit must be recovery-ready.");
  if ((report.summary?.failedAuditChecks ?? 1) !== 0) fail("Governed recovery audit must have zero failed checks.");
  if ((report.summary?.recoveryClassCount ?? 0) < 8) fail("Governed recovery audit must include the core recovery classes.");
  if ((report.summary?.autoSafeCount ?? 0) < 3) fail("Governed recovery audit must include auto-safe recovery classes.");
  if ((report.summary?.approvalRequiredCount ?? 0) < 2) fail("Governed recovery audit must include approval-required classes.");
  if ((report.summary?.maintenanceWindowCount ?? 0) < 1) fail("Governed recovery audit must include maintenance-window classes.");
  if ((report.summary?.blockedCount ?? 0) < 1) fail("Governed recovery audit must keep destructive data deletion blocked.");
  if (report.escalationPolicy?.discordFirst !== true) fail("Governed recovery audit must preserve Discord-first escalation.");
}

console.log(`Dashboard governed recovery audit validation: ${issues.length} error(s).`);
for (const item of issues) console.log(`- ERROR ${item}`);
if (issues.length) process.exit(1);

function fail(message) {
  issues.push(message);
}
