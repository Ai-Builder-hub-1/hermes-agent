#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const workspaceRoot = "/Users/hq/Workspace/projects";
const contractPath = path.join(repoRoot, "docs/plans/cp04-production-independent-warehouse-durability.json");
const markdownPath = path.join(repoRoot, "docs/plans/cp04-production-independent-warehouse-durability.md");
const truthPath = path.join(repoRoot, "docs/plans/cross-project-warehouse-truth-contract.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const truth = JSON.parse(fs.readFileSync(truthPath, "utf8"));
const phaseArg = process.argv.find((arg) => arg.startsWith("--phase="))?.slice("--phase=".length);

function fail(message) {
  console.error(`CP04 production-independent durability validation failed: ${message}`);
  process.exitCode = 1;
}

function hasText(filePath, phrases) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const phrase of phrases) {
    if (!text.includes(phrase)) fail(`${filePath} missing phrase: ${phrase}`);
  }
}

if (contract.canonicalPlan !== "CP-04") fail("contract must map to CP-04");
if (!fs.existsSync(markdownPath)) fail("markdown plan is missing");

const tierIds = new Set(contract.durabilityTiers?.map((tier) => tier.id));
for (const tier of [
  "tier-0-production-db",
  "tier-1-production-local-backup-archive",
  "tier-2-external-warehouse-mirror",
  "tier-3-historical-cold-archive",
]) {
  if (!tierIds.has(tier)) fail(`missing durability tier: ${tier}`);
}

const mirrorTier = contract.durabilityTiers?.find((tier) => tier.id === "tier-2-external-warehouse-mirror");
if (!mirrorTier) fail("missing external mirror tier");
if (mirrorTier?.runtimeDependency !== false) fail("external mirror must not be a runtime dependency");
if (mirrorTier?.deployDependency !== false) fail("external mirror must not be a deploy dependency");

const gateClasses = new Map(contract.gateClasses?.map((gate) => [gate.id, gate]));
for (const gate of ["runtime", "deploy", "prune", "mirror", "continuity"]) {
  if (!gateClasses.has(gate)) fail(`missing gate class: ${gate}`);
}
const mirrorGate = gateClasses.get("mirror");
if (mirrorGate?.blocksRuntime !== false) fail("mirror gate must not block runtime");
if (mirrorGate?.blocksDeploy !== false) fail("mirror gate must not block deploy");

for (const phrase of [
  "External warehouse mirror absence must not stop production collectors.",
  "External warehouse mirror absence must not block deployments when production-local backup and restore proof are fresh.",
]) {
  if (!contract.nonDependencyRules?.includes(phrase)) fail(`missing non-dependency rule: ${phrase}`);
}

const projectStandards = new Map(contract.projectProductionLocalStandards?.map((item) => [item.project, item]));
for (const [project, minimum] of [
  ["investing-system", 5],
  ["khashi-vc", 5],
  ["nous-hermes-agent", 4],
]) {
  const standard = projectStandards.get(project);
  if (!standard) fail(`missing production-local standard for ${project}`);
  if ((standard.requiredProofs ?? []).length < minimum) fail(`${project} must list at least ${minimum} production-local proofs`);
}

if (contract.mirrorBehavior?.mode !== "pull-based-catch-up") fail("mirror behavior must be pull-based catch-up");
for (const state of ["disconnected", "stale", "catching-up", "verified", "blocked"]) {
  if (!contract.mirrorBehavior?.states?.includes(state)) fail(`mirror behavior missing state: ${state}`);
}
for (const blocked of ["production collectors", "production deployment", "production-local backup creation"]) {
  if (!contract.mirrorBehavior?.mustNotBlock?.includes(blocked)) fail(`mirror mustNotBlock missing: ${blocked}`);
}

for (const requirement of [
  "tier health",
  "production backup freshness",
  "restore proof age",
  "external mirror lag",
  "safe-to-deploy card",
  "safe-to-prune card",
]) {
  if (!contract.dashboardRequirements?.includes(requirement)) fail(`dashboard requirement missing: ${requirement}`);
}

for (const requirement of [
  "production backup within SLO",
  "restore proof within SLO",
  "rollback or migration proof when schema changed",
  "production disk headroom",
  "service health check",
]) {
  if (!contract.deployGate?.requires?.includes(requirement)) fail(`deploy gate missing requirement: ${requirement}`);
}
for (const forbidden of ["external drive mounted", "local warehouse current", "local computer online"]) {
  if (!contract.deployGate?.doesNotRequire?.includes(forbidden)) fail(`deploy gate must not require: ${forbidden}`);
}

if (contract.pruneGate?.defaultDestructiveMode !== "disabled") fail("destructive pruning must remain disabled by default");
for (const requirement of [
  "production backup fresh",
  "archive bundle verified",
  "restore proof fresh",
  "dry-run candidate hash",
  "explicit scoped approval packet",
  "post-prune verification",
]) {
  if (!contract.pruneGate?.requires?.includes(requirement)) fail(`prune gate missing requirement: ${requirement}`);
}

for (const field of ["project", "dataset", "tier", "gateClass", "severity", "observedAt", "nextAction"]) {
  if (!contract.alertContract?.requiredFields?.includes(field)) fail(`alert contract missing field: ${field}`);
}

for (const drill of [
  "local computer off",
  "external drive unplugged",
  "production deploy with mirror stale",
  "production backup missing",
  "restore proof stale",
  "disk above warning threshold",
  "collector stops writing",
  "mirror reconnect catch-up",
]) {
  if (!contract.failureDrills?.includes(drill)) fail(`missing failure drill: ${drill}`);
}

if ((contract.phases ?? []).length !== 10) fail("contract must include all 10 phases");
for (const phase of contract.phases ?? []) {
  if (phase.status !== "built") fail(`${phase.id} must be built`);
  if (!phase.test) fail(`${phase.id} missing test description`);
}
if (phaseArg) {
  const phase = contract.phases?.find((candidate) => candidate.id === phaseArg);
  if (!phase) fail(`unknown phase requested: ${phaseArg}`);
}

if (!truth.productionIndependenceContract || truth.productionIndependenceContract !== "cp04-production-independent-warehouse-durability") {
  fail("warehouse truth contract must reference production independence contract");
}

hasText(path.join(workspaceRoot, "investing-system/docs/ops/INVESTING_STORAGE_MATURITY_RUNBOOK.md"), [
  "Production runtime and deployment do not depend on the external drive",
  "External mirror lag is a warning",
]);
hasText(path.join(workspaceRoot, "khashi-vc/docs/ops/KHASHI_STORAGE_MATURITY_RUNBOOK.md"), [
  "Production runtime and deployment do not depend on the external drive",
  "External mirror lag is a warning",
]);

if (!process.exitCode) {
  if (phaseArg) {
    const phase = contract.phases.find((candidate) => candidate.id === phaseArg);
    console.log(`CP04 production-independent durability phase validation passed: ${phase.id} ${phase.name}`);
  } else {
    console.log(`CP04 production-independent durability validation passed: ${contract.phases.length} phases, ${contract.durabilityTiers.length} tiers`);
  }
}
