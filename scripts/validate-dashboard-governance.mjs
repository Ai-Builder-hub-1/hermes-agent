#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const issues = [];

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readYaml(relativePath) {
  return yaml.load(read(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const requiredFiles = [
  "docs/design/dashboard-governance-and-enforcement.md",
  "docs/design/dashboard-admission-rfc-template.md",
  "experience-audit/governance-gates.yaml",
  "experience-audit/surfaces.yaml",
  "experience-audit/experience-contracts.yaml",
  "docs/design/dashboard-production-proof-registry.json",
];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    issue("error", `missing:${relativePath}`, `${relativePath} is required for V6 governance.`);
  }
}

if (issues.some((item) => item.severity === "error")) finish();

const gates = readYaml("experience-audit/governance-gates.yaml");
const surfacesDoc = readYaml("experience-audit/surfaces.yaml");
const contractsDoc = readYaml("experience-audit/experience-contracts.yaml");
const proofRegistry = readJson("docs/design/dashboard-production-proof-registry.json");

if (gates.schemaVersion !== 1) issue("error", "governance.schemaVersion", "governance-gates.yaml must declare schemaVersion: 1.");

const requiredGateIds = new Set([
  "owner-reviewer",
  "workspace-mapping",
  "single-shell-route-model",
  "private-remote",
  "shell-visual-contract",
  "experience-tier",
  "implementation-mode",
  "recipe-selection",
  "reference-evidence",
  "data-contract",
  "interaction-contract",
  "proof-route",
  "visual-quality",
  "adoption-reporting",
  "exception-review",
]);
const actualGateIds = new Set((gates.requiredGates ?? []).map((gate) => gate.id));
for (const gateId of requiredGateIds) {
  if (!actualGateIds.has(gateId)) issue("error", `gate:${gateId}`, `Missing required governance gate: ${gateId}.`);
}

const approvedWorkspaces = new Set(gates.approvedWorkspaces ?? []);
const approvedRecipes = new Set(gates.approvedRecipes ?? []);
const approvedShellModels = new Set(["single-shell", "standalone-dev-only", "compatibility-route"]);
const approvedExperienceTiers = new Set([0, 1, 2, 3]);
const approvedImplementationModes = new Set(["package-native", "hybrid", "static-adapter", "server-rendered-legacy", "planned"]);
const approvedTargetBands = new Set(["T0P", "T0L", "T1A", "T1B", "T2A", "T2B", "T3A", "T3B", "T3C"]);
const surfaces = surfacesDoc.surfaces ?? [];
const contracts = contractsDoc.contracts ?? [];
const contractIds = new Set(contracts.map((contract) => contract.id));
const proofIds = new Set((proofRegistry.entries ?? []).map((entry) => entry.id));
const exceptions = gates.exceptions ?? [];
const exceptionBySurfaceGate = new Set(exceptions.map((entry) => `${entry.surfaceId}:${entry.gate}`));

for (const surface of surfaces) {
  if (!surface.owner) issue("error", `surface:${surface.id}.owner`, `${surface.id} must declare owner.`);
  if (!surface.reviewer) issue("error", `surface:${surface.id}.reviewer`, `${surface.id} must declare reviewer.`);
  if (!approvedWorkspaces.has(surface.workspace)) issue("error", `surface:${surface.id}.workspace`, `${surface.id} uses unapproved workspace ${surface.workspace}.`);
  validateShellRouteModel("surface", surface);
  validateShellVisualContract("surface", surface);
  validateImplementationMode("surface", surface);
  if (!surface.primaryRecipe || !approvedRecipes.has(surface.primaryRecipe)) {
    issue("error", `surface:${surface.id}.primaryRecipe`, `${surface.id} must select an approved primary recipe.`);
  }
  validateExperienceTier("surface", surface);
}

for (const governed of gates.governedSurfaces ?? []) {
  if (!governed.owner) issue("error", `governed:${governed.id}.owner`, `${governed.id} must declare owner.`);
  if (!governed.reviewer) issue("error", `governed:${governed.id}.reviewer`, `${governed.id} must declare reviewer.`);
  if (!approvedWorkspaces.has(governed.workspace)) issue("error", `governed:${governed.id}.workspace`, `${governed.id} uses unapproved workspace.`);
  validateShellRouteModel("governed", governed);
  validateShellVisualContract("governed", governed);
  validateImplementationMode("governed", governed);
  validateExperienceTier("governed", governed);
  if (!approvedRecipes.has(governed.primaryRecipe)) issue("error", `governed:${governed.id}.recipe`, `${governed.id} must select an approved primary recipe.`);

  if (governed.contractId === "pending") {
    if (!exceptionBySurfaceGate.has(`${governed.id}:data-contract`)) {
      issue("error", `governed:${governed.id}.contract`, `${governed.id} has pending contract without data-contract exception.`);
    }
  } else if (!contractIds.has(governed.contractId)) {
    issue("error", `governed:${governed.id}.contract`, `${governed.id} references missing contract ${governed.contractId}.`);
  }

  if (governed.proofRequired && !proofIds.has(governed.proofRegistryId)) {
    issue("error", `governed:${governed.id}.proof`, `${governed.id} references missing proof registry id ${governed.proofRegistryId}.`);
  }

  if ((governed.visualQualityTarget ?? 0) < 90) {
    issue("warning", `governed:${governed.id}.visualQualityTarget`, `${governed.id} should target visual quality >= 90.`);
  }

  if (!Array.isArray(governed.adoptionEvidence) || governed.adoptionEvidence.length === 0) {
    issue("error", `governed:${governed.id}.adoptionEvidence`, `${governed.id} must declare adoption evidence.`);
  }
}

for (const capability of gates.governedCapabilities ?? []) {
  if (!capability.owner) issue("error", `capability:${capability.id}.owner`, `${capability.id} must declare owner.`);
  if (!capability.reviewer) issue("error", `capability:${capability.id}.reviewer`, `${capability.id} must declare reviewer.`);
  if (!capability.contractPath || !fs.existsSync(path.join(root, capability.contractPath))) {
    issue("error", `capability:${capability.id}.contractPath`, `${capability.id} references missing contract path.`);
  }
  if (!capability.validationCommand) issue("error", `capability:${capability.id}.validationCommand`, `${capability.id} must declare validation command.`);
}

const today = new Date("2026-07-30T00:00:00.000Z");
for (const exception of exceptions) {
  for (const field of ["id", "surfaceId", "gate", "owner", "reviewer", "reason", "expiresOn", "replacementPlan"]) {
    if (!exception[field]) issue("error", `exception:${exception.id ?? "unknown"}.${field}`, `Exception must declare ${field}.`);
  }
  if (exception.expiresOn) {
    const expires = new Date(`${exception.expiresOn}T00:00:00.000Z`);
    if (Number.isNaN(expires.getTime())) {
      issue("error", `exception:${exception.id}.expiresOn`, `${exception.id} has invalid expiresOn date.`);
    } else if (expires < today) {
      issue("error", `exception:${exception.id}.expired`, `${exception.id} expired on ${exception.expiresOn}.`);
    }
  }
}

finish();

function validateShellRouteModel(kind, surface) {
  if (!surface.canonicalRoute || typeof surface.canonicalRoute !== "string") {
    issue("error", `${kind}:${surface.id}.canonicalRoute`, `${surface.id} must declare canonicalRoute for the single-shell route model.`);
  }
  if (!surface.shellModel || !approvedShellModels.has(surface.shellModel)) {
    issue("error", `${kind}:${surface.id}.shellModel`, `${surface.id} must declare shellModel as one of: ${Array.from(approvedShellModels).join(", ")}.`);
  }
  if (surface.shellModel === "single-shell" && Array.isArray(surface.legacyRoutes) && surface.legacyRoutes.includes(surface.canonicalRoute)) {
    issue("error", `${kind}:${surface.id}.legacyRoutes`, `${surface.id} cannot list its canonicalRoute as a legacy route.`);
  }
  if (surface.shellModel === "single-shell" && surface.canonicalRoute && !String(surface.canonicalRoute).startsWith("/")) {
    issue("error", `${kind}:${surface.id}.canonicalRoute.format`, `${surface.id} canonicalRoute must be an absolute app route.`);
  }
  if (surface.legacyRoutes !== undefined && !Array.isArray(surface.legacyRoutes)) {
    issue("error", `${kind}:${surface.id}.legacyRoutes.format`, `${surface.id} legacyRoutes must be an array when declared.`);
  }
}

function validateShellVisualContract(kind, surface) {
  const target =
    Number(surface.targetExperienceTier);
  if (target < 3) return;

  if (!surface.shellVisualContract || typeof surface.shellVisualContract !== "object") {
    issue("warning", `${kind}:${surface.id}.shellVisualContract`, `${surface.id} targets Tier 3 and should declare sidebar/header/overflow visual shell expectations.`);
    return;
  }

  for (const field of ["sidebar", "header", "overflow"]) {
    if (!surface.shellVisualContract[field]) {
      issue("warning", `${kind}:${surface.id}.shellVisualContract.${field}`, `${surface.id} Tier 3 shell visual contract should declare ${field}.`);
    }
  }
}

function validateExperienceTier(kind, surface) {
  const current =
    Number(surface.currentExperienceTier);
  const target =
    Number(surface.targetExperienceTier);

  if (!approvedExperienceTiers.has(current)) {
    issue("error", `${kind}:${surface.id}.currentExperienceTier`, `${surface.id} must declare currentExperienceTier as 0, 1, 2, or 3.`);
  }
  if (!approvedExperienceTiers.has(target)) {
    issue("error", `${kind}:${surface.id}.targetExperienceTier`, `${surface.id} must declare targetExperienceTier as 0, 1, 2, or 3.`);
  }
  if (approvedExperienceTiers.has(current) && approvedExperienceTiers.has(target) && current < target && surface.tierMigrationRequired !== true) {
    issue("error", `${kind}:${surface.id}.tierMigrationRequired`, `${surface.id} is below target tier and must declare tierMigrationRequired: true.`);
  }
  if (approvedExperienceTiers.has(current) && approvedExperienceTiers.has(target) && current < target && !surface.tierMigrationNote) {
    issue("warning", `${kind}:${surface.id}.tierMigrationNote`, `${surface.id} should explain what blocks the target experience tier.`);
  }
  if (approvedExperienceTiers.has(current) && approvedExperienceTiers.has(target) && current >= target && surface.tierMigrationRequired === true) {
    issue("warning", `${kind}:${surface.id}.tierMigrationRequired`, `${surface.id} is at or above target tier but still declares migration required.`);
  }
}

function validateImplementationMode(kind, surface) {
  if (!surface.implementationMode || !approvedImplementationModes.has(surface.implementationMode)) {
    issue("error", `${kind}:${surface.id}.implementationMode`, `${surface.id} must declare implementationMode as one of: ${Array.from(approvedImplementationModes).join(", ")}.`);
  }

  if (surface.targetExperienceBand && !approvedTargetBands.has(surface.targetExperienceBand)) {
    issue("error", `${kind}:${surface.id}.targetExperienceBand`, `${surface.id} has invalid targetExperienceBand ${surface.targetExperienceBand}.`);
  }

  if (Number(surface.targetExperienceTier) >= 3 && surface.mobbinReferenceRequired !== true) {
    issue("warning", `${kind}:${surface.id}.mobbinReferenceRequired`, `${surface.id} targets Tier 3 and should require Mobbin/reference evidence before material redesign work.`);
  }

  if (surface.targetExperienceBand === "T3C" && surface.packageNativeRequired !== true) {
    issue("error", `${kind}:${surface.id}.packageNativeRequired`, `${surface.id} targets T3C and must declare packageNativeRequired: true.`);
  }

  if (surface.implementationMode === "server-rendered-legacy" && Number(surface.targetExperienceTier) >= 3 && !surface.tierMigrationRequired) {
    issue("error", `${kind}:${surface.id}.serverRenderedTier3`, `${surface.id} cannot target Tier 3 as server-rendered legacy without tierMigrationRequired: true.`);
  }

  if (surface.implementationMode !== "package-native" && surface.targetExperienceBand === "T3C" && !surface.bridgeStatus) {
    issue("warning", `${kind}:${surface.id}.bridgeStatus`, `${surface.id} targets T3C but is not package-native yet; declare bridgeStatus.`);
  }
}

function finish() {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;

  for (const item of issues) {
    console.log(`${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  }

  console.log(`Dashboard governance validation: ${errorCount} error(s), ${warningCount} warning(s).`);
  if (errorCount > 0) process.exit(1);
}
