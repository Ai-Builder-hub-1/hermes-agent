#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const contractPath = path.join(repoRoot, "docs/plans/cross-project-warehouse-truth-contract.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

function fail(message) {
  console.error(`warehouse truth validation failed: ${message}`);
  process.exitCode = 1;
}

if (contract.canonicalPlan !== "CP-04") fail("contract must map to CP-04");
const blockerSummary = contract.blockerSummary ?? "";
if (!/OANDA archive/i.test(blockerSummary)) fail("OANDA archive proof state must be explicit");
for (const phrase of ["proof", "prune", "Khashi", "destructive pruning disabled"]) {
  if (!blockerSummary.includes(phrase)) fail(`blockerSummary missing phrase: ${phrase}`);
}

const requiredProjects = new Set(["khashi-vc", "investing-system", "nous-hermes-agent"]);
for (const project of contract.projects ?? []) {
  requiredProjects.delete(project.id);
  if (!Array.isArray(project.requiredProofs) || project.requiredProofs.length < 5) {
    fail(`${project.id} must list at least five required proofs`);
  }
  for (const runbook of project.canonicalRunbooks ?? []) {
    const absolute = path.join("/Users/hq/Workspace/projects", runbook);
    if (!fs.existsSync(absolute)) fail(`${project.id} runbook missing: ${runbook}`);
  }
}
if (requiredProjects.size > 0) fail(`missing project contract: ${[...requiredProjects].join(", ")}`);

const investing = contract.projects?.find((project) => project.id === "investing-system");
if (!investing?.currentPosture?.includes("archive-prune-approval-required")) {
  fail("investing-system posture must reflect archive proof plus prune approval gate");
}

const requiredGates = new Set([
  "collector-continuity",
  "storage-runway",
  "archive-integrity",
  "mirror-integrity",
  "restore-proof",
  "operator-visibility"
]);
for (const gate of contract.gates ?? []) {
  requiredGates.delete(gate.id);
  for (const state of ["ready", "watch", "blocked"]) {
    if (!gate[state]) fail(`${gate.id} missing ${state} definition`);
  }
}
if (requiredGates.size > 0) fail(`missing gates: ${[...requiredGates].join(", ")}`);

const pruningRequired = new Set(["collector-continuity", "storage-runway", "archive-integrity", "restore-proof"]);
for (const gateId of pruningRequired) {
  const gate = contract.gates.find((candidate) => candidate.id === gateId);
  if (!gate?.requiredBeforePruning) fail(`${gateId} must be required before pruning`);
}

for (const phrase of ["canonical registry validates", "warehouse truth contract validates", "destructive pruning remains disabled"]) {
  if (!contract.minimumWaveOneExit?.some((item) => item.includes(phrase))) {
    fail(`minimumWaveOneExit missing phrase: ${phrase}`);
  }
}

if (!process.exitCode) {
  console.log(`warehouse truth validation passed: ${contract.projects.length} projects, ${contract.gates.length} gates`);
}
