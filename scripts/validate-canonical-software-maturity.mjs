#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const workspaceRoot = path.resolve(repoRoot, "..");
const registryPath = path.join(repoRoot, "docs/plans/canonical-cross-project-plan-registry.json");
const blockerJsonPath = path.join(repoRoot, "docs/plans/canonical-maturity-blocker-tracker.json");
const blockerMdPath = path.join(repoRoot, "docs/plans/canonical-maturity-blocker-tracker.md");
const outJson = path.join(repoRoot, "docs/plans/canonical-software-maturity-gate.json");
const outMd = path.join(repoRoot, "docs/plans/canonical-software-maturity-gate.md");

const args = new Set(process.argv.slice(2));
const issues = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(workspaceRoot, relativePath));
}

function packageJson(project) {
  return readJson(path.join(workspaceRoot, project, "package.json"));
}

function issue(severity, code, message, detail = {}) {
  issues.push({ severity, code, message, ...detail });
}

function requireScript(project, scriptName) {
  const pkg = packageJson(project);
  if (!pkg.scripts?.[scriptName]) {
    issue("error", "script.missing", `${project} is missing npm script ${scriptName}.`);
    return;
  }
  return pkg.scripts[scriptName];
}

function requirePath(relativePath, code = "path.missing") {
  if (!exists(relativePath)) issue("error", code, `Missing required path: ${relativePath}`);
}

const registry = readJson(registryPath);
const blockers = readJson(blockerJsonPath);
const blockerMd = fs.readFileSync(blockerMdPath, "utf8");
const planIds = new Set((registry.plans ?? []).map((plan) => plan.id));

if (!Array.isArray(registry.plans) || registry.plans.length !== 12) {
  issue("error", "registry.invalidPlanCount", `Expected 12 canonical plans, found ${registry.plans?.length ?? 0}.`);
}

for (const plan of registry.plans ?? []) {
  if (!planIds.has(plan.id)) issue("error", "registry.planMissing", `${plan.id} missing from plan id set.`);
  if (typeof plan.percentComplete !== "number" || plan.percentComplete < 0 || plan.percentComplete > 100) {
    issue("error", "registry.percentInvalid", `${plan.id} has invalid percentComplete ${plan.percentComplete}.`);
  }
  if (!plan.nextProof) issue("error", "registry.nextProofMissing", `${plan.id} missing nextProof.`);
  for (const source of [...(plan.canonicalInputs ?? []), ...(plan.supportingInputs ?? [])]) {
    requirePath(source, "registry.sourceMissing");
  }
}

if (!Array.isArray(blockers.blockers)) {
  issue("error", "blockers.invalid", "Blocker tracker JSON must contain blockers array.");
}

const blockerIds = new Set();
const allowedActiveTypes = new Set([
  "production-env",
  "production-token",
  "stale-production-proof",
  "proof-environment",
  "runtime-integration",
  "external-service",
  "credential",
  "source-contract"
]);
const allowedLockedTypes = new Set(["approval-policy"]);

for (const blocker of blockers.blockers ?? []) {
  if (!/^CMB-\d{3}$/.test(blocker.id ?? "")) issue("error", "blocker.idInvalid", `Invalid blocker id ${blocker.id}.`);
  if (blockerIds.has(blocker.id)) issue("error", "blocker.duplicate", `Duplicate blocker id ${blocker.id}.`);
  blockerIds.add(blocker.id);
  if (!blockerMd.includes(`| ${blocker.id} |`)) issue("error", "blocker.markdownMissing", `${blocker.id} missing from markdown tracker.`);
  for (const field of ["canonicalPlan", "type", "impact", "owner", "continuePath", "unblockCommand", "evidencePath", "status"]) {
    if (!blocker[field]) issue("error", "blocker.fieldMissing", `${blocker.id} missing ${field}.`);
  }
  const cpIds = String(blocker.canonicalPlan ?? "").match(/CP-\d{2}/g) ?? [];
  if (!cpIds.length) issue("error", "blocker.cpMissing", `${blocker.id} does not reference a CP id.`);
  for (const cpId of cpIds) {
    if (!planIds.has(cpId)) issue("error", "blocker.cpUnknown", `${blocker.id} references unknown ${cpId}.`);
  }
  if (blocker.status === "active" && !allowedActiveTypes.has(blocker.type)) {
    issue("error", "blocker.activeTypeUnknown", `${blocker.id} active blocker type ${blocker.type} is not classified.`);
  }
  if (blocker.status === "locked" && !allowedLockedTypes.has(blocker.type)) {
    issue("error", "blocker.lockedTypeUnknown", `${blocker.id} locked blocker type ${blocker.type} must be approval-policy.`);
  }
  if (blocker.status === "resolved" && !String(blocker.unblockCommand).trim()) {
    issue("error", "blocker.resolvedCommandMissing", `${blocker.id} resolved blocker must retain validation command.`);
  }
}

const requiredSoftwareHarnesses = [
  {
    id: "investing-warehouse-production-proof",
    project: "investing-system",
    script: "earnings:warehouse:production-proof",
    paths: [
      "investing-system/src/earnings/warehouse-production-proof.ts",
      "investing-system/src/scripts/earnings-warehouse-production-proof.ts",
      "investing-system/tests/earnings/warehouse-production-proof.test.ts"
    ]
  },
  {
    id: "khashi-maturity-truth",
    project: "khashi-vc",
    script: "khashi:maturity:truth:stdout",
    paths: ["khashi-vc/scripts/khashi-maturity-truth.mjs"]
  },
  {
    id: "khashi-freshness-proof",
    project: "khashi-vc",
    script: "khashi:freshness:proof",
    paths: ["khashi-vc/scripts/khashi-freshness-proof.mjs"]
  },
  {
    id: "khashi-storage-maturity",
    project: "khashi-vc",
    script: "khashi:storage:maturity",
    paths: ["khashi-vc/scripts/khashi-storage-maturity.mjs"]
  },
  {
    id: "nous-operational-routes",
    project: "nous-hermes-agent",
    script: "dashboard:operational-routes:validate",
    paths: ["nous-hermes-agent/scripts/validate-operational-routes.ts"]
  },
  {
    id: "nous-operational-sources",
    project: "nous-hermes-agent",
    script: "dashboard:operational-sources:validate",
    paths: ["nous-hermes-agent/scripts/validate-operational-live-sources.ts"]
  },
  {
    id: "nous-cp04-runtime",
    project: "nous-hermes-agent",
    script: "warehouse:runtime-intelligence:validate",
    paths: ["nous-hermes-agent/scripts/validate-cp04-runtime-intelligence-maturity.mjs"]
  },
  {
    id: "canonical-runtime-blockers",
    project: "nous-hermes-agent",
    script: "canonical:runtime-blockers:audit",
    paths: ["nous-hermes-agent/scripts/audit-canonical-runtime-blockers.mjs"]
  }
];

for (const harness of requiredSoftwareHarnesses) {
  requireScript(harness.project, harness.script);
  for (const required of harness.paths) requirePath(required, "harness.pathMissing");
}

const requiredProofArtifacts = [
  "investing-system/docs/proofs/earnings-event-trading-e05-e24-full-extent-audit.md",
  "nous-hermes-agent/docs/design/operational-route-validation-report.md",
  "nous-hermes-agent/docs/design/operational-live-source-validation-report.md",
  "nous-hermes-agent/docs/plans/canonical-runtime-blocker-audit.md",
  "nous-hermes-agent/docs/plans/cp04-runtime-intelligence-maturity.md",
  "khashi-vc/docs/reports/khashi-v2/data-operations-latest.md",
  "khashi-vc/docs/reports/khashi-v2/daily-market-intelligence-latest.md"
];
for (const artifact of requiredProofArtifacts) requirePath(artifact, "proof.pathMissing");

const activeUnclassified = (blockers.blockers ?? []).filter((blocker) => blocker.status === "active" && !allowedActiveTypes.has(blocker.type));
const unresolvedSoftwareHarnessGaps = issues.filter((item) => item.severity === "error" && (item.code.startsWith("harness.") || item.code === "script.missing"));
const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: errors.length ? "blocked" : "software-maturity-gate-ready",
  summary: {
    plans: registry.plans?.length ?? 0,
    blockers: blockers.blockers?.length ?? 0,
    activeBlockers: (blockers.blockers ?? []).filter((blocker) => blocker.status === "active").length,
    lockedBlockers: (blockers.blockers ?? []).filter((blocker) => blocker.status === "locked").length,
    resolvedBlockers: (blockers.blockers ?? []).filter((blocker) => blocker.status === "resolved").length,
    requiredSoftwareHarnesses: requiredSoftwareHarnesses.length,
    unresolvedSoftwareHarnessGaps: unresolvedSoftwareHarnessGaps.length,
    activeUnclassifiedBlockers: activeUnclassified.length,
    errors: errors.length,
    warnings: warnings.length
  },
  requiredSoftwareHarnesses,
  remainingRuntimeGates: (blockers.blockers ?? [])
    .filter((blocker) => blocker.status === "active" || blocker.status === "locked")
    .map((blocker) => ({
      id: blocker.id,
      canonicalPlan: blocker.canonicalPlan,
      type: blocker.type,
      owner: blocker.owner,
      status: blocker.status,
      unblockCommand: blocker.unblockCommand,
      evidencePath: blocker.evidencePath
    })),
  issues
};

function markdown(report) {
  const lines = [
    "# Canonical Software Maturity Gate",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: ${report.status}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    ...Object.entries(report.summary).map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "## Remaining Runtime Gates",
    "",
    "| ID | CP | Type | Status | Owner | Unblock |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.remainingRuntimeGates.map((gate) => `| ${gate.id} | ${gate.canonicalPlan} | ${gate.type} | ${gate.status} | ${gate.owner} | ${String(gate.unblockCommand).replace(/\|/g, "\\|")} |`),
    "",
    "## Issues",
    "",
    report.issues.length
      ? report.issues.map((item) => `- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`).join("\n")
      : "No software-maturity gate issues found.",
    ""
  ];
  return lines.join("\n");
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, markdown(report));

console.log(`Canonical software maturity gate: ${report.status}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
console.log(`Wrote ${path.relative(repoRoot, outJson)} and ${path.relative(repoRoot, outMd)}`);

if (args.has("--strict") && errors.length) process.exit(1);
