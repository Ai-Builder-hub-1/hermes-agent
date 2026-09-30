#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = "/Users/hq/Workspace/projects";
const contract = read("nous-hermes-agent/docs/plans/wave-3-intelligence-contract.json");
const financial = read("investing-system/docs/wave-3-financial-analysis-intelligence-lane.json");
const khashi = read("khashi-vc/docs/ops/KHASHI_CP07_MARKET_INTELLIGENCE_LANE.json");

function read(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"));
}

function fail(message) {
  console.error(`wave 3 validation failed: ${message}`);
  process.exitCode = 1;
}

for (const id of ["CP-03", "CP-06", "CP-07"]) {
  if (!contract.plans?.some((plan) => plan.id === id)) fail(`missing ${id}`);
}
if (financial.canonicalPlan !== "CP-06") fail("financial lane must map to CP-06");
if (khashi.canonicalPlan !== "CP-07") fail("Khashi lane must map to CP-07");
if ((financial.analysisEngines ?? []).length < 7) fail("financial lane must name all analysis engines");
if (!financial.requiredProofs?.includes("second-brain memory export")) fail("financial lane must require second-brain export");
if (!khashi.blockedClaims?.some((claim) => /paper trading is blocked/i.test(claim))) fail("Khashi paper trading gate must stay blocked");
if (!khashi.requiredNousExports?.includes("hard-stop verdict")) fail("Khashi lane must export hard-stop verdict");

for (const plan of contract.plans ?? []) {
  for (const proofFile of plan.proofFiles ?? []) {
    if (!fs.existsSync(path.join(workspaceRoot, proofFile))) fail(`missing proof file ${proofFile}`);
  }
}

for (const gate of ["decision lineage exists", "stale memories create research work", "agent preflight shows cited context"]) {
  if (!contract.decisionIntelligenceGates?.some((item) => item.includes(gate))) fail(`missing decision gate: ${gate}`);
}

if (!process.exitCode) {
  console.log("wave 3 validation passed: CP-03 -> CP-06 -> CP-07");
}
