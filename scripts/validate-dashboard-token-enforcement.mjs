#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-token-enforcement.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(registryPath)) {
  issue("error", "Token enforcement registry is missing.", "docs/design/dashboard-token-enforcement.json");
} else {
  const registry = readJson(registryPath);
  if (registry.version !== "V9") issue("error", "Token enforcement registry must declare version V9.");
  for (const family of ["color", "typography", "spacing", "radius", "shadow", "border", "motion", "density"]) {
    if (!(registry.tokenFamilies ?? []).includes(family)) issue("error", `Missing token family: ${family}.`);
  }
  for (const artifact of registry.sourceArtifacts ?? []) {
    if (!fs.existsSync(path.join(root, artifact))) issue("error", "Token source artifact is missing.", artifact);
  }
  const forbidden = registry.forbiddenPatterns ?? [];
  if (forbidden.length < 4) issue("error", "Token enforcement must define forbidden styling patterns.");
  for (const rule of forbidden) {
    if (!rule.id || !rule.pattern || !(rule.scope ?? []).length || !rule.allowedWhen) {
      issue("error", "Forbidden token rule is incomplete.", rule.id ?? "unknown");
    }
    try {
      new RegExp(rule.pattern);
    } catch (error) {
      issue("error", "Forbidden token rule has invalid regex.", `${rule.id}: ${error.message}`);
    }
  }
  if ((registry.requiredPractices ?? []).length < 4) issue("error", "Token enforcement must include required practices.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard token enforcement validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
