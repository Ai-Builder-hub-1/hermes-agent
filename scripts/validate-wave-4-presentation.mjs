#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = "/Users/hq/Workspace/projects";
const contract = read("nous-hermes-agent/docs/plans/wave-4-presentation-contract.json");
const reporting = read("khashi-vc/docs/ops/KHASHI_CP10_REPORTING_LANE.json");
const routeReport = read("nous-hermes-agent/docs/design/operational-route-validation-report.json");

function read(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8"));
}

function fail(message) {
  console.error(`wave 4 validation failed: ${message}`);
  process.exitCode = 1;
}

for (const id of ["CP-10", "CP-01", "CP-09"]) {
  if (!contract.plans?.some((plan) => plan.id === id)) fail(`missing ${id}`);
}
if (reporting.canonicalPlan !== "CP-10") fail("reporting lane must map to CP-10");
for (const field of ["verdict", "freshness", "blocked claims", "evidence quality", "next system action"]) {
  if (!reporting.requiredReportFields?.includes(field)) fail(`missing report field ${field}`);
}
if (!reporting.nousIngestionContract?.includes("latest hard-stop verdict")) fail("missing Nous hard-stop ingestion field");
if (routeReport.summary?.passed !== 36 || routeReport.summary?.failed !== 0 || routeReport.summary?.blocked !== 0) {
  fail(`operational route proof is not clean: ${JSON.stringify(routeReport.summary)}`);
}
for (const plan of contract.plans ?? []) {
  for (const proofFile of plan.proofFiles ?? []) {
    if (!fs.existsSync(path.join(workspaceRoot, proofFile))) fail(`missing proof file ${proofFile}`);
  }
}
if (!contract.plans?.some((plan) => plan.id === "CP-09" && /does not certify live trading/i.test(plan.requiredInvariant))) {
  fail("Khashi T3C scope boundary must be explicit");
}
if (!process.exitCode) {
  console.log("wave 4 validation passed: CP-10 -> CP-01 -> CP-09");
}
