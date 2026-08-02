#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-governance-ci-gates.json");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(registryPath)) {
  issue("error", "Governance CI gates registry is missing.");
} else {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (registry.version !== "V12") issue("error", "Governance CI gates registry must declare version V12.");
  const levels = new Set((registry.gateLevels ?? []).map((level) => level.id));
  for (const level of ["advisory", "blocking", "human-approval"]) {
    if (!levels.has(level)) issue("error", "Governance CI registry missing gate level.", level);
  }
  for (const gate of registry.gates ?? []) {
    if (!gate.id || !gate.command || !gate.level || !(gate.appliesTo ?? []).length) {
      issue("error", "Governance gate is incomplete.", gate.id ?? "unknown");
      continue;
    }
    const scriptName = gate.command.replace(/^npm run /, "").trim();
    if (!pkg.scripts[scriptName]) issue("error", "Governance gate command is not registered in package.json.", gate.command);
    if (!levels.has(gate.level)) issue("error", "Governance gate has unknown level.", `${gate.id}: ${gate.level}`);
  }
  if ((registry.promotionRules ?? []).length < 5) issue("error", "Governance CI registry must define promotion rules for T0/T1/T2/T3 bands.");
  if ((registry.exceptionRules ?? []).length < 3) issue("error", "Governance CI registry must define exception rules.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard governance CI validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
