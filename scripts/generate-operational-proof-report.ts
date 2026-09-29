#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPERATIONAL_PAGE_CONTRACTS,
  auditOperationalPages,
  type OperationalGroup,
} from "../web/src/lib/operational-page-contracts.ts";
import { auditSafeActions } from "../web/src/lib/operational-safe-actions.ts";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outJson = path.join(root, "docs/design/operational-proof-report.json");
const outMd = path.join(root, "docs/design/operational-proof-report.md");
const routeValidationJson = path.join(root, "docs/design/operational-route-validation-report.json");
const sourceValidationJson = path.join(root, "docs/design/operational-live-source-validation-report.json");

function readRouteValidationSummary() {
  if (!fs.existsSync(routeValidationJson)) {
    return {
      status: "missing",
      routes: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      generatedAt: "",
    };
  }
  const report = JSON.parse(fs.readFileSync(routeValidationJson, "utf8")) as {
    generatedAt?: string;
    summary?: {
      routes?: number;
      passed?: number;
      failed?: number;
      blocked?: number;
    };
  };
  const summary = report.summary ?? {};
  return {
    status: (summary.failed ?? 0) || (summary.blocked ?? 0) ? "attention" : "ready",
    routes: summary.routes ?? 0,
    passed: summary.passed ?? 0,
    failed: summary.failed ?? 0,
    blocked: summary.blocked ?? 0,
    generatedAt: report.generatedAt ?? "",
  };
}

function readLiveSourceValidationSummary() {
  if (!fs.existsSync(sourceValidationJson)) {
    return {
      status: "missing",
      sources: 0,
      reachable: 0,
      failed: 0,
      blocked: 0,
      impactedRoutes: 0,
      generatedAt: "",
    };
  }
  const report = JSON.parse(fs.readFileSync(sourceValidationJson, "utf8")) as {
    generatedAt?: string;
    summary?: {
      status?: string;
      sources?: number;
      reachable?: number;
      authRequired?: number;
      dependencyUnavailable?: number;
      failed?: number;
      blocked?: number;
      impactedRoutes?: number;
      authMode?: string;
      sessionTokenDiscovered?: boolean;
    };
  };
  const summary = report.summary ?? {};
  return {
    status: summary.status ?? ((summary.failed ?? 0) || (summary.blocked ?? 0) ? "attention" : "ready"),
    sources: summary.sources ?? 0,
    reachable: summary.reachable ?? 0,
    authRequired: summary.authRequired ?? 0,
    dependencyUnavailable: summary.dependencyUnavailable ?? 0,
    failed: summary.failed ?? 0,
    blocked: summary.blocked ?? 0,
    impactedRoutes: summary.impactedRoutes ?? 0,
    authMode: summary.authMode ?? "unknown",
    sessionTokenDiscovered: Boolean(summary.sessionTokenDiscovered),
    generatedAt: report.generatedAt ?? "",
  };
}

function groupCounts() {
  const groups: OperationalGroup[] = ["operate", "trading", "system"];
  return Object.fromEntries(groups.map((group) => {
    const audits = auditOperationalPages(group);
    return [group, {
      routes: audits.length,
      ready: audits.filter((item) => item.status === "ready").length,
      partial: audits.filter((item) => item.status === "partial").length,
      blocked: audits.filter((item) => item.status === "blocked").length,
      averageScore: Math.round(audits.reduce((sum, item) => sum + item.score, 0) / Math.max(1, audits.length)),
    }];
  }));
}

function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

const routeAudits = auditOperationalPages();
const safeActionAudit = auditSafeActions();
const staticRoutes = OPERATIONAL_PAGE_CONTRACTS.filter((contract) => contract.maturity === "static");
const liveSourceGaps = OPERATIONAL_PAGE_CONTRACTS.filter((contract) => contract.liveSources.length === 0);
const evidenceGaps = OPERATIONAL_PAGE_CONTRACTS.filter((contract) => contract.evidence.length === 0);
const chartedOrBetter = OPERATIONAL_PAGE_CONTRACTS.filter((contract) => ["charted", "controlled", "intelligent"].includes(contract.maturity));
const routeValidation = readRouteValidationSummary();
const liveSourceValidation = readLiveSourceValidationSummary();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  summary: {
    routes: OPERATIONAL_PAGE_CONTRACTS.length,
    readyRoutes: routeAudits.filter((item) => item.status === "ready").length,
    partialRoutes: routeAudits.filter((item) => item.status === "partial").length,
    blockedRoutes: routeAudits.filter((item) => item.status === "blocked").length,
    chartedOrBetter: chartedOrBetter.length,
    staticRoutes: staticRoutes.length,
    liveSourceGaps: liveSourceGaps.length,
    evidenceGaps: evidenceGaps.length,
    safeActions: safeActionAudit.totals.actions,
    safeActionHardeningGaps: safeActionAudit.totals.needsHardening,
    routeValidationStatus: routeValidation.status,
    routeValidationPassed: routeValidation.passed,
    routeValidationFailed: routeValidation.failed,
    routeValidationBlocked: routeValidation.blocked,
    liveSourceValidationStatus: liveSourceValidation.status,
    liveSourcesReachable: liveSourceValidation.reachable,
    liveSourcesAuthRequired: liveSourceValidation.authRequired,
    liveSourcesDependencyUnavailable: liveSourceValidation.dependencyUnavailable,
    liveSourcesFailed: liveSourceValidation.failed,
    liveSourcesBlocked: liveSourceValidation.blocked,
    liveSourceImpactedRoutes: liveSourceValidation.impactedRoutes,
  },
  groups: groupCounts(),
  routes: routeAudits,
  routeValidation,
  liveSourceValidation,
  staticRoutes: staticRoutes.map((route) => ({ route: route.route, label: route.label, nextAction: route.gaps[0] ?? "Add live data contract." })),
  liveSourceGaps: liveSourceGaps.map((route) => ({ route: route.route, label: route.label, maturity: route.maturity })),
  evidenceGaps: evidenceGaps.map((route) => ({ route: route.route, label: route.label, maturity: route.maturity })),
  safeActions: safeActionAudit,
  nextActions: [
    ...(staticRoutes.length ? [`Convert ${staticRoutes.length} remaining static route(s) into live or charted surfaces.`] : []),
    ...(liveSourceGaps.length ? [`Add live-source contracts for ${liveSourceGaps.length} route(s).`] : []),
    ...(evidenceGaps.length ? [`Add evidence contracts for ${evidenceGaps.length} route(s).`] : []),
    ...(safeActionAudit.totals.needsHardening ? [`Close ${safeActionAudit.totals.needsHardening} safe-action hardening gap(s).`] : []),
    ...(routeValidation.status === "ready" ? [] : ["Run Playwright route validation and clear failed or blocked operational routes."]),
    ...(liveSourceValidation.status === "auth_required" ? ["Rerun live-source validation with a dashboard session cookie or bearer token to prove authenticated sources end to end."] : []),
    ...(liveSourceValidation.status === "dependency_unavailable" ? ["Start or configure Hermes Brain, then rerun live-source validation for Second Brain and Compounding Intelligence sources."] : []),
    ...(liveSourceValidation.status === "ready" || liveSourceValidation.status === "auth_required" || liveSourceValidation.status === "dependency_unavailable" ? [] : ["Run live-source validation against the dashboard API and clear failed or blocked declared sources."]),
    "Persist route validation output as operating-runtime evidence when a writable dashboard backend is available.",
  ],
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

const lowestRoutes = [...routeAudits].slice(0, 10);
const md = `# Operational Proof Report

Generated: ${report.generatedAt}

## Summary

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.summary).map(([key, value]) => [key, value]),
)}

## Groups

${markdownTable(
  ["Group", "Routes", "Ready", "Partial", "Blocked", "Average score"],
  Object.entries(report.groups).map(([group, row]) => [group, row.routes, row.ready, row.partial, row.blocked, row.averageScore]),
)}

## Lowest-Scoring Routes

${markdownTable(
  ["Route", "Group", "Maturity", "Score", "Status", "Next action"],
  lowestRoutes.map((route) => [route.route, route.group, route.maturity, route.score, route.status, route.nextAction]),
)}

## Safe Actions

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.safeActions.totals).map(([key, value]) => [key, value]),
)}

## Route Validation

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.routeValidation).map(([key, value]) => [key, value]),
)}

## Live Source Validation

${markdownTable(
  ["Metric", "Value"],
  Object.entries(report.liveSourceValidation).map(([key, value]) => [key, value]),
)}

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}
`;

fs.writeFileSync(outMd, md);

console.log(`Operational proof report wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
