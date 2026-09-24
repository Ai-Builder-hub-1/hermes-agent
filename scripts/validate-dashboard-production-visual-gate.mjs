#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/dashboard-production-visual-gate.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) {
  issue("error", "Dashboard production visual gate is missing.", "docs/design/dashboard-production-visual-gate.json");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) issue("error", "Production visual gate must use schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Production visual gate is missing generatedAt.");
  if (report.status !== "visual-gate-passed") issue("error", "Production visual gate must pass.", report.status);
  if ((report.summary?.failed ?? 1) !== 0) issue("error", "Production visual gate must have zero failed dashboards.");
  if ((report.summary?.passed ?? 0) !== (report.summary?.dashboardCount ?? -1)) issue("error", "Every production dashboard must pass the visual gate.");
  if (!Array.isArray(report.items) || report.items.length < 1) issue("error", "Production visual gate must include dashboard items.");
  for (const item of report.items ?? []) {
    if (item.status !== "visual-gate-passed") issue("error", "Dashboard visual gate item must pass.", item.dashboardId);
    if (!Array.isArray(item.checks) || item.checks.some((check) => check.status !== "passed")) issue("error", "Every visual gate item check must pass.", item.dashboardId);
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard production visual gate validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
