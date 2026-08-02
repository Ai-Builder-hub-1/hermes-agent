#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const registryPath = "docs/design/canonical-main-design-maturity-port.json";
const requiredDocs = [
  "docs/design/canonical-main-design-maturity-port.md",
  "docs/design/ui-vocabulary-v1.md",
  "docs/design/pattern-library-v1.md",
  "docs/design/mobbin-reference-workflow.md",
  "docs/design/design-agent-specification.md",
];
const summaryJsonPath = "docs/design/canonical-main-design-maturity-summary.json";
const summaryMarkdownPath = "docs/design/canonical-main-design-maturity-summary.md";
const deploymentRegistryPath = "docs/deployment/environments.json";
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Unable to read ${path}: ${error.message}`);
    return null;
  }
}

const registry = readJson(registryPath);
for (const doc of requiredDocs) {
  if (!fs.existsSync(doc)) fail(`Missing required design maturity document: ${doc}`);
}

if (registry) {
  if (registry.schemaVersion !== 1) fail("schemaVersion must be 1.");
  if (registry.status !== "active") fail("status must be active.");
  if (registry.canonicalBranch !== "main") fail("canonicalBranch must be main.");
  if (registry.canonicalRemote !== "ai-builder/main") fail("canonicalRemote must be ai-builder/main.");
  if (registry.legacyBranch !== "legacy/dashboard-line") fail("legacyBranch must be legacy/dashboard-line.");
  if (!/^https:\/\/agent\.tlccapitalgroup\.com/.test(registry.productionUrl ?? "")) {
    fail("productionUrl must point at the Nous Hermes Agent production host.");
  }
  if (registry.productionProvider !== "hetzner") fail("productionProvider must be hetzner.");
  if (registry.deploymentSourceOfTruth !== deploymentRegistryPath) {
    fail(`deploymentSourceOfTruth must be ${deploymentRegistryPath}.`);
  }
  if ((registry.slices ?? []).length < 6) fail("Expected at least six port slices.");

  const slices = new Map((registry.slices ?? []).map((slice) => [slice.id, slice]));
  for (const id of ["S1", "S2", "S3", "S4", "S5", "S6"]) {
    if (!slices.has(id)) fail(`Missing required slice ${id}.`);
  }
  if (slices.get("S5")?.status !== "blocked") {
    warn("S5 should remain blocked until dashboard-kit package fate is decided.");
  }
  if (slices.get("S2")?.status === "completed") {
    for (const doc of requiredDocs.slice(1)) {
      const text = fs.existsSync(doc) ? fs.readFileSync(doc, "utf8") : "";
      if (text.trim().length < 400) fail(`${doc} is too small to support S2 completion.`);
    }
  }
  if (slices.get("S3")?.status === "completed") {
    if (!fs.existsSync(summaryJsonPath)) fail(`Missing generated summary: ${summaryJsonPath}`);
    if (!fs.existsSync(summaryMarkdownPath)) fail(`Missing generated summary: ${summaryMarkdownPath}`);
    const summary = fs.existsSync(summaryJsonPath) ? readJson(summaryJsonPath) : null;
    if (summary && summary.completedCount < 3) fail("S3 completion requires at least three completed slices in the generated summary.");
  }
  if (!(registry.externalWork ?? []).some((item) => item.name?.includes("Meal Assistant"))) {
    fail("External project evidence work must include Meal Assistant.");
  }
}

const deploymentRegistry = readJson(deploymentRegistryPath);
if (deploymentRegistry) {
  const production = (deploymentRegistry.environments ?? []).find((environment) => environment.id === "nous-hermes-agent-production");
  if (!production) {
    fail("Deployment registry must include nous-hermes-agent-production.");
  } else {
    if (production.provider !== "hetzner") fail("Production provider must be hetzner.");
    if (production.productionUrl !== "https://agent.tlccapitalgroup.com") {
      fail("Deployment registry productionUrl must match agent.tlccapitalgroup.com.");
    }
    const deployAutomationStatuses = new Set(["not-configured", "contract-partially-documented", "configured"]);
    if (!deployAutomationStatuses.has(production.deployAutomationStatus)) {
      fail("Deployment registry deployAutomationStatus is not recognized.");
    }
    if (production.deployAutomationStatus === "configured") {
      warn("Update validation to require production environment protection and deploy evidence before configured status is accepted.");
    }
    const runtime = production.runtime ?? {};
    if (production.deployAutomationStatus !== "not-configured") {
      if (runtime.hostAlias !== "hermes-os") fail("Documented Hetzner host alias must be hermes-os.");
      if (runtime.serviceManager !== "docker compose") fail("Production service manager must be docker compose.");
      if (runtime.composeProjectPath !== "/root/apps/deploy") fail("Production compose project path must be /root/apps/deploy.");
      if (runtime.serviceName !== "nous-hermes-agent") fail("Production compose service must be nous-hermes-agent.");
      if (runtime.reverseProxy !== "caddy") fail("Production reverse proxy must be caddy.");
    }
    const invalidPaths = production.knownInvalidDeployPaths ?? [];
    if (!invalidPaths.some((item) => item.path === ".github/workflows/deploy-site.yml")) {
      fail("Deployment registry must mark deploy-site.yml as non-production automation.");
    }
  }
}

console.log(`Design maturity port validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const warning of warnings) console.log(`- WARNING ${warning}`);
for (const error of errors) console.log(`- ERROR ${error}`);
if (errors.length) process.exit(1);
