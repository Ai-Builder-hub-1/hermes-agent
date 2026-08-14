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
const designIntelligence = readJsonIfExists(path.join(designDir, "dashboard-design-intelligence-report.json"));
const productQuality = readJsonIfExists(path.join(designDir, "dashboard-product-quality-control-plane-report.json"));
const platformIntelligence = readJsonIfExists(path.join(designDir, "dashboard-platform-intelligence-report.json"));
const downstreamPlatform = readJsonIfExists(path.join(designDir, "dashboard-downstream-platform-assessment.json"));
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
      : null,
    designIntelligence: designIntelligence
      ? {
          layerCount: designIntelligence.summary?.layerCount,
          screenIntentCount: designIntelligence.summary?.screenIntentCount,
          blueprintCount: designIntelligence.summary?.blueprintCount,
          mappedRouteCount: designIntelligence.summary?.mappedRouteCount,
          target: designIntelligence.summary?.target
        }
      : null,
    productQuality: productQuality
      ? {
          capabilityCount: productQuality.summary?.capabilityCount,
          fleetRouteCount: productQuality.summary?.fleetRouteCount,
          gateCount: productQuality.summary?.gateCount,
          blockingGateCount: productQuality.summary?.blockingGateCount,
          target: productQuality.summary?.target
        }
      : null,
    platformIntelligence: platformIntelligence
      ? {
          layerCount: platformIntelligence.summary?.layerCount,
          dashboardCount: platformIntelligence.summary?.dashboardCount,
          strategyWorkflowCount: platformIntelligence.summary?.strategyWorkflowCount,
          target: platformIntelligence.summary?.target
        }
      : null,
    downstreamPlatform: downstreamPlatform
      ? {
          projectCount: downstreamPlatform.summary?.projectCount,
          highPriorityCount: downstreamPlatform.summary?.highPriorityCount,
          needsRenderedProofCount: downstreamPlatform.summary?.needsRenderedProofCount,
          packageNativeUnknownCount: downstreamPlatform.summary?.packageNativeUnknownCount
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
    ],
    [
      "Design intelligence",
      report.centralReports.designIntelligence
        ? `${report.centralReports.designIntelligence.layerCount} layers; ${report.centralReports.designIntelligence.screenIntentCount} intents; ${report.centralReports.designIntelligence.blueprintCount} blueprints; ${report.centralReports.designIntelligence.mappedRouteCount} mapped routes`
        : "missing"
    ],
    [
      "Product quality control plane",
      report.centralReports.productQuality
        ? `${report.centralReports.productQuality.capabilityCount} capabilities; ${report.centralReports.productQuality.fleetRouteCount} routes; ${report.centralReports.productQuality.gateCount} gates; ${report.centralReports.productQuality.blockingGateCount} blocking`
        : "missing"
    ],
    [
      "Platform intelligence",
      report.centralReports.platformIntelligence
        ? `${report.centralReports.platformIntelligence.layerCount} layers; ${report.centralReports.platformIntelligence.dashboardCount} dashboards; ${report.centralReports.platformIntelligence.strategyWorkflowCount} workflows`
        : "missing"
    ],
    [
      "Downstream platform assessment",
      report.centralReports.downstreamPlatform
        ? `${report.centralReports.downstreamPlatform.projectCount} projects; ${report.centralReports.downstreamPlatform.highPriorityCount} high priority; ${report.centralReports.downstreamPlatform.needsRenderedProofCount} need rendered proof`
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
