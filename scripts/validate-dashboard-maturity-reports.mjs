#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "docs/design/dashboard-component-evidence-backlog.json",
  "docs/design/dashboard-component-certification-checklist.json",
  "docs/design/dashboard-visual-coverage-report.json",
  "docs/design/dashboard-visual-evidence-tasks.json",
  "docs/design/dashboard-promotion-history.json",
  "docs/design/dashboard-promotion-readiness.json",
  "docs/design/dashboard-route-a11y-matrix.json",
  "docs/design/dashboard-token-scan-report.json",
  "docs/design/dashboard-token-suppressions.json",
  "docs/design/dashboard-token-debt-backlog.json",
  "docs/design/project-status-ledger.json",
  "docs/design/dashboard-pr-artifacts/latest.json",
  "web/src/pages/dashboard-maturity-data.ts"
];
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    issue("error", "Required maturity report is missing.", file);
    continue;
  }
  if (file.endsWith(".ts")) continue;
  const json = JSON.parse(fs.readFileSync(full, "utf8"));
  if (json.schemaVersion !== 1) issue("error", "Maturity report has invalid schemaVersion.", file);
  if (!json.generatedAt) issue("error", "Maturity report is missing generatedAt.", file);
}

if (!issues.some((item) => item.severity === "error")) {
  const componentBacklog = JSON.parse(fs.readFileSync(path.join(root, required[0]), "utf8"));
  const certification = JSON.parse(fs.readFileSync(path.join(root, required[1]), "utf8"));
  const visualCoverage = JSON.parse(fs.readFileSync(path.join(root, required[2]), "utf8"));
  const visualTasks = JSON.parse(fs.readFileSync(path.join(root, required[3]), "utf8"));
  const promotionHistory = JSON.parse(fs.readFileSync(path.join(root, required[4]), "utf8"));
  const readiness = JSON.parse(fs.readFileSync(path.join(root, required[5]), "utf8"));
  const a11yMatrix = JSON.parse(fs.readFileSync(path.join(root, required[6]), "utf8"));
  const tokenReport = JSON.parse(fs.readFileSync(path.join(root, required[7]), "utf8"));
  const tokenSuppressions = JSON.parse(fs.readFileSync(path.join(root, required[8]), "utf8"));
  const tokenDebt = JSON.parse(fs.readFileSync(path.join(root, required[9]), "utf8"));
  const projectStatusLedger = JSON.parse(fs.readFileSync(path.join(root, required[10]), "utf8"));
  if (!Array.isArray(componentBacklog.items)) issue("error", "Component evidence backlog must include items.");
  if ((certification.itemCount ?? 0) < 1) issue("error", "Component certification checklist must include components.");
  if ((visualCoverage.dashboardCount ?? 0) < 1) issue("error", "Visual coverage report must include dashboards.");
  if (typeof visualCoverage.freshnessSlaDays !== "number") issue("error", "Visual coverage report must include freshnessSlaDays.");
  if (!Array.isArray(visualTasks.items)) issue("error", "Visual evidence tasks must include items.");
  if (!Array.isArray(promotionHistory.events)) issue("error", "Promotion history must include events.");
  if ((readiness.itemCount ?? 0) < 1) issue("error", "Promotion readiness report must include projects.");
  if ((a11yMatrix.routeCount ?? 0) < 1) issue("error", "Route a11y matrix must include routes.");
  if (tokenReport.advisory !== true) issue("error", "Full token scan report must be advisory.");
  if (!Array.isArray(tokenSuppressions.suppressions)) issue("error", "Token suppressions must include suppressions.");
  if (!Array.isArray(tokenDebt.items)) issue("error", "Token debt backlog must include items.");
  if (!Array.isArray(projectStatusLedger.projects) || projectStatusLedger.projects.length < 1) issue("error", "Project status ledger must include projects.");
  if (!projectStatusLedger.crossProject) issue("error", "Project status ledger must include crossProject summary.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard maturity report validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
