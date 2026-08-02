#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-component-maturity-registry.json");
const allowedLevels = new Set(["missing", "experimental", "reusable", "package-native", "documented", "certified"]);
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

if (!fs.existsSync(registryPath)) {
  issue("error", "Component maturity registry is missing.", "docs/design/dashboard-component-maturity-registry.json");
} else {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (registry.version !== "V8") issue("error", "Component maturity registry must declare version V8.");
  if ((registry.levels ?? []).length < 6) issue("error", "Component maturity registry must define all maturity levels.");
  const components = registry.components ?? [];
  if (components.length < 6) issue("error", "Component maturity registry must include core dashboard components.");
  for (const component of components) {
    if (!component.name) issue("error", "Component entry missing name.");
    if (!component.owner) issue("error", "Component entry missing owner.", component.name);
    if (!allowedLevels.has(component.maturity)) issue("error", "Component entry has unknown maturity.", `${component.name}: ${component.maturity}`);
    if (!component.requiredForTier) issue("error", "Component entry missing requiredForTier.", component.name);
    for (const evidence of component.evidence ?? []) {
      if (!exists(evidence)) issue("error", "Component evidence file is missing.", `${component.name}: ${evidence}`);
    }
    if (component.maturity === "certified" && (component.missingEvidence ?? []).length) {
      issue("error", "Certified component cannot list missing evidence.", component.name);
    }
    if ((component.missingEvidence ?? []).length) {
      issue("warning", "Component has remaining maturity evidence gaps.", `${component.name}: ${component.missingEvidence.join(", ")}`);
    }
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard component maturity validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
