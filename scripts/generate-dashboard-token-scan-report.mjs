#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const jsonPath = path.join(root, "docs/design/dashboard-token-scan-report.json");
const mdPath = path.join(root, "docs/design/dashboard-token-scan-report.md");
const result = spawnSync("node", ["scripts/scan-dashboard-tokens.mjs", "--all"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024
});
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const issueLines = output.split(/\r?\n/).filter((line) => line.startsWith("- WARNING") || line.startsWith("- ERROR"));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  command: "node scripts/scan-dashboard-tokens.mjs --all",
  exitCode: result.status ?? 1,
  issueCount: issueLines.length,
  advisory: true,
  summary: output.split(/\r?\n/).find((line) => line.startsWith("Dashboard token scan:")) ?? "",
  issues: issueLines
};
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Token Scan Report",
  "",
  `Generated: ${report.generatedAt}`,
  report.summary,
  "Advisory: true",
  "",
  ...issueLines.slice(0, 100)
].join("\n")}\n`);
console.log(`Dashboard token scan report generated: ${report.issueCount} advisory issue(s).`);
