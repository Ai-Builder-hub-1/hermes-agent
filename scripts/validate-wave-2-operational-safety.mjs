#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = "/Users/hq/Workspace/projects";
const contractPath = path.join(workspaceRoot, "nous-hermes-agent/docs/plans/wave-2-operational-safety-contract.json");
const matrixPath = path.join(workspaceRoot, "investing-system/docs/oanda-live-readiness-canonical-matrix.json");
const investingPackagePath = path.join(workspaceRoot, "investing-system/package.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const investingPackage = JSON.parse(fs.readFileSync(investingPackagePath, "utf8"));

function fail(message) {
  console.error(`wave 2 validation failed: ${message}`);
  process.exitCode = 1;
}

const expectedPlans = ["CP-05", "CP-02", "CP-11"];
for (const id of expectedPlans) {
  if (!contract.plans?.some((plan) => plan.id === id)) fail(`missing ${id}`);
}

if (matrix.canonicalPlan !== "CP-05") fail("OANDA matrix must map to CP-05");
if (!String(matrix.liveCurrencyBoundary).includes("locked")) fail("live currency boundary must stay locked");
if (!matrix.nonNegotiableGates?.some((gate) => /live submit remains locked/i.test(gate))) fail("missing live-submit lock gate");
if (!matrix.nonNegotiableGates?.some((gate) => /archive restore proof/i.test(gate))) fail("missing archive restore proof gate");
if (!matrix.levels?.filter((level) => level.status === "blocked").some((level) => level.id === "level-7-live-promotion-gate")) fail("level 7 must remain blocked");
if (!matrix.levels?.filter((level) => level.status === "blocked").some((level) => level.id === "level-9-live-readiness-certification")) fail("level 9 must remain blocked");

if (!investingPackage.scripts?.["oanda:archive:prove"]) fail("missing oanda:archive:prove script");
if (investingPackage.scripts?.["storage:archive"] !== "npm run oanda:archive:prove") fail("storage:archive must use proof path");

for (const route of ["/system/warehouse", "/system/storage", "/system/freshness", "/system/workers", "/system/deployments", "/system/credentials"]) {
  if (!contract.controlPlanePages?.includes(route)) fail(`missing control-plane page ${route}`);
}

for (const gate of ["OANDA live submit remains locked", "destructive pruning remains disabled", "Discord and Telegram commands must check authorization"]) {
  if (!contract.nonNegotiableGates?.some((item) => item.includes(gate))) fail(`missing non-negotiable gate: ${gate}`);
}

for (const item of contract.plans.flatMap((plan) => plan.proofFiles ?? [])) {
  if (!fs.existsSync(path.join(workspaceRoot, item))) fail(`missing proof file ${item}`);
}

if (!process.exitCode) {
  console.log("wave 2 validation passed: CP-05 -> CP-02 -> CP-11");
}
