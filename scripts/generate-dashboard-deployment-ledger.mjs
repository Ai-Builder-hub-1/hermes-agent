#!/usr/bin/env node
import path from "node:path";
import { dashboardRegistry, designDir, markdownTable, resolveProjectPath, root, runGit, statusLines, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const jsonPath = path.join(designDir, "dashboard-deployment-ledger.json");
const mdPath = path.join(designDir, "dashboard-deployment-ledger.md");

function repoState(projectRoot) {
  const branch = runGit(projectRoot, ["branch", "--show-current"]);
  const commit = runGit(projectRoot, ["rev-parse", "HEAD"]);
  const shortCommit = commit ? commit.slice(0, 12) : "";
  const statusBranch = runGit(projectRoot, ["status", "--short", "--branch"]).split("\n")[0] ?? "";
  const dirtyFiles = statusLines(projectRoot);
  const evidenceDirtyFiles = dirtyFiles.filter((line) => /docs\/design\/|packages\/hermes-dashboard-kit\/adoption\/reports\/|web\/src\/pages\/project-tier-assessment-data\.ts/.test(line));
  const sourceDirtyFiles = dirtyFiles.filter((line) => !evidenceDirtyFiles.includes(line));
  const ahead = Number(statusBranch.match(/\[ahead (\d+)/)?.[1] ?? 0);
  const behind = Number(statusBranch.match(/behind (\d+)/)?.[1] ?? 0);
  return {
    branch,
    commit,
    shortCommit,
    statusBranch,
    clean: sourceDirtyFiles.length === 0,
    dirtyCount: dirtyFiles.length,
    sourceDirtyCount: sourceDirtyFiles.length,
    evidenceDirtyCount: evidenceDirtyFiles.length,
    dirtyFiles: dirtyFiles.slice(0, 20),
    sourceDirtyFiles: sourceDirtyFiles.slice(0, 20),
    evidenceDirtyFiles: evidenceDirtyFiles.slice(0, 20),
    ahead,
    behind
  };
}

const entries = dashboardRegistry().map((dashboard) => {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const deployment = dashboard.deployment ?? {};
  const state = repoState(projectRoot);
  const missing = [];
  if (!state.commit) missing.push("local git commit");
  for (const field of ["provider", "sshHost", "composeProject", "composeService", "buildContext", "promotionScript"]) {
    if (!deployment[field]) missing.push(`deployment.${field}`);
  }
  const risks = [];
  if (!deployment.source) risks.push("deployment source note missing");
  if (!deployment.sourceCommit && !deployment.commitSha) risks.push("production commit not recorded");
  if (!state.clean) risks.push("local repo has uncommitted changes");
  if (state.ahead > 0) risks.push("local branch has unpushed commits");
  if (state.behind > 0) risks.push("local branch is behind upstream");
  return {
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    projectRoot: path.relative(root, projectRoot) || ".",
    url: dashboard.url,
    deployment: {
      provider: deployment.provider,
      sshHost: deployment.sshHost,
      composeProject: deployment.composeProject,
      composeService: deployment.composeService,
      buildContext: deployment.buildContext,
      promotionScript: deployment.promotionScript,
      source: deployment.source ?? null,
      sourceCommit: deployment.sourceCommit ?? deployment.commitSha ?? null
    },
    repo: state,
    status: missing.length ? "missing-source" : risks.length ? "tracked-with-risks" : "tracked",
    missing,
    risks
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Cross-project deployment source ledger for Hetzner dashboard promotion and rollback review.",
  checkedCount: entries.length,
  missingSourceCount: entries.filter((entry) => entry.status === "missing-source").length,
  trackedWithRisksCount: entries.filter((entry) => entry.status === "tracked-with-risks").length,
  entries
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard Deployment Ledger

Generated: ${report.generatedAt}

This ledger connects each registered dashboard to its local repo state and Hetzner deployment metadata. It does not prove what commit is currently running in production unless a project records \`deployment.sourceCommit\` or \`deployment.commitSha\`.

${markdownTable(
  ["Project", "Status", "Branch", "Commit", "Service", "Risks"],
  entries.map((entry) => [
    entry.label,
    entry.status,
    entry.repo.branch || "unknown",
    entry.repo.shortCommit || "unknown",
    entry.deployment.composeService || "missing",
    entry.risks.length ? entry.risks.join("; ") : "none"
  ])
)}
`);

console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
