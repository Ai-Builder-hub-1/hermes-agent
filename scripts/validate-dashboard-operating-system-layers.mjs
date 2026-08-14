#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-operating-system-layer-registry.json");
const packagePath = path.join(root, "package.json");
const issues = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function addIssue(severity, code, message) {
  issues.push({ severity, code, message });
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

if (!fs.existsSync(registryPath)) {
  addIssue("error", "registry.missing", "docs/design/dashboard-operating-system-layer-registry.json is required.");
  finish();
}

if (!fs.existsSync(packagePath)) {
  addIssue("error", "package.missing", "package.json is required.");
  finish();
}

const registry = readJson(registryPath);
const packageJson = readJson(packagePath);
const scripts = packageJson.scripts ?? {};
const layers = registry.layers ?? [];
const layerNumbers = new Set();
const layerIds = new Set();
const expectedBands = new Set((registry.maturityBands ?? []).map((band) => band.id));

if (registry.schemaVersion !== 1) {
  addIssue("error", "registry.schemaVersion", "Dashboard operating system layer registry must declare schemaVersion 1.");
}
if (registry.version !== "V60") {
  addIssue("error", "registry.version", "Dashboard operating system layer registry must declare version V60.");
}
if (registry.minimumLayerCount !== 60) {
  addIssue("error", "registry.minimumLayerCount", "Dashboard operating system layer registry must require 60 layers.");
}
if (layers.length !== 60) {
  addIssue("error", "layers.count", `Expected 60 layers, found ${layers.length}.`);
}
if ((registry.maturityBands ?? []).length !== 3) {
  addIssue("error", "maturityBands.count", "Expected three maturity bands: foundation, operational-enforcement, product-operating-system.");
}

for (const requiredBand of ["foundation", "operational-enforcement", "product-operating-system"]) {
  if (!expectedBands.has(requiredBand)) {
    addIssue("error", `band.${requiredBand}.missing`, `Missing maturity band ${requiredBand}.`);
  }
}

for (const layer of layers) {
  const number = Number(layer.number);
  if (!Number.isInteger(number) || number < 1 || number > 60) {
    addIssue("error", `layer.${layer.id ?? "unknown"}.number`, "Layer number must be an integer from 1 to 60.");
  }
  if (layerNumbers.has(number)) {
    addIssue("error", `layer.${number}.duplicate`, `Layer number ${number} is duplicated.`);
  }
  layerNumbers.add(number);

  if (!nonEmptyString(layer.id)) {
    addIssue("error", `layer.${number}.id`, "Layer id is required.");
  } else if (layerIds.has(layer.id)) {
    addIssue("error", `layer.${layer.id}.duplicate`, `Layer id ${layer.id} is duplicated.`);
  }
  layerIds.add(layer.id);

  for (const field of ["name", "band", "purpose", "maturityOutput"]) {
    if (!nonEmptyString(layer[field])) {
      addIssue("error", `layer.${layer.id ?? number}.${field}`, `Layer ${layer.id ?? number} must declare ${field}.`);
    }
  }

  if (!expectedBands.has(layer.band)) {
    addIssue("error", `layer.${layer.id}.band`, `${layer.band} is not a declared maturity band.`);
  }

  for (const field of ["sourceArtifacts", "enforcementCommands", "proofSignals"]) {
    if (!nonEmptyArray(layer[field])) {
      addIssue("error", `layer.${layer.id}.${field}`, `Layer ${layer.id} must declare non-empty ${field}.`);
    }
  }

  for (const artifact of layer.sourceArtifacts ?? []) {
    if (!pathExists(artifact)) {
      addIssue("error", `layer.${layer.id}.artifact`, `Layer ${layer.id} references missing artifact: ${artifact}.`);
    }
  }

  for (const command of layer.enforcementCommands ?? []) {
    if (!scripts[command]) {
      addIssue("error", `layer.${layer.id}.command`, `Layer ${layer.id} references missing package script: ${command}.`);
    }
  }
}

for (let number = 1; number <= 60; number += 1) {
  if (!layerNumbers.has(number)) {
    addIssue("error", `layer.${number}.missing`, `Missing layer number ${number}.`);
  }
}

const bandCoverage = new Map();
for (const layer of layers) {
  bandCoverage.set(layer.band, (bandCoverage.get(layer.band) ?? 0) + 1);
}
for (const band of registry.maturityBands ?? []) {
  if (!bandCoverage.get(band.id)) {
    addIssue("error", `band.${band.id}.empty`, `Maturity band ${band.id} has no layers.`);
  }
}

finish();

function finish() {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  console.log(`Dashboard operating system layer validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const issue of issues) {
    console.log(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
  }
  if (errors.length) {
    process.exit(1);
  }
}
