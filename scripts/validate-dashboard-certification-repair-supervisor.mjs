#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root, readJson } from "./dashboard-report-utils.mjs";

const supervisorPath = path.join(root, "docs/fleet/dashboard-certification-repair-supervisor.json");
const playbookPath = path.join(root, "docs/design/dashboard-certification-repair-playbooks.json");
const certificationPath = path.join(root, "docs/fleet/dashboard-certification-report.json");
const strict = process.argv.includes("--strict");
const issues = [];

for (const file of [supervisorPath, playbookPath, certificationPath]) {
  if (!fs.existsSync(file)) issue("error", "artifact.missing", `${path.relative(root, file)} is missing.`);
}
if (issues.some((item) => item.severity === "error")) finish();

const supervisor = readJson(supervisorPath);
const playbook = readJson(playbookPath);
const certification = readJson(certificationPath);

if (supervisor.schemaVersion !== 1) issue("error", "supervisor.schemaVersion", "Supervisor schemaVersion must be 1.");
if (playbook.schemaVersion !== 1) issue("error", "playbook.schemaVersion", "Playbook schemaVersion must be 1.");
if (!supervisor.policy?.deploymentBlockedUntilStrictCertificationPasses) {
  issue("error", "policy.deploymentGate", "Supervisor must declare deploymentBlockedUntilStrictCertificationPasses.");
}
if (!supervisor.policy?.doesNotAutoRewriteBusinessLogic) {
  issue("error", "policy.businessLogic", "Supervisor must declare it does not auto-rewrite business logic.");
}

const certifiedProjects = new Set((certification.projects ?? []).map((project) => project.project));
const orderProjects = new Set((supervisor.executionOrder ?? []).map((item) => item.project));
for (const project of certifiedProjects) {
  if (!orderProjects.has(project)) issue("error", `executionOrder.${project}`, `${project} is missing from repair execution order.`);
}

const playbookClasses = new Set((playbook.failureClasses ?? []).map((item) => item.id));
for (const required of [
  "manifest-truth",
  "shell-anatomy",
  "hidden-marker",
  "static-route-retirement",
  "local-visual-debt",
  "chart-contract",
  "proof-gap",
  "dev-tool-production-risk"
]) {
  if (!playbookClasses.has(required)) issue("error", `playbook.${required}`, `Missing repair playbook class ${required}.`);
}

for (const item of playbook.failureClasses ?? []) {
  if (!item.lane) issue("error", `playbook.${item.id}.lane`, `${item.id} must define lane.`);
  if (!item.repairPattern) issue("error", `playbook.${item.id}.repairPattern`, `${item.id} must define repairPattern.`);
  if (!Array.isArray(item.requiredProof) || item.requiredProof.length < 2) {
    issue("error", `playbook.${item.id}.requiredProof`, `${item.id} must define required proof.`);
  }
}

for (const item of supervisor.workItems ?? []) {
  if (!certifiedProjects.has(item.project)) issue("error", `workItem.${item.id}.project`, `${item.id} references unknown project.`);
  if (!playbookClasses.has(item.failureClass) && item.failureClass !== "uncategorized") {
    issue("error", `workItem.${item.id}.failureClass`, `${item.id} references unknown failure class ${item.failureClass}.`);
  }
  if (!item.rerun?.includes("dashboard:certify:strict")) {
    issue("error", `workItem.${item.id}.rerun`, `${item.id} must rerun strict certification.`);
  }
}

if ((certification.summary?.blocked ?? 0) > 0 && (supervisor.workItems ?? []).length === 0) {
  issue("error", "workItems.empty", "Blocked certification report must produce repair work items.");
}

finish();

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard certification repair supervisor validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length || (strict && warnings.length)) process.exit(1);
}
