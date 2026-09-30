import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const planPath = path.join(root, "docs/plans/2026-09-30-unified-operational-maturity-plan.md");
const proofPath = path.join(root, "docs/design/operational-proof-report.json");

function fail(message) {
  console.error(`operational plan consistency failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(planPath)) fail(`missing ${path.relative(root, planPath)}`);
if (!fs.existsSync(proofPath)) fail(`missing ${path.relative(root, proofPath)}`);

const plan = fs.readFileSync(planPath, "utf8");
const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
const summary = proof.summary ?? {};

const expectedSnippets = [
  `Operational routes validated | ${summary.routeValidationPassed}/${summary.routes}`,
  `Operational route failures | ${summary.routeValidationFailed}`,
  `Declared live sources reachable | ${summary.liveSourcesReachable}/`,
  `Impacted routes from live-source failures | ${summary.liveSourceImpactedRoutes}`,
  `Static operational routes | ${summary.staticRoutes}`,
  `Safe actions in registry | ${summary.safeActions}`,
  `Evidence-backed safe actions | ${summary.safeActions}/${summary.safeActions}`,
];

for (const snippet of expectedSnippets) {
  if (!plan.includes(snippet)) {
    fail(`plan snapshot is stale or contradictory; expected to find "${snippet}"`);
  }
}

const phaseZeroPattern = /\| 0\. Canonical Plan And Proof Baseline .*?\| 100% \|/;
if (!phaseZeroPattern.test(plan)) {
  fail("combined plan must keep Phase 0 at 100% after the proof baseline is regenerated");
}

console.log("operational plan consistency passed");
