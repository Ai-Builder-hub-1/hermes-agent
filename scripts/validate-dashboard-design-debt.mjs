#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { designDir, markdownTable, readJson, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const write = args.has("--write") || strict;
const today = new Date("2026-08-12T00:00:00.000Z");
const debtPath = path.join(designDir, "dashboard-design-debt-registry.json");
const deprecationPath = path.join(designDir, "dashboard-pattern-deprecation-registry.json");
const reportPath = path.join(designDir, "dashboard-design-debt-report.json");
const reportMdPath = path.join(designDir, "dashboard-design-debt-report.md");
const issues = [];

const debt = readJson(debtPath);
const deprecation = readJson(deprecationPath);
const requiredDebtFields = debt.policy?.requiredFields ?? [];
const requiredPatternFields = deprecation.policy?.requiredFields ?? [];

for (const item of debt.items ?? []) {
  for (const field of requiredDebtFields) {
    if (!present(item[field])) {
      issues.push(finding("error", "designDebt.missingField", `${item.id ?? "unknown"} is missing ${field}.`, item.id));
    }
  }
  if (item.expiresOn) {
    const expiry = new Date(`${item.expiresOn}T00:00:00.000Z`);
    if (Number.isNaN(expiry.getTime())) {
      issues.push(finding("error", "designDebt.invalidExpiry", `${item.id} has invalid expiresOn ${item.expiresOn}.`, item.id));
    } else if (expiry < today) {
      issues.push(finding("error", "designDebt.expired", `${item.id} expired on ${item.expiresOn}.`, item.id));
    }
  }
  if (item.maturityImpact === "blocking" || item.blocksPromotion === true) {
    issues.push(finding("error", "designDebt.blocksPromotion", `${item.id} blocks dashboard promotion.`, item.id));
  }
}

for (const pattern of deprecation.deprecatedPatterns ?? []) {
  for (const field of requiredPatternFields) {
    if (!present(pattern[field])) {
      issues.push(finding("error", "deprecatedPattern.missingField", `${pattern.id ?? "unknown"} is missing ${field}.`, pattern.id));
    }
  }
  if (pattern.enforcementDate) {
    const enforcementDate = new Date(`${pattern.enforcementDate}T00:00:00.000Z`);
    if (Number.isNaN(enforcementDate.getTime())) {
      issues.push(finding("error", "deprecatedPattern.invalidDate", `${pattern.id} has invalid enforcementDate ${pattern.enforcementDate}.`, pattern.id));
    }
  }
  try {
    new RegExp(pattern.pattern);
  } catch (error) {
    issues.push(finding("error", "deprecatedPattern.invalidRegex", `${pattern.id} has invalid regex: ${error.message}`, pattern.id));
  }
}

const activeDebt = (debt.items ?? []).filter((item) => item.status !== "closed");
const expiredDebt = activeDebt.filter((item) => item.expiresOn && new Date(`${item.expiresOn}T00:00:00.000Z`) < today);
const blockingDebt = activeDebt.filter((item) => item.maturityImpact === "blocking" || item.blocksPromotion === true);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: issues.some((item) => item.severity === "error") ? "fail" : activeDebt.length ? "needs-review" : "pass",
  policy: debt.policy,
  summary: {
    activeDebtCount: activeDebt.length,
    expiredDebtCount: expiredDebt.length,
    blockingDebtCount: blockingDebt.length,
    deprecatedPatternCount: (deprecation.deprecatedPatterns ?? []).length,
    findingCount: issues.length
  },
  activeDebt,
  deprecatedPatterns: deprecation.deprecatedPatterns ?? [],
  findings: issues
};

if (write) {
  writeJson(reportPath, report);
  writeMarkdown(reportMdPath, renderMarkdown(report));
}

console.log(`Dashboard design debt validation: ${issues.filter((item) => item.severity === "error").length} error(s), ${issues.filter((item) => item.severity === "warning").length} warning(s).`);
if (write) console.log(`Wrote ${path.relative(process.cwd(), reportPath)} and ${path.relative(process.cwd(), reportMdPath)}`);
for (const issue of issues) console.log(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
if (strict && report.status !== "pass") process.exit(1);
if (issues.some((item) => item.severity === "error")) process.exit(1);

function present(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim().length > 0;
}

function finding(severity, code, message, itemId) {
  return { severity, code, message, itemId };
}

function renderMarkdown(report) {
  const rows = report.activeDebt.length
    ? report.activeDebt.map((item) => [
        item.id,
        Array.isArray(item.scope) ? item.scope.join(", ") : item.scope,
        item.owner,
        item.maturityImpact,
        item.expiresOn,
        item.replacementPlan
      ])
    : [["none", "-", "-", "-", "-", "No active design debt."]];
  const patternRows = report.deprecatedPatterns.map((item) => [
    item.id,
    item.scope.join(", "),
    item.replacement,
    item.enforcementDate
  ]);
  return [
    "# Dashboard Design Debt Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: ${report.status}`,
    "",
    `Active debt: ${report.summary.activeDebtCount}`,
    `Expired debt: ${report.summary.expiredDebtCount}`,
    `Blocking debt: ${report.summary.blockingDebtCount}`,
    `Deprecated patterns: ${report.summary.deprecatedPatternCount}`,
    "",
    "## Active Debt",
    "",
    markdownTable(["ID", "Scope", "Owner", "Impact", "Expires", "Replacement"], rows),
    "",
    "## Deprecated Patterns",
    "",
    markdownTable(["ID", "Scope", "Replacement", "Enforced"], patternRows)
  ].join("\n");
}
