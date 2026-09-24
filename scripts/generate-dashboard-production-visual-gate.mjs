#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/design/dashboard-production-visual-gate.json");
const outMd = path.join(root, "docs/design/dashboard-production-visual-gate.md");
const coverage = read("docs/design/dashboard-visual-coverage-report.json");
const matrix = read("docs/design/dashboard-visual-regression-matrix.json", null);

const coverageItems = coverage.items ?? [];
const matrixItems = matrix?.items ?? [];
const matrixById = new Map(matrixItems.map((item) => [item.id, item]));
const items = coverageItems.map((item) => {
  const matrixItem = matrixById.get(item.dashboardId);
  const checks = [
    check("proof-url", "Proof URL is registered.", item.hasProofUrl === true),
    check("health-url", "Health URL is registered.", item.hasHealthUrl === true),
    check("screenshot", "Production screenshot exists.", item.hasScreenshot === true && Boolean(item.screenshot)),
    check("freshness", "Screenshot is fresh.", item.screenshotFresh === true),
    check("visual-quality", "Visual quality passed.", item.visualQualityStatus === "pass" && Number(item.visualQualityScore ?? 0) >= 90),
    check("regression-matrix", "Visual regression matrix is baseline-ready.", matrixItem?.status === "baseline-ready"),
  ];
  const failed = checks.filter((entry) => entry.status !== "passed");
  return {
    dashboardId: item.dashboardId,
    label: item.label,
    url: item.url,
    status: failed.length ? "needs-visual-work" : "visual-gate-passed",
    screenshot: item.screenshot ?? null,
    screenshotUpdatedAt: item.screenshotUpdatedAt ?? null,
    visualQualityScore: item.visualQualityScore ?? null,
    regressionRequiredCaptures: matrixItem?.defaultRequiredCount ?? 0,
    checks,
  };
});

const failedItems = items.filter((item) => item.status !== "visual-gate-passed");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-production-visual-gate.mjs",
  status: failedItems.length ? "needs-visual-work" : "visual-gate-passed",
  summary: {
    dashboardCount: items.length,
    passed: items.length - failedItems.length,
    failed: failedItems.length,
    staleScreenshots: coverage.staleCount ?? 0,
    matrixBaselineReady: matrix?.summary?.baselineReadyCount ?? 0,
    matrixDashboardCount: matrix?.summary?.dashboardCount ?? 0,
  },
  items,
};

fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard production visual gate: ${report.status}, ${report.summary.passed}/${report.summary.dashboardCount} passed.`);
if (failedItems.length) process.exitCode = 1;

function read(rel, fallback) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function check(id, description, passed) {
  return { id, description, status: passed ? "passed" : "failed" };
}

function renderMarkdown(report) {
  return [
    "# Dashboard Production Visual Gate",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Passed: ${report.summary.passed}/${report.summary.dashboardCount}`,
    `Stale screenshots: ${report.summary.staleScreenshots}`,
    `Matrix baseline-ready: ${report.summary.matrixBaselineReady}/${report.summary.matrixDashboardCount}`,
    "",
    "## Dashboards",
    "",
    ...report.items.map((item) => `- ${item.status === "visual-gate-passed" ? "PASS" : "FAIL"} ${item.label}: ${item.status}`),
    "",
  ].join("\n");
}
