#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const requiredFiles = [
  "docs/design/kaoshi-experience-architecture-comparison.md",
  "docs/design/kaoshi-experience-architecture-build-plan.md",
  "docs/design/kaoshi-experience-architecture-gap-register.json",
  "docs/design/kaoshi-experience-contract-standard.md",
  "docs/design/kaoshi-visualization-decision-system.md",
  "docs/design/kaoshi-live-data-reference-capability.md",
  "docs/design/dashboard-governance-and-enforcement.md",
  "docs/design/dashboard-admission-rfc-template.md",
  "experience-audit/repository-map.yaml",
  "experience-audit/surfaces.yaml",
  "experience-audit/components.yaml",
  "experience-audit/visualizations.yaml",
  "experience-audit/contracts.yaml",
  "experience-audit/gaps.yaml",
  "experience-audit/decisions.yaml",
  "experience-audit/roadmap.yaml",
  "experience-audit/evidence-ledger.yaml",
  "experience-audit/feature-traces.yaml",
  "experience-audit/dependency-graph.yaml",
  "experience-audit/verification-pack.yaml",
  "experience-audit/experience-contract.schema.json",
  "experience-audit/experience-contracts.yaml",
  "experience-audit/visualization-intent-matrix.yaml",
  "experience-audit/live-data-reference.yaml",
  "experience-audit/governance-gates.yaml",
];

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

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    issue("error", `missing:${relativePath}`, `${relativePath} is required.`);
  }
}

if (issues.some((item) => item.severity === "error")) {
  finish();
}

for (const relativePath of requiredFiles.filter((item) => item.endsWith(".yaml"))) {
  try {
    const doc = readYaml(relativePath);
    if (!doc || doc.schemaVersion !== 1) issue("error", `schemaVersion:${relativePath}`, `${relativePath} must declare schemaVersion: 1.`);
  } catch (error) {
    issue("error", `yaml:${relativePath}`, `${relativePath} failed to parse: ${error.message}`);
  }
}

for (const relativePath of requiredFiles.filter((item) => item.endsWith(".json"))) {
  try {
    readJson(relativePath);
  } catch (error) {
    issue("error", `json:${relativePath}`, `${relativePath} failed to parse: ${error.message}`);
  }
}

const plan = read("docs/design/kaoshi-experience-architecture-build-plan.md");
for (const marker of [
  "| V1 | Evidence and architecture baseline | Complete |",
  "| V2 | Experience contract foundation | Complete |",
  "| V3 | Visualization decision and wrapper layer | Complete |",
  "| V4 | Live-data reference capability | Complete - central standard plus Kashi VC live reference implemented |",
  "| V5 | Screen-level Kashi reference migration | Live Market Intelligence reference complete with Kashi-owned contracts and production proof |",
  "| V6 | Governance and enforcement | Complete - admission gates, ownership, proof, exceptions, and strict local validation are in place |",
]) {
  if (!plan.includes(marker)) issue("error", `plan-marker:${marker}`, `Build plan is missing completed marker: ${marker}`);
}

const traces = readYaml("experience-audit/feature-traces.yaml").featureTraces ?? [];
const requiredTraceTypes = new Set(["simple-crud", "analytical-dashboard", "live-or-frequently-refreshed", "ai-assisted-workflow", "high-risk-action"]);
for (const traceType of requiredTraceTypes) {
  if (!traces.some((trace) => trace.type === traceType)) {
    issue("error", `feature-trace:${traceType}`, `Missing required feature trace type: ${traceType}`);
  }
}

const contracts = readYaml("experience-audit/experience-contracts.yaml").contracts ?? [];
if (!contracts.some((contract) => contract.id === "khashi-vc.market-intelligence-live")) {
  issue("error", "contract:khashi-reference", "Kashi Market Intelligence draft experience contract is required.");
}

for (const contract of contracts) {
  for (const family of ["purpose", "data", "state", "interaction", "freshness", "responsive", "accessibility", "performance", "security", "observability", "quality", "governance"]) {
    if (!contract[family]) issue("error", `contract:${contract.id}.${family}`, `${contract.id} is missing ${family}.`);
  }
}

const matrix = readYaml("experience-audit/visualization-intent-matrix.yaml");
const familyIds = new Set((matrix.families ?? []).map((family) => family.id));
for (const family of ["time-series", "market-microstructure", "category-comparison", "distribution", "forecast-uncertainty", "flow-dependency", "executive-finance", "readiness-quality"]) {
  if (!familyIds.has(family)) issue("error", `visualization-family:${family}`, `Visualization matrix missing ${family}.`);
}

const live = readYaml("experience-audit/live-data-reference.yaml");
if ((live.liveTable?.paginationRequiredWhenRowsExceed ?? 0) <= 0) {
  issue("error", "live.pagination", "Live data reference must define pagination threshold.");
}
if ((live.snapshotSeries?.minimumForMovementChart ?? 0) < 2) {
  issue("error", "live.snapshotSeries.minimumForMovementChart", "Movement charts must require at least two snapshots.");
}

const governance = readYaml("experience-audit/governance-gates.yaml");
const requiredGovernanceGates = new Set(["owner-reviewer", "workspace-mapping", "recipe-selection", "data-contract", "interaction-contract", "proof-route", "visual-quality", "adoption-reporting", "exception-review"]);
const governanceGateIds = new Set((governance.requiredGates ?? []).map((gate) => gate.id));
for (const gateId of requiredGovernanceGates) {
  if (!governanceGateIds.has(gateId)) issue("error", `governance-gate:${gateId}`, `Governance gates missing ${gateId}.`);
}
if (!(governance.governedSurfaces ?? []).some((surface) => surface.id === "khashi-vc.market-intelligence-live" && surface.proofRegistryId === "khashi-vc.roc")) {
  issue("error", "governance.khashi-reference", "Governance registry must include Kashi live Market Intelligence proof reference.");
}

const designContract = read("packages/hermes-dashboard-kit/DESIGN.md");
for (const doc of [
  "docs/design/kaoshi-experience-architecture-comparison.md",
  "docs/design/kaoshi-experience-architecture-build-plan.md",
  "docs/design/kaoshi-experience-architecture-gap-register.json",
]) {
  if (!designContract.includes(doc)) issue("warning", `design-reference:${doc}`, `DESIGN.md should reference ${doc}.`);
}

finish();

function finish() {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;

  for (const item of issues) {
    console.log(`${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  }

  console.log(`Kaoshi experience architecture validation: ${errorCount} error(s), ${warningCount} warning(s).`);
  if (errorCount > 0) process.exit(1);
}
