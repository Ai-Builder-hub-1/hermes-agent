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
      status: "planned"
    });
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  note: "This is a codemod candidate plan. Actual source rewriting remains gated by per-surface review.",
  candidates
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
