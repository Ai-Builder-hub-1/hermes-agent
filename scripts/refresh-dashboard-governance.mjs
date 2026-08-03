#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const includeLive = process.argv.includes("--live");
const includeCapture = process.argv.includes("--capture");
const jsonPath = path.join(designDir, "dashboard-governance-refresh-report.json");
const mdPath = path.join(designDir, "dashboard-governance-refresh-report.md");

const commands = [
  ["dashboard-kit:adoption:report", ["npm", ["run", "dashboard-kit:adoption:report"]]],
  ["dashboard:tier-assessment:sync", ["npm", ["run", "dashboard:tier-assessment:sync"]]],
  ["dashboard:readiness-impact:report", ["npm", ["run", "dashboard:readiness-impact:report"]]],
  ["dashboard:deployment-metadata:validate", ["npm", ["run", "dashboard:deployment-metadata:validate"]]],
  ["dashboard:deployment-ledger:report", ["npm", ["run", "dashboard:deployment-ledger:report"]]],
  ["dashboard:kit-distribution:report", ["npm", ["run", "dashboard:kit-distribution:report"]]],
  ["dashboard:runtime-data:report", ["npm", ["run", "dashboard:runtime-data:report"]]],
  ["dashboard:telemetry-contract:report", ["npm", ["run", "dashboard:telemetry-contract:report"]]],
  ["dashboard:production-dns:validate", ["npm", ["run", "dashboard:production-dns:validate"]]],
  ["dashboard:production-proof:registry", ["npm", ["run", "dashboard:production-proof:registry"]]],
  ["dashboard:visual-quality:score", ["npm", ["run", "dashboard:visual-quality:score"]]],
  ["dashboard:bridge:coverage", ["npm", ["run", "dashboard:bridge:coverage"]]],
  ["dashboard:project-profiles:validate", ["npm", ["run", "dashboard:project-profiles:validate"]]],
  ["dashboard:health:validate", ["npm", ["run", "dashboard:health:validate"]]],
  ["dashboard-promotion-readiness", ["node", ["scripts/generate-dashboard-promotion-readiness.mjs"]]],
  ["dashboard-maturity-report", ["node", ["scripts/generate-dashboard-maturity-report.mjs"]]],
  ["dashboard:next-actions:report", ["npm", ["run", "dashboard:next-actions:report"]]],
  ["dashboard:world-class:report", ["npm", ["run", "dashboard:world-class:report"]]]
];

if (includeLive) commands.push(["dashboard:health:validate:live", ["npm", ["run", "dashboard:health:validate:live"]]]);
if (includeCapture) commands.push(["dashboard:production-proof:capture", ["npm", ["run", "dashboard:production-proof:capture"]]]);

function importantLines(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const selected = lines.filter((line) => /passed|failed|error|warning|wrote|ready|review|score|validation/i.test(line));
  return (selected.length ? selected : lines.slice(-4)).slice(-8);
}

const results = [];
for (const [id, [command, args]] of commands) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: 180000
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  results.push({
    id,
    command: [command, ...args].join(" "),
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
    durationMs: Date.now() - startedAt,
    summary: importantLines(output)
  });
}

const failed = results.filter((result) => result.status !== "passed");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: failed.length ? "failed" : "passed",
  includedLiveChecks: includeLive,
  includedScreenshotCapture: includeCapture,
  checkedCount: results.length,
  failedCount: failed.length,
  results
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard Governance Refresh Report

Generated: ${report.generatedAt}

Status: **${report.status}**

${markdownTable(
  ["Check", "Status", "Duration", "Summary"],
  results.map((result) => [
    result.id,
    result.status,
    `${Math.round(result.durationMs / 1000)}s`,
    result.summary.join("; ")
  ])
)}
`);

console.log(`Dashboard governance refresh ${report.status}: ${failed.length} failed.`);
console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
if (failed.length) process.exit(1);
