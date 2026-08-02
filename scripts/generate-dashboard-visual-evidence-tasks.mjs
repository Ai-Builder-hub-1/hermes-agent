#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coveragePath = path.join(root, "docs/design/dashboard-visual-coverage-report.json");
const jsonPath = path.join(root, "docs/design/dashboard-visual-evidence-tasks.json");
const mdPath = path.join(root, "docs/design/dashboard-visual-evidence-tasks.md");
const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
const warningAge = 21;
const blockingAge = coverage.freshnessSlaDays ?? 30;

const items = (coverage.items ?? [])
  .filter((item) => item.status !== "covered" || (item.screenshotAgeDays ?? 0) >= warningAge)
  .map((item) => ({
    dashboardId: item.dashboardId,
    label: item.label,
    status: item.status,
    priority: item.status === "needs-evidence" ? "P0" : (item.screenshotAgeDays ?? 0) >= blockingAge ? "P0" : "P1",
    action: item.status === "needs-evidence"
      ? "Capture production screenshot evidence and rerun visual coverage report."
      : "Refresh screenshot evidence before freshness SLA expiry.",
    screenshotAgeDays: item.screenshotAgeDays,
    warningAgeDays: warningAge,
    blockingAgeDays: blockingAge
  }));

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  warningAgeDays: warningAge,
  blockingAgeDays: blockingAge,
  itemCount: items.length,
  items
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Visual Evidence Tasks",
  "",
  `Generated: ${report.generatedAt}`,
  `Warning age: ${warningAge} days`,
  `Blocking age: ${blockingAge} days`,
  "",
  ...items.map((item) => `- ${item.priority} ${item.label}: ${item.action}`)
].join("\n")}\n`);

console.log(`Dashboard visual evidence tasks generated: ${items.length} item(s).`);
