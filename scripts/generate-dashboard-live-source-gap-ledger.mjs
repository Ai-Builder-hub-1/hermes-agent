#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const jsonPath = path.join(root, "docs/design/dashboard-live-source-gap-ledger.json");
const mdPath = path.join(root, "docs/design/dashboard-live-source-gap-ledger.md");

const evidence = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const generatedAt = new Date().toISOString();

const routeGaps = evidence.routeBindings.map((route) => {
  const sourceGaps = route.sourceBindings
    .filter((source) => source.status === "missing" || source.freshness === "stale")
    .map((source) => ({
      kind: source.kind,
      label: source.label,
      source: source.source,
      status: source.status,
      freshness: source.freshness,
      severity: severityForSource(route.priority, source),
      remediation: remediationForSource(source),
      owner: ownerFor(route.family, route.priority),
      targetState: "fresh-live-probe",
    }));
  const blockedMutatingActions = route.commandReadiness.actionRegistry
    .filter((action) => action.mode === "gated-mutation" && action.eligibility === "blocked")
    .map((action) => ({
      action: action.action,
      permission: action.permission,
      auditEvent: action.auditEvent,
      cooldownSeconds: action.cooldownSeconds,
      duplicateWindowSeconds: action.duplicateWindowSeconds,
      disabledReason: action.disabledReason,
      remediation: "Add live command endpoint, permission check, confirmation step, audit write, cooldown enforcement, and rollback/recovery proof before enabling.",
      targetState: "permissioned-audited-command",
    }));
  const nextActions = [
    ...sourceGaps.slice(0, 3).map((gap) => `Replace ${gap.label} with ${gap.targetState} for ${route.route}.`),
    blockedMutatingActions.length ? `Keep ${blockedMutatingActions.length} mutating actions disabled until command endpoints and recovery proof exist.` : null,
  ].filter(Boolean);
  return {
    exportName: route.exportName,
    route: route.route,
    title: route.title,
    family: route.family,
    priority: route.priority,
    projectProfile: route.projectProfile,
    sourceGapCount: sourceGaps.length,
    blockedMutatingActionCount: blockedMutatingActions.length,
    sourceGaps,
    blockedMutatingActions,
    nextActions,
  };
});

const sourceGapCount = routeGaps.reduce((sum, route) => sum + route.sourceGapCount, 0);
const blockedMutatingActionCount = routeGaps.reduce((sum, route) => sum + route.blockedMutatingActionCount, 0);
const routeWithGapCount = routeGaps.filter((route) => route.sourceGapCount || route.blockedMutatingActionCount).length;

const report = {
  schemaVersion: 1,
  generatedAt,
  source: "docs/design/generated-dashboard-route-evidence-bindings.json",
  purpose: "Tracks remaining live-source replacement and command enablement work after generated dashboard route maturity reached production-ready governance.",
  policy: {
    generatedRouteMaturityCanBe100WithVisibleCaveats: true,
    staleOrMissingSourcesRequireLiveProbeReplacement: true,
    mutatingActionsStayBlockedUntilFullyGoverned: true,
    p0AndP1GapsMustRemainVisible: true,
  },
  totals: {
    routeCount: routeGaps.length,
    routeWithGapCount,
    sourceGapCount,
    blockedMutatingActionCount,
    p0SourceGapCount: sourceGapCountForPriority(routeGaps, "P0"),
    p1SourceGapCount: sourceGapCountForPriority(routeGaps, "P1"),
    p0BlockedMutatingActionCount: blockedActionCountForPriority(routeGaps, "P0"),
    p1BlockedMutatingActionCount: blockedActionCountForPriority(routeGaps, "P1"),
  },
  rollups: {
    priority: rollupBy(routeGaps, "priority"),
    family: rollupBy(routeGaps, "family"),
    sourceKind: rollupSources(routeGaps),
  },
  routeGaps,
};

fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function severityForSource(priority, source) {
  if (priority === "P0" && source.status === "missing") return "critical";
  if (priority === "P0" || priority === "P1") return "high";
  if (source.status === "missing") return "medium";
  return "low";
}

function remediationForSource(source) {
  if (source.status === "missing") return `Create or connect a live ${source.label} entry for ${source.source}.`;
  if (source.freshness === "stale") return `Refresh ${source.label} from a live probe and persist checkedAt/freshness metadata.`;
  return `Keep ${source.label} monitored by the live probe cadence.`;
}

function ownerFor(family, priority) {
  if (priority === "P0") return `${family} operations owner`;
  if (priority === "P1") return `${family} platform owner`;
  return `${family} dashboard owner`;
}

function sourceGapCountForPriority(routes, priority) {
  return routes.filter((route) => route.priority === priority).reduce((sum, route) => sum + route.sourceGapCount, 0);
}

function blockedActionCountForPriority(routes, priority) {
  return routes.filter((route) => route.priority === priority).reduce((sum, route) => sum + route.blockedMutatingActionCount, 0);
}

function rollupBy(routes, field) {
  const rollup = {};
  for (const route of routes) {
    const key = route[field];
    rollup[key] ??= { routeCount: 0, routeWithGapCount: 0, sourceGapCount: 0, blockedMutatingActionCount: 0 };
    rollup[key].routeCount += 1;
    if (route.sourceGapCount || route.blockedMutatingActionCount) rollup[key].routeWithGapCount += 1;
    rollup[key].sourceGapCount += route.sourceGapCount;
    rollup[key].blockedMutatingActionCount += route.blockedMutatingActionCount;
  }
  return rollup;
}

function rollupSources(routes) {
  const rollup = {};
  for (const route of routes) {
    for (const gap of route.sourceGaps) {
      rollup[gap.kind] ??= { gapCount: 0, missingCount: 0, staleCount: 0, p0Count: 0, p1Count: 0 };
      rollup[gap.kind].gapCount += 1;
      if (gap.status === "missing") rollup[gap.kind].missingCount += 1;
      if (gap.freshness === "stale") rollup[gap.kind].staleCount += 1;
      if (route.priority === "P0") rollup[gap.kind].p0Count += 1;
      if (route.priority === "P1") rollup[gap.kind].p1Count += 1;
    }
  }
  return rollup;
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Live Source Gap Ledger",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Routes: ${report.totals.routeCount}`,
    `- Routes with gaps: ${report.totals.routeWithGapCount}`,
    `- Stale or missing source gaps: ${report.totals.sourceGapCount}`,
    `- Blocked mutating actions: ${report.totals.blockedMutatingActionCount}`,
    `- P0 source gaps: ${report.totals.p0SourceGapCount}`,
    `- P1 source gaps: ${report.totals.p1SourceGapCount}`,
    `- P0 blocked mutating actions: ${report.totals.p0BlockedMutatingActionCount}`,
    `- P1 blocked mutating actions: ${report.totals.p1BlockedMutatingActionCount}`,
    "",
    "## Route Gaps",
    "",
    "| Priority | Route | Source gaps | Blocked actions | Next action |",
    "| --- | --- | ---: | ---: | --- |",
    ...report.routeGaps.map((route) => `| ${route.priority} | ${route.route} | ${route.sourceGapCount} | ${route.blockedMutatingActionCount} | ${route.nextActions[0] ?? "No action"} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}
