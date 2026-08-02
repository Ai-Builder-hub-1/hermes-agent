#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const suppressionsPath = path.join(root, "docs/design/dashboard-token-suppressions.json");
const reportPath = path.join(root, "docs/design/dashboard-token-scan-report.json");
const jsonPath = path.join(root, "docs/design/dashboard-token-debt-backlog.json");
const mdPath = path.join(root, "docs/design/dashboard-token-debt-backlog.md");
const suppressions = fs.existsSync(suppressionsPath) ? JSON.parse(fs.readFileSync(suppressionsPath, "utf8")).suppressions ?? [] : [];
const scanReport = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const items = suppressions.map((item) => ({
  file: item.file,
  rule: item.rule,
  count: item.maxAllowed,
  owner: item.owner,
  priority: item.file.includes("packages/hermes-dashboard-kit") ? "P0" : "P1",
  action: item.rule === "hard-coded-color"
    ? "Replace raw color values with named Hermes/Kaoshi tokens."
    : "Replace raw visual styling with theme tokens or package primitives."
}));

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  advisoryIssueCount: scanReport.issueCount,
  itemCount: items.length,
  items
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Token Debt Backlog",
  "",
  `Generated: ${report.generatedAt}`,
  `Advisory issue groups: ${items.length}`,
  "",
  ...items.map((item) => `- ${item.priority} ${item.file} ${item.rule}: ${item.count} finding(s). ${item.action}`)
].join("\n")}\n`);
console.log(`Dashboard token debt backlog generated: ${items.length} item(s).`);
