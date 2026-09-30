#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "docs/plans/canonical-cross-project-plan-registry.json");
const markdownPath = path.join(repoRoot, "docs/plans/canonical-cross-project-plan-registry.md");

function fail(message) {
  console.error(`registry validation failed: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(registryPath);
const markdown = fs.readFileSync(markdownPath, "utf8");
const ids = new Set();
const paths = new Map();

if (!Array.isArray(registry.plans) || registry.plans.length !== 12) {
  fail(`expected 12 canonical plans, found ${registry.plans?.length ?? 0}`);
}

for (const plan of registry.plans ?? []) {
  if (!/^CP-\d{2}$/.test(plan.id ?? "")) fail(`invalid plan id ${plan.id}`);
  if (ids.has(plan.id)) fail(`duplicate plan id ${plan.id}`);
  ids.add(plan.id);

  if (!markdown.includes(`| ${plan.id} |`) && !markdown.includes(`## ${plan.id} `)) {
    fail(`${plan.id} is missing from markdown registry`);
  }

  for (const requiredField of ["name", "wave", "order", "owner", "status", "percentComplete", "confidence", "nextProof"]) {
    if (plan[requiredField] === undefined || plan[requiredField] === "") {
      fail(`${plan.id} missing ${requiredField}`);
    }
  }

  if (!Number.isInteger(plan.order) || plan.order < 1 || plan.order > 12) {
    fail(`${plan.id} has invalid order ${plan.order}`);
  }
  if (typeof plan.percentComplete !== "number" || plan.percentComplete < 0 || plan.percentComplete > 100) {
    fail(`${plan.id} has invalid percentComplete ${plan.percentComplete}`);
  }

  const allInputs = [...(plan.canonicalInputs ?? []), ...(plan.supportingInputs ?? [])];
  if (allInputs.length === 0) fail(`${plan.id} has no mapped source documents`);

  for (const relativePath of allInputs) {
    const absolutePath = path.join(registry.workspaceRoot, relativePath);
    if (!fs.existsSync(absolutePath)) fail(`${plan.id} source does not exist: ${relativePath}`);
    const seenBy = paths.get(relativePath) ?? [];
    seenBy.push(plan.id);
    paths.set(relativePath, seenBy);
  }
}

const expectedWaveOne = ["CP-12", "CP-04", "CP-08"];
const actualWaveOne = registry.plans
  .filter((plan) => plan.wave === "wave-1-truth-layer")
  .sort((a, b) => a.order - b.order)
  .map((plan) => plan.id);

if (JSON.stringify(actualWaveOne) !== JSON.stringify(expectedWaveOne)) {
  fail(`wave one order mismatch: expected ${expectedWaveOne.join(", ")}, found ${actualWaveOne.join(", ")}`);
}

const duplicateInputs = [...paths.entries()]
  .filter(([, planIds]) => new Set(planIds).size > 1)
  .map(([relativePath, planIds]) => `${relativePath} -> ${[...new Set(planIds)].join(", ")}`);

const allowedDuplicatePrefixes = [
  "investing-system/docs/execution-plan.md",
  "investing-system/docs/staged-build-plan.md",
  "nous-hermes-agent/docs/plans/wave-4-presentation-contract.json",
  "nous-hermes-agent/docs/plans/wave-2-operational-safety-contract.json",
  "khashi-vc/docs/design/KHASHI_DASHBOARD_REDESIGN_PLAN.md",
  "khashi-vc/docs/design/KHASHI_MOBBIN_RESEARCH_PLAN.md",
  "khashi-vc/docs/design/KHASHI_DATA_OPERATIONS_MATURITY_STANDARD.md",
  "khashi-vc/docs/khashi-t3c-readiness-audit-2026-09-26.md",
  "khashi-vc/docs/production-data-warehouse-maturity.md",
  "khashi-vc/docs/ops/KHASHI_STORAGE_MATURITY_RUNBOOK.md",
  "khashi-vc/docs/ops/KHASHI_STORAGE_RECOVERY_AND_PREVENTION_PLAN.md"
];

for (const duplicate of duplicateInputs) {
  if (!allowedDuplicatePrefixes.some((prefix) => duplicate.startsWith(prefix))) {
    fail(`unclassified overlapping source mapping: ${duplicate}`);
  }
}

if (!process.exitCode) {
  console.log(`registry validation passed: ${registry.plans.length} plans, wave one ${actualWaveOne.join(" -> ")}`);
}
