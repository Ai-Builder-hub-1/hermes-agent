#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root } from "./dashboard-report-utils.mjs";

const reportPath = path.join(root, "docs/fleet/fleet-release-readiness.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) {
  issue("error", "Fleet release readiness report is missing.", "Run npm run fleet:release-readiness.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) issue("error", "Fleet release readiness report must declare schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Fleet release readiness report is missing generatedAt.");
  if (!report.rules?.deployableSource || !report.rules?.generatedEvidence || !report.rules?.screenshotProof) {
    issue("error", "Fleet release readiness rules are incomplete.");
  }
  if (!Array.isArray(report.projects) || report.projects.length < 5) {
    issue("error", "Fleet release readiness report must include registered projects.");
  }

  for (const project of report.projects ?? []) {
    if (!project.id) issue("error", "Project entry missing id.");
    if (!project.recommendation) issue("error", "Project entry missing recommendation.", project.id);
    if (!project.commitIntent) issue("error", "Project entry missing commit intent.", project.id);
    if (!project.proofPolicy) issue("error", "Project entry missing proof policy.", project.id);
    if (!Array.isArray(project.cleanupActions)) issue("error", "Project entry missing cleanup actions.", project.id);
    for (const entry of project.entries ?? []) {
      if (!entry.path) issue("error", "Dirty file entry missing path.", project.id);
      if (!entry.classification?.class) issue("error", "Dirty file entry missing classification.", `${project.id}:${entry.path}`);
      if (!entry.classification?.commitPolicy) issue("error", "Dirty file entry missing commit policy.", `${project.id}:${entry.path}`);
      if (["unsafe", "unknown"].includes(entry.classification?.class)) {
        issue("warning", "Dirty file needs release review before commit/deploy.", `${project.id}:${entry.path}`);
      }
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Fleet release readiness validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
