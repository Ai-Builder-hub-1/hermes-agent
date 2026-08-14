#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const generatedAt = new Date().toISOString();
const registryPath = path.join(designDir, "dashboard-platform-intelligence-system.json");
const mdPath = path.join(designDir, "dashboard-platform-intelligence-system.md");
const reportPath = path.join(designDir, "dashboard-platform-intelligence-report.json");
const reportMdPath = path.join(designDir, "dashboard-platform-intelligence-report.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-platform-intelligence-data.ts");

const platformLayers = [
  ["product-strategy-intelligence", "Understand what each dashboard exists to accomplish, which workflows matter, and what data proves business value.", ["business objective", "operator workflow", "route telemetry", "OKR/KPI relationship"], ["product strategy brief", "workflow priority", "value proof contract"]],
  ["portfolio-product-map", "Map every project, dashboard, workflow, data source, component dependency, maturity score, and business objective.", ["fleet registry", "dashboard registry", "project status ledger", "component dependency graph"], ["portfolio map", "project dependency map", "maturity map"]],
  ["autonomous-roadmap-builder", "Propose roadmap work from business priority, maturity, debt, missing components, usage telemetry, revenue/risk impact, and feedback.", ["quality scores", "design debt", "component gaps", "business priority"], ["ranked roadmap", "next-build candidates", "blocked/deferred reasons"]],
  ["investment-roi-scoring", "Score potential work by expected value, effort, risk, reuse potential, urgency, dependencies, and cost of delay.", ["roadmap candidate", "effort estimate", "risk score", "reuse count"], ["ROI score", "priority class", "go/no-go rationale"]],
  ["business-objective-alignment", "Connect dashboard work to TLC OKRs, business-unit OKRs, KPIs, bottlenecks, active projects, and task queues.", ["OKR/KPI registry", "task ledger", "dashboard route map"], ["objective linkage", "impact claim", "ownership chain"]],
  ["adaptive-product-architecture", "Detect when pages should merge, split, retire, change mode, or move into a new domain subkit.", ["usage telemetry", "workflow proof", "route IA", "operator feedback"], ["architecture recommendation", "migration path", "retirement candidate"]],
  ["autonomous-task-generation", "Convert gaps into engineering, design, data-contract, QA, proof, documentation, and deployment tasks.", ["assessment finding", "standard failure", "route manifest"], ["task set", "owner suggestion", "acceptance criteria"]],
  ["cross-functional-review-layer", "Run design, engineering, business, compliance/risk, data-quality, and operator-workflow reviews before promotion.", ["review packet", "proof artifacts", "business objective"], ["review decisions", "approval state", "exception record"]],
  ["production-learning-loop", "Feed production telemetry back into roadmap, component evolution, workflow redesign, OKR progress, and retirement decisions.", ["runtime telemetry", "workflow outcomes", "proof freshness"], ["learning item", "roadmap update", "component feedback"]],
  ["autonomous-product-council", "Answer what should be built, fixed, retired, unblocked, or promoted next across the whole fleet.", ["portfolio map", "roadmap scores", "review states", "OKR alignment"], ["council recommendation", "fleet priority", "blocked-project callout"]],
  ["scenario-planning", "Simulate migration cost, operator improvement, rollout risk, dependency conflict, and delay impact before build.", ["candidate work", "dependency graph", "baseline scores"], ["scenario comparison", "risk/benefit note", "recommended path"]],
  ["continuous-product-refactoring", "Continuously detect stale dashboards, low-use pages, failed workflows, redundant features, outdated components, and weak alignment.", ["production telemetry", "quality history", "component usage"], ["refactor candidate", "retire candidate", "upgrade candidate"]],
  ["autonomous-release-governance", "Control releases through quality gates, business-value gates, risk gates, proof gates, rollback readiness, and post-release monitoring.", ["release candidate", "quality gate result", "business gate result"], ["release decision", "rollback plan", "post-release proof"]],
  ["org-memory", "Persist why products exist, why decisions were made, which experiments worked, which patterns failed, and what the business values.", ["decision record", "experiment result", "review feedback"], ["org memory item", "future build rule", "preference update"]],
  ["closed-loop-operating-system", "Connect business objective, product strategy, dashboard/workflow design, build, proof, deploy, telemetry, learning, and roadmap update.", ["business objective", "build proof", "telemetry", "learning"], ["closed-loop status", "next operating cycle", "maturity delta"]]
].map(([id, purpose, requiredInputs, outputs], index) => ({
  id,
  number: index + 1,
  status: index < 6 ? "active" : "defined",
  purpose,
  requiredInputs,
  outputs,
  enforcementSignals: [
    "route linked to business objective",
    "maturity score known",
    "next work ranked",
    "proof and telemetry required",
    "review decision recorded"
  ]
}));

const dashboards = dashboardRegistry();
const dashboardRows = dashboards.map((dashboard) => ({
  id: dashboard.id,
  projectName: dashboard.projectName,
  category: dashboard.category,
  owner: dashboard.owner,
  url: dashboard.url,
  proofUrl: dashboard.proofUrl,
  healthUrl: dashboard.healthUrl,
  platformSignals: [
    "product purpose",
    "operator workflow",
    "business objective linkage",
    "quality score",
    "roadmap priority",
    "production proof",
    "learning loop"
  ],
  nextIntelligenceWork: inferNextWork(dashboard)
}));

const strategyWorkflows = [
  ["objective-to-dashboard", "business objective -> dashboard/workflow design -> component/data requirements -> proof"],
  ["dashboard-to-roadmap", "dashboard maturity + telemetry + debt -> ranked roadmap work"],
  ["component-to-fleet", "component health + usage + defects -> upgrade campaign"],
  ["production-to-learning", "production usage + failures + proof freshness -> learning item and standard update"],
  ["review-to-memory", "human approval/rejection -> design memory and future build rules"],
  ["release-to-governance", "release candidate -> gates -> deploy -> post-release proof"]
].map(([id, flow]) => ({ id, flow, status: "required" }));

const policy = {
  everyDashboardRequiresProductPurpose: true,
  everyDashboardRequiresBusinessObjectiveLinkage: true,
  roadmapRequiresValueRiskEffortScore: true,
  releasesRequireBusinessAndQualityGates: true,
  productionTelemetryFeedsRoadmap: true,
  humanReviewFeedsOrgMemory: true,
  staleDashboardsEnterRefactorQueue: true
};

const registry = {
  schemaVersion: 1,
  version: "V1",
  generatedAt,
  title: "Dashboard Platform Intelligence System",
  status: "active",
  owner: "nous-hermes-agent",
  purpose: "Turn dashboard standards and product-quality checks into a portfolio-level product operating system that links business objectives, roadmap decisions, product architecture, proof, telemetry, learning, and release governance.",
  policy,
  platformLayers,
  dashboards: dashboardRows,
  strategyWorkflows
};

const report = {
  schemaVersion: 1,
  version: registry.version,
  generatedAt,
  summary: {
    layerCount: platformLayers.length,
    activeLayerCount: platformLayers.filter((layer) => layer.status === "active").length,
    definedLayerCount: platformLayers.filter((layer) => layer.status === "defined").length,
    dashboardCount: dashboardRows.length,
    strategyWorkflowCount: strategyWorkflows.length,
    target: "Move from dashboard quality control to portfolio-level product intelligence and roadmap governance."
  },
  nextActions: [
    "Attach business objective links to each production dashboard route.",
    "Generate value/risk/effort scores for each downstream dashboard maturity task.",
    "Create a fleet roadmap view from quality debt, component gaps, proof status, and business priority.",
    "Feed production telemetry and human review decisions into org memory.",
    "Use closed-loop operating cycles before any project is promoted as complete."
  ],
  platformLayers: platformLayers.map((layer) => ({ id: layer.id, status: layer.status, purpose: layer.purpose })),
  dashboards: dashboardRows,
  strategyWorkflows
};

writeJson(registryPath, registry);
writeJson(reportPath, report);
writeMarkdown(mdPath, `# Dashboard Platform Intelligence System

Generated: ${generatedAt}

Purpose: ${registry.purpose}

## Policy

${markdownTable(
  ["Rule", "Required"],
  Object.entries(policy).map(([key, value]) => [key, value ? "yes" : "no"])
)}

## Platform Layers

${markdownTable(
  ["#", "Layer", "Status", "Purpose", "Outputs"],
  platformLayers.map((layer) => [layer.number, layer.id, layer.status, layer.purpose, layer.outputs.join(", ")])
)}

## Dashboard Coverage

${markdownTable(
  ["Dashboard", "Project", "Category", "Next intelligence work"],
  dashboardRows.map((dashboard) => [dashboard.id, dashboard.projectName, dashboard.category, dashboard.nextIntelligenceWork])
)}

## Strategy Workflows

${markdownTable(
  ["Workflow", "Flow", "Status"],
  strategyWorkflows.map((workflow) => [workflow.id, workflow.flow, workflow.status])
)}
`);

writeMarkdown(reportMdPath, `# Dashboard Platform Intelligence Report

Generated: ${generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.summary).map(([key, value]) => [key, value])
)}

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}

## Dashboard Coverage

${markdownTable(
  ["Dashboard", "Category", "Signals", "Next work"],
  dashboardRows.map((dashboard) => [
    dashboard.id,
    dashboard.category,
    dashboard.platformSignals.join(", "),
    dashboard.nextIntelligenceWork
  ])
)}
`);

writeMarkdown(webDataPath, `// Generated by scripts/generate-dashboard-platform-intelligence-system.mjs.
export const dashboardPlatformIntelligenceGeneratedAt = ${JSON.stringify(generatedAt)};
export const dashboardPlatformIntelligenceSummary = ${JSON.stringify(report.summary, null, 2)} as const;
export const dashboardPlatformIntelligenceLayers = ${JSON.stringify(platformLayers, null, 2)} as const;
export const dashboardPlatformIntelligenceDashboards = ${JSON.stringify(dashboardRows, null, 2)} as const;
export const dashboardPlatformIntelligenceWorkflows = ${JSON.stringify(strategyWorkflows, null, 2)} as const;
`);

console.log(`Dashboard platform intelligence generated: ${platformLayers.length} layers, ${dashboardRows.length} dashboards, ${strategyWorkflows.length} workflows.`);
console.log(`Wrote ${path.relative(root, registryPath)}, ${path.relative(root, reportPath)}, and ${path.relative(root, webDataPath)}`);

function inferNextWork(dashboard) {
  const category = dashboard.category ?? "";
  if (dashboard.id === "nous-hermes-agent.dashboard") return "Operate the product-quality console and closed-loop fleet roadmap.";
  if (category.includes("media")) return "Link media workflow quality to publishing throughput, QA outcomes, and production learning.";
  if (category.includes("research")) return "Link research/market workflows to decision quality, evidence confidence, and experiment readiness.";
  if (category.includes("enterprise")) return "Link OKR/KPI outcomes to business-unit dashboards and owner task queues.";
  if (category.includes("consumer")) return "Link planner/workflow completion to retention, fulfillment quality, and operator friction.";
  if (category.includes("business")) return "Link workspace quality to evidence coverage, validation throughput, and deliverable completion.";
  return "Attach business objective, workflow proof, visual score, and production telemetry.";
}
