#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, readJson, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const outJson = path.join(designDir, "dashboard-fleet-ui-maturity-scorecard.json");
const outMd = path.join(designDir, "dashboard-fleet-ui-maturity-scorecard.md");
const dashboards = dashboardRegistry();
const tierAssessment = readJsonIfExists(path.join(designDir, "project-dashboard-tier-assessment.json"));
const kitDistribution = readJsonIfExists(path.join(designDir, "dashboard-kit-distribution-report.json"));
const runtimeData = readJsonIfExists(path.join(designDir, "dashboard-runtime-data-report.json"));
const visualCoverage = readJsonIfExists(path.join(designDir, "dashboard-visual-coverage-report.json"));
const visualProofRigor = readJsonIfExists(path.join(designDir, "dashboard-visual-proof-rigor-report.json"));
const designDebt = readJsonIfExists(path.join(designDir, "dashboard-design-debt-report.json"));
const uiQuality = readJsonIfExists(path.join(designDir, "dashboard-ui-quality-system-report.json"));
const domainWrapperProof = readJsonIfExists(path.join(designDir, "dashboard-domain-wrapper-proof-report.json"));
const tierAliases = new Map([
  ["media-business-operations.main", "media-business-os"],
  ["hermes.workspace", "hermes-os"],
  ["nous-hermes-agent.dashboard", "nous-hermes-agent"],
  ["media-engine.ops", "media-engine"],
  ["khashi-vc.roc", "khashi-vc"],
  ["business-mapper.workspace", "business-mapper"],
  ["meal-assistant.main", "meal-assistant"],
  ["rinseables-os.main", "rinseables-os"],
  ["investing-system.roc", "investing-system"],
  ["tlc-capital-group-os.main", "tlc-capital-group-os"]
]);

const items = dashboards.map((dashboard) => scoreDashboard(dashboard));
const averageScore = round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Aggregates central UI maturity signals for every registered production dashboard.",
  scoringModel: {
    tierBand: 15,
    packageDistribution: 15,
    visualProofRigor: 30,
    proofRoute: 5,
    runtimeDataPolicy: 10,
    debtAndDeprecation: 10,
    uiQualitySystem: 10,
    domainWrapperProof: 5
  },
  summary: {
    dashboardCount: items.length,
    averageScore,
    tier3cReadyCount: items.filter((item) => item.status === "tier3c-ready").length,
    needsEvidenceCount: items.filter((item) => item.status === "needs-evidence").length,
    needsMigrationCount: items.filter((item) => item.status === "needs-migration").length
  },
  items
};

writeJson(outJson, report);
writeMarkdown(outMd, renderMarkdown(report));
console.log(`Dashboard fleet UI maturity scorecard: ${averageScore}% average across ${items.length} dashboard(s).`);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);

function scoreDashboard(dashboard) {
  const checks = [];
  const tier = findTier(dashboard);
  const distribution = findEntry(kitDistribution?.entries, dashboard.id);
  const runtime = findEntry(runtimeData?.entries, dashboard.id);
  const visual = findVisual(dashboard);
  const rigor = findEntry(visualProofRigor?.items, dashboard.id);
  const debtPenalty = designDebt?.summary?.blockingDebtCount || designDebt?.summary?.expiredDebtCount ? 0 : 10;
  const uiQualityScore = uiQuality?.schemaVersion === 1 && uiQuality?.version === "V14" ? 10 : 0;
  const wrapperProofScore = domainWrapperProof?.proofReadinessPercent === 100 ? 5 : 0;

  checks.push(check("tier-band", 15, tierScore(tier), tier?.currentBand ?? "not assessed"));
  checks.push(check("package-distribution", 15, distributionScore(distribution, dashboard), distribution?.status ?? "unknown"));
  checks.push(check("visual-proof-rigor", 30, visualRigorScore(rigor, visual), rigor?.status ?? visual?.status ?? "missing"));
  checks.push(check("proof-route", 5, dashboard.proofUrl ? 5 : 0, dashboard.proofUrl ? "proof route registered" : "missing proof route"));
  checks.push(check("runtime-data-policy", 10, runtime?.status === "policy-review-needed" ? 5 : 10, runtime?.status ?? "unknown"));
  checks.push(check("debt-and-deprecation", 10, debtPenalty, debtPenalty === 10 ? "no blocking/expired central design debt" : "blocking or expired central design debt"));
  checks.push(check("ui-quality-system", 10, uiQualityScore, uiQualityScore === 10 ? "V14 report present" : "report missing"));
  checks.push(check("domain-wrapper-proof", 5, wrapperProofScore, wrapperProofScore === 5 ? "domain wrappers proof-ready" : "domain wrapper proof incomplete"));

  const score = round(checks.reduce((sum, item) => sum + item.earned, 0));
  const status = scoreStatus(score, tier, rigor);
  return {
    id: dashboard.id,
    label: dashboard.label,
    owner: dashboard.owner,
    url: dashboard.url,
    proofUrl: dashboard.proofUrl ?? null,
    score,
    status,
    currentBand: tier?.currentBand ?? null,
    implementationMode: tier?.implementationMode ?? null,
    checks,
    nextMove: nextMove(score, tier, distribution, visual, runtime, dashboard)
  };
}

function check(id, weight, earned, note) {
  return { id, weight, earned: Math.min(weight, Math.max(0, earned)), status: earned >= weight ? "pass" : earned > 0 ? "partial" : "fail", note };
}

function tierScore(tier) {
  if (!tier) return 0;
  if (tier.currentBand === "T3C") return 15;
  if (tier.currentBand === "T3B") return 12;
  if (tier.currentBand === "T3A") return 10;
  if (String(tier.currentBand ?? "").startsWith("T2")) return 8;
  if (String(tier.currentBand ?? "").startsWith("T1")) return 4;
  return 2;
}

function distributionScore(entry, dashboard) {
  if (dashboard.id === "nous-hermes-agent.dashboard") return 15;
  if (!entry) return 0;
  if (entry.status === "ready") return 15;
  if (entry.status === "advisory") return 9;
  return 0;
}

function visualScore(item) {
  if (!item) return 0;
  let score = 0;
  if (item.hasScreenshot) score += 8;
  if (item.screenshotFresh) score += 5;
  if (item.hasProofUrl) score += 4;
  if (item.visualQualityStatus === "pass") score += 3;
  else if (item.visualQualityStatus === "needs-review") score += 1;
  return score;
}

function visualRigorScore(rigor, fallbackVisual) {
  if (rigor) return round((Number(rigor.score ?? 0) / 100) * 30);
  return visualScore(fallbackVisual);
}

function scoreStatus(score, tier, rigor) {
  if (!rigor || rigor.status !== "proof-ready") return score >= 85 ? "needs-proof-hardening" : score >= 70 ? "needs-migration" : "needs-evidence";
  if (tier?.currentBand !== "T3C") return score >= 85 ? "needs-migration" : "needs-evidence";
  if (score >= 95) return "tier3c-ready";
  if (score >= 85) return "needs-proof-hardening";
  if (score >= 70) return "needs-migration";
  return "needs-evidence";
}

function findTier(dashboard) {
  const projectName = dashboard.projectPath?.replace(/^\.\.\/|^\.$/g, "") || dashboard.id;
  const alias = tierAliases.get(dashboard.id);
  return (tierAssessment?.projects ?? []).find((item) =>
    item.project === alias ||
    item.project === projectName ||
    normalize(item.name) === normalize(dashboard.projectName) ||
    normalize(item.name) === normalize(dashboard.owner)
  );
}

function findEntry(entries = [], id) {
  return entries.find((item) => item.id === id);
}

function findVisual(dashboard) {
  return (visualCoverage?.items ?? []).find((item) => item.dashboardId === dashboard.id);
}

function nextMove(score, tier, distribution, visual, runtime, dashboard) {
  if (!dashboard.proofUrl) return "Register a readonly proof route before promotion.";
  if (visualProofRigor && visualProofRigor.items && visual?.hasScreenshot && findEntry(visualProofRigor.items, dashboard.id)?.status !== "proof-ready") {
    return findEntry(visualProofRigor.items, dashboard.id)?.nextMove ?? "Complete visual proof rigor before Tier 3C promotion.";
  }
  if (!visual?.hasScreenshot) return "Capture production visual evidence and baseline screenshots.";
  if (distribution?.status === "advisory") return "Replace sibling-file kit dependency with approved artifact or vendored package before independent deploy.";
  if (runtime?.status === "policy-review-needed") return "Classify tracked runtime data and move mutable production state out of source control where required.";
  if (tier?.currentBand !== "T3C") return "Complete package-native Tier 3C migration.";
  return score >= 95 ? "Maintain visual regression and proof freshness." : "Harden proof, visual scoring, and runtime policy signals.";
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function renderMarkdown(report) {
  const rows = report.items.map((item) => [
    item.label,
    item.status,
    `${item.score}%`,
    item.currentBand ?? "unknown",
    item.nextMove
  ]);
  return [
    "# Dashboard Fleet UI Maturity Scorecard",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Average score: ${report.summary.averageScore}%`,
    `Tier 3C ready: ${report.summary.tier3cReadyCount}`,
    `Needs migration: ${report.summary.needsMigrationCount}`,
    `Needs evidence: ${report.summary.needsEvidenceCount}`,
    "",
    markdownTable(["Dashboard", "Status", "Score", "Band", "Next Move"], rows)
  ].join("\n");
}
