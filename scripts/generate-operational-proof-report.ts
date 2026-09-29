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
  },
  groups: groupCounts(),
  routes: routeAudits,
  staticRoutes: staticRoutes.map((route) => ({ route: route.route, label: route.label, nextAction: route.gaps[0] ?? "Add live data contract." })),
  liveSourceGaps: liveSourceGaps.map((route) => ({ route: route.route, label: route.label, maturity: route.maturity })),
  evidenceGaps: evidenceGaps.map((route) => ({ route: route.route, label: route.label, maturity: route.maturity })),
  safeActions: safeActionAudit,
  nextActions: [
    ...(staticRoutes.length ? [`Convert ${staticRoutes.length} remaining static route(s) into live or charted surfaces.`] : []),
    ...(liveSourceGaps.length ? [`Add live-source contracts for ${liveSourceGaps.length} route(s).`] : []),
    ...(evidenceGaps.length ? [`Add evidence contracts for ${evidenceGaps.length} route(s).`] : []),
    ...(safeActionAudit.totals.needsHardening ? [`Close ${safeActionAudit.totals.needsHardening} safe-action hardening gap(s).`] : []),
    "Add Playwright route validation for Operate, Trading, and System pages.",
    "Persist route validation output as operating-runtime evidence.",
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

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}
`;

fs.writeFileSync(outMd, md);

console.log(`Operational proof report wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
