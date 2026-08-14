#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const designDir = path.join(root, "docs/design");
const registryPath = path.join(designDir, "dashboard-platform-intelligence-system.json");
const reportPath = path.join(designDir, "dashboard-platform-intelligence-report.json");
const mdPath = path.join(designDir, "dashboard-platform-intelligence-system.md");
const reportMdPath = path.join(designDir, "dashboard-platform-intelligence-report.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-platform-intelligence-data.ts");
const issues = [];

const requiredLayerIds = [
  "product-strategy-intelligence",
  "portfolio-product-map",
  "autonomous-roadmap-builder",
  "investment-roi-scoring",
  "business-objective-alignment",
  "adaptive-product-architecture",
  "autonomous-task-generation",
  "cross-functional-review-layer",
  "production-learning-loop",
  "autonomous-product-council",
  "scenario-planning",
  "continuous-product-refactoring",
  "autonomous-release-governance",
  "org-memory",
  "closed-loop-operating-system"
];

for (const file of [registryPath, reportPath, mdPath, reportMdPath, webDataPath]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}
if (hasErrors()) finish();

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const md = fs.readFileSync(mdPath, "utf8");
const webData = fs.readFileSync(webDataPath, "utf8");

if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "Platform intelligence registry must declare schemaVersion 1.");
if (registry.version !== "V1") issue("error", "registry.version", "Platform intelligence registry must declare V1.");
if (registry.status !== "active") issue("error", "registry.status", "Platform intelligence registry must be active.");

for (const key of [
  "everyDashboardRequiresProductPurpose",
  "everyDashboardRequiresBusinessObjectiveLinkage",
  "roadmapRequiresValueRiskEffortScore",
  "releasesRequireBusinessAndQualityGates",
  "productionTelemetryFeedsRoadmap",
  "humanReviewFeedsOrgMemory",
  "staleDashboardsEnterRefactorQueue"
]) {
  if (registry.policy?.[key] !== true) issue("error", `policy.${key}`, `Policy must require ${key}.`);
}

const layers = registry.platformLayers ?? [];
if (layers.length !== requiredLayerIds.length) issue("error", "platformLayers.count", `Expected ${requiredLayerIds.length} platform layers.`);
const layerIds = new Set(layers.map((layer) => layer.id));
for (const id of requiredLayerIds) {
  if (!layerIds.has(id)) issue("error", `platformLayer:${id}.missing`, `${id} is missing.`);
}
for (const layer of layers) {
  for (const field of ["id", "status", "purpose"]) requireString(layer, field, `platformLayer:${layer.id ?? "unknown"}`);
  for (const field of ["requiredInputs", "outputs", "enforcementSignals"]) requireArray(layer, field, `platformLayer:${layer.id ?? "unknown"}`);
  if (typeof layer.number !== "number" || layer.number < 1 || layer.number > requiredLayerIds.length) {
    issue("error", `platformLayer:${layer.id}.number`, `${layer.id} has invalid number.`);
  }
}

const dashboards = registry.dashboards ?? [];
if (dashboards.length < 10) issue("error", "dashboards.count", "Platform intelligence must cover all registered production dashboards.");
for (const dashboard of dashboards) {
  for (const field of ["id", "projectName", "category", "owner", "url", "proofUrl", "healthUrl", "nextIntelligenceWork"]) {
    requireString(dashboard, field, `dashboard:${dashboard.id ?? "unknown"}`);
  }
  requireArray(dashboard, "platformSignals", `dashboard:${dashboard.id ?? "unknown"}`);
  for (const signal of ["product purpose", "operator workflow", "business objective linkage", "quality score", "roadmap priority", "production proof", "learning loop"]) {
    if (!dashboard.platformSignals.includes(signal)) issue("error", `dashboard:${dashboard.id}.${signal}`, `${dashboard.id} must require ${signal}.`);
  }
}

const workflows = registry.strategyWorkflows ?? [];
if (workflows.length < 6) issue("error", "strategyWorkflows.count", "Platform intelligence must define closed-loop strategy workflows.");
for (const workflow of workflows) {
  for (const field of ["id", "flow", "status"]) requireString(workflow, field, `workflow:${workflow.id ?? "unknown"}`);
  if (workflow.status !== "required") issue("error", `workflow:${workflow.id}.status`, `${workflow.id} must be required.`);
}

if (report.summary?.layerCount !== layers.length) issue("error", "report.summary.layerCount", "Report layer count is stale.");
if (report.summary?.dashboardCount !== dashboards.length) issue("error", "report.summary.dashboardCount", "Report dashboard count is stale.");
if (report.summary?.strategyWorkflowCount !== workflows.length) issue("error", "report.summary.strategyWorkflowCount", "Report workflow count is stale.");

for (const phrase of ["Policy", "Platform Layers", "Dashboard Coverage", "Strategy Workflows"]) {
  if (!md.includes(phrase)) issue("error", `markdown.${phrase}`, `Platform intelligence markdown must include ${phrase}.`);
}

for (const token of [
  "dashboardPlatformIntelligenceGeneratedAt",
  "dashboardPlatformIntelligenceSummary",
  "dashboardPlatformIntelligenceLayers",
  "dashboardPlatformIntelligenceDashboards",
  "dashboardPlatformIntelligenceWorkflows"
]) {
  if (!webData.includes(token)) issue("error", `webData.${token}`, `Generated web data must export ${token}.`);
}

finish();

function requireString(object, field, codePrefix) {
  if (typeof object[field] !== "string" || object[field].trim() === "") {
    issue("error", `${codePrefix}.${field}`, `${codePrefix} must declare ${field}.`);
  }
}

function requireArray(object, field, codePrefix) {
  if (!Array.isArray(object[field]) || object[field].length === 0) {
    issue("error", `${codePrefix}.${field}`, `${codePrefix} must declare non-empty ${field}.`);
  }
}

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function hasErrors() {
  return issues.some((item) => item.severity === "error");
}

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard platform intelligence validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
