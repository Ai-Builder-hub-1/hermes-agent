#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-ui-quality-system-registry.json");
const designDebtPath = path.join(root, "docs/design/dashboard-design-debt-registry.json");
const deprecationPath = path.join(root, "docs/design/dashboard-pattern-deprecation-registry.json");
const humanReviewPath = path.join(root, "docs/design/dashboard-human-review-workflow.json");
const handbookPath = path.join(root, "docs/design/dashboard-ui-quality-system-handbook.md");
const agentProtocolPath = path.join(root, "docs/design/dashboard-agent-build-protocol.md");
const renderedImplementationPath = path.join(root, "docs/design/rendered-visual-implementation-standard.md");
const visualRubricPath = path.join(root, "docs/design/dashboard-visual-maturity-rubric.json");
const visualReviewQueuePath = path.join(root, "docs/design/dashboard-visual-review-queue.json");
const designPreferenceMemoryPath = path.join(root, "docs/design/dashboard-design-preference-memory.json");
const designIntelligencePath = path.join(root, "docs/design/dashboard-design-intelligence-registry.json");
const designIntelligenceReportPath = path.join(root, "docs/design/dashboard-design-intelligence-report.json");
const productQualityPath = path.join(root, "docs/design/dashboard-product-quality-control-plane.json");
const productQualityReportPath = path.join(root, "docs/design/dashboard-product-quality-control-plane-report.json");
const platformIntelligencePath = path.join(root, "docs/design/dashboard-platform-intelligence-system.json");
const platformIntelligenceReportPath = path.join(root, "docs/design/dashboard-platform-intelligence-report.json");
const downstreamPlatformPath = path.join(root, "docs/design/dashboard-downstream-platform-assessment.json");
const operatingMaturityPlanPath = path.join(root, "docs/fleet/tlc-operating-system-maturity-build-plan.json");
const issues = [];

const requiredLayerIds = new Set([
  "design-token-governance",
  "content-copy-standard",
  "information-priority-model",
  "density-responsiveness-system",
  "accessibility-keyboard-operation",
  "performance-loading-ux",
  "ui-quality-observability",
  "design-debt-registry",
  "pattern-deprecation-system",
  "component-acceptance-tests",
  "human-review-workflow",
  "agent-build-protocol"
]);

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

for (const file of [
  registryPath,
  designDebtPath,
  deprecationPath,
  humanReviewPath,
  handbookPath,
  agentProtocolPath,
  renderedImplementationPath,
  visualRubricPath,
  visualReviewQueuePath,
  designPreferenceMemoryPath,
  designIntelligencePath,
  designIntelligenceReportPath,
  productQualityPath,
  productQualityReportPath,
  platformIntelligencePath,
  platformIntelligenceReportPath,
  downstreamPlatformPath,
  operatingMaturityPlanPath,
]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}

if (issues.some((item) => item.severity === "error")) finish();

const registry = readJson(registryPath);
if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "UI quality registry must declare schemaVersion 1.");
if (registry.version !== "V14") issue("error", "registry.version", "UI quality registry must declare version V14.");
if (!nonEmptyArray(registry.minimumTier3CRequirements) || registry.minimumTier3CRequirements.length < 10) {
  issue("error", "registry.minimumTier3CRequirements", "UI quality registry must declare robust Tier 3C requirements.");
}
for (const phrase of [
  "every production dashboard route registered",
  "approved spacing and card-content tokens"
]) {
  if (!registry.minimumTier3CRequirements?.some((requirement) => requirement.includes(phrase))) {
    issue("error", `registry.minimumTier3CRequirements.${phrase}`, `Tier 3C requirements must include ${phrase}.`);
  }
}

const layers = registry.layers ?? [];
if (layers.length !== requiredLayerIds.size) issue("error", "registry.layers.count", `UI quality registry must declare ${requiredLayerIds.size} layers.`);
const layerIds = new Set();
const seenNumbers = new Set();
for (const layer of layers) {
  if (!requiredLayerIds.has(layer.id)) issue("error", `layer:${layer.id}.unknown`, `Unknown UI quality layer ${layer.id}.`);
  if (layerIds.has(layer.id)) issue("error", `layer:${layer.id}.duplicate`, `${layer.id} is duplicated.`);
  layerIds.add(layer.id);
  if (seenNumbers.has(layer.number)) issue("error", `layer:${layer.id}.number`, `Layer number ${layer.number} is duplicated.`);
  seenNumbers.add(layer.number);
  if (typeof layer.number !== "number" || layer.number < 13 || layer.number > 24) issue("error", `layer:${layer.id}.number`, `${layer.id} must be numbered 13-24.`);
  for (const field of ["purpose", "maturityOutput"]) {
    if (!nonEmptyString(layer[field])) issue("error", `layer:${layer.id}.${field}`, `${layer.id} must declare ${field}.`);
  }
  for (const field of ["sourceArtifacts", "requiredCapabilities", "enforcementCommands", "proofSignals"]) {
    if (!nonEmptyArray(layer[field])) issue("error", `layer:${layer.id}.${field}`, `${layer.id} must declare non-empty ${field}.`);
  }
  if (layer.id === "density-responsiveness-system") {
    for (const capability of ["page-level route registration", "spacing token contract", "card content contract", "full-width table/card containment contract"]) {
      if (!layer.requiredCapabilities?.includes(capability)) {
        issue("error", `layer:${layer.id}.${capability}`, `${layer.id} must require ${capability}.`);
      }
    }
    for (const signal of ["registered pages declare density and blueprint", "cards prove header/body/action/footer spacing", "table surfaces prove pagination and horizontal scroll containment"]) {
      if (!layer.proofSignals?.includes(signal)) {
        issue("error", `layer:${layer.id}.${signal}`, `${layer.id} must prove ${signal}.`);
      }
    }
  }
  for (const artifact of layer.sourceArtifacts ?? []) {
    if (!exists(artifact)) issue("error", `layer:${layer.id}.artifact`, `${layer.id} references missing source artifact ${artifact}.`);
  }
}
for (const id of requiredLayerIds) {
  if (!layerIds.has(id)) issue("error", `layer:${id}.missing`, `Missing UI quality layer ${id}.`);
}

const debt = readJson(designDebtPath);
if (debt.version !== "V14") issue("error", "designDebt.version", "Design debt registry must declare V14.");
for (const field of ["expiredDebtBlocksTier3C", "blockingDebtBlocksPromotion"]) {
  if (debt.policy?.[field] !== true) issue("error", `designDebt.policy.${field}`, `Design debt policy must set ${field}: true.`);
}
const today = new Date("2026-08-12T00:00:00.000Z");
for (const item of debt.items ?? []) {
  for (const field of debt.policy?.requiredFields ?? []) {
    if (!item[field]) issue("error", `designDebt:${item.id ?? "unknown"}.${field}`, `Design debt item must declare ${field}.`);
  }
  if (item.expiresOn && new Date(`${item.expiresOn}T00:00:00.000Z`) < today) {
    issue("error", `designDebt:${item.id}.expired`, `${item.id} expired on ${item.expiresOn}.`);
  }
}

const deprecation = readJson(deprecationPath);
if (deprecation.version !== "V14") issue("error", "deprecation.version", "Pattern deprecation registry must declare V14.");
if ((deprecation.deprecatedPatterns ?? []).length < 4) issue("error", "deprecation.patterns", "Pattern deprecation registry must include core deprecated patterns.");
for (const pattern of deprecation.deprecatedPatterns ?? []) {
  for (const field of deprecation.policy?.requiredFields ?? []) {
    if (!pattern[field]) issue("error", `deprecation:${pattern.id ?? "unknown"}.${field}`, `Deprecated pattern must declare ${field}.`);
  }
  if (pattern.pattern) {
    try {
      new RegExp(pattern.pattern);
    } catch (error) {
      issue("error", `deprecation:${pattern.id}.pattern`, `${pattern.id} has invalid regex: ${error.message}`);
    }
  }
}

const review = readJson(humanReviewPath);
if (review.version !== "V14") issue("error", "humanReview.version", "Human review workflow must declare V14.");
for (const required of ["approved", "changes-requested", "excepted"]) {
  if (!(review.reviewStates ?? []).includes(required)) issue("error", `humanReview.state:${required}`, `Human review workflow must include ${required}.`);
}
if ((review.requiredEvidence ?? []).length < 5) issue("error", "humanReview.requiredEvidence", "Human review workflow must require enough evidence.");

const visualRubric = readJson(visualRubricPath);
if (visualRubric.version !== "V1") issue("error", "visualRubric.version", "Visual maturity rubric must declare V1.");
if ((visualRubric.visualTiers ?? []).length < 5) issue("error", "visualRubric.tiers", "Visual maturity rubric must define V0 through V4.");
if (!visualRubric.visualTiers?.some((tier) => tier.tier === "V3" && tier.minimumScore >= 88)) {
  issue("error", "visualRubric.V3", "Visual maturity rubric must require V3 score >= 88.");
}
if ((visualRubric.criteria ?? []).length < 10) issue("error", "visualRubric.criteria", "Visual maturity rubric must cover at least 10 quality criteria.");
if (!visualRubric.promotionRules?.some((rule) => rule.target === "V4")) {
  issue("error", "visualRubric.promotionRules", "Visual maturity rubric must define a V4 promotion rule.");
}

const visualReviewQueue = readJson(visualReviewQueuePath);
if (visualReviewQueue.version !== "V1") issue("error", "visualReviewQueue.version", "Visual review queue must declare V1.");
for (const state of ["queued", "in-review", "changes-requested", "approved", "excepted"]) {
  if (!(visualReviewQueue.states ?? []).includes(state)) issue("error", `visualReviewQueue.state:${state}`, `Visual review queue must include state ${state}.`);
}
for (const item of visualReviewQueue.items ?? []) {
  for (const field of ["id", "project", "surface", "state", "targetVisualTier", "currentVisualTier", "reason", "nextAction"]) {
    if (!item[field]) issue("error", `visualReviewQueue:${item.id ?? "unknown"}.${field}`, `Visual review queue item must declare ${field}.`);
  }
  if (!nonEmptyArray(item.requiredEvidence)) issue("error", `visualReviewQueue:${item.id}.requiredEvidence`, "Visual review queue items must require evidence.");
}

const designPreferenceMemory = readJson(designPreferenceMemoryPath);
if (designPreferenceMemory.version !== "V1") issue("error", "designPreferenceMemory.version", "Design preference memory must declare V1.");
if ((designPreferenceMemory.globalPreferences ?? []).length < 5) {
  issue("error", "designPreferenceMemory.globalPreferences", "Design preference memory must include core global preferences.");
}
if (!designPreferenceMemory.globalPreferences?.some((item) => item.id === "avoid-generic-static-dashboards")) {
  issue("error", "designPreferenceMemory.genericDashboard", "Design preference memory must record the generic dashboard rejection.");
}

const designIntelligence = readJson(designIntelligencePath);
if (designIntelligence.version !== "V1") issue("error", "designIntelligence.version", "Design intelligence registry must declare V1.");
if (designIntelligence.status !== "active") issue("error", "designIntelligence.status", "Design intelligence registry must be active.");
if ((designIntelligence.screenIntents ?? []).length < 7) issue("error", "designIntelligence.screenIntents", "Design intelligence must define core screen intents.");
if ((designIntelligence.blueprints ?? []).length < 6) issue("error", "designIntelligence.blueprints", "Design intelligence must define core experience blueprints.");
if ((designIntelligence.maturityLayers ?? []).length < 20) issue("error", "designIntelligence.maturityLayers", "Design intelligence must define the full 20-layer maturity model.");
if ((designIntelligence.routeIntentMap ?? []).length < 7) issue("error", "designIntelligence.routeIntentMap", "Design intelligence must map primary fleet routes to intent and blueprint.");
for (const key of ["tier3RequiresIntent", "tier3RequiresBlueprint", "tier3RequiresWorkflowProof", "tier3RequiresScreenshotReview", "tier3RequiresHumanDecision"]) {
  if (designIntelligence.promotionPolicy?.[key] !== true) issue("error", `designIntelligence.promotionPolicy.${key}`, `Design intelligence promotion policy must require ${key}.`);
}
const designIntelligenceReport = readJson(designIntelligenceReportPath);
if (designIntelligenceReport.summary?.layerCount !== (designIntelligence.maturityLayers ?? []).length) {
  issue("error", "designIntelligenceReport.stale", "Design intelligence report is stale; rerun npm run dashboard:design-intelligence:generate.");
}

const productQuality = readJson(productQualityPath);
if (productQuality.version !== "V1") issue("error", "productQuality.version", "Product quality control plane must declare V1.");
if (productQuality.status !== "active") issue("error", "productQuality.status", "Product quality control plane must be active.");
if ((productQuality.capabilities ?? []).length < 15) issue("error", "productQuality.capabilities", "Product quality control plane must define the full capability set.");
if ((productQuality.fleetRoutes ?? []).length < 10) issue("error", "productQuality.fleetRoutes", "Product quality control plane must cover the current dashboard fleet.");
if ((productQuality.gates ?? []).length < 5) issue("error", "productQuality.gates", "Product quality control plane must define promotion gates.");
for (const key of ["everyRouteRequiresControlPlaneSignals", "tier3RequiresQualityGatePass", "productionPromotionRequiresFreshProof", "componentChangesRequireBlastRadius", "safeAutopatchesRequireProofRerun", "userRejectedPatternsBecomeFleetMemory"]) {
  if (productQuality.policy?.[key] !== true) issue("error", `productQuality.policy.${key}`, `Product quality policy must require ${key}.`);
}
const productQualityReport = readJson(productQualityReportPath);
if (productQualityReport.summary?.capabilityCount !== (productQuality.capabilities ?? []).length) {
  issue("error", "productQualityReport.stale", "Product quality report is stale; rerun npm run dashboard:product-quality:generate.");
}

const platformIntelligence = readJson(platformIntelligencePath);
if (platformIntelligence.version !== "V1") issue("error", "platformIntelligence.version", "Platform intelligence system must declare V1.");
if (platformIntelligence.status !== "active") issue("error", "platformIntelligence.status", "Platform intelligence system must be active.");
if ((platformIntelligence.platformLayers ?? []).length < 15) issue("error", "platformIntelligence.platformLayers", "Platform intelligence must define the full layer set.");
if ((platformIntelligence.dashboards ?? []).length < 10) issue("error", "platformIntelligence.dashboards", "Platform intelligence must cover the dashboard fleet.");
if ((platformIntelligence.strategyWorkflows ?? []).length < 6) issue("error", "platformIntelligence.strategyWorkflows", "Platform intelligence must define strategy workflows.");
for (const key of ["everyDashboardRequiresProductPurpose", "everyDashboardRequiresBusinessObjectiveLinkage", "roadmapRequiresValueRiskEffortScore", "releasesRequireBusinessAndQualityGates", "productionTelemetryFeedsRoadmap", "humanReviewFeedsOrgMemory", "staleDashboardsEnterRefactorQueue"]) {
  if (platformIntelligence.policy?.[key] !== true) issue("error", `platformIntelligence.policy.${key}`, `Platform intelligence policy must require ${key}.`);
}
const platformIntelligenceReport = readJson(platformIntelligenceReportPath);
if (platformIntelligenceReport.summary?.layerCount !== (platformIntelligence.platformLayers ?? []).length) {
  issue("error", "platformIntelligenceReport.stale", "Platform intelligence report is stale; rerun npm run dashboard:platform-intelligence:generate.");
}

const downstreamPlatform = readJson(downstreamPlatformPath);
if (downstreamPlatform.version !== "V1") issue("error", "downstreamPlatform.version", "Downstream platform assessment must declare V1.");
if ((downstreamPlatform.projects ?? []).length < 10) issue("error", "downstreamPlatform.projects", "Downstream platform assessment must cover the dashboard fleet.");
if ((downstreamPlatform.requiredFleetMoves ?? []).length < 5) issue("error", "downstreamPlatform.requiredFleetMoves", "Downstream platform assessment must define required fleet moves.");

const operatingPlan = readJson(operatingMaturityPlanPath);
if (operatingPlan.schemaVersion !== 1) issue("error", "operatingPlan.schemaVersion", "Operating maturity plan must declare schemaVersion 1.");
if ((operatingPlan.levels ?? []).length < 6) issue("error", "operatingPlan.levels", "Operating maturity plan must cover L0 through L5.");
if ((operatingPlan.workstreams ?? []).length < 10) issue("error", "operatingPlan.workstreams", "Operating maturity plan must include trackable workstreams.");

const handbook = fs.readFileSync(handbookPath, "utf8");
for (const phrase of ["Content And Copy Standard", "Information Priority Model", "Density And Responsiveness", "Design Debt", "Pattern Deprecation", "Human Review", "Agent Protocol"]) {
  if (!handbook.includes(phrase)) issue("error", `handbook.${phrase}`, `Handbook must include ${phrase}.`);
}
for (const phrase of ["Route registration is mandatory", "standard card anatomy", "Tables with more than ten rows require pagination", "cannot be promoted to Tier 3C when any production page is unregistered"]) {
  if (!handbook.includes(phrase)) issue("error", `handbook.${phrase}`, `Handbook must include ${phrase}.`);
}

const agentProtocol = fs.readFileSync(agentProtocolPath, "utf8");
for (const phrase of ["Required Sequence", "Blocked Actions", "Final Response Requirements"]) {
  if (!agentProtocol.includes(phrase)) issue("error", `agentProtocol.${phrase}`, `Agent protocol must include ${phrase}.`);
}

const renderedImplementation = fs.readFileSync(renderedImplementationPath, "utf8");
for (const phrase of ["Completion Rule", "Layout rhythm layer", "Missing component layer", "Rendered proof layer", "Promotion layer"]) {
  if (!renderedImplementation.includes(phrase)) issue("error", `renderedImplementation.${phrase}`, `Rendered visual implementation standard must include ${phrase}.`);
}

finish();

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard UI quality system validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
