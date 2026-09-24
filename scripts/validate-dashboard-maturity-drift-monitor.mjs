#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/fleet/dashboard-maturity-drift-monitor.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) {
  issue("error", "Dashboard maturity drift monitor is missing.", "docs/fleet/dashboard-maturity-drift-monitor.json");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) issue("error", "Drift monitor must use schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Drift monitor is missing generatedAt.");
  if (report.status !== "stable") issue("error", "Dashboard maturity drift monitor must be stable.", report.status);
  if ((report.summary?.failed ?? 1) !== 0) issue("error", "Dashboard maturity drift monitor must have zero failed signals.");
  if ((report.summary?.passing ?? 0) !== (report.summary?.signalCount ?? -1)) issue("error", "All maturity drift signals must pass.");
  if (!Array.isArray(report.signals) || report.signals.length < 10) issue("error", "Drift monitor must include comprehensive signals.");
  for (const signal of report.signals ?? []) {
    if (signal.status !== "passing") issue("error", "Drift signal must pass.", signal.id);
    if (!signal.evidence || typeof signal.evidence !== "object") issue("error", "Drift signal must include evidence.", signal.id);
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard maturity drift validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
