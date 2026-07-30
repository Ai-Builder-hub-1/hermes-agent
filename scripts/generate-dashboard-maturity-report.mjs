#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const adoptionReportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
const telemetryReportPath = path.join(root, "docs/design/dashboard-telemetry-contract-report.json");
const productionProofPath = path.join(root, "docs/design/dashboard-production-proof-registry.json");
const visualQualityPath = path.join(root, "docs/design/dashboard-visual-quality-report.json");
const readinessImpactPath = path.join(root, "docs/design/dashboard-readiness-impact.json");
const outputPath = path.join(root, "docs/design/dashboard-maturity-report.json");

const projectAliases = {
  "khashi-vc": ["khashi-vc"],
  "media-engine": ["media-engine"],
  "media-business-os": ["media-business-operations", "media-business-os"],
  "business-mapper": ["business-mapper"],
  "meal-assistant": ["meal-assistant"],
  "hermes-os": ["hermes", "nous-hermes-agent"],
  "tlc-capital-group-os": ["tlc-capital-group-os"],
  "investing-system": ["investing-system"]
};

function readJsonIfExists(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function aliasesFor(project) {
  return [project, ...(projectAliases[project] ?? [])];
}

function matchesProject(project, candidate) {
  const aliases = aliasesFor(project);
  return aliases.some((alias) => candidate === alias || candidate?.startsWith(`${alias}.`));
}

function baseMaturityLevel(result) {
  if (!result) return { level: 0, label: "unregistered" };
  if (result.status === "stale") return { level: 3, label: "stale detection active" };
  if (result.status === "needs-review") return { level: 4, label: "kit adoption needs review" };
  return { level: 5, label: "registered and adoption-current" };
}

function evidenceFor(project, reports) {
  const telemetryItems = reports.telemetry.items ?? [];
  const proofEntries = reports.productionProof.entries ?? [];
  const visualItems = reports.visualQuality.items ?? [];
  const readinessItems = reports.readiness.impacts ?? [];

  const telemetryMatches = telemetryItems.filter((item) => matchesProject(project, item.id));
  const productionMatches = proofEntries.filter((entry) => matchesProject(project, entry.id));
  const visualMatches = visualItems.filter((item) => matchesProject(project, item.project));
  const readiness = readinessItems.find((item) => item.project === project);

  const telemetryReady = telemetryMatches.length > 0 && telemetryMatches.every((item) => item.status === "ready");
  const productionBaselined = productionMatches.length > 0 && productionMatches.every((entry) => entry.status === "baseline-present");
  const visualPass = visualMatches.length > 0 && visualMatches.every((item) => item.status === "pass" && Number(item.score) >= 90);
  const readinessClear = Boolean(readiness) && Number(readiness.dashboardPenaltyPercent) === 0 && Number(readiness.readinessCapPercent) >= 100;

  return {
    telemetryReady,
    productionBaselined,
    visualPass,
    readinessClear,
    telemetryMatches: telemetryMatches.map((item) => item.id),
    productionMatches: productionMatches.map((item) => item.id),
    visualMatches: visualMatches.map((item) => `${item.project}/${item.surface}`),
    readiness
  };
}

function maturityFromEvidence(base, evidence) {
  let level = base.level;
  let label = base.label;
  const blockers = [];

  if (level >= 5 && evidence.telemetryReady) {
    level = Math.max(level, 6);
    label = "live data verified";
  } else if (level >= 5) {
    blockers.push("telemetry contract incomplete or missing");
  }

  if (level >= 6 && evidence.productionBaselined) {
    level = Math.max(level, 7);
    label = "production screenshots verified";
  } else if (level >= 6) {
    blockers.push("production screenshot baseline missing");
  }

  if (level >= 7 && evidence.visualPass) {
    level = Math.max(level, 8);
    label = "premium design reviewed";
  } else if (level >= 7) {
    blockers.push("visual quality threshold not met");
  }

  if (level >= 8 && evidence.readinessClear) {
    level = Math.max(level, 9);
    label = "readiness-gated";
  } else if (level >= 8) {
    blockers.push("readiness impact not clear");
  }

  if (level >= 9 && evidence.telemetryReady && evidence.productionBaselined && evidence.visualPass && evidence.readinessClear) {
    level = 10;
    label = "telemetry-normalized and world-class";
  }

  return { level, label, blockers };
}

const adoption = readJsonIfExists(adoptionReportPath, { results: [] });
const reports = {
  telemetry: readJsonIfExists(telemetryReportPath, { items: [] }),
  productionProof: readJsonIfExists(productionProofPath, { entries: [] }),
  visualQuality: readJsonIfExists(visualQualityPath, { items: [] }),
  readiness: readJsonIfExists(readinessImpactPath, { impacts: [] })
};

const items = (adoption.results ?? []).map((result) => {
  const base = baseMaturityLevel(result);
  const evidence = evidenceFor(result.project, reports);
  const maturity = maturityFromEvidence(base, evidence);
  return {
    project: result.project,
    name: result.name,
    status: result.status,
    issueCount: result.issues?.length ?? 0,
    level: maturity.level,
    label: maturity.label,
    blockers: maturity.blockers,
    evidence: {
      telemetryReady: evidence.telemetryReady,
      productionBaselined: evidence.productionBaselined,
      visualPass: evidence.visualPass,
      readinessClear: evidence.readinessClear,
      telemetryMatches: evidence.telemetryMatches,
      productionMatches: evidence.productionMatches,
      visualMatches: evidence.visualMatches
    }
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceReports: {
    adoption: "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json",
    telemetry: "docs/design/dashboard-telemetry-contract-report.json",
    productionProof: "docs/design/dashboard-production-proof-registry.json",
    visualQuality: "docs/design/dashboard-visual-quality-report.json",
    readiness: "docs/design/dashboard-readiness-impact.json"
  },
  levels: [
    "0 unregistered",
    "1 CSS synced",
    "2 surface manifest declared",
    "3 stale detection active",
    "4 kit adoption needs review",
    "5 registered and adoption-current",
    "6 live data verified",
    "7 production screenshots verified",
    "8 premium design reviewed",
    "9 readiness-gated",
    "10 telemetry-normalized and world-class"
  ],
  items
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
