#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/fleet/dashboard-fully-operational-certification.json");
const standardPath = path.join(root, "docs/design/dashboard-fully-operational-standard.md");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(standardPath)) issue("error", "Fully operational standard is missing.", "docs/design/dashboard-fully-operational-standard.md");
if (!fs.existsSync(reportPath)) {
  issue("error", "Fully operational certification report is missing.", "docs/fleet/dashboard-fully-operational-certification.json");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) issue("error", "Fully operational report must use schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Fully operational report is missing generatedAt.");
  if (report.status !== "fully-operational-certified") issue("error", "Dashboard fleet must be fully-operational-certified.", report.status);
  if (report.score !== 100) issue("error", "Fully operational score must be 100.", String(report.score));
  if ((report.summary?.failed ?? 1) !== 0) issue("error", "Fully operational report must have zero failed checks.");
  if ((report.summary?.passed ?? 0) !== (report.summary?.checks ?? -1)) issue("error", "Every fully operational check must pass.");
  if ((report.summary?.generatedRoutes ?? 0) < 1) issue("error", "Fully operational report must include generated routes.");
  if ((report.summary?.projectDashboards ?? 0) < 1) issue("error", "Fully operational report must include project dashboards.");
  if ((report.summary?.unsafeMutations ?? 1) !== 0) issue("error", "Fully operational report must have zero unsafe mutations.");
  if (!Array.isArray(report.checks) || report.checks.length < 1) issue("error", "Fully operational report must include checks.");
  for (const check of report.checks ?? []) {
    if (!check.id || !check.description) issue("error", "Fully operational check is missing id or description.");
    if (check.status !== "passed") issue("error", "Fully operational check must pass.", check.id);
    if (!check.evidence || typeof check.evidence !== "object") issue("error", "Fully operational check must include evidence.", check.id);
  }
  if (!Array.isArray(report.residualRisk) || report.residualRisk.length < 1) issue("error", "Fully operational report must include residual risk notes.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard fully operational certification validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
