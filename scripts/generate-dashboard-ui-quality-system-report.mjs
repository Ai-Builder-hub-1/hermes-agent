#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { designDir, markdownTable, writeJson, writeMarkdown, root } from "./dashboard-report-utils.mjs";

const registryPath = path.join(designDir, "dashboard-ui-quality-system-registry.json");
const jsonPath = path.join(designDir, "dashboard-ui-quality-system-report.json");
const mdPath = path.join(designDir, "dashboard-ui-quality-system-report.md");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const scorecard = readJsonIfExists(path.join(designDir, "dashboard-fleet-ui-maturity-scorecard.json"));
const debtReport = readJsonIfExists(path.join(designDir, "dashboard-design-debt-report.json"));
const visualMatrix = readJsonIfExists(path.join(designDir, "dashboard-visual-regression-matrix.json"));
const layers = registry.layers ?? [];
const statusCounts = layers.reduce((counts, layer) => {
  counts[layer.status] = (counts[layer.status] ?? 0) + 1;
  return counts;
}, {});
const implementedCount = layers.filter((layer) => ["implemented", "active"].includes(layer.status)).length;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  version: registry.version,
  layerCount: layers.length,
  implementedCount,
  newStandardCount: layers.filter((layer) => layer.status === "new-standard").length,
  statusCounts,
  tier3CRequirementCount: registry.minimumTier3CRequirements?.length ?? 0,
  centralReports: {
    fleetUiMaturity: scorecard
      ? {
          averageScore: scorecard.summary?.averageScore,
          tier3cReadyCount: scorecard.summary?.tier3cReadyCount,
          needsMigrationCount: scorecard.summary?.needsMigrationCount,
          needsEvidenceCount: scorecard.summary?.needsEvidenceCount
        }
      : null,
    designDebt: debtReport
      ? {
          status: debtReport.status,
          activeDebtCount: debtReport.summary?.activeDebtCount,
          expiredDebtCount: debtReport.summary?.expiredDebtCount,
          blockingDebtCount: debtReport.summary?.blockingDebtCount
        }
      : null,
    visualRegression: visualMatrix
      ? {
          baselineReadyCount: visualMatrix.summary?.baselineReadyCount,
          dashboardCount: visualMatrix.summary?.dashboardCount,
          missingProofRouteCount: visualMatrix.summary?.missingProofRouteCount
        }
      : null
  },
  layers: layers.map((layer) => ({
    id: layer.id,
    number: layer.number,
    status: layer.status,
    commandCount: layer.enforcementCommands?.length ?? 0,
    artifactCount: layer.sourceArtifacts?.length ?? 0,
    proofSignalCount: layer.proofSignals?.length ?? 0,
    maturityOutput: layer.maturityOutput
  }))
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard UI Quality System Report

Generated: ${report.generatedAt}

Layer count: ${report.layerCount}

Tier 3C requirements: ${report.tier3CRequirementCount}

## Central Reports

${markdownTable(
  ["Report", "Status"],
  [
    [
      "Fleet UI maturity",
      report.centralReports.fleetUiMaturity
        ? `${report.centralReports.fleetUiMaturity.averageScore}% average; ${report.centralReports.fleetUiMaturity.tier3cReadyCount} Tier 3C ready; ${report.centralReports.fleetUiMaturity.needsMigrationCount} need migration; ${report.centralReports.fleetUiMaturity.needsEvidenceCount} need evidence`
        : "missing"
    ],
    [
      "Design debt",
      report.centralReports.designDebt
        ? `${report.centralReports.designDebt.status}; ${report.centralReports.designDebt.activeDebtCount} active; ${report.centralReports.designDebt.expiredDebtCount} expired; ${report.centralReports.designDebt.blockingDebtCount} blocking`
        : "missing"
    ],
    [
      "Visual regression",
      report.centralReports.visualRegression
        ? `${report.centralReports.visualRegression.baselineReadyCount}/${report.centralReports.visualRegression.dashboardCount} baseline-ready; ${report.centralReports.visualRegression.missingProofRouteCount} missing proof routes`
        : "missing"
    ]
  ]
)}

## Layers

${markdownTable(
  ["Layer", "Status", "Commands", "Artifacts", "Proof Signals", "Maturity Output"],
  report.layers.map((layer) => [
    `${layer.number}. ${layer.id}`,
    layer.status,
    layer.commandCount,
    layer.artifactCount,
    layer.proofSignalCount,
    layer.maturityOutput
  ])
)}
`);

console.log(`Dashboard UI quality system report: ${report.layerCount} layer(s), ${report.implementedCount} implemented/active, ${report.newStandardCount} new standard(s).`);
console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);

function readJsonIfExists(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}
