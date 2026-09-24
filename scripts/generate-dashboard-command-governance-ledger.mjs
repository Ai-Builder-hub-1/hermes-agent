#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const jsonPath = path.join(root, "docs/design/dashboard-command-governance-ledger.json");
const mdPath = path.join(root, "docs/design/dashboard-command-governance-ledger.md");

const evidence = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const generatedAt = new Date().toISOString();
const routes = evidence.routeBindings ?? [];

const routeEntries = routes.map((route) => {
  const actions = route.commandReadiness?.actionRegistry ?? [];
  const readOnlyActions = actions.filter((action) => action.mode === "read-only");
  const mutatingActions = actions.filter((action) => action.mode === "gated-mutation");
  const unsafeMutations = mutatingActions.filter((action) => action.eligibility !== "blocked" || !action.disabledReason);
  const missingControlActions = actions.filter((action) => !action.permission || !action.auditEvent || !Number.isFinite(action.cooldownSeconds) || !Number.isFinite(action.duplicateWindowSeconds));
  return {
    route: route.route,
    title: route.title,
    family: route.family,
    priority: route.priority,
    projectProfile: route.projectProfile,
    actionCount: actions.length,
    readOnlyEligibleCount: readOnlyActions.filter((action) => action.eligibility === "eligible").length,
    mutatingBlockedCount: mutatingActions.filter((action) => action.eligibility === "blocked").length,
    unsafeMutationCount: unsafeMutations.length,
    missingControlCount: missingControlActions.length,
    posture: unsafeMutations.length || missingControlActions.length ? "needs-control-repair" : "locked-safe",
    actions: actions.map((action) => ({
      action: action.action,
      mode: action.mode,
      permission: action.permission,
      eligibility: action.eligibility,
      auditEvent: action.auditEvent,
      cooldownSeconds: action.cooldownSeconds,
      duplicateWindowSeconds: action.duplicateWindowSeconds,
      disabledReason: action.disabledReason ?? null,
      failureRoute: action.failureRoute ?? null,
    }))
  };
});

const uniqueActions = new Map();
for (const route of routeEntries) {
  for (const action of route.actions) {
    const key = action.action;
    const entry = uniqueActions.get(key) ?? {
      action: action.action,
      mode: action.mode,
      permission: action.permission,
      eligibility: action.eligibility,
      auditEvent: action.auditEvent,
      routeCount: 0,
      unsafeRouteCount: 0,
    };
    entry.routeCount += 1;
    if (action.mode === "gated-mutation" && action.eligibility !== "blocked") entry.unsafeRouteCount += 1;
    uniqueActions.set(key, entry);
  }
}

const totals = {
  routeCount: routeEntries.length,
  actionInstanceCount: routeEntries.reduce((sum, route) => sum + route.actionCount, 0),
  readOnlyEligibleCount: routeEntries.reduce((sum, route) => sum + route.readOnlyEligibleCount, 0),
  mutatingBlockedCount: routeEntries.reduce((sum, route) => sum + route.mutatingBlockedCount, 0),
  unsafeMutationCount: routeEntries.reduce((sum, route) => sum + route.unsafeMutationCount, 0),
  missingControlCount: routeEntries.reduce((sum, route) => sum + route.missingControlCount, 0),
  lockedSafeRouteCount: routeEntries.filter((route) => route.posture === "locked-safe").length,
  uniqueActionCount: uniqueActions.size,
};

const report = {
  schemaVersion: 1,
  generatedAt,
  source: "docs/design/generated-dashboard-route-evidence-bindings.json",
  purpose: "Proves dashboard command controls keep read-only actions usable while every mutating action remains blocked until endpoint, permission, confirmation, audit, cooldown, rollback, and recovery evidence exist.",
  policy: {
    readOnlyActionsMayExecuteWithViewPermission: true,
    mutatingActionsMustStayBlockedWithoutFullGovernance: true,
    requiredMutationControls: ["live endpoint", "permission gate", "confirmation step", "audit event", "cooldown", "duplicate suppression", "rollback or recovery proof"],
    unsafeMutationEnabledFailsShipCheck: true,
    disabledMutationIsSafePostureNotSourceGap: true,
  },
  totals,
  safePosture: totals.unsafeMutationCount === 0 && totals.missingControlCount === 0 && totals.lockedSafeRouteCount === totals.routeCount,
  uniqueActions: [...uniqueActions.values()],
  routes: routeEntries,
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);

function renderMarkdown(report) {
  const rows = report.routes.map((route) => `| ${route.priority} | ${route.route} | ${route.posture} | ${route.readOnlyEligibleCount} | ${route.mutatingBlockedCount} | ${route.unsafeMutationCount} |`);
  return `# Dashboard Command Governance Ledger\n\nGenerated: ${report.generatedAt}\n\n## Decision\n\n- Safe command posture: ${report.safePosture ? "yes" : "no"}\n- Unsafe enabled mutations: ${report.totals.unsafeMutationCount}\n- Missing command controls: ${report.totals.missingControlCount}\n- Read-only eligible actions: ${report.totals.readOnlyEligibleCount}\n- Blocked mutating actions: ${report.totals.mutatingBlockedCount}\n\n## Policy\n\nMutating actions remain disabled until the live endpoint, permission gate, confirmation step, audit event, cooldown, duplicate suppression, and rollback/recovery proof all exist. This is treated as the safe production posture.\n\n## Routes\n\n| Priority | Route | Posture | Read-only eligible | Mutating blocked | Unsafe mutations |\n| --- | --- | --- | ---: | ---: | ---: |\n${rows.join("\n")}\n`;
}
