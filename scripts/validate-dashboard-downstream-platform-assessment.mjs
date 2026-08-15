#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const designDir = path.join(root, "docs/design");
const reportPath = path.join(designDir, "dashboard-downstream-platform-assessment.json");
const mdPath = path.join(designDir, "dashboard-downstream-platform-assessment.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-downstream-platform-assessment-data.ts");
const issues = [];

for (const file of [reportPath, mdPath, webDataPath]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}
if (hasErrors()) finish();

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const md = fs.readFileSync(mdPath, "utf8");
const webData = fs.readFileSync(webDataPath, "utf8");

if (report.schemaVersion !== 1) issue("error", "report.schemaVersion", "Downstream assessment must declare schemaVersion 1.");
if (report.version !== "V1") issue("error", "report.version", "Downstream assessment must declare V1.");
if (report.status !== "active") issue("error", "report.status", "Downstream assessment must be active.");
if ((report.projects ?? []).length < 10) issue("error", "projects.count", "Downstream assessment must cover the current dashboard fleet.");
if ((report.requiredFleetMoves ?? []).length < 5) issue("error", "requiredFleetMoves.count", "Downstream assessment must define required fleet moves.");

for (const project of report.projects ?? []) {
  for (const field of ["id", "projectName", "category", "owner", "productionUrl", "dashboardStatus", "implementationMode", "readiness", "priority", "proofStatus"]) {
    requireString(project, field, `project:${project.id ?? "unknown"}`);
  }
  requireArray(project, "downstreamWork", `project:${project.id ?? "unknown"}`);
  if (project.proofStatus === "passed") {
    if ((project.proofRequired ?? []).length !== 0) {
      issue("error", `project:${project.id}.proofRequired`, `${project.id} should not list pending proof requirements after proof passes.`);
    }
  } else {
    requireArray(project, "proofRequired", `project:${project.id ?? "unknown"}`);
    for (const proof of ["rendered visual proof", "workflow proof", "production proof freshness"]) {
      if (!project.proofRequired.includes(proof)) issue("error", `project:${project.id}.${proof}`, `${project.id} must require ${proof}.`);
    }
  }
}

if (report.summary?.projectCount !== report.projects.length) issue("error", "summary.projectCount", "Summary project count is stale.");
if (!md.includes("Required Fleet Moves") || !md.includes("Project Work")) issue("error", "markdown.sections", "Markdown must include required fleet moves and project work.");
for (const token of [
  "dashboardDownstreamPlatformAssessmentGeneratedAt",
  "dashboardDownstreamPlatformAssessmentSummary",
  "dashboardDownstreamPlatformAssessmentProjects",
  "dashboardDownstreamPlatformRequiredFleetMoves"
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
  console.log(`Dashboard downstream platform assessment validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
