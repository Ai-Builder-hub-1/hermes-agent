#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-evidence-bindings-data.ts");
const maturityPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) issue("error", "Generated route evidence binding report is missing.", "docs/design/generated-dashboard-route-evidence-bindings.json");
if (!fs.existsSync(webDataPath)) issue("error", "Generated route evidence binding web data is missing.", "web/src/pages/generated-dashboard-route-evidence-bindings-data.ts");
if (!fs.existsSync(maturityPath)) issue("error", "Generated route maturity ledger is missing.", "docs/design/generated-dashboard-route-maturity-ledger.json");

if (!issues.some((item) => item.severity === "error")) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const maturity = JSON.parse(fs.readFileSync(maturityPath, "utf8"));
  const webData = fs.readFileSync(webDataPath, "utf8");
  const routeCount = maturity.totals?.routeCount ?? 0;

  if (report.schemaVersion !== 1) issue("error", "Generated route evidence binding report has invalid schemaVersion.");
  if (!report.generatedAt) issue("error", "Generated route evidence binding report is missing generatedAt.");
  if (!report.policy?.generatedEvidenceDataCountsForDataBinding) issue("error", "Generated route evidence binding policy must declare generated evidence data binding.");
  if ((report.routeBindings ?? []).length !== routeCount) issue("error", "Generated route evidence binding count must match maturity route count.", `${report.routeBindings?.length ?? 0} bindings vs ${routeCount} routes`);
  if ((report.totals?.dataBoundCount ?? 0) < routeCount) issue("error", "Every generated route must be evidence data-bound for the 33-to-43 band.", `${report.totals?.dataBoundCount ?? 0}/${routeCount}`);
  if ((report.totals?.observabilityBoundCount ?? 0) < ((maturity.totals?.p0Count ?? 0) + (maturity.totals?.p1Count ?? 0))) issue("error", "P0/P1 routes must have observability bindings for the 33-to-43 band.");
  if ((report.totals?.drillDownBoundCount ?? 0) < (maturity.totals?.p0Count ?? 0)) issue("error", "P0 routes must have evidence drill-down bindings for the 33-to-43 band.");
  for (const binding of report.routeBindings ?? []) {
    if (!binding.route || !binding.title || !binding.priority || !binding.family) issue("error", "Route evidence binding is missing identity fields.", binding.exportName);
    if (binding.dataBindingStatus !== "bound") issue("error", "Route evidence binding must be bound.", binding.route);
    if (!Array.isArray(binding.sourceBindings) || binding.sourceBindings.filter((source) => source.status !== "missing").length < 5) issue("error", "Route evidence binding must include at least five available sources.", binding.route);
    if (!Array.isArray(binding.dataSignals) || binding.dataSignals.length < 5) issue("error", "Route evidence binding must include data signals.", binding.route);
    if (!Array.isArray(binding.drillDownTargets) || binding.drillDownTargets.length < 5) issue("error", "Route evidence binding must include drill-down targets.", binding.route);
  }
  if (!webData.includes("generatedDashboardRouteEvidenceBindings")) issue("error", "Generated route evidence web data must export generatedDashboardRouteEvidenceBindings.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Generated dashboard route evidence binding validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
