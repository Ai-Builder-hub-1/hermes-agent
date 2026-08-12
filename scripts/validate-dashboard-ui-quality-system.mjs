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

for (const file of [registryPath, designDebtPath, deprecationPath, humanReviewPath, handbookPath, agentProtocolPath]) {
  if (!fs.existsSync(file)) issue("error", `missing:${path.relative(root, file)}`, `${path.relative(root, file)} is required.`);
}

if (issues.some((item) => item.severity === "error")) finish();

const registry = readJson(registryPath);
if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "UI quality registry must declare schemaVersion 1.");
if (registry.version !== "V14") issue("error", "registry.version", "UI quality registry must declare version V14.");
if (!nonEmptyArray(registry.minimumTier3CRequirements) || registry.minimumTier3CRequirements.length < 10) {
  issue("error", "registry.minimumTier3CRequirements", "UI quality registry must declare robust Tier 3C requirements.");
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

const handbook = fs.readFileSync(handbookPath, "utf8");
for (const phrase of ["Content And Copy Standard", "Information Priority Model", "Density And Responsiveness", "Design Debt", "Pattern Deprecation", "Human Review", "Agent Protocol"]) {
  if (!handbook.includes(phrase)) issue("error", `handbook.${phrase}`, `Handbook must include ${phrase}.`);
}

const agentProtocol = fs.readFileSync(agentProtocolPath, "utf8");
for (const phrase of ["Required Sequence", "Blocked Actions", "Final Response Requirements"]) {
  if (!agentProtocol.includes(phrase)) issue("error", `agentProtocol.${phrase}`, `Agent protocol must include ${phrase}.`);
}

finish();

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard UI quality system validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length) process.exit(1);
}
