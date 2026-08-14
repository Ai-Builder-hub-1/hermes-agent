#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const outJson = path.join(designDir, "dashboard-visual-proof-rigor-report.json");
const outMd = path.join(designDir, "dashboard-visual-proof-rigor-report.md");
const coverage = readJsonIfExists(path.join(designDir, "dashboard-visual-coverage-report.json"));
const quality = readJsonIfExists(path.join(designDir, "dashboard-visual-quality-report.json"));
const regression = readJsonIfExists(path.join(designDir, "dashboard-visual-regression-matrix.json"));
const productionProof = readJsonIfExists(path.join(designDir, "dashboard-production-proof-registry.json"));
const regressionRun = readJsonIfExists(path.join(designDir, "dashboard-fleet-visual-regression-run.json"));

const dashboards = dashboardRegistry();
const qualityByDashboard = new Map();
for (const item of quality?.items ?? []) {
  const key = `${item.project}:${item.surface}`;
  qualityByDashboard.set(key, item);
}

const items = dashboards.map((dashboard) => auditDashboard(dashboard));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Turns visual proof from a checklist into a rigor score. Tier 3C requires rendered evidence, not just registered routes or lexical source checks.",
  scoringModel: {
    freshProductionScreenshot: 15,
    screenshotArtifactHealthy: 10,
    proofAndHealthRoutes: 10,
    lexicalVisualQuality: 10,
    regressionContract: 15,
    stateViewportThemeCoverage: 10,
    productionProofRegistry: 10,
    executedRegressionArtifacts: 20
  },
  summary: {
    dashboardCount: items.length,
    proofReadyCount: items.filter((item) => item.status === "proof-ready").length,
    needsRegressionExecutionCount: items.filter((item) => item.status === "needs-regression-execution").length,
    needsEvidenceCount: items.filter((item) => item.status === "needs-evidence").length,
    averageScore: round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1))
  },
  items
};

writeJson(outJson, report);
writeMarkdown(outMd, renderMarkdown(report));
console.log(`Dashboard visual proof rigor: ${report.summary.averageScore}% average; ${report.summary.proofReadyCount}/${items.length} proof-ready.`);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);

function auditDashboard(dashboard) {
  const coverageItem = (coverage?.items ?? []).find((item) => item.dashboardId === dashboard.id);
  const regressionItem = (regression?.items ?? []).find((item) => item.id === dashboard.id);
  const proofItem = (productionProof?.items ?? productionProof?.entries ?? []).find((item) => item.id === dashboard.id || item.dashboardId === dashboard.id);
  const screenshotPath = coverageItem?.screenshot ? path.join(root, coverageItem.screenshot) : null;
  const screenshotStats = screenshotPath && fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath) : null;
  const qualityItems = findQualityItems(dashboard);
  const bestQualityScore = qualityItems.reduce((best, item) => Math.max(best, Number(item.score ?? 0)), 0);
  const hasRequiredViewportMatrix = hasRequiredRegressionShape(regression);
  const requiredCaptures = regressionItem?.requiredCaptures ?? [];
  const defaultRequiredCount = Number(regressionItem?.defaultRequiredCount ?? 0);
  const requiredCaptureCount = Number(regressionItem?.requiredCaptureCount ?? requiredCaptures.length);
  const baselineArtifactCount = countExistingRegressionArtifacts(requiredCaptures, "baselinePath");
  const currentArtifactCount = countExistingRegressionArtifacts(requiredCaptures, "currentPath");
  const executedRegression = baselineArtifactCount >= defaultRequiredCount && currentArtifactCount >= defaultRequiredCount;
  const runItem = (regressionRun?.items ?? []).find((item) => item.id === dashboard.id);
  const runPassed = runItem?.status === "pass";

  const checks = [
    check("fresh-production-screenshot", 15, Boolean(coverageItem?.hasScreenshot && coverageItem?.screenshotFresh), coverageItem?.screenshotAgeDays === null ? "missing" : `${coverageItem?.screenshotAgeDays}d old`),
    check("screenshot-artifact-healthy", 10, Boolean(screenshotStats && screenshotStats.size > 50_000), screenshotStats ? `${Math.round(screenshotStats.size / 1024)}KB` : "missing"),
    check("proof-and-health-routes", 10, Boolean(coverageItem?.hasProofUrl && coverageItem?.hasHealthUrl), `proof=${Boolean(coverageItem?.hasProofUrl)}, health=${Boolean(coverageItem?.hasHealthUrl)}`),
    check("lexical-visual-quality", 10, bestQualityScore >= 90 && qualityItems.every((item) => item.status === "pass"), `${bestQualityScore}% source heuristic`),
    check("regression-contract", 15, Boolean(regressionItem && hasRequiredViewportMatrix && requiredCaptureCount >= 30), `${requiredCaptureCount} required captures`),
    check("state-viewport-theme-coverage", 10, Boolean(defaultRequiredCount >= 20), `${defaultRequiredCount} default-required captures`),
    check("production-proof-registry", 10, Boolean(proofItem && proofItem.status !== "baseline-needed"), proofItem?.status ?? "missing"),
    check("executed-regression-artifacts", 20, Boolean(executedRegression && runPassed), runItem ? `${runItem.status}; baseline=${baselineArtifactCount}, current=${currentArtifactCount}` : `missing run; baseline=${baselineArtifactCount}, current=${currentArtifactCount}`)
  ];

  const score = round(checks.reduce((sum, item) => sum + item.earned, 0));
  const status = score < 70
    ? "needs-evidence"
    : executedRegression && runPassed && score >= 95
      ? "proof-ready"
      : "needs-regression-execution";
  return {
    id: dashboard.id,
    label: dashboard.label,
    score,
    status,
    hasExecutedRegressionArtifacts: executedRegression,
    regressionRequiredCaptureCount: requiredCaptureCount,
    regressionDefaultRequiredCount: defaultRequiredCount,
    regressionBaselineArtifactCount: baselineArtifactCount,
    regressionCurrentArtifactCount: currentArtifactCount,
    checks,
    nextMove: nextMove(score, coverageItem, regressionItem, executedRegression)
  };
}

function findQualityItems(dashboard) {
  const aliases = new Set([
    dashboard.id,
    dashboard.projectName,
    dashboard.owner,
    dashboard.projectPath?.replace(/^\.\.\//, ""),
    dashboard.id.split(".")[0],
    dashboard.projectName?.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return (quality?.items ?? []).filter((item) => aliases.has(String(item.project).toLowerCase()));
}

function hasRequiredRegressionShape(matrix) {
  const viewports = new Set((matrix?.viewportMatrix ?? []).filter((item) => item.required).map((item) => item.id));
  const themes = new Set(matrix?.themes ?? []);
  const states = new Set(matrix?.requiredStates ?? []);
  return viewports.has("desktop") && viewports.has("mobile") && themes.has("light") && themes.has("dark") && states.has("default") && states.has("loading") && states.has("error") && states.has("stale");
}

function countExistingRegressionArtifacts(captures, field) {
  return captures.filter((capture) => {
    const value = capture?.[field];
    if (!value) return false;
    return fs.existsSync(path.join(root, value)) || fs.existsSync(path.resolve(root, "..", value));
  }).length;
}

function check(id, weight, passed, note) {
  return {
    id,
    weight,
    earned: passed ? weight : 0,
    status: passed ? "pass" : "fail",
    note
  };
}

function nextMove(score, coverageItem, regressionItem, executedRegression) {
  if (!coverageItem?.hasScreenshot) return "Capture a production screenshot before claiming visual maturity.";
  if (!coverageItem?.screenshotFresh) return "Refresh production screenshot evidence.";
  if (!regressionItem) return "Add the dashboard to the viewport/theme/state visual regression matrix.";
  if (!executedRegression) return "Execute and store baseline/current visual regression artifacts for required viewports, themes, and states.";
  if (score < 95) return "Resolve failed proof rigor checks before Tier 3C promotion.";
  return "Maintain proof freshness and approve regression diffs before release.";
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function renderMarkdown(report) {
  return [
    "# Dashboard Visual Proof Rigor Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Average score: ${report.summary.averageScore}%`,
    `Proof ready: ${report.summary.proofReadyCount}/${report.summary.dashboardCount}`,
    `Needs regression execution: ${report.summary.needsRegressionExecutionCount}`,
    `Needs evidence: ${report.summary.needsEvidenceCount}`,
    "",
    markdownTable(
      ["Dashboard", "Status", "Score", "Regression Artifacts", "Next Move"],
      report.items.map((item) => [
        item.label,
        item.status,
        `${item.score}%`,
        `${item.regressionBaselineArtifactCount}/${item.regressionCurrentArtifactCount}`,
        item.nextMove
      ])
    )
  ].join("\n");
}
