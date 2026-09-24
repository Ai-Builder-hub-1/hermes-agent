#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/dashboard-command-governance-ledger.json");
const evidencePath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const issues = [];
const issue = (severity, message, details = "") => issues.push({ severity, message, details });

if (!fs.existsSync(reportPath)) issue("error", "Dashboard command governance ledger is missing.", "docs/design/dashboard-command-governance-ledger.json");
if (!fs.existsSync(evidencePath)) issue("error", "Generated route evidence bindings are missing.", "docs/design/generated-dashboard-route-evidence-bindings.json");

if (!issues.some((item) => item.severity === "error")) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  const routeCount = evidence.totals?.routeCount ?? 0;
  if (report.schemaVersion !== 1) issue("error", "Dashboard command governance ledger has invalid schemaVersion.");
  if (!report.generatedAt) issue("error", "Dashboard command governance ledger is missing generatedAt.");
  if (report.source !== "docs/design/generated-dashboard-route-evidence-bindings.json") issue("error", "Dashboard command governance ledger must point at generated route evidence bindings.");
  if (!report.policy?.mutatingActionsMustStayBlockedWithoutFullGovernance) issue("error", "Command governance policy must require mutating actions to stay blocked without full governance.");
  if (!report.policy?.unsafeMutationEnabledFailsShipCheck) issue("error", "Command governance policy must fail ship check on unsafe enabled mutations.");
  if ((report.totals?.routeCount ?? 0) !== routeCount) issue("error", "Command governance route count must match generated route evidence.", `${report.totals?.routeCount ?? 0}/${routeCount}`);
  if ((report.totals?.unsafeMutationCount ?? 0) !== 0) issue("error", "Command governance ledger has unsafe enabled mutating actions.", String(report.totals?.unsafeMutationCount ?? 0));
  if ((report.totals?.missingControlCount ?? 0) !== 0) issue("error", "Command governance ledger has actions missing required controls.", String(report.totals?.missingControlCount ?? 0));
  if ((report.totals?.readOnlyEligibleCount ?? 0) < routeCount) issue("error", "Command governance ledger must keep read-only actions eligible.");
  if ((report.totals?.mutatingBlockedCount ?? 0) < routeCount) issue("error", "Command governance ledger must keep mutating actions blocked until governed.");
  if (report.safePosture !== true) issue("error", "Command governance ledger must report safePosture true.");
  for (const route of report.routes ?? []) {
    if (route.posture !== "locked-safe") issue("error", "Route command posture is not locked-safe.", route.route);
    for (const action of route.actions ?? []) {
      if (!action.permission || !action.auditEvent) issue("error", "Command action is missing permission or audit event.", `${route.route}: ${action.action}`);
      if (!Number.isFinite(action.cooldownSeconds) || !Number.isFinite(action.duplicateWindowSeconds)) issue("error", "Command action is missing cooldown controls.", `${route.route}: ${action.action}`);
      if (action.mode === "gated-mutation" && (action.eligibility !== "blocked" || !action.disabledReason)) issue("error", "Mutating action is not safely blocked.", `${route.route}: ${action.action}`);
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard command governance validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
