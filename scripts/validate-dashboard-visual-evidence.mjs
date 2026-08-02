#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-visual-evidence-layer.json");
const qualityPath = path.join(root, "docs/design/dashboard-visual-quality-report.json");
const screenshotDir = path.join(root, "docs/design/production-screenshots");

const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(registryPath)) issue("error", "Visual evidence registry is missing.", registryPath);
if (!fs.existsSync(qualityPath)) issue("error", "Visual quality report is missing.", qualityPath);
if (!fs.existsSync(screenshotDir)) issue("error", "Production screenshot directory is missing.", screenshotDir);

if (!issues.some((item) => item.severity === "error")) {
  const registry = readJson(registryPath);
  const quality = readJson(qualityPath);
  const screenshots = fs.readdirSync(screenshotDir).filter((file) => file.endsWith(".png"));

  if (registry.version !== "V7") issue("error", "Visual evidence registry must declare version V7.");
  if ((registry.viewportMatrix ?? []).filter((viewport) => viewport.required).length < 5) {
    issue("error", "Visual evidence must define desktop, tablet, mobile, and embedded viewport coverage.");
  }
  for (const signal of ["nonblank-render", "text-containment", "no-incoherent-overlap", "loading-empty-error-states"]) {
    if (!(registry.requiredSignals ?? []).includes(signal)) issue("error", `Missing required visual signal: ${signal}.`);
  }
  if ((registry.commands ?? []).length < 3) issue("error", "Visual evidence registry must include executable commands.");
  if (!Array.isArray(quality.items) || quality.items.length === 0) {
    issue("warning", "Visual quality report has no project items.");
  }
  if (screenshots.length < 2) {
    issue("warning", "Production screenshot evidence is thin; capture more registered dashboards.");
  }
  const lowScores = (quality.items ?? []).filter((item) => Number(item.score ?? 0) < 80);
  for (const item of lowScores) {
    issue("warning", "Visual quality score is below the review floor.", `${item.project}/${item.surface}: ${item.score}`);
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard visual evidence validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) {
  console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
}
if (errors.length) process.exit(1);
