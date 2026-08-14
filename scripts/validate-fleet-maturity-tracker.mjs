#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root } from "./dashboard-report-utils.mjs";

const fleetDir = path.join(root, "docs/fleet");
const files = {
  registry: path.join(fleetDir, "fleet-registry.json"),
  evidence: path.join(fleetDir, "fleet-evidence-ledger.json"),
  workGraph: path.join(fleetDir, "fleet-maturity-work-graph.json"),
  suggestions: path.join(fleetDir, "fleet-maturity-suggestions.json"),
  statusMd: path.join(fleetDir, "fleet-maturity-status.md"),
  workGraphMd: path.join(fleetDir, "fleet-maturity-work-graph.md"),
  suggestionsMd: path.join(fleetDir, "fleet-maturity-suggestions.md")
};

const requiredProjects = [
  "tlc-capital-group-os",
  "nous-hermes-agent",
  "hermes-os",
  "media-engine",
  "media-business-operations",
  "khashi-vc",
  "business-mapper",
  "meal-assistant",
  "rinseables-os",
  "investing-system"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function issue(severity, code, message, detail = {}) {
  return { severity, code, message, ...detail };
}

const issues = [];

for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    issues.push(issue("error", "file.missing", `Missing ${key}: ${path.relative(root, file)}`));
  }
}

const registry = fs.existsSync(files.registry) ? readJson(files.registry) : { projects: [] };
const evidence = fs.existsSync(files.evidence) ? readJson(files.evidence) : { entries: [] };
const workGraph = fs.existsSync(files.workGraph) ? readJson(files.workGraph) : { items: [] };
const suggestions = fs.existsSync(files.suggestions) ? readJson(files.suggestions) : { suggestions: [] };

const projectIds = new Set((registry.projects ?? []).map((project) => project.id));

for (const projectId of requiredProjects) {
  if (!projectIds.has(projectId)) {
    issues.push(issue("error", "project.missing", `Fleet registry is missing required project ${projectId}.`));
  }
}

for (const project of registry.projects ?? []) {
  for (const field of ["id", "name", "repo", "ownerSystem", "maturityRole"]) {
    if (!project[field]) issues.push(issue("error", "project.fieldMissing", `${project.id ?? "unknown"} missing ${field}.`));
  }
  for (const field of ["visual", "productMaturity", "companyOsMaturity"]) {
    if (!project[field]) issues.push(issue("error", "project.maturityFieldMissing", `${project.id} missing ${field}.`));
  }
  if (project.visual && (!project.visual.visualTier || !project.visual.targetVisualTier || !project.visual.status)) {
    issues.push(issue("error", "project.visualInvalid", `${project.id} visual maturity must include visualTier, targetVisualTier, and status.`));
  }
  if (project.productMaturity && (!project.productMaturity.productTier || !project.productMaturity.targetProductTier || !project.productMaturity.status)) {
    issues.push(issue("error", "project.productMaturityInvalid", `${project.id} product maturity must include productTier, targetProductTier, and status.`));
  }
  if (project.companyOsMaturity && (!project.companyOsMaturity.companyOsTier || !project.companyOsMaturity.targetCompanyOsTier || !project.companyOsMaturity.status)) {
    issues.push(issue("error", "project.companyOsMaturityInvalid", `${project.id} company OS maturity must include companyOsTier, targetCompanyOsTier, and status.`));
  }
  for (const field of ["service", "url", "healthUrl"]) {
    if (!project.production?.[field]) issues.push(issue("warning", "production.fieldMissing", `${project.id} missing production.${field}.`));
  }
  for (const relationship of project.relationships ?? []) {
    if (relationship.target !== "*" && !projectIds.has(relationship.target)) {
      issues.push(issue("error", "relationship.targetMissing", `${project.id} relationship target does not exist: ${relationship.target}`));
    }
  }
}

const evidenceKeys = new Set();
for (const entry of evidence.entries ?? []) {
  evidenceKeys.add(`${entry.projectId}.${entry.kind}`);
  if (!projectIds.has(entry.projectId)) issues.push(issue("error", "evidence.projectMissing", `${entry.id} references unknown project ${entry.projectId}.`));
  if (!["current", "missing", "stale", "blocked", "not-applicable", "needs-review"].includes(entry.status)) {
    issues.push(issue("error", "evidence.invalidStatus", `${entry.id} has invalid status ${entry.status}.`));
  }
  if (String(entry.source ?? "").toLowerCase().includes("vercel")) {
    issues.push(issue("error", "evidence.vercelReference", `${entry.id} references Vercel.`));
  }
}

for (const projectId of projectIds) {
  for (const kind of evidence.evidenceKinds ?? []) {
    if (!evidenceKeys.has(`${projectId}.${kind}`)) {
      issues.push(issue("error", "evidence.kindMissing", `${projectId} missing evidence kind ${kind}.`));
    }
  }
  for (const kind of ["visual-maturity", "product-maturity", "company-os-maturity"]) {
    if (!evidenceKeys.has(`${projectId}.${kind}`)) {
      issues.push(issue("error", "evidence.maturityKindMissing", `${projectId} missing maturity evidence kind ${kind}.`));
    }
  }
}

const workItemIds = new Set();
for (const item of workGraph.items ?? []) {
  workItemIds.add(item.id);
  if (!projectIds.has(item.ownerProject)) issues.push(issue("error", "work.ownerMissing", `${item.id} has unknown owner ${item.ownerProject}.`));
  if (item.sourceProject && item.sourceProject !== "*" && !projectIds.has(item.sourceProject)) {
    issues.push(issue("error", "work.sourceMissing", `${item.id} has unknown source ${item.sourceProject}.`));
  }
  for (const affected of item.affectedProjects ?? []) {
    if (!projectIds.has(affected)) issues.push(issue("error", "work.affectedMissing", `${item.id} has unknown affected project ${affected}.`));
  }
  if (!Array.isArray(item.evidenceRequiredToClose)) {
    issues.push(issue("error", "work.evidenceRequiredInvalid", `${item.id} must declare evidenceRequiredToClose array.`));
  }
}

for (const suggestion of suggestions.suggestions ?? []) {
  if (!workItemIds.has(suggestion.workItemId)) {
    issues.push(issue("error", "suggestion.workItemMissing", `${suggestion.id} references unknown work item ${suggestion.workItemId}.`));
  }
  if (!["ready-to-build", "recommended", "needs-human-decision", "blocked-by-credential", "defer", "not-needed"].includes(suggestion.status)) {
    issues.push(issue("error", "suggestion.invalidStatus", `${suggestion.id} has invalid status ${suggestion.status}.`));
  }
}

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (/vercel/i.test(content)) {
    issues.push(issue("error", "file.vercelReference", `${path.relative(root, file)} contains a Vercel reference.`));
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Fleet maturity tracker validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) {
  console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
}
if (!errors.length) {
  console.log(`Validated ${path.relative(root, fleetDir)}`);
}
if (errors.length) process.exit(1);
