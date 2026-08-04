import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback = null) => {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
};

const projectId = getArg("--project", "nous-hermes-agent.dashboard");
const baseOverride = getArg("--base");
const targetRef = getArg("--target", "HEAD");
const allowNonRuntime =
  args.has("--allow-non-runtime") ||
  args.has("--allow-report-only") ||
  process.env.HERMES_ALLOW_NON_RUNTIME_DEPLOY === "1" ||
  process.env.HERMES_ALLOW_REPORT_ONLY_DEPLOY === "1";
const jsonMode = args.has("--json");

const runGit = (gitArgs, options = {}) =>
  execFileSync("git", gitArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.allowFailure ? "pipe" : "inherit"],
  }).trim();

const resolveRef = (ref) => runGit(["rev-parse", ref]);

const readLedgerBase = () => {
  const ledgerPath = resolve(process.cwd(), "docs/design/dashboard-deployment-ledger.json");
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const entry = ledger.entries?.find((candidate) => candidate.id === projectId);
  return entry?.deployment?.sourceCommit || entry?.promotionEvidence?.resolvedCommit || null;
};

const baseRef = baseOverride || readLedgerBase();
if (!baseRef) {
  throw new Error(
    `No deployed source commit found for ${projectId}. Pass --base=<sha> or refresh the deployment ledger.`,
  );
}

const baseCommit = resolveRef(baseRef);
const targetCommit = resolveRef(targetRef);

const changedFiles = runGit(["diff", "--name-only", `${baseCommit}..${targetCommit}`])
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const packageJsonRuntimeChanged = () => {
  if (!changedFiles.includes("package.json")) return false;
  const basePackage = JSON.parse(runGit(["show", `${baseCommit}:package.json`]));
  const targetPackage = JSON.parse(runGit(["show", `${targetCommit}:package.json`]));
  const runtimeKeys = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
    "overrides",
    "workspaces",
    "engines",
    "type",
    "exports",
    "imports",
    "main",
    "module",
    "browser",
  ];
  return runtimeKeys.some(
    (key) => JSON.stringify(basePackage[key] ?? null) !== JSON.stringify(targetPackage[key] ?? null),
  );
};

const isReportPath = (file) =>
  /^docs\/design\/.*\.(json|md)$/.test(file) ||
  /^docs\/design\/dashboard-.*\.(json|md)$/.test(file) ||
  /^docs\/design\/.*maturity.*\.(json|md)$/.test(file) ||
  /^docs\/design\/.*readiness.*\.(json|md)$/.test(file) ||
  /^docs\/design\/.*ledger.*\.(json|md)$/.test(file) ||
  /^docs\/design\/.*report.*\.(json|md)$/.test(file) ||
  file === "docs/design/project-dashboard-tier-assessment.json" ||
  file === "web/src/pages/project-tier-assessment-data.ts" ||
  file === "web/src/pages/dashboard-maturity-data.ts" ||
  file.startsWith("packages/hermes-dashboard-kit/adoption/reports/");

const isGovernanceToolingPath = (file) =>
  file === "docs/design/dashboard-governance-ci-gates.json" ||
  file === "docs/design/dashboard-deploy-anti-loop-standard.md" ||
  /^scripts\/(check|validate|generate|scan|score|summarize|refresh)-dashboard-.*\.mjs$/.test(file) ||
  /^scripts\/(generate|validate)-project-status-.*\.mjs$/.test(file) ||
  /^packages\/hermes-dashboard-kit\/scripts\/.*\.mjs$/.test(file);

const packageRuntimeChanged = packageJsonRuntimeChanged();

const classifications = changedFiles.map((file) => {
  if (file === "package.json") {
    return {
      file,
      class: packageRuntimeChanged ? "runtime" : "governance-tooling",
      reason: packageRuntimeChanged
        ? "package runtime metadata changed"
        : "package script-only metadata changed",
    };
  }
  if (isReportPath(file)) return { file, class: "generated-report", reason: "dashboard evidence/report path" };
  if (isGovernanceToolingPath(file)) {
    return { file, class: "governance-tooling", reason: "dashboard governance tool path" };
  }
  return { file, class: "runtime", reason: "unknown or runtime-impacting path" };
});

const runtimeFiles = classifications.filter((entry) => entry.class === "runtime");
const reportFiles = classifications.filter((entry) => entry.class === "generated-report");
const governanceFiles = classifications.filter((entry) => entry.class === "governance-tooling");
const decision =
  changedFiles.length === 0
    ? "no-op"
    : runtimeFiles.length > 0
      ? "deploy-allowed"
      : allowNonRuntime
        ? "non-runtime-override"
        : "deploy-blocked";

const result = {
  schemaVersion: 1,
  projectId,
  baseCommit,
  targetCommit,
  changedCount: changedFiles.length,
  runtimeCount: runtimeFiles.length,
  reportCount: reportFiles.length,
  governanceToolingCount: governanceFiles.length,
  decision,
  overrideUsed: allowNonRuntime && runtimeFiles.length === 0 && changedFiles.length > 0,
  changedFiles: classifications,
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Dashboard deploy anti-loop: ${decision}`);
  console.log(`Project: ${projectId}`);
  console.log(`Base deployed commit: ${baseCommit}`);
  console.log(`Target commit: ${targetCommit}`);
  console.log(
    `Changed files: ${changedFiles.length} (${runtimeFiles.length} runtime, ${reportFiles.length} report, ${governanceFiles.length} governance tooling)`,
  );
  if (runtimeFiles.length > 0) {
    console.log("Runtime-impacting paths:");
    for (const entry of runtimeFiles) console.log(`- ${entry.file}`);
  }
  if (decision === "deploy-blocked") {
    console.log(
      "Blocked: target contains only generated report and/or governance-tooling changes since the deployed commit.",
    );
    console.log("Use --allow-non-runtime or HERMES_ALLOW_NON_RUNTIME_DEPLOY=1 only for an intentional exception.");
  }
}

if (decision === "deploy-blocked") process.exit(1);
