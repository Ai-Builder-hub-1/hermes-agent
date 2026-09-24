#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "docs/fleet/dashboard-governed-recovery-audit.json");
const outMd = path.join(root, "docs/fleet/dashboard-governed-recovery-audit.md");

const daily = read("docs/fleet/dashboard-executive-daily-operating-view.json");
const actionUnlock = read("docs/design/dashboard-action-unlock-ledger.json");
const command = read("docs/design/dashboard-command-governance-ledger.json");
const drift = read("docs/fleet/dashboard-maturity-drift-monitor.json");
const visual = read("docs/design/dashboard-production-visual-gate.json");
const predictive = read("docs/fleet/dashboard-predictive-causal-intelligence.json");
const ship = read("docs/fleet/fleet-ship-check.json");

const recoveryClasses = [
  recovery("refresh-evidence", "Refresh stale generated evidence", "auto-safe", "Regenerate maturity, health, monitoring, and visual reports.", true),
  recovery("rerun-live-check", "Rerun live dashboard check", "auto-safe", "Run the live E2E or monitoring check for the affected dashboard.", true),
  recovery("refresh-visual-proof", "Refresh production visual proof", "auto-safe", "Capture/compare visual proof and update the visual gate report.", true),
  recovery("restart-collector", "Restart a stalled collector or worker", "approval-required", "Requires project owner approval and linked evidence of stalled collection.", true),
  recovery("run-pruning", "Run pruning or compaction", "maintenance-window", "Requires quiet window, backup proof, dry-run estimate, and rollback plan.", true),
  recovery("enable-mutation", "Enable a controlled mutating action", "approval-required", "Requires command governance approval and action unlock evidence.", true),
  recovery("deploy-dashboard", "Deploy dashboard change", "approval-required", "Requires ship check, maturity report validation, web build, and production verification.", true),
  recovery("delete-data", "Delete or destructively prune data", "blocked", "Blocked until retention policy, backup proof, owner approval, and restore test are present.", false),
];

const auditChecks = [
  check("command-safe", "Command governance is safe.", command.safePosture === true),
  check("no-unsafe-mutations", "No unsafe mutations are enabled.", (actionUnlock.totals?.unsafeMutationCount ?? 1) === 0),
  check("no-unknown-actions", "No unknown actions remain.", (actionUnlock.totals?.unknownActionCount ?? 1) === 0),
  check("drift-stable", "Maturity drift is stable.", drift.status === "stable"),
  check("visual-gate", "Visual gate is passing.", visual.status === "visual-gate-passed"),
  check("predictive-low-risk", "Predictive causal intelligence is low-risk.", predictive.status === "low-risk"),
  check("ship-ready", "Fleet is safe to commit and deploy.", ship.safeToCommit === true && ship.safeToDeploy === true),
  check("daily-clear", "Daily operating view is clear.", daily.status === "clear"),
];

const failed = auditChecks.filter((item) => item.status !== "passed");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "scripts/generate-dashboard-governed-recovery-audit.mjs",
  status: failed.length ? "recovery-attention" : "recovery-ready",
  summary: {
    auditCheckCount: auditChecks.length,
    failedAuditChecks: failed.length,
    recoveryClassCount: recoveryClasses.length,
    autoSafeCount: recoveryClasses.filter((item) => item.mode === "auto-safe").length,
    approvalRequiredCount: recoveryClasses.filter((item) => item.mode === "approval-required").length,
    maintenanceWindowCount: recoveryClasses.filter((item) => item.mode === "maintenance-window").length,
    blockedCount: recoveryClasses.filter((item) => item.mode === "blocked").length,
  },
  auditChecks,
  recoveryClasses,
  escalationPolicy: {
    discordFirst: true,
    requireEvidenceLink: true,
    requireOwnerForApprovalActions: true,
    requireMaintenanceWindowForPruning: true,
    requireRollbackForDeployments: true,
  },
  nextActions: failed.length
    ? failed.map((item) => `Resolve recovery audit check ${item.id}: ${item.description}`)
    : ["Auto-safe recovery classes can be implemented next; approval and maintenance-window classes remain gated."],
};

fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard governed recovery audit: ${report.status}, ${auditChecks.length - failed.length}/${auditChecks.length} checks passed.`);
if (failed.length) process.exitCode = 1;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function recovery(id, label, mode, guardrail, enabled) {
  return { id, label, mode, guardrail, enabled };
}

function check(id, description, passed) {
  return { id, description, status: passed ? "passed" : "failed" };
}

function renderMarkdown(report) {
  return [
    "# Dashboard Governed Recovery Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Audit Checks",
    "",
    ...report.auditChecks.map((item) => `- ${item.status === "passed" ? "PASS" : "FAIL"} ${item.id}: ${item.description}`),
    "",
    "## Recovery Classes",
    "",
    ...report.recoveryClasses.map((item) => `- ${item.mode.toUpperCase()} ${item.label}: ${item.guardrail}`),
    "",
  ].join("\n");
}
