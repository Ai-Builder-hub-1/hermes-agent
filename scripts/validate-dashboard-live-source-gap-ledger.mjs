#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/dashboard-live-source-gap-ledger.json");
const evidencePath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) issue("error", "Dashboard live source gap ledger is missing.", "docs/design/dashboard-live-source-gap-ledger.json");
if (!fs.existsSync(evidencePath)) issue("error", "Generated route evidence bindings are missing.", "docs/design/generated-dashboard-route-evidence-bindings.json");

if (!issues.some((item) => item.severity === "error")) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  const routeCount = evidence.totals?.routeCount ?? 0;

  if (report.schemaVersion !== 1) issue("error", "Dashboard live source gap ledger has invalid schemaVersion.");
  if (!report.generatedAt) issue("error", "Dashboard live source gap ledger is missing generatedAt.");
  if (report.source !== "docs/design/generated-dashboard-route-evidence-bindings.json") issue("error", "Dashboard live source gap ledger must point at generated route evidence bindings.");
  if (!report.policy?.staleOrMissingSourcesRequireLiveProbeReplacement) issue("error", "Dashboard live source gap ledger must require live probe replacement for stale/missing sources.");
  if (!report.policy?.mutatingActionsStayBlockedUntilFullyGoverned) issue("error", "Dashboard live source gap ledger must require blocked mutating actions to stay disabled until governed.");
  if (!report.policy?.p0AndP1GapsMustRemainVisible) issue("error", "Dashboard live source gap ledger must keep P0/P1 gaps visible.");
  if ((report.routeGaps ?? []).length !== routeCount) issue("error", "Dashboard live source gap route count must match generated route evidence.", `${report.routeGaps?.length ?? 0}/${routeCount}`);
  if ((report.totals?.routeCount ?? 0) !== routeCount) issue("error", "Dashboard live source gap totals routeCount must match generated route evidence.", `${report.totals?.routeCount ?? 0}/${routeCount}`);
  if ((report.totals?.sourceGapCount ?? 0) < 1) issue("error", "Dashboard live source gap ledger must track stale/missing source gaps.");
  if ((report.totals?.blockedMutatingActionCount ?? 0) < 1) issue("error", "Dashboard live source gap ledger must track blocked mutating actions.");
  if ((report.totals?.p0SourceGapCount ?? 0) < 1) issue("error", "Dashboard live source gap ledger must expose P0 source gaps.");
  if ((report.totals?.p1SourceGapCount ?? 0) < 1) issue("error", "Dashboard live source gap ledger must expose P1 source gaps.");
  if (!report.rollups?.priority || !report.rollups?.family || !report.rollups?.sourceKind) issue("error", "Dashboard live source gap ledger must include priority, family, and sourceKind rollups.");

  for (const route of report.routeGaps ?? []) {
    if (!route.route || !route.title || !route.priority || !route.family) issue("error", "Route gap entry is missing identity fields.", route.exportName);
    if (!Array.isArray(route.sourceGaps)) issue("error", "Route gap entry must include sourceGaps.", route.route);
    if (!Array.isArray(route.blockedMutatingActions)) issue("error", "Route gap entry must include blockedMutatingActions.", route.route);
    if (!Array.isArray(route.nextActions) || route.nextActions.length < 1) issue("error", "Route gap entry must include nextActions.", route.route);
    for (const gap of route.sourceGaps ?? []) {
      if (!gap.kind || !gap.label || !gap.source) issue("error", "Source gap is missing identity fields.", route.route);
      if (!["missing", "stale", "tracked", "declared"].includes(gap.status) && !["stale", "missing"].includes(gap.freshness)) issue("error", "Source gap must represent stale or missing evidence.", `${route.route}: ${gap.label}`);
      if (!gap.remediation || !gap.targetState) issue("error", "Source gap must include remediation and targetState.", `${route.route}: ${gap.label}`);
    }
    for (const action of route.blockedMutatingActions ?? []) {
      if (!action.action || !action.permission || !action.auditEvent) issue("error", "Blocked mutating action is missing command metadata.", route.route);
      if (!action.disabledReason || !action.remediation) issue("error", "Blocked mutating action must include disabledReason and remediation.", `${route.route}: ${action.action}`);
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard live source gap ledger validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
