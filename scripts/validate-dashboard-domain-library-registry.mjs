#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "docs/design/dashboard-domain-library-registry.json");
const standardPath = path.join(root, "docs/design/dashboard-domain-library-standard.md");
const rfcTemplatePath = path.join(root, "docs/design/dashboard-domain-library-admission-rfc-template.md");
const issues = [];

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

if (!fs.existsSync(registryPath)) {
  issue("error", "registry.missing", "docs/design/dashboard-domain-library-registry.json is required.");
  finish();
}

if (!fs.existsSync(standardPath)) {
  issue("error", "standard.missing", "docs/design/dashboard-domain-library-standard.md is required.");
}

if (!fs.existsSync(rfcTemplatePath)) {
  issue("error", "rfcTemplate.missing", "docs/design/dashboard-domain-library-admission-rfc-template.md is required.");
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

if (registry.schemaVersion !== 1) issue("error", "registry.schemaVersion", "Registry must declare schemaVersion: 1.");
if (!isNonEmptyString(registry.version)) issue("error", "registry.version", "Registry must declare a version.");
if (!isNonEmptyString(registry.owner)) issue("error", "registry.owner", "Registry must declare an owner.");
if (!registry.defaultPolicy?.selectionRequiredForTier3) {
  issue("error", "registry.defaultPolicy.selectionRequiredForTier3", "Tier 3 library selection must be required by default.");
}
if (!isNonEmptyArray(registry.defaultPolicy?.newLibraryAdmission)) {
  issue("error", "registry.defaultPolicy.newLibraryAdmission", "Registry must define admission requirements for new libraries.");
}

const requiredDomainIds = new Set([
  "financial-trading-charts",
  "general-dashboard-charts",
  "data-tables-and-grids",
  "calendar-and-scheduling",
  "workflow-drag-drop",
  "node-graphs-and-pipelines",
  "rich-text-and-research-documents",
  "image-thumbnail-generation",
  "interactive-canvas-editing",
  "video-template-generation",
  "forms-and-validation"
]);

const domains = registry.domains ?? [];
if (domains.length < requiredDomainIds.size) issue("error", "domains.count", `Registry must include at least ${requiredDomainIds.size} domain families.`);

const domainIds = new Set();
for (const domain of domains) {
  if (!isNonEmptyString(domain.id)) {
    issue("error", "domain.id", "Every domain must declare an id.");
    continue;
  }
  if (domainIds.has(domain.id)) issue("error", `domain:${domain.id}.duplicate`, `${domain.id} is duplicated.`);
  domainIds.add(domain.id);

  for (const field of ["label", "defaultLibrary"]) {
    if (!isNonEmptyString(domain[field])) issue("error", `domain:${domain.id}.${field}`, `${domain.id} must declare ${field}.`);
  }

  for (const field of ["projectTypes", "approvedWrappers", "requiredProof", "bannedFallbacks"]) {
    if (!isNonEmptyArray(domain[field])) issue("error", `domain:${domain.id}.${field}`, `${domain.id} must declare non-empty ${field}.`);
  }

  const candidates = domain.libraryCandidates ?? [];
  if (candidates.length !== 2) {
    issue("error", `domain:${domain.id}.libraryCandidates`, `${domain.id} must compare exactly two library candidates.`);
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  if (!candidateIds.has(domain.defaultLibrary)) {
    issue("error", `domain:${domain.id}.defaultLibrary`, `${domain.id} defaultLibrary must match one candidate id.`);
  }

  for (const candidate of candidates) {
    const candidateCode = `domain:${domain.id}.candidate:${candidate.id ?? "unknown"}`;
    for (const field of ["id", "package", "source", "licenseReview", "whyUse"]) {
      if (!isNonEmptyString(candidate[field])) issue("error", `${candidateCode}.${field}`, `${candidateCode} must declare ${field}.`);
    }
    if (isNonEmptyString(candidate.source) && !candidate.source.startsWith("https://")) {
      issue("warning", `${candidateCode}.source`, `${candidateCode} source should be an https URL.`);
    }
    for (const field of ["bestFor", "tradeoffs"]) {
      if (!isNonEmptyArray(candidate[field])) issue("error", `${candidateCode}.${field}`, `${candidateCode} must declare non-empty ${field}.`);
    }
  }
}

for (const domainId of requiredDomainIds) {
  if (!domainIds.has(domainId)) issue("error", `domain:${domainId}.missing`, `Registry is missing required domain ${domainId}.`);
}

const maturityWork = registry.maturityWork ?? [];
if (maturityWork.length < 6) issue("error", "maturityWork.count", "Registry must declare at least six maturity work items.");
for (const item of maturityWork) {
  const code = `maturityWork:${item.id ?? "unknown"}`;
  for (const field of ["id", "label", "whyItMatters", "requiredOutcome"]) {
    if (!isNonEmptyString(item[field])) issue("error", `${code}.${field}`, `${code} must declare ${field}.`);
  }
}

if (fs.existsSync(standardPath)) {
  const standard = fs.readFileSync(standardPath, "utf8");
  for (const phrase of ["Wrapper Rule", "Static Fallback Rule", "Maturity Work Needed", "Tier 3C", "dashboard:domain-libraries:coverage", "dashboard:domain-libraries:coverage:strict", "dashboard:domain-wrappers:proof", "dashboard:domain-wrappers:proof:strict", "dashboard:domain-libraries:usage"]) {
    if (!standard.includes(phrase)) issue("error", `standard.${phrase}`, `Standard document must include ${phrase}.`);
  }
}

if (fs.existsSync(rfcTemplatePath)) {
  const template = fs.readFileSync(rfcTemplatePath, "utf8");
  for (const phrase of ["Candidate Comparison", "Dashboard Kit Wrapper Plan", "Proof Plan", "Adoption Plan"]) {
    if (!template.includes(phrase)) issue("error", `rfcTemplate.${phrase}`, `RFC template must include ${phrase}.`);
  }
}

finish();

function finish() {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;

  for (const item of issues) {
    console.log(`${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  }

  console.log(`Dashboard domain library registry validation: ${errorCount} error(s), ${warningCount} warning(s).`);
  if (errorCount > 0) process.exit(1);
}
