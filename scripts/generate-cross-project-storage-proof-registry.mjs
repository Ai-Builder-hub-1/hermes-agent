#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const workspaceRoot = process.env.HERMES_WORKSPACE_ROOT ?? "/Users/hq/Workspace/projects";
const repoRoot = process.cwd();
const outputJson = path.join(repoRoot, "docs/plans/cross-project-storage-proof-registry.json");
const outputMd = path.join(repoRoot, "docs/plans/cross-project-storage-proof-registry.md");

const sources = [
  {
    id: "investing-system",
    label: "Investing System",
    reportPath: path.join(workspaceRoot, "investing-system/docs/reports/investing-storage-maturity/latest.json"),
    canonicalPlan: "CP-04",
  },
  {
    id: "khashi-vc",
    label: "Khashi VC",
    reportPath: path.join(workspaceRoot, "khashi-vc/docs/reports/khashi-storage-maturity/latest.json"),
    canonicalPlan: "CP-04",
  },
];

const generatedAt = new Date().toISOString();
const projects = sources.map(readSource);
const summary = summarize(projects);
const registry = {
  id: "cross-project-storage-proof-registry",
  canonicalPlan: "CP-04",
  generatedAt,
  workspaceRoot,
  status: summary.blocked ? "blocked" : summary.watch ? "watch" : "ready",
  summary,
  projects,
  nextActions: nextActions(projects),
};

if (args.has("--write")) {
  fs.mkdirSync(path.dirname(outputJson), { recursive: true });
  fs.writeFileSync(outputJson, `${JSON.stringify(registry, null, 2)}\n`);
  fs.writeFileSync(outputMd, markdown(registry));
}

console.log(JSON.stringify(registry, null, 2));

function readSource(source) {
  const exists = fs.existsSync(source.reportPath);
  if (!exists) {
    return {
      ...source,
      status: "missing",
      score: 0,
      checkedAt: null,
      freshnessHours: null,
      reportPath: source.reportPath,
      facts: {},
      blockers: [`missing report: ${source.reportPath}`],
      nextAction: "Generate the project storage maturity report and rerun this registry.",
    };
  }
  try {
    const report = JSON.parse(fs.readFileSync(source.reportPath, "utf8"));
    const freshnessHours = ageHours(report.checkedAt);
    const stale = freshnessHours === null || freshnessHours > 48;
    const facts = extractFacts(source.id, report);
    const blockers = [];
    if (stale) blockers.push(`report stale: ${freshnessHours === null ? "unknown" : `${freshnessHours}h old`}`);
    if (report.status === "blocked") blockers.push("project report status is blocked");
    if (facts.restoreProofStatus && !["ready", "passed", "verified"].includes(facts.restoreProofStatus)) blockers.push(`restore proof ${facts.restoreProofStatus}`);
    if (facts.archivePruneProofStatus === "blocked") blockers.push("archive/prune proof is blocked");
    const projectStatus = report.status === "blocked"
      ? "blocked"
      : blockers.length
        ? "watch"
        : report.status === "ready" ? "ready" : report.status ?? "unknown";
    return {
      ...source,
      status: projectStatus,
      score: Number(report.score ?? 0),
      checkedAt: report.checkedAt ?? null,
      freshnessHours,
      reportPath: source.reportPath,
      facts,
      blockers,
      nextAction: report.nextActions?.[0] ?? (blockers.length ? blockers[0] : "Keep report on cadence and ingest into Nous warehouse jobs."),
    };
  } catch (error) {
    return {
      ...source,
      status: "blocked",
      score: 0,
      checkedAt: null,
      freshnessHours: null,
      reportPath: source.reportPath,
      facts: {},
      blockers: [`unreadable report: ${error instanceof Error ? error.message : String(error)}`],
      nextAction: "Repair the report JSON and rerun this registry.",
    };
  }
}

function extractFacts(projectId, report) {
  if (projectId === "investing-system") {
    return {
      rootDiskUsedPct: report.summary?.rootDiskUsedPct ?? null,
      ledgerFiles: report.summary?.ledgerFiles ?? null,
      ledgerBudgetProofStatus: report.summary?.ledgerBudgetProofStatus ?? "missing",
      archivePruneProofStatus: report.summary?.ledgerArchivePruneProofStatus ?? "missing",
      archiveRecords: report.summary?.archiveRecords ?? null,
      archiveRestoreVerifiedRecords: report.summary?.archiveRestoreVerifiedRecords ?? null,
      backupFiles: report.summary?.backupFiles ?? null,
      restoreProofStatus: report.storage?.backups?.restoreProof?.status ?? "missing",
      localPullProofStatus: report.summary?.localPullProofStatus ?? "missing",
      brokerWarehouseRows: report.summary?.brokerWarehouseRows ?? null,
      strategyBacktestRuns: report.summary?.strategyBacktestRuns ?? null,
    };
  }
  return {
    rootDiskUsedPct: report.summary?.rootDiskUsedPct ?? null,
    storeRecordRows: report.summary?.storeRecordRows ?? null,
    staleKeyStores: report.summary?.staleKeyStores ?? null,
    retentionDryRunProofStatus: report.summary?.retentionDryRunProofStatus ?? "missing",
    mirrorStatus: report.summary?.mirrorStatus ?? "missing",
    localPullSourceStatus: report.summary?.localPullSourceStatus ?? "missing",
    localPullProofStatus: report.summary?.localPullProofStatus ?? "missing",
    restoreProofStatus: report.summary?.restoreProofStatus ?? report.storage?.restoreProof?.status ?? "unknown",
  };
}

function summarize(projects) {
  const ready = projects.filter((project) => project.status === "ready").length;
  const missing = projects.filter((project) => project.status === "missing").length;
  const blocked = projects.filter((project) => project.status === "blocked" || project.status === "missing").length;
  const watch = projects.filter((project) => project.status === "watch").length;
  const averageScore = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.score ?? 0), 0) / projects.length)
    : 0;
  return {
    projects: projects.length,
    ready,
    watch,
    blocked,
    missing,
    averageScore,
    oldestFreshnessHours: Math.max(...projects.map((project) => Number(project.freshnessHours ?? 999999))),
  };
}

function nextActions(projects) {
  const actions = [];
  for (const project of projects) {
    if (project.blockers.length) actions.push(`${project.label}: ${project.nextAction}`);
  }
  if (!actions.length) actions.push("All storage maturity reports are fresh and ready; keep the registry on cadence.");
  return actions;
}

function ageHours(iso) {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 36_000) / 100);
}

function markdown(registry) {
  const lines = [
    "# Cross-Project Storage Proof Registry",
    "",
    `Canonical plan: ${registry.canonicalPlan}`,
    "",
    `Generated at: ${registry.generatedAt}`,
    "",
    `Status: ${registry.status}`,
    "",
    "| Project | Status | Score | Checked | Freshness | Key facts | Next action |",
    "| --- | --- | ---: | --- | ---: | --- | --- |",
  ];
  for (const project of registry.projects) {
    lines.push(`| ${project.label} | ${project.status} | ${project.score} | ${project.checkedAt ?? "missing"} | ${project.freshnessHours ?? "unknown"}h | ${factsText(project.facts)} | ${project.nextAction} |`);
  }
  lines.push("", "## Next Actions", "");
  for (const action of registry.nextActions) lines.push(`- ${action}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function factsText(facts) {
  return Object.entries(facts)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}
