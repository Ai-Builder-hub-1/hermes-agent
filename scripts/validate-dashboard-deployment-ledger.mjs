#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { designDir, readJson, root } from "./dashboard-report-utils.mjs";

const reportPath = path.join(designDir, "dashboard-deployment-ledger.json");
const report = readJson(reportPath);
const issues = [];

for (const entry of report.entries ?? []) {
  if (!entry.repo?.commit) issues.push({ severity: "error", id: entry.id, message: "Missing local git commit." });
  if (!entry.deployment?.composeService) issues.push({ severity: "error", id: entry.id, message: "Missing compose service." });
  if (!entry.deployment?.buildContext) issues.push({ severity: "error", id: entry.id, message: "Missing build context." });
  if (!entry.deployment?.promotionScript) issues.push({ severity: "error", id: entry.id, message: "Missing promotion script." });
  for (const risk of entry.risks ?? []) {
    issues.push({ severity: "warning", id: entry.id, message: risk });
  }
}

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");
console.log(`Dashboard deployment ledger validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const issue of issues) console.log(`- ${issue.severity.toUpperCase()} ${issue.id}: ${issue.message}`);
if (!errors.length) console.log(`Validated ${path.relative(root, reportPath)}`);
if (errors.length) process.exit(1);
