#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pagePath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const reportPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-maturity-data.ts");
const placeholderCopy = "This route is registered for the Hermes dashboard governance system";
const requiredLayers = [
  "route-coverage",
  "page-contract",
  "data-binding",
  "state-coverage",
  "observability",
  "drill-down",
  "cross-project-standard",
  "command-control",
  "alerting-escalation",
  "warehouse-storage",
  "component-maturity",
  "ux-visual-maturity",
  "testing-proof",
  "governance-ledger",
  "production-readiness",
];
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(pagePath)) issue("error", "Generated dashboard page module is missing.", "web/src/pages/GeneratedDashboardPages.tsx");
if (!fs.existsSync(reportPath)) issue("error", "Generated route maturity ledger is missing.", "docs/design/generated-dashboard-route-maturity-ledger.json");
if (!fs.existsSync(webDataPath)) issue("error", "Generated route maturity web data is missing.", "web/src/pages/generated-dashboard-route-maturity-data.ts");

if (!issues.some((item) => item.severity === "error")) {
  const pageSource = fs.readFileSync(pagePath, "utf8");
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const webData = fs.readFileSync(webDataPath, "utf8");
  const exports = [...pageSource.matchAll(/export const (\w+Page)\s*=\s*makePage/g)].map((match) => match[1]);
  const routeRows = [...pageSource.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((match) => match[1]);
  const entryExports = new Set((report.entries ?? []).map((entry) => entry.exportName));
  const layerIds = new Set((report.layers ?? []).map((layer) => layer.id));

  if (pageSource.includes(placeholderCopy)) issue("error", "Generated dashboard placeholder copy returned.", "web/src/pages/GeneratedDashboardPages.tsx");
  if (!pageSource.includes("GeneratedGovernancePage")) issue("error", "Generated page module must render the governance page shell.");
  if (report.schemaVersion !== 1) issue("error", "Generated route maturity ledger has invalid schemaVersion.");
  if (!report.generatedAt) issue("error", "Generated route maturity ledger is missing generatedAt.");
  if (report.policy?.placeholderRoutesAllowed !== false) issue("error", "Generated route maturity policy must disallow placeholder routes.");
  if ((report.layers ?? []).length !== requiredLayers.length) issue("error", "Generated route maturity ledger must include the complete layer set.");
  if ((report.totals?.dataBoundCount ?? 0) < (report.totals?.routeCount ?? 0)) issue("error", "Generated route maturity ledger must mark every route data-bound for the 33-to-43 band.");
  if ((report.totals?.observabilityBoundCount ?? 0) < ((report.totals?.p0Count ?? 0) + (report.totals?.p1Count ?? 0))) issue("error", "Generated route maturity ledger must mark P0/P1 observability-bound for the 33-to-43 band.");
  if ((report.totals?.drillDownBoundCount ?? 0) < (report.totals?.p0Count ?? 0)) issue("error", "Generated route maturity ledger must mark P0 drill-down-bound for the 33-to-43 band.");
  for (const layer of requiredLayers) {
    if (!layerIds.has(layer)) issue("error", "Generated route maturity ledger is missing a required layer.", layer);
  }
  if ((report.entries ?? []).length !== exports.length) issue("error", "Generated route maturity ledger entry count must match exported pages.", `${report.entries?.length ?? 0} entries vs ${exports.length} exports`);
  if (routeRows.length !== exports.length) issue("error", "Generated route rows must match exported pages.", `${routeRows.length} rows vs ${exports.length} exports`);
  for (const exportName of exports) {
    if (!entryExports.has(exportName)) issue("error", "Generated route maturity ledger is missing exported page.", exportName);
  }
  for (const entry of report.entries ?? []) {
    if (!entry.route || !entry.title || !entry.family || !entry.priority) issue("error", "Generated route maturity entry is missing identity fields.", entry.exportName);
    if (!entry.currentStage) issue("error", "Generated route maturity entry is missing currentStage.", entry.exportName);
    if (!Number.isFinite(entry.score) || entry.score < 0 || entry.score > 100) issue("error", "Generated route maturity score must be 0-100.", entry.exportName);
    if (!Array.isArray(entry.completedLayers) || entry.completedLayers.length < 1) issue("error", "Generated route maturity entry is missing completedLayers.", entry.exportName);
    if (!Array.isArray(entry.openLayers)) issue("error", "Generated route maturity entry is missing openLayers.", entry.exportName);
    if (!entry.nextOpenLayer) issue("error", "Generated route maturity entry is missing nextOpenLayer.", entry.exportName);
    if (!entry.evidenceBinding) issue("error", "Generated route maturity entry is missing evidenceBinding summary.", entry.exportName);
    if (entry.evidenceBinding && entry.evidenceBinding.dataBindingStatus !== "bound") issue("error", "Generated route maturity evidenceBinding must be bound.", entry.exportName);
    if (!Array.isArray(entry.layerStatus) || entry.layerStatus.length !== requiredLayers.length) issue("error", "Generated route maturity entry must include layerStatus for every layer.", entry.exportName);
    for (const layer of entry.layerStatus ?? []) {
      if (!requiredLayers.includes(layer.id)) issue("error", "Generated route maturity entry has unknown layer status.", `${entry.exportName}: ${layer.id}`);
      if (!["complete", "open"].includes(layer.status)) issue("error", "Generated route maturity layer status must be complete or open.", `${entry.exportName}: ${layer.id}`);
      if (layer.status === "complete" && (!Array.isArray(layer.evidence) || layer.evidence.length < 1)) issue("error", "Complete maturity layer must include evidence.", `${entry.exportName}: ${layer.id}`);
      if (layer.status === "open" && !layer.blocker) issue("error", "Open maturity layer must include blocker.", `${entry.exportName}: ${layer.id}`);
    }
    if (!entry.nextMaturityAction) issue("error", "Generated route maturity entry is missing nextMaturityAction.", entry.exportName);
    if (!Array.isArray(entry.proofRequired) || entry.proofRequired.length < 1) issue("error", "Generated route maturity entry is missing proofRequired.", entry.exportName);
  }
  if (!webData.includes("generatedDashboardRouteMaturity")) issue("error", "Generated route maturity web data must export generatedDashboardRouteMaturity.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Generated dashboard route maturity validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
