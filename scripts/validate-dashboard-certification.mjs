#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root, readJson } from "./dashboard-report-utils.mjs";

const reportPath = path.join(root, "docs/fleet/dashboard-certification-report.json");
const repairPath = path.join(root, "docs/fleet/dashboard-certification-repair-packets.json");
const ledgerPath = path.join(root, "docs/fleet/dashboard-certification-attempt-ledger.json");
const standardPath = path.join(root, "docs/design/dashboard-certification-standard.md");
const strict = process.argv.includes("--strict");
const issues = [];

for (const file of [reportPath, repairPath, ledgerPath, standardPath]) {
  if (!fs.existsSync(file)) issue("error", "artifact.missing", `${path.relative(root, file)} is missing.`);
}

if (issues.some((item) => item.severity === "error")) finish();

const report = readJson(reportPath);
const repairs = readJson(repairPath);
const ledger = readJson(ledgerPath);
const standard = fs.readFileSync(standardPath, "utf8");

if (report.schemaVersion !== 1) issue("error", "report.schemaVersion", "Certification report schemaVersion must be 1.");
if (!Array.isArray(report.standard?.layers) || report.standard.layers.length < 20) {
  issue("error", "report.layers", "Certification report must include the full 20-layer certification model.");
}
if (!Array.isArray(report.standard?.promotionStateMachine) || report.standard.promotionStateMachine.length < 10) {
  issue("error", "report.stateMachine", "Certification report must include promotion state machine.");
}
if (!Array.isArray(report.projects) || report.projects.length === 0) {
  issue("error", "report.projects", "Certification report must include projects.");
}

const projectIds = new Set();
for (const project of report.projects ?? []) {
  if (!project.project) issue("error", "project.id", "Every certification project must include an id.");
  projectIds.add(project.project);
  if (!["certified", "needs-review", "blocked"].includes(project.verdict)) {
    issue("error", `project.${project.project}.verdict`, `${project.project} has invalid verdict ${project.verdict}.`);
  }
  if (!Array.isArray(project.blockers)) issue("error", `project.${project.project}.blockers`, `${project.project} blockers must be an array.`);
  if (!Array.isArray(project.warnings)) issue("error", `project.${project.project}.warnings`, `${project.project} warnings must be an array.`);
  if (!project.repairPacket?.id) issue("error", `project.${project.project}.repairPacket`, `${project.project} must include a repair packet reference.`);
  if (project.verdict === "blocked" && !project.repairPacket.actions?.length) {
    issue("error", `project.${project.project}.repairActions`, `${project.project} is blocked but has no repair actions.`);
  }
  if (project.declared?.targetExperienceBand === "T3C" && project.falseNativeClaim && project.verdict !== "blocked") {
    issue("error", `project.${project.project}.falseNativeVerdict`, `${project.project} has a false-native claim but was not blocked.`);
  }
}

if (repairs.schemaVersion !== 1) issue("error", "repairs.schemaVersion", "Repair packet schemaVersion must be 1.");
for (const packet of repairs.packets ?? []) {
  if (!projectIds.has(packet.project)) issue("error", `repair.${packet.id}.project`, `${packet.id} references unknown project ${packet.project}.`);
  if (!Array.isArray(packet.actions) || packet.actions.length === 0) {
    issue("error", `repair.${packet.id}.actions`, `${packet.id} must include repair actions.`);
  }
  if (!packet.rerun?.includes("dashboard:certify")) {
    issue("error", `repair.${packet.id}.rerun`, `${packet.id} must include certification rerun command.`);
  }
}

if (ledger.schemaVersion !== 1) issue("error", "ledger.schemaVersion", "Attempt ledger schemaVersion must be 1.");
if ((ledger.attempts ?? []).length !== (report.projects ?? []).length) {
  issue("error", "ledger.attempts", "Attempt ledger must include one entry per certified project.");
}
for (const attempt of ledger.attempts ?? []) {
  if (!projectIds.has(attempt.project)) issue("error", `ledger.${attempt.project}.project`, `Ledger references unknown project ${attempt.project}.`);
  if (!["preflight", "repair-needed", "certified"].includes(attempt.state)) {
    issue("error", `ledger.${attempt.project}.state`, `${attempt.project} has invalid promotion state ${attempt.state}.`);
  }
}

for (const required of [
  "Tool-Agnostic Rule",
  "Required Flow",
  "Blocking Rules",
  "Hidden `data-hdk-component`",
  "commit/deploy only after certification"
]) {
  if (!standard.includes(required)) issue("error", `standard.${required}`, `Certification standard must mention ${required}.`);
}

finish();

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard certification artifact validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length || (strict && warnings.length)) process.exit(1);
}
