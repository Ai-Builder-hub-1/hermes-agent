#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const generatedAt = new Date().toISOString();
const jsonPath = path.join(designDir, "dashboard-downstream-platform-assessment.json");
const mdPath = path.join(designDir, "dashboard-downstream-platform-assessment.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-downstream-platform-assessment-data.ts");

const projectStatusPath = path.join(designDir, "project-status-ledger.json");
const fleetRegistryPath = path.join(root, "docs/fleet/fleet-registry.json");
const productQualityPath = path.join(designDir, "dashboard-product-quality-control-plane.json");
const platformIntelligencePath = path.join(designDir, "dashboard-platform-intelligence-system.json");

const projectStatus = readJsonIfExists(projectStatusPath);
const fleetRegistry = readJsonIfExists(fleetRegistryPath);
const productQuality = readJsonIfExists(productQualityPath);
const platformIntelligence = readJsonIfExists(platformIntelligencePath);
const dashboards = dashboardRegistry();
const projectRows = dashboards.map((dashboard) => {
  const fleetProject = (fleetRegistry?.projects ?? []).find((project) => project.dashboard?.dashboardId === dashboard.id || project.id === normalizeProjectId(dashboard));
  const statusProject = findStatusProject(projectStatus, dashboard);
  const visual = fleetProject?.visual ?? statusProject?.visual ?? {};
  const dashboardStatus = fleetProject?.dashboard ?? statusProject?.dashboard ?? {};
  const work = downstreamWorkFor(dashboard, visual, dashboardStatus);
  return {
    id: dashboard.id,
    projectName: dashboard.projectName,
    category: dashboard.category,
    owner: dashboard.owner,
    productionUrl: dashboard.url,
    currentVisualTier: visual.visualTier ?? "unknown",
    targetVisualTier: visual.targetVisualTier ?? inferTargetVisualTier(dashboard),
    visualScore: visual.visualScore ?? null,
    dashboardStatus: dashboardStatus.status ?? "unknown",
    implementationMode: dashboardStatus.implementationMode ?? "unknown",
    readiness: work.readiness,
    priority: work.priority,
    downstreamWork: work.items,
    blockers: work.blockers,
    proofRequired: work.proofRequired
  };
});

const summary = {
  generatedAt,
  projectCount: projectRows.length,
  highPriorityCount: projectRows.filter((project) => project.priority === "high").length,
  mediumPriorityCount: projectRows.filter((project) => project.priority === "medium").length,
  lowPriorityCount: projectRows.filter((project) => project.priority === "low").length,
  packageNativeUnknownCount: projectRows.filter((project) => project.implementationMode === "unknown").length,
  needsRenderedProofCount: projectRows.filter((project) => project.proofRequired.includes("rendered visual proof")).length,
  platformLayerCount: platformIntelligence?.platformLayers?.length ?? 0,
  productQualityCapabilityCount: productQuality?.capabilities?.length ?? 0
};

const report = {
  schemaVersion: 1,
  version: "V1",
  generatedAt,
  title: "Dashboard Downstream Platform Assessment",
  status: "active",
  purpose: "Translate central platform-intelligence standards into concrete downstream maturity work for each production dashboard project.",
  summary,
  projects: projectRows,
  requiredFleetMoves: [
    "Every project must expose a project-local dashboard:standard:check command aligned to Nous Hermes.",
    "Every production route must publish route/page manifests with intent, blueprint, density, business objective, components, data states, and proof states.",
    "Every project must capture rendered proof for desktop expanded, desktop collapsed, overflow scan, and primary workflow.",
    "Every route must expose quality state: visual score, workflow proof, design debt, component dependencies, promotion blockers, and production proof freshness.",
    "Every project-specific improvement must either use existing dashboard-kit components or create a component enrichment RFC before local UI is accepted."
  ]
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard Downstream Platform Assessment

Generated: ${generatedAt}

Purpose: ${report.purpose}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(summary).map(([key, value]) => [key, value])
)}

## Required Fleet Moves

${report.requiredFleetMoves.map((item) => `- ${item}`).join("\n")}

## Project Work

${markdownTable(
  ["Project", "Status", "Mode", "Visual", "Priority", "Readiness", "Top downstream work"],
  projectRows.map((project) => [
    project.projectName,
    project.dashboardStatus,
    project.implementationMode,
    `${project.currentVisualTier} -> ${project.targetVisualTier}${project.visualScore === null ? "" : ` (${project.visualScore})`}`,
    project.priority,
    project.readiness,
    project.downstreamWork.slice(0, 3).join("<br>")
  ])
)}
`);

writeMarkdown(webDataPath, `// Generated by scripts/generate-dashboard-downstream-platform-assessment.mjs.
export const dashboardDownstreamPlatformAssessmentGeneratedAt = ${JSON.stringify(generatedAt)};
export const dashboardDownstreamPlatformAssessmentSummary = ${JSON.stringify(summary, null, 2)} as const;
export const dashboardDownstreamPlatformAssessmentProjects = ${JSON.stringify(projectRows, null, 2)} as const;
export const dashboardDownstreamPlatformRequiredFleetMoves = ${JSON.stringify(report.requiredFleetMoves, null, 2)} as const;
`);

console.log(`Dashboard downstream platform assessment generated: ${projectRows.length} projects.`);
console.log(`Wrote ${path.relative(root, jsonPath)}, ${path.relative(root, mdPath)}, and ${path.relative(root, webDataPath)}`);

function downstreamWorkFor(dashboard, visual, dashboardStatus) {
  const items = [
    "Add or verify project-local dashboard:standard:check against Nous Hermes validators.",
    "Register every page with intent, blueprint, density, business objective, data states, and proof states.",
    "Capture rendered visual proof for expanded/collapsed sidebar, overflow scan, and primary workflow.",
    "Expose route quality state in dashboard snapshot: visual score, proof freshness, workflow proof, design debt, and blockers."
  ];
  const blockers = [];
  const proofRequired = ["rendered visual proof", "workflow proof", "production proof freshness"];
  const category = dashboard.category ?? "";

  if ((dashboardStatus.implementationMode ?? "") !== "package-native") {
    items.unshift("Migrate primary dashboard route to package-native dashboard-kit implementation.");
    blockers.push("package-native implementation not proven");
  }
  if ((visual.visualScore ?? 0) < 88) {
    items.push("Run route redesign against the visual maturity rubric until V3 score is proven.");
    blockers.push("visual score below V3 threshold or unknown");
  }
  if (category.includes("media")) {
    items.push("Connect publishing workflow outcomes to package generation, QA approval, rejection reason, posting result, and throughput metrics.");
  } else if (category.includes("research")) {
    items.push("Connect research/market workflows to evidence quality, category navigation, chart/detail proof, experiments, and decision readiness.");
  } else if (category.includes("consumer")) {
    items.push("Connect planner workflows to saved state, calendar selection, drawer completion, checklist/export proof, and household outcome metrics.");
  } else if (category.includes("enterprise")) {
    items.push("Connect OKR/KPI governance to business-unit ownership, task attribution, review cadence, and objective outcome proof.");
  } else if (category.includes("business")) {
    items.push("Connect workspace workflows to validation queues, evidence coverage, deliverables, and advisory output proof.");
  } else {
    items.push("Connect route telemetry and proof to product-purpose, roadmap, and release-governance signals.");
  }

  const priority = blockers.length > 0 ? "high" : (visual.visualTier === visual.targetVisualTier && visual.visualScore >= 96 ? "low" : "medium");
  const readiness = blockers.length > 0 ? "blocked" : (priority === "low" ? "monitor" : "ready-to-upgrade");
  return { items, blockers, proofRequired, priority, readiness };
}

function readJsonIfExists(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function normalizeProjectId(dashboard) {
  return String(dashboard.projectName ?? dashboard.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findStatusProject(projectStatus, dashboard) {
  const projects = projectStatus?.projects ?? projectStatus?.items ?? [];
  return projects.find((project) => project.dashboard?.dashboardId === dashboard.id || project.id === normalizeProjectId(dashboard));
}

function inferTargetVisualTier(dashboard) {
  return dashboard.id === "nous-hermes-agent.dashboard" ? "V4" : "V3";
}
