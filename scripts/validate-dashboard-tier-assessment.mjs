#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
const assessmentPath = path.join(root, "docs/design/project-dashboard-tier-assessment.json");
const backlogPath = path.join(root, "docs/design/dashboard-cross-project-action-backlog.json");
const webDataPath = path.join(root, "web/src/pages/project-tier-assessment-data.ts");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(message, details = {}) {
  return { severity: "error", message, ...details };
}

function warn(message, details = {}) {
  return { severity: "warning", message, ...details };
}

function projectIssueCodes(result, severity) {
  return (result.issues ?? []).filter((issue) => issue.severity === severity).map((issue) => issue.code);
}

function expectedProject(result) {
  const tier = result.experienceTier ?? {};
  return {
    project: result.project,
    name: result.name,
    auditStatus: result.status,
    coarseTier: {
      current: tier.current,
      target: tier.target
    },
    currentBand: tier.currentBand ?? "T0L",
    currentBandLabel: tier.currentBandLabel ?? "",
    targetBand: tier.targetBand ?? "",
    targetBandLabel: tier.targetBandLabel ?? "",
    implementationMode: tier.implementationMode ?? "",
    warnings: projectIssueCodes(result, "warning"),
    errors: projectIssueCodes(result, "error"),
    nextMove: tier.nextAction ?? "",
    externalWorkItems: result.externalWorkItems ?? []
  };
}

function stable(value) {
  return JSON.stringify(value);
}

const issues = [];

for (const file of [reportPath, assessmentPath, backlogPath, webDataPath]) {
  if (!fs.existsSync(file)) {
    issues.push(fail("Required tier assessment artifact is missing.", { file: path.relative(root, file) }));
  }
}

if (issues.some((issue) => issue.severity === "error")) {
  printAndExit(issues);
}

const report = readJson(reportPath);
const assessment = readJson(assessmentPath);
const backlog = readJson(backlogPath);
const webData = fs.readFileSync(webDataPath, "utf8");
const bandIds = new Set((report.experienceTierBands ?? []).map((band) => band.band));
const expectedProjects = (report.results ?? []).map(expectedProject);

if (assessment.sourceHash !== report.sourceHash) {
  issues.push(fail("Tier assessment sourceHash does not match latest adoption report.", {
    assessment: assessment.sourceHash,
    report: report.sourceHash
  }));
}

if (assessment.generatedAt !== report.generatedAt) {
  issues.push(fail("Tier assessment generatedAt does not match latest adoption report.", {
    assessment: assessment.generatedAt,
    report: report.generatedAt
  }));
}

if (stable(assessment.projects ?? []) !== stable(expectedProjects)) {
  issues.push(fail("Tier assessment projects are stale; rerun npm run dashboard:tier-assessment:sync."));
}

if (!webData.includes(`export const projectTierSourceHash = ${JSON.stringify(report.sourceHash)}`)) {
  issues.push(fail("Generated web tier data does not include the latest report source hash.", {
    file: "web/src/pages/project-tier-assessment-data.ts"
  }));
}

const expectedBacklogItems = expectedProjects.flatMap((project) =>
  project.externalWorkItems.map((item) => ({
    project: project.project,
    projectName: project.name,
    currentBand: project.currentBand,
    targetBand: project.targetBand,
    auditStatus: project.auditStatus,
    ...item
  }))
);

if (stable(backlog.items ?? []) !== stable(expectedBacklogItems)) {
  issues.push(fail("Cross-project backlog is stale; rerun npm run dashboard:tier-assessment:sync."));
}

for (const project of expectedProjects) {
  if (!project.currentBand || !bandIds.has(project.currentBand)) {
    issues.push(fail("Project has missing or unknown currentBand.", { project: project.project, currentBand: project.currentBand }));
  }
  if (project.targetBand && !bandIds.has(project.targetBand)) {
    issues.push(fail("Project has unknown targetBand.", { project: project.project, targetBand: project.targetBand }));
  }
  if (!project.nextMove) {
    issues.push(fail("Project is missing nextMove.", { project: project.project }));
  }
  if (project.auditStatus !== "current" && project.externalWorkItems.length === 0) {
    issues.push(fail("Non-current project must have externalWorkItems.", { project: project.project, auditStatus: project.auditStatus }));
  }
  if (project.currentBand === "T3A" && project.auditStatus === "current") {
    issues.push(fail("T3A cannot be treated as current.", { project: project.project }));
  }
  if (project.currentBand === "T3C") {
    if (project.implementationMode !== "package-native") {
      issues.push(fail("T3C requires package-native implementation mode.", { project: project.project, implementationMode: project.implementationMode }));
    }
    if (project.warnings.length || project.errors.length) {
      issues.push(fail("T3C requires clean audit evidence.", { project: project.project, warnings: project.warnings.length, errors: project.errors.length }));
    }
  }
  if (project.targetBand === "T3C" && project.implementationMode !== "package-native") {
    if (!project.warnings.includes("packageNative.bridge")) {
      issues.push(fail("T3C target using a bridge must include packageNative.bridge warning.", { project: project.project, implementationMode: project.implementationMode }));
    }
    if (!project.externalWorkItems.some((item) => item.action.toLowerCase().includes("package-native"))) {
      issues.push(fail("T3C bridge project must have package-native external work item.", { project: project.project }));
    }
  }
}

if (expectedBacklogItems.length === 0) {
  issues.push(warn("No external backlog items were generated. This is unusual unless every project is current at target maturity."));
}

printAndExit(issues);

function printAndExit(items) {
  const errors = items.filter((issue) => issue.severity === "error");
  const warnings = items.filter((issue) => issue.severity === "warning");
  console.log(`Dashboard tier assessment validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of items) {
    console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.project ? ` [${item.project}]` : ""}${item.file ? ` [${item.file}]` : ""}`);
  }
  if (errors.length) process.exit(1);
}
