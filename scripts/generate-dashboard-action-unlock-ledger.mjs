#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const commandPath = path.join(root, "docs/design/dashboard-command-governance-ledger.json");
const liveGapPath = path.join(root, "docs/design/dashboard-live-source-gap-ledger.json");
const jsonPath = path.join(root, "docs/design/dashboard-action-unlock-ledger.json");
const mdPath = path.join(root, "docs/design/dashboard-action-unlock-ledger.md");

const command = JSON.parse(fs.readFileSync(commandPath, "utf8"));
const liveGaps = JSON.parse(fs.readFileSync(liveGapPath, "utf8"));
const routeGapByRoute = new Map((liveGaps.routeGaps ?? []).map((route) => [route.route, route]));

const classificationPolicy = {
  "refresh evidence": {
    classification: "enable-readonly-preview",
    risk: "low",
    requiredState: "enabled",
    rationale: "Read-only evidence refresh does not mutate durable project state.",
  },
  "recheck health": {
    classification: "enable-safe-action",
    risk: "low",
    requiredState: "enabled",
    rationale: "Health checks are non-destructive and produce audit evidence.",
  },
  "view recent runs": {
    classification: "enable-readonly-preview",
    risk: "low",
    requiredState: "enabled",
    rationale: "Run history inspection is read-only.",
  },
  "view failed jobs": {
    classification: "enable-readonly-preview",
    risk: "low",
    requiredState: "enabled",
    rationale: "Failed job inspection is read-only.",
  },
  "inspect sync lag": {
    classification: "enable-readonly-preview",
    risk: "low",
    requiredState: "enabled",
    rationale: "Sync lag inspection is read-only.",
  },
  "rerun collector": {
    classification: "enable-approval-required",
    risk: "medium",
    requiredState: "blocked-until-approved",
    rationale: "Collector reruns can duplicate work or increase API/provider load, so they need confirmation, audit, cooldown, and owner approval.",
  },
  "restart worker": {
    classification: "enable-maintenance-window-only",
    risk: "high",
    requiredState: "blocked-until-maintenance",
    rationale: "Worker restarts can interrupt active jobs and should require maintenance-window or incident context.",
  },
  "trigger sync": {
    classification: "enable-approval-required",
    risk: "medium",
    requiredState: "blocked-until-approved",
    rationale: "Manual sync can change durable read models and should require approval, cooldown, and audit proof.",
  },
  "pause pruning": {
    classification: "enable-maintenance-window-only",
    risk: "high",
    requiredState: "blocked-until-maintenance",
    rationale: "Pruning controls affect retention behavior and should only run with maintenance context and rollback proof.",
  },
  "resume pruning": {
    classification: "enable-maintenance-window-only",
    risk: "high",
    requiredState: "blocked-until-maintenance",
    rationale: "Resuming pruning changes retention behavior and requires maintenance context and recovery proof.",
  },
  "open incident": {
    classification: "enable-approval-required",
    risk: "medium",
    requiredState: "blocked-until-approved",
    rationale: "Incident creation is safe when audited, but should include owner, severity, dedupe, and notification proof.",
  },
};

const routeEntries = (command.routes ?? []).map((route) => {
  const routeGap = routeGapByRoute.get(route.route);
  const actions = (route.actions ?? []).map((action) => {
    const policy = classificationPolicy[action.action] ?? {
      classification: "keep-blocked",
      risk: "unknown",
      requiredState: "blocked-until-classified",
      rationale: "Action requires manual classification before it can be considered operational.",
    };
    const gapAction = routeGap?.blockedMutatingActions?.find((item) => item.action === action.action);
    return {
      action: action.action,
      mode: action.mode,
      permission: action.permission,
      eligibility: action.eligibility,
      auditEvent: action.auditEvent,
      classification: policy.classification,
      risk: policy.risk,
      requiredState: policy.requiredState,
      rationale: policy.rationale,
      cooldownSeconds: action.cooldownSeconds ?? gapAction?.cooldownSeconds ?? null,
      duplicateWindowSeconds: action.duplicateWindowSeconds ?? gapAction?.duplicateWindowSeconds ?? null,
      disabledReason: action.disabledReason ?? gapAction?.disabledReason ?? null,
      remediation: action.remediation ?? gapAction?.remediation ?? null,
      requiredControls: requiredControlsFor(policy.classification),
      testProof: testProofFor(policy.classification),
      safeForFullyOperational: isSafeForFullyOperational(policy.classification, action),
    };
  });
  return {
    route: route.route,
    title: route.title,
    family: route.family,
    priority: route.priority,
    projectProfile: route.projectProfile,
    posture: route.posture,
    actionCount: actions.length,
    classifiedActionCount: actions.filter((action) => action.classification !== "keep-blocked" || action.risk !== "unknown").length,
    unknownActionCount: actions.filter((action) => action.requiredState === "blocked-until-classified").length,
    executableReadOnlyCount: actions.filter((action) => action.mode === "read-only").length,
    controlledMutationCount: actions.filter((action) => action.mode !== "read-only" && action.safeForFullyOperational).length,
    unsafeMutationCount: actions.filter((action) => action.mode !== "read-only" && !action.safeForFullyOperational).length,
    actions,
  };
});

const uniqueActionEntries = (command.uniqueActions ?? []).map((action) => {
  const policy = classificationPolicy[action.action] ?? {
    classification: "keep-blocked",
    risk: "unknown",
    requiredState: "blocked-until-classified",
    rationale: "Action requires manual classification before it can be considered operational.",
  };
  return {
    ...action,
    ...policy,
    requiredControls: requiredControlsFor(policy.classification),
    testProof: testProofFor(policy.classification),
    safeForFullyOperational: action.mode === "read-only" || ["enable-approval-required", "enable-maintenance-window-only"].includes(policy.classification),
  };
});

const totals = {
  routeCount: routeEntries.length,
  uniqueActionCount: uniqueActionEntries.length,
  actionInstanceCount: routeEntries.reduce((sum, route) => sum + route.actionCount, 0),
  readOnlyActionCount: routeEntries.reduce((sum, route) => sum + route.actions.filter((action) => action.mode === "read-only").length, 0),
  controlledMutationCount: routeEntries.reduce((sum, route) => sum + route.controlledMutationCount, 0),
  unknownActionCount: routeEntries.reduce((sum, route) => sum + route.unknownActionCount, 0),
  unsafeMutationCount: routeEntries.reduce((sum, route) => sum + route.unsafeMutationCount, 0),
  approvalRequiredCount: routeEntries.reduce((sum, route) => sum + route.actions.filter((action) => action.classification === "enable-approval-required").length, 0),
  maintenanceWindowOnlyCount: routeEntries.reduce((sum, route) => sum + route.actions.filter((action) => action.classification === "enable-maintenance-window-only").length, 0),
  readOnlyPreviewCount: routeEntries.reduce((sum, route) => sum + route.actions.filter((action) => action.classification === "enable-readonly-preview").length, 0),
  safeActionCount: routeEntries.reduce((sum, route) => sum + route.actions.filter((action) => action.classification === "enable-safe-action").length, 0),
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "docs/design/dashboard-command-governance-ledger.json",
  purpose: "Classifies every dashboard action so the fully-operational gate can distinguish enabled read-only actions, safe actions, approval-required mutations, maintenance-window mutations, and unknown/unsafe actions.",
  policy: {
    unknownActionsAllowed: false,
    unsafeMutationsAllowed: false,
    blockedMutationsAllowedWhenClassified: true,
    destructiveActionsRequireMaintenanceWindow: true,
    materialMutationsRequireApproval: true,
  },
  safeForFullyOperational: totals.unknownActionCount === 0 && totals.unsafeMutationCount === 0,
  totals,
  uniqueActions: uniqueActionEntries,
  routes: routeEntries,
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function requiredControlsFor(classification) {
  const shared = ["permission check", "audit event", "result state"];
  if (classification === "enable-readonly-preview") return ["dashboard:view", ...shared, "no durable mutation"];
  if (classification === "enable-safe-action") return ["dashboard:view", ...shared, "rate limit", "idempotent endpoint"];
  if (classification === "enable-approval-required") return ["dashboard:operate", ...shared, "confirmation", "approval", "cooldown", "dedupe", "rollback or remediation note"];
  if (classification === "enable-maintenance-window-only") return ["dashboard:operate", ...shared, "confirmation", "maintenance window", "cooldown", "rollback proof", "incident or owner signoff"];
  return ["manual classification"];
}

function testProofFor(classification) {
  if (classification === "enable-readonly-preview") return ["read-only route smoke", "permission denial test", "audit event assertion"];
  if (classification === "enable-safe-action") return ["idempotency test", "rate-limit test", "audit event assertion"];
  if (classification === "enable-approval-required") return ["approval gate test", "cooldown test", "rollback/remediation proof"];
  if (classification === "enable-maintenance-window-only") return ["maintenance-window denial test", "owner approval test", "rollback proof"];
  return ["classification review"];
}

function isSafeForFullyOperational(classification, action) {
  if (action.mode === "read-only") return ["enable-readonly-preview", "enable-safe-action"].includes(classification);
  return ["enable-approval-required", "enable-maintenance-window-only"].includes(classification);
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Action Unlock Ledger",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Routes: ${report.totals.routeCount}`,
    `- Unique actions: ${report.totals.uniqueActionCount}`,
    `- Action instances: ${report.totals.actionInstanceCount}`,
    `- Read-only actions: ${report.totals.readOnlyActionCount}`,
    `- Controlled mutations: ${report.totals.controlledMutationCount}`,
    `- Approval-required mutations: ${report.totals.approvalRequiredCount}`,
    `- Maintenance-window mutations: ${report.totals.maintenanceWindowOnlyCount}`,
    `- Unknown actions: ${report.totals.unknownActionCount}`,
    `- Unsafe mutations: ${report.totals.unsafeMutationCount}`,
    `- Safe for fully operational: ${report.safeForFullyOperational ? "yes" : "no"}`,
    "",
    "## Unique Actions",
    "",
    ...report.uniqueActions.map((action) => `- ${action.action}: ${action.classification}, ${action.risk}, ${action.requiredState}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}
