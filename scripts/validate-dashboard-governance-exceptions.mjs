#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-governance-exceptions.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(registryPath)) {
  issue("error", "Governance exception registry is missing.");
} else {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (registry.version !== "V12") issue("error", "Exception registry must declare version V12.");
  const exceptions = registry.exceptions ?? [];
  for (const item of exceptions) {
    for (const field of ["id", "owner", "reviewer", "blockedGate", "reason", "replacementPlan", "createdAt", "expiresAt"]) {
      if (!item[field]) issue("error", "Governance exception is missing required field.", `${item.id ?? "unknown"}: ${field}`);
    }
    if (item.targetBand === "T3C" || item.promotesTo === "T3C") {
      issue("error", "Governance exceptions cannot promote a project to T3C.", item.id ?? "unknown");
    }
    if (item.expiresAt && Number.isNaN(Date.parse(item.expiresAt))) {
      issue("error", "Governance exception has invalid expiresAt.", `${item.id}: ${item.expiresAt}`);
    } else if (item.expiresAt && Date.parse(item.expiresAt) < Date.now()) {
      issue("error", "Governance exception is expired.", `${item.id}: ${item.expiresAt}`);
    }
  }
  for (const rule of [
    "Expired exceptions are blocking.",
    "Exceptions cannot promote a project to T3C."
  ]) {
    if (!(registry.rules ?? []).includes(rule)) issue("error", "Exception registry missing required rule.", rule);
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard governance exception validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
