#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const issues = [];

const manifest = readJson(".hermes-dashboard.json");
const platform = readJson(".hermes-dashboard-platform.json");

if (platform.schemaVersion !== 1) issue("error", "schemaVersion", "Platform manifest must declare schemaVersion 1.");
if (platform.status !== "active") issue("error", "status", "Platform manifest must be active.");
if (platform.projectId !== manifest.projectId) issue("error", "projectId", "Platform manifest projectId must match .hermes-dashboard.json.");

for (const field of ["dashboardId", "screenIntent", "experienceBlueprint", "density", "businessObjective", "targetVisualTier"]) requireString(platform, field, "platform");
for (const field of ["pages", "requiredComponents", "dataStates", "proofStates", "workflowActions", "qualitySignals", "downstreamRequirements"]) requireArray(platform, field, "platform");

const allowedDensity = new Set(["compact", "standard", "comfortable", "dense"]);
if (!allowedDensity.has(platform.density)) issue("error", "density", `Unsupported density: ${platform.density}`);

for (const required of ["loading", "empty", "partial", "stale", "error", "ready"]) {
  if (!platform.dataStates.includes(required)) issue("error", `dataStates.${required}`, `Missing data state ${required}.`);
}
for (const required of ["desktop-expanded", "desktop-collapsed", "overflow-scan", "primary-workflow", "production-proof"]) {
  if (!platform.proofStates.includes(required)) issue("error", `proofStates.${required}`, `Missing proof state ${required}.`);
}
for (const required of ["visual score", "workflow proof", "design debt", "component dependencies", "promotion blockers", "proof freshness"]) {
  if (!platform.qualitySignals.includes(required)) issue("error", `qualitySignals.${required}`, `Missing quality signal ${required}.`);
}
for (const required of [
  "project-local dashboard:standard:check",
  "route/page manifest",
  "rendered visual proof",
  "workflow proof",
  "quality snapshot",
  "component enrichment RFC for missing local UI"
]) {
  if (!platform.downstreamRequirements.includes(required)) issue("error", `downstreamRequirements.${required}`, `Missing downstream requirement ${required}.`);
}

if (manifest.dashboardKit?.adoptionMode !== "package-native") issue("error", "dashboardKit.adoptionMode", "Dashboard adoptionMode must be package-native.");
if (manifest.dashboardKit?.targetExperienceBand !== "T3C") issue("error", "dashboardKit.targetExperienceBand", "Dashboard targetExperienceBand must be T3C.");

const surfaceComponents = new Set((manifest.surfaces ?? []).flatMap((surface) => surface.requiredComponents ?? []));
for (const component of platform.requiredComponents) {
  if (!surfaceComponents.has(component) && !isGenericShellComponent(component)) {
    issue("warning", `requiredComponents.${component}`, `${component} is required by platform manifest but not declared by surface manifest.`);
  }
}

const result = {
  schemaVersion: 1,
  projectId: platform.projectId,
  dashboardId: platform.dashboardId,
  checkedAt: new Date().toISOString(),
  screenIntent: platform.screenIntent,
  experienceBlueprint: platform.experienceBlueprint,
  density: platform.density,
  targetVisualTier: platform.targetVisualTier,
  errors: issues.filter((item) => item.severity === "error"),
  warnings: issues.filter((item) => item.severity === "warning")
};

console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function requireString(object, field, prefix) {
  if (typeof object[field] !== "string" || object[field].trim() === "") issue("error", `${prefix}.${field}`, `${prefix} must declare ${field}.`);
}

function requireArray(object, field, prefix) {
  if (!Array.isArray(object[field]) || object[field].length === 0) issue("error", `${prefix}.${field}`, `${prefix} must declare non-empty ${field}.`);
}

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function isGenericShellComponent(component) {
  return ["DashboardShell", "DashboardSidebar", "DashboardHeader", "DashboardQueryBoundary", "DataFreshnessStrip", "ProofStrip", "StatePanel", "DataTable"].includes(component);
}
