#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const designDir = path.join(root, "docs/design");
const registryPath = path.join(designDir, "dashboard-design-intelligence-registry.json");
const reportPath = path.join(designDir, "dashboard-design-intelligence-report.json");
const mdPath = path.join(designDir, "dashboard-design-intelligence-registry.md");
const webDataPath = path.join(root, "web/src/pages/dashboard-design-intelligence-data.ts");
const issues = [];

const requiredLayerIds = [
  "design-intent-engine",
  "experience-blueprints",
  "component-recommendation-system",
  "design-memory",
  "taste-calibration-loop",
  "screenshot-aware-review",
  "reference-matching",
  "visual-diff-intelligence",
  "design-system-ci-blockers",
  "production-ux-monitoring",
  "design-debt-autopatcher",
  "cross-project-pattern-reuse",
  "product-workflow-proof",
  "design-to-data-contract",
  "operator-outcome-metrics",
  "auto-tier-promotion",
  "design-system-release-train",
  "project-creation-gate",
  "autonomous-fleet-refactor-loop",
  "human-taste-console"
];

for (const file of [registryPath, reportPath, mdPath, webDataPath]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}
if (hasErrors()) finish();

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const md = fs.readFileSync(mdPath, "utf8");
const webData = fs.readFileSync(webDataPath, "utf8");

if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "Design intelligence registry must declare schemaVersion 1.");
if (registry.version !== "V1") issue("error", "registry.version", "Design intelligence registry must declare version V1.");
if (registry.status !== "active") issue("error", "registry.status", "Design intelligence registry must be active.");

for (const [key, value] of Object.entries(registry.promotionPolicy ?? {})) {
  if (value !== true) issue("error", `promotionPolicy.${key}`, `${key} must be true.`);
}
for (const key of [
  "tier3RequiresIntent",
  "tier3RequiresBlueprint",
  "tier3RequiresPageRegistration",
  "tier3RequiresSpacingContract",
  "tier3RequiresCardDensityContract",
  "tier3RequiresTableContainmentContract",
  "tier3RequiresWorkflowProof",
  "tier3RequiresScreenshotReview",
  "tier3RequiresHumanDecision",
  "tier4RequiresReusablePatternPromotion"
]) {
  if (registry.promotionPolicy?.[key] !== true) issue("error", `promotionPolicy.${key}`, `${key} is required.`);
}

const intents = registry.screenIntents ?? [];
if (intents.length < 7) issue("error", "screenIntents.count", "At least seven screen intents are required.");
for (const intent of intents) {
  for (const field of ["id", "label", "density", "primaryQuestion"]) requireString(intent, field, `screenIntent:${intent.id ?? "unknown"}`);
  requireArray(intent, "requiredBlueprints", `screenIntent:${intent.id ?? "unknown"}`);
  requireArray(intent, "forbiddenPatterns", `screenIntent:${intent.id ?? "unknown"}`);
  if (!["compact", "standard", "comfortable", "presentation"].includes(intent.density)) {
    issue("error", `screenIntent:${intent.id}.density`, `${intent.id} has invalid density ${intent.density}.`);
  }
}

const blueprints = registry.blueprints ?? [];
if (blueprints.length < 6) issue("error", "blueprints.count", "At least six experience blueprints are required.");
const intentIds = new Set(intents.map((intent) => intent.id));
const blueprintIds = new Set();
for (const blueprint of blueprints) {
  blueprintIds.add(blueprint.id);
  for (const field of ["id", "intent"]) requireString(blueprint, field, `blueprint:${blueprint.id ?? "unknown"}`);
  for (const field of ["requiredSections", "requiredComponents", "proofRequirements"]) requireArray(blueprint, field, `blueprint:${blueprint.id ?? "unknown"}`);
  if (!intentIds.has(blueprint.intent)) issue("error", `blueprint:${blueprint.id}.intent`, `${blueprint.id} references unknown intent ${blueprint.intent}.`);
  if (blueprint.requiredComponents.length < 4) issue("error", `blueprint:${blueprint.id}.requiredComponents`, `${blueprint.id} must list at least four components.`);
  if (blueprint.proofRequirements.length < 4) issue("error", `blueprint:${blueprint.id}.proofRequirements`, `${blueprint.id} must list at least four proof requirements.`);
}

const layers = registry.maturityLayers ?? [];
if (layers.length !== requiredLayerIds.length) issue("error", "maturityLayers.count", `Expected ${requiredLayerIds.length} maturity layers.`);
const layerIds = new Set(layers.map((layer) => layer.id));
for (const id of requiredLayerIds) {
  if (!layerIds.has(id)) issue("error", `maturityLayer:${id}.missing`, `${id} is missing.`);
}
for (const layer of layers) {
  if (typeof layer.number !== "number" || layer.number < 1 || layer.number > 20) issue("error", `maturityLayer:${layer.id}.number`, `${layer.id} must be numbered 1-20.`);
  for (const field of ["id", "status", "purpose", "acceptance"]) requireString(layer, field, `maturityLayer:${layer.id ?? "unknown"}`);
  requireArray(layer, "sourceArtifacts", `maturityLayer:${layer.id ?? "unknown"}`);
  requireArray(layer, "enforcementSignals", `maturityLayer:${layer.id ?? "unknown"}`);
  for (const artifact of layer.sourceArtifacts ?? []) {
    if (!fs.existsSync(path.join(root, artifact))) issue("error", `maturityLayer:${layer.id}.artifact`, `${layer.id} references missing artifact ${artifact}.`);
  }
}

const routeMap = registry.routeIntentMap ?? [];
if (routeMap.length < 7) issue("error", "routeIntentMap.count", "Route intent map must cover the primary fleet routes.");
for (const route of routeMap) {
  for (const field of ["routeId", "intent", "blueprint", "density", "targetVisualTier", "status", "nextProof"]) requireString(route, field, `routeIntent:${route.routeId ?? "unknown"}`);
  if (!intentIds.has(route.intent)) issue("error", `routeIntent:${route.routeId}.intent`, `${route.routeId} references unknown intent ${route.intent}.`);
  if (!blueprintIds.has(route.blueprint)) issue("error", `routeIntent:${route.routeId}.blueprint`, `${route.routeId} references unknown blueprint ${route.blueprint}.`);
  if (route.pageContract?.requiredForEveryProductionPage !== true) {
    issue("error", `routeIntent:${route.routeId}.pageContract`, `${route.routeId} must require page-level contracts for every production page.`);
  }
  for (const key of ["requiresRouteRegistration", "requiresSpacingTokenProof", "requiresCardDensityProof", "requiresTableContainmentProof", "requiresDrawerAndOverlayProof"]) {
    if (route.pageContract?.[key] !== true) issue("error", `routeIntent:${route.routeId}.pageContract.${key}`, `${route.routeId} page contract must require ${key}.`);
  }
  if (!Array.isArray(route.pageContract?.requiresScreenshotStates) || route.pageContract.requiresScreenshotStates.length < 4) {
    issue("error", `routeIntent:${route.routeId}.pageContract.requiresScreenshotStates`, `${route.routeId} page contract must require screenshot states.`);
  }
}

if (report.summary?.layerCount !== 20) issue("error", "report.summary.layerCount", "Report must summarize 20 layers.");
if (report.summary?.mappedRouteCount !== routeMap.length) issue("error", "report.summary.mappedRouteCount", "Report route count is stale.");
for (const phrase of ["Screen Intents", "Blueprints", "Maturity Layers", "Route Intent Map"]) {
  if (!md.includes(phrase)) issue("error", `markdown.${phrase}`, `Registry markdown must include ${phrase}.`);
}
for (const token of [
  "dashboardDesignIntelligenceGeneratedAt",
  "dashboardDesignIntelligenceSummary",
  "dashboardDesignIntelligenceScreenIntents",
  "dashboardDesignIntelligenceBlueprints",
  "dashboardDesignIntelligenceLayers",
  "dashboardDesignIntelligenceRouteMap"
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
  console.log(`Dashboard design intelligence validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
