#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const contractPath = path.join(repoRoot, "docs/plans/cp04-runtime-intelligence-maturity.json");
const markdownPath = path.join(repoRoot, "docs/plans/cp04-runtime-intelligence-maturity.md");
const backendPath = path.join(repoRoot, "hermes_cli/system_warehouse.py");
const frontendTypePath = path.join(repoRoot, "web/src/lib/system-warehouse.ts");
const dashboardPath = path.join(repoRoot, "web/src/pages/SystemOperationsPage.tsx");
const packagePath = path.join(repoRoot, "package.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const phaseArg = process.argv.find((arg) => arg.startsWith("--phase="))?.slice("--phase=".length);

function fail(message) {
  console.error(`CP04 runtime intelligence validation failed: ${message}`);
  process.exitCode = 1;
}

function hasText(filePath, phrases) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const phrase of phrases) {
    if (!text.includes(phrase)) fail(`${path.relative(repoRoot, filePath)} missing phrase: ${phrase}`);
  }
}

if (contract.canonicalPlan !== "CP-04") fail("contract must map to CP-04");
if (contract.track !== "runtime-intelligence-maturity") fail("contract track mismatch");
if (!fs.existsSync(markdownPath)) fail("markdown plan is missing");
if (contract.runtimeSummaryField !== "cp04Runtime") fail("runtime summary field must be cp04Runtime");
if ((contract.phases ?? []).length !== 20) fail("contract must include all 20 phases");

for (const phase of contract.phases ?? []) {
  if (phase.status !== "built") fail(`${phase.id} must be built`);
  if (!phase.test) fail(`${phase.id} missing test description`);
}

if (phaseArg) {
  const phase = contract.phases?.find((candidate) => candidate.id === phaseArg);
  if (!phase) fail(`unknown phase requested: ${phaseArg}`);
}

for (const field of contract.requiredRuntimeFields ?? []) {
  hasText(backendPath, [`"${field}"`]);
  hasText(frontendTypePath, [`${field}`]);
}

for (const fn of contract.automationFunctions ?? []) {
  hasText(backendPath, [`def ${fn}`]);
}

for (const command of contract.automationCommands ?? []) {
  if (!packageJson.scripts?.[command]) fail(`package script missing: ${command}`);
}

hasText(backendPath, [
  "def _cp04_runtime_intelligence",
  "def record_cp04_automation_cycle",
  "def cp04_deploy_gate_check",
  "def record_cp04_prune_approval_packet",
  "def record_cp04_game_day_drill",
  "def cp04_discord_alert_contract",
  "\"runtimeDependency\": False",
  "\"deployDependency\": False",
  "\"defaultDestructiveMode\": \"disabled\"",
  "\"approvalRequired\": True",
  "\"localOfflineOutcome\"",
  "\"externalMirror.mustNotBlockRuntime\"",
]);

hasText(dashboardPath, [
  "CP04 runtime decisions",
  "CP04 phase certification",
  "Executive CP04 packet",
  "summary.cp04Runtime ?? fallbackCp04Runtime(summary)",
  "cp04Runtime.mirrorContinuity.state",
  "cp04Runtime.deployGate",
  "cp04Runtime.pruneGate",
  "cp04Runtime.runtimeCertification.phases",
]);

for (const section of contract.requiredDashboardSections ?? []) {
  const lookup = section
    .replace("safe-to-deploy decision", "deployGate")
    .replace("safe-to-prune decision", "pruneGate")
    .replace("durability tier cards", "durabilityTiers")
    .replace("mirror continuity status", "mirrorContinuity")
    .replace("data quality score", "dataQuality")
    .replace("recovery confidence", "recoveryConfidence")
    .replace("SLO error budget", "sloBudget")
    .replace("remediation suggestions", "remediation")
    .replace("executive CP04 packet", "executivePacket")
    .replace("phase certification", "runtimeCertification");
  if (!fs.readFileSync(backendPath, "utf8").includes(lookup) && !fs.readFileSync(dashboardPath, "utf8").includes(lookup)) {
    fail(`dashboard/runtime section missing: ${section}`);
  }
}

if (!process.exitCode) {
  if (phaseArg) {
    const phase = contract.phases.find((candidate) => candidate.id === phaseArg);
    console.log(`CP04 runtime intelligence phase validation passed: ${phase.id} ${phase.name}`);
  } else {
    console.log(`CP04 runtime intelligence validation passed: ${contract.phases.length} phases`);
  }
}
