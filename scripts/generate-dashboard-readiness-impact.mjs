#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const adoptionReportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
const outputPath = path.join(root, "docs/design/dashboard-readiness-impact.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const adoption = fs.existsSync(adoptionReportPath) ? readJson(adoptionReportPath) : { results: [] };
const impacts = (adoption.results ?? []).map((result) => {
  const stale = result.status === "stale";
  const needsReview = result.status === "needs-review";
  const highSeverityIssues = (result.issues ?? []).filter((issue) => issue.severity === "error").length;
  const warningIssues = (result.issues ?? []).filter((issue) => issue.severity === "warning").length;
  const readinessCapPercent = stale ? 85 : needsReview ? 95 : 100;
  const dashboardPenaltyPercent = stale
    ? Math.min(15, Math.max(5, highSeverityIssues * 2))
    : needsReview
      ? Math.min(5, Math.max(1, warningIssues))
      : 0;
  return {
    project: result.project,
    dashboardAdoptionStatus: result.status,
    readinessCapPercent,
    dashboardPenaltyPercent,
    reason: stale
      ? "Priority dashboard surface has stale design-system adoption or legacy local UI patterns."
      : needsReview
        ? "Priority dashboard surface is registered but still has review warnings before full dashboard readiness."
      : "No dashboard adoption penalty."
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceReport: "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json",
  impacts
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
