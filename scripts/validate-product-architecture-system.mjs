#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const issues = [];

const requiredFiles = [
  "docs/design/product-architecture-system-handbook.md",
  "docs/design/product-architecture-standards-current-assessment.md",
  "docs/design/product-architecture-ai-instruction-pack.md",
  "experience-audit/repository-map.yaml",
  "experience-audit/evidence-ledger.yaml",
  "experience-audit/feature-traces.yaml",
  "experience-audit/standards-maturity.yaml",
  "experience-audit/standards-source-register.yaml",
  "experience-audit/product-architecture-standards-registry.yaml",
  "experience-audit/product-architecture-gap-register.yaml",
  "experience-audit/product-architecture-adoption-plan.yaml",
  "experience-audit/architecture-health-dashboard.yaml",
  "experience-audit/dependency-graph.yaml",
  "scripts/validate-dashboard-governance.mjs",
];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    issue("error", `missing:${relativePath}`, `${relativePath} is required by the Product Architecture System.`);
  }
}

if (hasErrors()) finish();

for (const relativePath of requiredFiles.filter((file) => file.endsWith(".yaml"))) {
  try {
    const doc = readYaml(relativePath);
    if (!doc || doc.schemaVersion !== 1) issue("error", `schema:${relativePath}`, `${relativePath} must declare schemaVersion: 1.`);
  } catch (error) {
    issue("error", `yaml:${relativePath}`, `${relativePath} failed to parse: ${error.message}`);
  }
}

if (hasErrors()) finish();

const sourceRegister = readYaml("experience-audit/standards-source-register.yaml");
const sourceIds = new Set((sourceRegister.sources ?? []).map((source) => source.id));
for (const id of ["S01", "S03", "S05", "S08", "S10", "S11", "S13"]) {
  if (!sourceIds.has(id)) issue("error", `source:${id}`, `Source register is missing required source ${id}.`);
}

const registry = readYaml("experience-audit/product-architecture-standards-registry.yaml");
const rules = registry.rules ?? [];
const requiredClasses = [
  "principles",
  "foundations",
  "interface-system",
  "product-domain",
  "information-composition",
  "state",
  "data-api",
  "interaction-loading-errors",
  "responsive-adaptive",
  "accessibility",
  "performance-reliability",
  "security-privacy",
  "observability",
  "ai-assisted-engineering",
  "quality-testing-review",
  "governance-lifecycle",
  "enforcement",
];
const ruleClasses = new Set(rules.map((rule) => rule.class));
for (const classId of requiredClasses) {
  if (!ruleClasses.has(classId)) issue("error", `rule-class:${classId}`, `Standards registry must include at least one rule for ${classId}.`);
}

for (const rule of rules) {
  if (!rule.id || !rule.class || !rule.status || !rule.level || !rule.rule || !rule.owner) {
    issue("error", `rule:${rule.id ?? "unknown"}`, "Each rule must declare id, class, status, level, rule, and owner.");
  }
  if (rule.level === "MUST" && (!Array.isArray(rule.verification) || rule.verification.length === 0)) {
    issue("error", `rule:${rule.id}.verification`, "Every MUST rule needs at least one verification mechanism.");
  }
  for (const sourceId of rule.sources ?? []) {
    if (!sourceIds.has(sourceId)) issue("error", `rule:${rule.id}.source:${sourceId}`, `${rule.id} references missing source ${sourceId}.`);
  }
}

const maturity = readYaml("experience-audit/standards-maturity.yaml");
const maturityClasses = new Set((maturity.classes ?? []).map((item) => item.id));
for (const classId of requiredClasses) {
  if (!maturityClasses.has(classId)) issue("error", `maturity:${classId}`, `Maturity matrix must include ${classId}.`);
}

const traces = readYaml("experience-audit/feature-traces.yaml").featureTraces ?? [];
if (traces.length < 6) issue("error", "traces.minimum", "At least six vertical feature traces are required.");
for (const trace of traces) {
  for (const field of ["id", "type", "surface", "userGoal", "routeOrModule", "sourceData", "schema", "stateMachine", "permissions", "telemetry", "accessibility", "evidence"]) {
    if (!trace[field]) issue("error", `trace:${trace.id ?? "unknown"}.${field}`, `Feature trace must declare ${field}.`);
  }
}

const gapRegister = readYaml("experience-audit/product-architecture-gap-register.yaml");
for (const gap of gapRegister.gaps ?? []) {
  for (const field of ["id", "standardId", "currentMaturity", "targetMaturity", "severity", "blastRadius", "owner", "dependencies", "evidence", "acceptanceEvidence", "status"]) {
    if (gap[field] === undefined) issue("error", `gap:${gap.id ?? "unknown"}.${field}`, `Gap must declare ${field}.`);
  }
}

const adoption = readYaml("experience-audit/product-architecture-adoption-plan.yaml");
if ((adoption.adoptionClusters ?? []).length < 3) issue("error", "adoption.clusters", "Adoption plan must cover at least three priority clusters.");

const health = readYaml("experience-audit/architecture-health-dashboard.yaml");
for (const widget of health.widgets ?? []) {
  if (!widget.id || !widget.dataSource || !fs.existsSync(path.join(root, widget.dataSource))) {
    issue("error", `health:${widget.id ?? "unknown"}`, "Health dashboard widgets must reference existing data sources.");
  }
}

const assessment = readText("docs/design/product-architecture-standards-current-assessment.md");
for (const marker of ["Repository and runtime evidence index", "Current architecture map", "Six vertical feature traces", "Standards maturity matrix", "Gap register and dependency graph", "Recommended first build stretch"]) {
  if (!assessment.includes(marker)) issue("error", `assessment:${marker}`, `Assessment must include ${marker}.`);
}

finish();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readYaml(relativePath) {
  return yaml.load(readText(relativePath));
}

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function hasErrors() {
  return issues.some((item) => item.severity === "error");
}

function finish() {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  for (const item of issues) console.log(`${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  console.log(`Product Architecture System validation: ${errorCount} error(s), ${warningCount} warning(s).`);
  if (errorCount > 0) process.exit(1);
}
