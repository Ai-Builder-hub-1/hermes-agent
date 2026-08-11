#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/component-review-registry.json");
const reportPath = path.join(root, "docs/design/dashboard-kit-gallery-report.json");
const requiredScoreDimensions = [
  "visualPolish",
  "interactionCompleteness",
  "stateCoverage",
  "domainIntelligence",
  "adoptionReadiness",
  "accessibility"
];
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    issue("error", "Required dashboard kit maturity file is missing.", path.relative(root, filePath));
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(registryPath);
const report = readJson(reportPath);

if (registry) {
  if (registry.version !== 1) issue("error", "Component review registry must declare version 1.");
  if (!registry.scale?.scorePolicy) issue("error", "Component review registry must declare the central-kit versus project-adoption score policy.");
  if (registry.scale?.level5Threshold !== 100) issue("error", "Component review registry must declare a Level 5 threshold of 100.");

  for (const family of registry.families ?? []) {
    if (family.reviewStatus !== "approved") {
      issue("error", "Every Level 5 family must be approved.", family.id);
    }
    if (!(family.closureEvidence ?? []).length) {
      issue("error", "Every approved family must have closure evidence.", family.id);
    }
    if ((family.nextActions ?? []).length) {
      issue("error", "Central kit Level 5 families cannot carry unresolved next actions.", `${family.id}: ${family.nextActions.join("; ")}`);
    }
    for (const dimension of requiredScoreDimensions) {
      if (family.score?.[dimension] !== 100) {
        issue("error", "Central kit Level 5 score dimension must be 100.", `${family.id}.${dimension}=${family.score?.[dimension] ?? "missing"}`);
      }
    }
    if (!Number.isFinite(family.score?.projectAdoption)) {
      issue("error", "Every family must keep a separate downstream projectAdoption score.", family.id);
    }
    if (!(family.projectReadiness ?? []).length) {
      issue("warning", "Family has no downstream project readiness links.", family.id);
    }
  }
}

if (report) {
  if (report.reviewSummary?.averageScore !== 100) {
    issue("error", "Generated gallery report must show central kit score 100.", `actual=${report.reviewSummary?.averageScore ?? "missing"}`);
  }
  if (report.reviewSummary?.level5Ready !== true) {
    issue("error", "Generated gallery report must declare level5Ready true.");
  }
  if (!Number.isFinite(report.reviewSummary?.downstreamAdoptionScore)) {
    issue("error", "Generated gallery report must show downstream adoption separately.");
  }
  if ((report.reviewSummary?.unresolvedNextActions ?? 0) !== 0) {
    issue("error", "Generated gallery report cannot include unresolved central next actions.", String(report.reviewSummary.unresolvedNextActions));
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard kit gallery maturity validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) {
  console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
}
if (errors.length) process.exit(1);
