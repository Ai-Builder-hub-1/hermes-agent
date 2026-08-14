#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const designDir = path.join(root, "docs/design");
const registryPath = path.join(designDir, "dashboard-product-quality-control-plane.json");
const reportPath = path.join(designDir, "dashboard-product-quality-control-plane-report.json");
const mdPath = path.join(designDir, "dashboard-product-quality-control-plane.md");
const reportMdPath = path.join(designDir, "dashboard-product-quality-control-plane-report.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-product-quality-control-plane-data.ts");
const issues = [];

const requiredCapabilityIds = [
  "autonomous-product-architect",
  "design-system-dependency-graph",
  "component-health-scores",
  "real-user-ux-analytics",
  "design-regression-root-cause",
  "automated-component-upgrade-campaigns",
  "cross-fleet-ux-benchmarking",
  "reference-driven-generation",
  "operator-persona-modeling",
  "workflow-outcome-learning",
  "design-experiment-framework",
  "acceptance-criteria-generator",
  "product-quality-ledger",
  "self-healing-ui-layer",
  "org-level-design-governance"
];

for (const file of [registryPath, reportPath, mdPath, reportMdPath, webDataPath]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}
if (hasErrors()) finish();

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const md = fs.readFileSync(mdPath, "utf8");
const webData = fs.readFileSync(webDataPath, "utf8");

if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "Product quality control plane must declare schemaVersion 1.");
if (registry.version !== "V1") issue("error", "registry.version", "Product quality control plane must declare V1.");
if (registry.status !== "active") issue("error", "registry.status", "Product quality control plane must be active.");

for (const key of [
  "everyRouteRequiresControlPlaneSignals",
  "tier3RequiresQualityGatePass",
  "productionPromotionRequiresFreshProof",
  "componentChangesRequireBlastRadius",
  "safeAutopatchesRequireProofRerun",
  "userRejectedPatternsBecomeFleetMemory"
]) {
  if (registry.policy?.[key] !== true) issue("error", `policy.${key}`, `Policy must require ${key}.`);
}

const capabilities = registry.capabilities ?? [];
if (capabilities.length !== requiredCapabilityIds.length) issue("error", "capabilities.count", `Expected ${requiredCapabilityIds.length} product-quality capabilities.`);
const capabilityIds = new Set(capabilities.map((item) => item.id));
for (const id of requiredCapabilityIds) {
  if (!capabilityIds.has(id)) issue("error", `capability:${id}.missing`, `${id} is missing.`);
}
for (const item of capabilities) {
  for (const field of ["id", "status", "purpose"]) requireString(item, field, `capability:${item.id ?? "unknown"}`);
  for (const field of ["requiredInputs", "outputs"]) requireArray(item, field, `capability:${item.id ?? "unknown"}`);
  if (!["active", "defined", "implemented"].includes(item.status)) issue("error", `capability:${item.id}.status`, `${item.id} has invalid status ${item.status}.`);
}

const routes = registry.fleetRoutes ?? [];
if (routes.length < 10) issue("error", "fleetRoutes.count", "Control plane must cover the current dashboard fleet.");
for (const route of routes) {
  for (const field of ["routeId", "domain", "intent", "targetTier", "proofFocus"]) requireString(route, field, `fleetRoute:${route.routeId ?? "unknown"}`);
  requireArray(route, "requiredControlPlaneSignals", `fleetRoute:${route.routeId ?? "unknown"}`);
  for (const signal of ["route registered", "component dependencies known", "visual score known", "workflow proof known", "design debt known", "promotion blockers known"]) {
    if (!route.requiredControlPlaneSignals.includes(signal)) issue("error", `fleetRoute:${route.routeId}.${signal}`, `${route.routeId} must require ${signal}.`);
  }
}

const gates = registry.gates ?? [];
if (gates.length < 5) issue("error", "gates.count", "Control plane must define all promotion gates.");
for (const gate of gates) {
  for (const field of ["id", "stage"]) requireString(gate, field, `gate:${gate.id ?? "unknown"}`);
  requireArray(gate, "checks", `gate:${gate.id ?? "unknown"}`);
  if (gate.blocksPromotion !== true) issue("error", `gate:${gate.id}.blocksPromotion`, `${gate.id} must block promotion.`);
}

if (report.summary?.capabilityCount !== capabilities.length) issue("error", "report.summary.capabilityCount", "Report capability count is stale.");
if (report.summary?.fleetRouteCount !== routes.length) issue("error", "report.summary.fleetRouteCount", "Report route count is stale.");
if (report.summary?.gateCount !== gates.length) issue("error", "report.summary.gateCount", "Report gate count is stale.");

for (const phrase of ["Policy", "Capabilities", "Fleet Routes", "Gates"]) {
  if (!md.includes(phrase)) issue("error", `markdown.${phrase}`, `Control-plane markdown must include ${phrase}.`);
}

for (const token of [
  "dashboardProductQualityControlPlaneGeneratedAt",
  "dashboardProductQualityControlPlaneSummary",
  "dashboardProductQualityControlPlaneCapabilities",
  "dashboardProductQualityControlPlaneFleetRoutes",
  "dashboardProductQualityControlPlaneGates"
]) {
  if (!webData.includes(token)) issue("error", `webData.${token}`, `Generated web data must export ${token}.`);
}

finish();

function requireString(object, field, codePrefix) {
  if (typeof object[field] !== "string" || object[field].trim() === "") {
    issue("error", `${codePrefix}.${field}`, `${codePrefix} must declare ${field}.`);
  }
}

function requireArray(object, field, codePrefix) {
  if (!Array.isArray(object[field]) || object[field].length === 0) {
    issue("error", `${codePrefix}.${field}`, `${codePrefix} must declare non-empty ${field}.`);
  }
}

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function hasErrors() {
  return issues.some((item) => item.severity === "error");
}

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard product quality control plane validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
