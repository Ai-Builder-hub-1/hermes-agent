#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, readJson, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const outJson = path.join(designDir, "dashboard-visual-regression-matrix.json");
const outMd = path.join(designDir, "dashboard-visual-regression-matrix.md");
const visualEvidence = readJson(path.join(designDir, "dashboard-visual-evidence-layer.json"));
const dashboards = dashboardRegistry();
const themes = ["light", "dark"];
const requiredStates = ["default", "loading", "empty", "error", "stale"];
const productionScreenshotDir = path.join(designDir, "production-screenshots");

const items = dashboards.map((dashboard) => {
  const existingProductionScreenshot = path.join(productionScreenshotDir, `${dashboard.id}.png`);
  const requiredCaptures = [];
  for (const viewport of visualEvidence.viewportMatrix ?? []) {
    if (!viewport.required) continue;
    for (const theme of themes) {
      for (const state of requiredStates) {
        requiredCaptures.push({
          id: `${dashboard.id}.${viewport.id}.${theme}.${state}`,
          viewport: viewport.id,
          width: viewport.width,
          height: viewport.height,
          theme,
          state,
          required: state === "default" || ["desktop", "standard-desktop", "mobile"].includes(viewport.id),
          baselinePath: `proof/dashboard-baseline/${viewport.id}/${theme}/${state}.png`,
          currentPath: `proof/dashboard-current/${viewport.id}/${theme}/${state}.png`
        });
      }
    }
  }
  const defaultRequiredCount = requiredCaptures.filter((capture) => capture.required).length;
  const status = dashboard.proofUrl && fs.existsSync(existingProductionScreenshot)
    ? "baseline-ready"
    : dashboard.proofUrl
      ? "needs-baseline-capture"
      : "missing-proof-route";
  return {
    id: dashboard.id,
    label: dashboard.label,
    url: dashboard.url,
    proofUrl: dashboard.proofUrl ?? null,
    status,
    existingProductionScreenshot: fs.existsSync(existingProductionScreenshot)
      ? path.relative(root, existingProductionScreenshot)
      : null,
    requiredCaptureCount: requiredCaptures.length,
    defaultRequiredCount,
    requiredCaptures
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Defines screenshot regression expectations for every registered dashboard across viewport, theme, and state.",
  viewportMatrix: visualEvidence.viewportMatrix,
  themes,
  requiredStates,
  summary: {
    dashboardCount: items.length,
    baselineReadyCount: items.filter((item) => item.status === "baseline-ready").length,
    needsBaselineCaptureCount: items.filter((item) => item.status === "needs-baseline-capture").length,
    missingProofRouteCount: items.filter((item) => item.status === "missing-proof-route").length
  },
  items
};

writeJson(outJson, report);
writeMarkdown(outMd, renderMarkdown(report));
console.log(`Dashboard visual regression matrix: ${report.summary.baselineReadyCount}/${report.summary.dashboardCount} baseline-ready.`);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);

function renderMarkdown(report) {
  const rows = report.items.map((item) => [
    item.label,
    item.status,
    item.proofUrl ? "yes" : "no",
    item.existingProductionScreenshot ?? "missing",
    item.defaultRequiredCount
  ]);
  return [
    "# Dashboard Visual Regression Matrix",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Baseline-ready: ${report.summary.baselineReadyCount}/${report.summary.dashboardCount}`,
    `Needs baseline capture: ${report.summary.needsBaselineCaptureCount}`,
    `Missing proof route: ${report.summary.missingProofRouteCount}`,
    "",
    markdownTable(["Dashboard", "Status", "Proof Route", "Production Screenshot", "Required Captures"], rows)
  ].join("\n");
}
