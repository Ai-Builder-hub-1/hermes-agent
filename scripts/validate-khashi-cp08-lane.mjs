#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = "/Users/hq/Workspace/projects";
const lanePath = path.join(workspaceRoot, "khashi-vc/docs/ops/KHASHI_CP08_DATA_OPS_IMPLEMENTATION_LANE.json");
const lane = JSON.parse(fs.readFileSync(lanePath, "utf8"));

function fail(message) {
  console.error(`khashi CP-08 validation failed: ${message}`);
  process.exitCode = 1;
}

if (lane.canonicalPlan !== "CP-08") fail("lane must map to CP-08");
if (lane.rollsUpTo !== "CP-04") fail("lane must roll up to CP-04");
if (lane.pruningPolicy?.destructivePruningEnabled !== false) fail("destructive pruning must remain disabled");
if ((lane.percentComplete ?? 0) < 80) fail("Khashi lane expected to remain at least 80% based on current proof");

const requiredGates = new Set([
  "collector-continuity",
  "storage-runway",
  "archive-integrity",
  "mirror-integrity",
  "restore-proof",
  "operator-visibility"
]);

for (const mapping of lane.gateMapping ?? []) {
  requiredGates.delete(mapping.warehouseGate);
  for (const field of ["khashiProof", "status", "nextAction"]) {
    if (!mapping[field]) fail(`${mapping.warehouseGate} missing ${field}`);
  }
}
if (requiredGates.size > 0) fail(`missing gate mappings: ${[...requiredGates].join(", ")}`);

for (const runbook of lane.sourceRunbooks ?? []) {
  const absolute = path.join(workspaceRoot, "khashi-vc", runbook);
  if (!fs.existsSync(absolute)) fail(`missing source runbook: ${runbook}`);
}

for (const exitItem of ["Khashi data ops lane references CP-08 and CP-04", "pruning remains disabled by policy"]) {
  if (!lane.waveOneExit?.includes(exitItem)) fail(`waveOneExit missing: ${exitItem}`);
}

if (!process.exitCode) {
  console.log(`khashi CP-08 validation passed: ${lane.gateMapping.length} gates, pruning disabled`);
}
