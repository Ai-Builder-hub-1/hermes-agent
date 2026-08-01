#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const adoptionReportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
const outputPath = path.join(root, "docs/design/dashboard-migration-codemod-plan.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = fs.existsSync(adoptionReportPath) ? readJson(adoptionReportPath) : { results: [] };
const candidates = [];
const packageNativeStages = [
  "inventory-current-shell-routes-and-production-links",
  "create-package-native-dashboard-shell",
  "map-static-selectors-to-dashboard-kit-components",
  "replace-local-cards-tables-charts-forms-drawers",
  "add-mobbin-reference-intake-and-design-review-artifact",
  "add-light-dark-system-proof-screenshots",
  "cutover-canonical-route-and-retire-static-adapter"
];

for (const result of report.results ?? []) {
  for (const issue of result.issues ?? []) {
    if (!issue.code?.startsWith("legacy.") && issue.code !== "surface.componentMissing") continue;
    candidates.push({
      project: result.project,
      path: issue.path,
      issueCode: issue.code,
      suggestedCodemod: issue.code.includes("inline")
        ? "replace-inline-chart-with-hdk-chart-surface"
        : "insert-dashboard-kit-component-marker-and-static-wrapper",
      packageNativeMigration: {
        targetMode: "package-native",
        targetExperienceTier: 3,
        starterCommand: `npm run dashboard:package-native:create -- --project-dir ../${result.project} --project-id ${result.project} --name "${result.project}" --template cockpit --force true`,
        stages: packageNativeStages,
        requiredComponents: [
          "DashboardShell",
          "DashboardSidebar",
          "DashboardHeader",
          "MetricGrid",
          "DataTable",
          "ChartPanel",
          "VisualizationStateFrame",
          "DetailDrawerShell",
          "ProofEvidencePanel"
        ]
      },
      status: "planned"
    });
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  note: "This is a codemod candidate plan. Actual source rewriting remains gated by per-surface review. Package-native migrations must move standalone/static surfaces into shared kit components before production cutover.",
  defaultPackageNativeStages: packageNativeStages,
  candidates
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
