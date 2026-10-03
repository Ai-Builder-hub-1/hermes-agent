#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GLOBAL_RUNTIME_ENV_KEYS = new Set([
  "EARNINGS_BACKFILL_ARCHIVE_ROOT",
  "EARNINGS_WAREHOUSE_ARCHIVE_ROOT",
  "KHASHI_FRESHNESS_BASE_URL",
  "KHASHI_ROC_BASE_URL",
  "MARKET_WAREHOUSE_ROOT",
  "KHASHI_WAREHOUSE_ROOT"
]);

loadGlobalRuntimeEnv();

const repoRoot = process.cwd();
const workspaceRoot = path.resolve(repoRoot, "..");
const outJson = path.join(repoRoot, "docs/plans/canonical-runtime-blocker-audit.json");
const outMd = path.join(repoRoot, "docs/plans/canonical-runtime-blocker-audit.md");

const investingProofPath = path.join(
  workspaceRoot,
  "investing-system/docs/proofs/earnings-warehouse-production-proof-latest.json"
);
const khashiTruthPath = path.join(workspaceRoot, "khashi-vc/docs/reports/khashi-maturity-truth/latest.json");
const nousRoutePath = path.join(repoRoot, "docs/design/operational-route-validation-report.json");
const nousSourcePath = path.join(repoRoot, "docs/design/operational-live-source-validation-report.json");

const checks = [
  investingWarehouseCheck(),
  khashiFreshnessStorageCheck(),
  nousSourceAuthCheck(),
  lockedApprovalCheck("CMB-005", "OANDA live trading", "Human approval remains required before live execution."),
  lockedApprovalCheck("CMB-006", "destructive pruning", "Human approval remains required before destructive pruning.")
];

const active = checks.filter((check) => check.status === "blocked" || check.status === "locked");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: active.some((check) => check.status === "blocked") ? "blocked" : "ready-with-locked-approvals",
  summary: {
    checks: checks.length,
    ready: checks.filter((check) => check.status === "ready").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    locked: checks.filter((check) => check.status === "locked").length
  },
  checks
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(outMd, markdown(report));

console.log(`Canonical runtime blocker audit: ${report.status}`);
console.log(`${report.summary.ready} ready, ${report.summary.blocked} blocked, ${report.summary.locked} locked.`);
console.log(`Wrote ${path.relative(repoRoot, outJson)} and ${path.relative(repoRoot, outMd)}`);

if (process.argv.includes("--strict") && report.status === "blocked") process.exit(1);

function investingWarehouseCheck() {
  const proof = readJson(investingProofPath);
  const env = {
    EARNINGS_BACKFILL_ARCHIVE_ROOT: Boolean(process.env.EARNINGS_BACKFILL_ARCHIVE_ROOT),
    EARNINGS_WAREHOUSE_ARCHIVE_ROOT: Boolean(process.env.EARNINGS_WAREHOUSE_ARCHIVE_ROOT)
  };
  const ready = proof?.status === "ready" && env.EARNINGS_BACKFILL_ARCHIVE_ROOT && env.EARNINGS_WAREHOUSE_ARCHIVE_ROOT;
  return {
    id: "CMB-002",
    title: "Investing earnings warehouse production proof",
    status: ready ? "ready" : "blocked",
    evidencePath: relative(investingProofPath),
    evidenceStatus: proof?.status ?? "missing",
    requiredInputs: redactEnv(env),
    blockers: ready
      ? []
      : [
          ...missingEnv(env),
          ...(proof ? proof.blockers ?? [] : ["Production warehouse proof artifact is missing."])
        ],
    nextActions: ready
      ? ["Keep the production proof fresh before scaled collection expansion."]
      : [
          "Set EARNINGS_BACKFILL_ARCHIVE_ROOT and EARNINGS_WAREHOUSE_ARCHIVE_ROOT in the production/runtime environment.",
          "Run `npm run earnings:warehouse:production-proof -- --write-mirror --output=docs/proofs/earnings-warehouse-production-proof-latest.json` from investing-system.",
          "Rerun this canonical runtime blocker audit."
        ]
  };
}

function khashiFreshnessStorageCheck() {
  const truth = readJson(khashiTruthPath);
  const freshnessProof = readJson(path.join(workspaceRoot, "khashi-vc/docs/proofs/khashi-freshness-proof.json"));
  const env = {
    KHASHI_FRESHNESS_BASE_URL: Boolean(process.env.KHASHI_FRESHNESS_BASE_URL),
    KHASHI_ROC_BASE_URL: Boolean(process.env.KHASHI_ROC_BASE_URL),
    KHASHI_FRESHNESS_TOKEN: Boolean(process.env.KHASHI_FRESHNESS_TOKEN),
    AMARI_VIEWER_TOKEN: Boolean(process.env.AMARI_VIEWER_TOKEN),
    AMARI_RESEARCHER_TOKEN: Boolean(process.env.AMARI_RESEARCHER_TOKEN),
    AMARI_ADMIN_TOKEN: Boolean(process.env.AMARI_ADMIN_TOKEN),
    MARKET_WAREHOUSE_ROOT: Boolean(process.env.MARKET_WAREHOUSE_ROOT),
    KHASHI_WAREHOUSE_ROOT: Boolean(process.env.KHASHI_WAREHOUSE_ROOT)
  };
  const hasBaseUrl = env.KHASHI_FRESHNESS_BASE_URL || env.KHASHI_ROC_BASE_URL;
  const hasToken = env.KHASHI_FRESHNESS_TOKEN || env.AMARI_VIEWER_TOKEN || env.AMARI_RESEARCHER_TOKEN || env.AMARI_ADMIN_TOKEN;
  const hasWarehouseRoot = env.MARKET_WAREHOUSE_ROOT || env.KHASHI_WAREHOUSE_ROOT;
  const freshnessAuthPassed = Boolean(
    freshnessProof
      && freshnessProof.status !== "observe-blocked"
      && !hasFreshnessAuthFailure(freshnessProof)
  );
  const blockedFindings = (truth?.findings ?? []).filter((finding) => finding.severity === "blocked");
  const requiredEvidenceReady = ["ready", "watch"].includes(String(truth?.status ?? "")) && blockedFindings.length === 0;
  const ready = requiredEvidenceReady && hasBaseUrl && (hasToken || freshnessAuthPassed) && hasWarehouseRoot;
  return {
    id: "CMB-003",
    title: "Khashi freshness/storage production proof",
    status: ready ? "ready" : "blocked",
    evidencePath: relative(khashiTruthPath),
    evidenceStatus: truth?.status ?? "missing",
    freshnessProof: {
      status: freshnessProof?.status ?? "missing",
      checkedAt: freshnessProof?.checkedAt ?? null,
      authPassed: freshnessAuthPassed,
      blockers: freshnessProof?.blockers ?? []
    },
    requiredInputs: {
      baseUrl: hasBaseUrl,
      token: hasToken,
      warehouseRoot: hasWarehouseRoot,
      env: redactEnv(env)
    },
    blockers: ready
      ? []
      : [
          ...(hasBaseUrl ? [] : ["Missing KHASHI_FRESHNESS_BASE_URL or KHASHI_ROC_BASE_URL."]),
          ...(hasToken || freshnessAuthPassed ? [] : ["Missing KHASHI_FRESHNESS_TOKEN or AMARI_* token."]),
          ...(hasWarehouseRoot ? [] : ["Missing MARKET_WAREHOUSE_ROOT or KHASHI_WAREHOUSE_ROOT for readable warehouse catalog proof."]),
          ...blockedFindings.map((finding) => finding.message),
          ...(truth ? [] : ["Khashi maturity truth artifact is missing."])
        ],
    nextActions: ready
      ? ["Keep Khashi maturity truth fresh before relying on market intelligence reports."]
      : [
          "Run `KHASHI_FRESHNESS_MODE=production npm run khashi:freshness:proof` from khashi-vc with production URL/token configured.",
          "Run `npm run khashi:storage:maturity` from khashi-vc with readable warehouse root configured.",
          "Regenerate Khashi v2 reports and run `npm run khashi:maturity:truth`."
        ]
  };
}

function hasFreshnessAuthFailure(proof) {
  const failedChecks = Array.isArray(proof?.checks) ? proof.checks.filter((check) => check.required !== false && !check.ok) : [];
  return failedChecks.some((check) => {
    const status = Number(check.status);
    const error = String(check.error ?? "").toLowerCase();
    return status === 401 || status === 403 || error.includes("token missing") || error.includes("authorization");
  });
}

function nousSourceAuthCheck() {
  const route = readJson(nousRoutePath);
  const source = readJson(nousSourcePath);
  const env = {
    DASHBOARD_BEARER_TOKEN: Boolean(process.env.DASHBOARD_BEARER_TOKEN),
    DASHBOARD_AUTH_COOKIE: Boolean(process.env.DASHBOARD_AUTH_COOKIE),
    HERMES_DASHBOARD_SESSION_TOKEN: Boolean(process.env.HERMES_DASHBOARD_SESSION_TOKEN),
    DASHBOARD_SESSION_TOKEN: Boolean(process.env.DASHBOARD_SESSION_TOKEN)
  };
  const hasAuth = Object.values(env).some(Boolean);
  const routeReady = route?.summary?.routes === route?.summary?.passed && route?.summary?.blocked === 0 && route?.summary?.failed === 0;
  const sourceReady = source?.summary?.status === "ready";
  const ready = routeReady && sourceReady;
  return {
    id: "CMB-007",
    title: "Nous production route/source proof",
    status: ready ? "ready" : "blocked",
    evidencePath: `${relative(nousRoutePath)} and ${relative(nousSourcePath)}`,
    evidenceStatus: {
      routes: routeReady ? "ready" : route?.summary?.status ?? "missing",
      sources: source?.summary?.status ?? "missing"
    },
    requiredInputs: redactEnv(env),
    blockers: ready
      ? []
      : [
          ...(routeReady ? [] : ["Operational route validation is not ready."]),
          ...(hasAuth ? [] : ["Missing dashboard auth input for protected source validation."]),
          ...(source?.summary?.authRequired ? [`${source.summary.authRequired} dashboard sources still require auth.`] : []),
          ...(source?.summary?.failed ? [`${source.summary.failed} dashboard sources failed.`] : []),
          ...(source?.summary?.blocked ? [`${source.summary.blocked} dashboard sources are blocked.`] : [])
        ],
    nextActions: ready
      ? ["Keep production route/source validation fresh after dashboard deploys."]
      : [
          "Set DASHBOARD_BEARER_TOKEN, DASHBOARD_AUTH_COOKIE, HERMES_DASHBOARD_SESSION_TOKEN, or DASHBOARD_SESSION_TOKEN.",
          "Run `npm run dashboard:operational-sources:validate -- --base-url https://agent.tlccapitalgroup.com`.",
          "Rerun `npm run canonical:runtime-blockers:audit`."
        ]
  };
}

function lockedApprovalCheck(id, title, reason) {
  return {
    id,
    title,
    status: "locked",
    evidencePath: "canonical approval policy",
    evidenceStatus: "approval_required",
    requiredInputs: {},
    blockers: [reason],
    nextActions: ["Do not unlock without explicit human approval and current risk/restore/incident proof."]
  };
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadGlobalRuntimeEnv(env = process.env) {
  const values = readGlobalRuntimeEnv(env.HERMES_GLOBAL_ENV_PATH);
  for (const [key, value] of Object.entries(values)) {
    if (env[key] === undefined) env[key] = value;
  }
}

function readGlobalRuntimeEnv(filePath = path.join(os.homedir(), ".hermes.env")) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const assignment = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
    const equalsIndex = assignment.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = assignment.slice(0, equalsIndex).trim();
    if (!GLOBAL_RUNTIME_ENV_KEYS.has(key)) continue;
    values[key] = unquoteEnvValue(assignment.slice(equalsIndex + 1).trim());
  }
  return values;
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function redactEnv(env) {
  return Object.fromEntries(Object.entries(env).map(([key, present]) => [key, present ? "present" : "missing"]));
}

function missingEnv(env) {
  return Object.entries(env)
    .filter(([, present]) => !present)
    .map(([key]) => `Missing ${key}.`);
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath);
}

function markdown(input) {
  return [
    "# Canonical Runtime Blocker Audit",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    `Status: ${input.status}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    ...Object.entries(input.summary).map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "## Checks",
    "",
    "| ID | Check | Status | Evidence | Blockers | Next Actions |",
    "| --- | --- | --- | --- | --- | --- |",
    ...input.checks.map((check) => `| ${check.id} | ${escapeMd(check.title)} | ${check.status} | ${escapeMd(String(check.evidencePath))} | ${escapeMd(check.blockers.join("; ") || "none")} | ${escapeMd(check.nextActions.join("; "))} |`),
    ""
  ].join("\n");
}

function escapeMd(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
