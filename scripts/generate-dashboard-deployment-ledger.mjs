#!/usr/bin/env node
import { execFileSync } from "node:child_process";
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

function latestPromotionEvidence(deployment) {
  if (process.env.HERMES_DASHBOARD_DEPLOYMENT_EVIDENCE === "0") return { evidence: null, error: "disabled" };
  if (!deployment.sshHost || !deployment.composeService) return { evidence: null, error: "missing sshHost or composeService" };
  const remotePath = deployment.evidencePath ?? `/root/apps/deploy/deployment-evidence/latest/${deployment.composeService}.json`;
  try {
    const output = execFileSync("ssh", [deployment.sshHost, "cat", remotePath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 7000
    });
    return { evidence: JSON.parse(output), error: null, remotePath };
  } catch (error) {
    return {
      evidence: null,
      error: error instanceof Error ? error.message.split("\n")[0] : String(error),
      remotePath
    };
  }
}

const entries = dashboardRegistry().map((dashboard) => {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const deployment = dashboard.deployment ?? {};
  const promotionEvidence = latestPromotionEvidence(deployment);
  const deployedCommit = promotionEvidence.evidence?.source?.resolvedCommit ?? deployment.sourceCommit ?? deployment.commitSha ?? null;
  const deploymentSource = promotionEvidence.evidence
    ? `promotion-evidence:${promotionEvidence.evidence.eventId}`
    : deployment.source ?? null;
  const state = repoState(projectRoot);
  const missing = [];
  if (!state.commit) missing.push("local git commit");
  for (const field of ["provider", "sshHost", "composeProject", "composeService", "buildContext", "promotionScript"]) {
    if (!deployment[field]) missing.push(`deployment.${field}`);
  }
  const risks = [];
  if (!deploymentSource) risks.push("deployment source note missing");
  if (!deployedCommit) risks.push("production commit not recorded");
  if (promotionEvidence.error && promotionEvidence.error !== "disabled") risks.push("promotion evidence unavailable");
  if (promotionEvidence.evidence?.status && promotionEvidence.evidence.status !== "succeeded") risks.push(`latest promotion status is ${promotionEvidence.evidence.status}`);
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
      source: deploymentSource,
      sourceCommit: deployedCommit
    },
    promotionEvidence: {
      available: Boolean(promotionEvidence.evidence),
      remotePath: promotionEvidence.remotePath ?? null,
      error: promotionEvidence.error,
      eventId: promotionEvidence.evidence?.eventId ?? null,
      status: promotionEvidence.evidence?.status ?? null,
      startedAt: promotionEvidence.evidence?.startedAt ?? null,
      finishedAt: promotionEvidence.evidence?.finishedAt ?? null,
      previousCommit: promotionEvidence.evidence?.source?.previousCommit ?? null,
      resolvedCommit: promotionEvidence.evidence?.source?.resolvedCommit ?? null,
      imageId: promotionEvidence.evidence?.runtime?.imageId ?? null,
      containerImageId: promotionEvidence.evidence?.runtime?.containerImageId ?? null,
      rollbackCommand: promotionEvidence.evidence?.rollback?.command ?? null
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

This ledger connects each registered dashboard to local repo state, Hetzner deployment metadata, and the latest promotion evidence when available. Services without promotion evidence still need a recorded deployed commit before their production source can be treated as proven.

${markdownTable(
  ["Project", "Status", "Local commit", "Deployed commit", "Service", "Evidence", "Risks"],
  entries.map((entry) => [
    entry.label,
    entry.status,
    entry.repo.shortCommit || "unknown",
    entry.deployment.sourceCommit ? entry.deployment.sourceCommit.slice(0, 12) : "unknown",
    entry.deployment.composeService || "missing",
    entry.promotionEvidence.available ? entry.promotionEvidence.eventId : "missing",
    entry.risks.length ? entry.risks.join("; ") : "none"
  ])
)}
`);

console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
