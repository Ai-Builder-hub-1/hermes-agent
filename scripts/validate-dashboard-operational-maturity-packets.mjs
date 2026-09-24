#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/dashboard-operational-maturity-packets.json");
const runtimePath = path.join(root, "web/src/pages/dashboard-operational-maturity-packets.runtime.json");
const webDataPath = path.join(root, "web/src/pages/dashboard-operational-maturity-packets-data.ts");
const generatedPagesPath = path.join(root, "web/src/pages/GeneratedDashboardPages.tsx");
const requiredLayers = [
  "access-recovery",
  "purpose-orientation",
  "live-data-contract",
  "operational-summary",
  "drilldowns",
  "history-trends",
  "governed-actions",
  "incidents-alerts",
  "business-workflow",
  "rollup-certification",
];
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

for (const file of [reportPath, runtimePath, webDataPath, generatedPagesPath]) {
  if (!fs.existsSync(file)) issue("error", "Operational maturity file is missing.", path.relative(root, file));
}

if (!issues.some((item) => item.severity === "error")) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
  const webData = fs.readFileSync(webDataPath, "utf8");
  const generatedPages = fs.readFileSync(generatedPagesPath, "utf8");
  const exports = [...generatedPages.matchAll(/export const (\w+Page)\s*=\s*makePage/g)].map((match) => match[1]);
  const packetExports = new Set((report.packets ?? []).map((packet) => packet.exportName));

  if (report.schemaVersion !== 1) issue("error", "Operational maturity packet report must use schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Operational maturity packet report is missing generatedAt.");
  if (report.policy?.requiredLayerCount !== requiredLayers.length) issue("error", "Operational maturity policy must require exactly ten layers.");
  if (report.policy?.routeCertificationIsNotOperationalCertification !== true) issue("error", "Operational maturity policy must distinguish route certification from operational certification.");
  if ((report.layers ?? []).length !== requiredLayers.length) issue("error", "Operational maturity report must include the full ten-layer model.");
  if ((report.packets ?? []).length !== exports.length) issue("error", "Operational maturity packet count must match generated dashboard exports.", `${report.packets?.length ?? 0} packets vs ${exports.length} exports`);
  if ((runtime.packets ?? []).length !== (report.packets ?? []).length) issue("error", "Operational maturity runtime asset must match report packet count.");
  if (!webData.includes("loadDashboardOperationalMaturityPackets")) issue("error", "Operational maturity web data must export loadDashboardOperationalMaturityPackets.");
  if (!webData.includes("dashboard-operational-maturity-packets.runtime.json")) issue("error", "Operational maturity web data must reference the runtime asset.");
  if (!generatedPages.includes("loadDashboardOperationalMaturityPackets")) issue("error", "Generated dashboard pages must load operational maturity packets.");
  if (!generatedPages.includes("Operational Maturity")) issue("error", "Generated dashboard pages must render the operational maturity section.");

  for (const layerId of requiredLayers) {
    if (!(report.layers ?? []).some((layer) => layer.id === layerId)) issue("error", "Operational maturity layer model is missing a required layer.", layerId);
  }

  for (const exportName of exports) {
    if (!packetExports.has(exportName)) issue("error", "Operational maturity report is missing an exported page packet.", exportName);
  }

  for (const packet of report.packets ?? []) {
    if (!packet.exportName || !packet.route || !packet.title || !packet.family || !packet.priority) issue("error", "Operational maturity packet is missing identity fields.", packet.exportName ?? packet.route);
    if (!packet.primaryQuestion) issue("error", "Operational maturity packet is missing primaryQuestion.", packet.exportName);
    if (!Array.isArray(packet.operatorDecisions) || packet.operatorDecisions.length < 3) issue("error", "Operational maturity packet must include at least three operator decisions.", packet.exportName);
    if (!Array.isArray(packet.criticalFailureStates) || packet.criticalFailureStates.length < 3) issue("error", "Operational maturity packet must include at least three critical failure states.", packet.exportName);
    if (!Array.isArray(packet.sharedComponents) || packet.sharedComponents.length < 6) issue("error", "Operational maturity packet must include shared components.", packet.exportName);
    if (!Array.isArray(packet.dataContracts) || packet.dataContracts.length < 5) issue("error", "Operational maturity packet must include data contracts.", packet.exportName);
    if (!Array.isArray(packet.rollupSignals) || packet.rollupSignals.length < 5) issue("error", "Operational maturity packet must include rollup signals.", packet.exportName);
    if (!Number.isFinite(packet.score) || packet.score < 0 || packet.score > 100) issue("error", "Operational maturity packet score must be 0-100.", packet.exportName);
    if (!Array.isArray(packet.layers) || packet.layers.length !== requiredLayers.length) issue("error", "Operational maturity packet must include all ten layers.", packet.exportName);
    const layerIds = new Set((packet.layers ?? []).map((layer) => layer.id));
    for (const layerId of requiredLayers) {
      if (!layerIds.has(layerId)) issue("error", "Operational maturity packet is missing a required layer.", `${packet.exportName}: ${layerId}`);
    }
    for (const layer of packet.layers ?? []) {
      if (!requiredLayers.includes(layer.id)) issue("error", "Operational maturity packet includes an unknown layer.", `${packet.exportName}: ${layer.id}`);
      if (!Number.isFinite(layer.order) || layer.order < 1 || layer.order > requiredLayers.length) issue("error", "Operational maturity layer order is invalid.", `${packet.exportName}: ${layer.id}`);
      if (!layer.label || !layer.objective) issue("error", "Operational maturity layer is missing label or objective.", `${packet.exportName}: ${layer.id}`);
      if (!["ready", "specified"].includes(layer.status)) issue("error", "Operational maturity layer status must be ready or specified.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.buildWork) || layer.buildWork.length < 3) issue("error", "Operational maturity layer must include at least three build-work items.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.components) || layer.components.length < 3) issue("error", "Operational maturity layer must include at least three components.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.dataRequirements) || layer.dataRequirements.length < 3) issue("error", "Operational maturity layer must include at least three data requirements.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.drilldowns) || layer.drilldowns.length < 3) issue("error", "Operational maturity layer must include at least three drilldowns.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.actions) || layer.actions.length < 3) issue("error", "Operational maturity layer must include at least three actions.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.acceptance) || layer.acceptance.length < 3) issue("error", "Operational maturity layer must include at least three acceptance checks.", `${packet.exportName}: ${layer.id}`);
      if (!Array.isArray(layer.testProof) || layer.testProof.length < 3) issue("error", "Operational maturity layer must include at least three test proof requirements.", `${packet.exportName}: ${layer.id}`);
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard operational maturity packet validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
