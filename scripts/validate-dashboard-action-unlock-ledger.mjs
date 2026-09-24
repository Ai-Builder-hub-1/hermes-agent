#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/dashboard-action-unlock-ledger.json");
const issues = [];
const requiredClassifications = new Set([
  "enable-readonly-preview",
  "enable-safe-action",
  "enable-approval-required",
  "enable-maintenance-window-only",
  "keep-blocked",
  "retire-action",
]);

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) {
  issue("error", "Dashboard action unlock ledger is missing.", "docs/design/dashboard-action-unlock-ledger.json");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (report.schemaVersion !== 1) issue("error", "Action unlock ledger must use schemaVersion 1.");
  if (!report.generatedAt) issue("error", "Action unlock ledger is missing generatedAt.");
  if (report.safeForFullyOperational !== true) issue("error", "Action unlock ledger must be safe for fully-operational certification.");
  if (report.policy?.unknownActionsAllowed !== false) issue("error", "Action unlock policy must disallow unknown actions.");
  if (report.policy?.unsafeMutationsAllowed !== false) issue("error", "Action unlock policy must disallow unsafe mutations.");
  if ((report.totals?.routeCount ?? 0) < 1) issue("error", "Action unlock ledger must include routes.");
  if ((report.totals?.uniqueActionCount ?? 0) < 1) issue("error", "Action unlock ledger must include unique actions.");
  if ((report.totals?.actionInstanceCount ?? 0) < 1) issue("error", "Action unlock ledger must include action instances.");
  if ((report.totals?.unknownActionCount ?? 1) !== 0) issue("error", "Action unlock ledger must have zero unknown actions.");
  if ((report.totals?.unsafeMutationCount ?? 1) !== 0) issue("error", "Action unlock ledger must have zero unsafe mutations.");
  if ((report.totals?.controlledMutationCount ?? 0) < 1) issue("error", "Action unlock ledger must classify controlled mutations.");
  for (const action of report.uniqueActions ?? []) {
    if (!requiredClassifications.has(action.classification)) issue("error", "Unknown action classification.", `${action.action}: ${action.classification}`);
    if (!action.requiredState || !action.rationale) issue("error", "Unique action must include requiredState and rationale.", action.action);
    if (!Array.isArray(action.requiredControls) || action.requiredControls.length < 1) issue("error", "Unique action must include required controls.", action.action);
    if (!Array.isArray(action.testProof) || action.testProof.length < 1) issue("error", "Unique action must include test proof.", action.action);
  }
  for (const route of report.routes ?? []) {
    if (!route.route || !route.title) issue("error", "Route action entry must include route and title.");
    if ((route.unknownActionCount ?? 0) !== 0) issue("error", "Route must not have unknown actions.", route.route);
    if ((route.unsafeMutationCount ?? 0) !== 0) issue("error", "Route must not have unsafe mutations.", route.route);
    for (const action of route.actions ?? []) {
      if (!requiredClassifications.has(action.classification)) issue("error", "Route action has unknown classification.", `${route.route}: ${action.action}`);
      if (action.safeForFullyOperational !== true) issue("error", "Route action must be safe for fully-operational certification.", `${route.route}: ${action.action}`);
      if (!Array.isArray(action.requiredControls) || action.requiredControls.length < 1) issue("error", "Route action must include required controls.", `${route.route}: ${action.action}`);
      if (!Array.isArray(action.testProof) || action.testProof.length < 1) issue("error", "Route action must include test proof.", `${route.route}: ${action.action}`);
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard action unlock validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
