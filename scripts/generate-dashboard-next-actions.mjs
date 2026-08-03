#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jsonOut = path.join(root, "docs/design/dashboard-next-actions-report.json");
const mdOut = path.join(root, "docs/design/dashboard-next-actions-report.md");

function readJson(relativePath, fallback) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function projectKey(value) {
  const key = String(value ?? "")
    .replace(/\.main$|\.workspace$|\.roc$|\.ops$|\.dashboard$/g, "")
    .replace("media-business-operations", "media-business-os");
  if (key === "hermes") return "hermes-os";
  return key;
}

function priorityFor(category) {
  return {
    adoption: "P0",
    proof: "P0",
    telemetry: "P1",
    deployment: "P0",
    visual: "P1",
    bridge: "P1",
    migration: "P1",
    readiness: "P0",
    "deployment-source": "P0",
    distribution: "P1",
    "runtime-data": "P1"
  }[category] ?? "P2";
}

const adoption = readJson("packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json", { results: [] });
const proof = readJson("docs/design/dashboard-production-proof-registry.json", { entries: [] });
const telemetry = readJson("docs/design/dashboard-telemetry-contract-report.json", { items: [] });
const visual = readJson("docs/design/dashboard-visual-quality-report.json", { items: [] });
const bridge = readJson("docs/design/dashboard-bridge-coverage-report.json", { items: [] });
const deployment = readJson("docs/design/dashboard-deployment-metadata-report.json", { items: [] });
const deploymentLedger = readJson("docs/design/dashboard-deployment-ledger.json", { entries: [] });
const kitDistribution = readJson("docs/design/dashboard-kit-distribution-report.json", { entries: [] });
const runtimeData = readJson("docs/design/dashboard-runtime-data-report.json", { entries: [] });
const migration = readJson("docs/design/dashboard-migration-codemod-plan.json", { candidates: [] });
const readiness = readJson("docs/design/dashboard-readiness-impact.json", { impacts: [] });

const actions = [];

function add(project, category, title, evidence, command, blocksWorldClass = true) {
  actions.push({
    id: `${project}.${category}.${actions.length + 1}`,
    project,
    priority: priorityFor(category),
    category,
    title,
    evidence,
    command,
    blocksWorldClass
  });
}

for (const result of adoption.results ?? []) {
  if (result.status === "current") continue;
  const errors = (result.issues ?? []).filter((issue) => issue.severity === "error").length;
  add(
    result.project,
    "adoption",
    `Move adoption status from ${result.status} to current.`,
    `${errors} error(s), ${(result.issues ?? []).length} total issue(s).`,
    "npm run dashboard-kit:adoption:report"
  );
}

for (const entry of proof.entries ?? []) {
  const project = projectKey(entry.id);
  if (!entry.proof?.proofEndpointDeclared) {
    add(project, "proof", "Declare a readonly production proof endpoint.", entry.id, "npm run dashboard:production-proof:registry");
  }
  if (!entry.proof?.screenshotCaptured || entry.status !== "baseline-present") {
    add(project, "proof", "Capture and review a clean production screenshot baseline.", `${entry.id}: ${entry.status}`, "npm run dashboard:production-proof:capture");
  }
}

for (const item of telemetry.items ?? []) {
  if (item.status === "ready") continue;
  add(projectKey(item.id), "telemetry", "Complete dashboard telemetry contract.", `Missing: ${(item.missing ?? []).join(", ")}`, "npm run dashboard:telemetry-contract:report");
}

for (const item of visual.items ?? []) {
  if (item.status === "pass" && Number(item.score) >= 90) continue;
  add(item.project, "visual", "Raise visual quality score to at least 90 and pass all checks.", `${item.surface}: ${item.score}`, "npm run dashboard:visual-quality:score");
}

for (const item of bridge.items ?? []) {
  if (item.status === "pass") continue;
  add(item.project, "bridge", "Add visual-selection bridge and stable review handles.", `${item.surface}: missing ${(item.missing ?? []).join(", ")}`, "npm run dashboard:bridge:coverage");
}

for (const item of deployment.items ?? []) {
  if (item.status === "ready") continue;
  add(projectKey(item.id), "deployment", "Complete Hetzner deployment metadata or remove from production registry.", `Missing: ${(item.missing ?? []).join(", ")}`, "npm run dashboard:deployment-metadata:validate");
}

for (const entry of deploymentLedger.entries ?? []) {
  const risks = (entry.risks ?? []).filter((risk) => /source|commit|unpushed|behind|uncommitted/i.test(risk));
  if (!risks.length) continue;
  add(
    projectKey(entry.id),
    "deployment-source",
    "Record deploy source and clear repo-state risks before the next production promotion.",
    risks.join("; "),
    "npm run dashboard:deployment-ledger:report",
    false
  );
}

for (const entry of kitDistribution.entries ?? []) {
  if (entry.status === "ready") continue;
  add(
    projectKey(entry.id),
    "distribution",
    "Move dashboard-kit consumption to an approved distribution path.",
    `${entry.mode}: ${entry.recommendation}`,
    "npm run dashboard:kit-distribution:report",
    entry.severity === "blocking"
  );
}

for (const entry of runtimeData.entries ?? []) {
  if (entry.status === "clean") continue;
  add(
    projectKey(entry.id),
    "runtime-data",
    "Classify tracked data as fixture/config or move generated runtime data out of git.",
    `${entry.runtimeTrackedCount} tracked runtime-like file(s), ${entry.dirtyGeneratedCount} dirty generated file(s).`,
    "npm run dashboard:runtime-data:report",
    false
  );
}

for (const candidate of migration.candidates ?? []) {
  if (candidate.status === "closed") continue;
  add(candidate.project, "migration", "Clear package-native migration codemod candidate.", `${candidate.issueCode}: ${candidate.path}`, "npm run dashboard:migration-codemod:plan");
}

for (const impact of readiness.impacts ?? []) {
  if (Number(impact.dashboardPenaltyPercent) <= 0 && Number(impact.readinessCapPercent) >= 100) continue;
  add(impact.project, "readiness", "Remove dashboard readiness penalty/cap.", `${impact.dashboardPenaltyPercent}% penalty, cap ${impact.readinessCapPercent}%`, "npm run dashboard:readiness-impact:report");
}

const priorityRank = { P0: 0, P1: 1, P2: 2 };
actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.project.localeCompare(b.project) || a.category.localeCompare(b.category));

const grouped = new Map();
for (const action of actions) {
  if (!grouped.has(action.project)) grouped.set(action.project, []);
  grouped.get(action.project).push(action);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceReports: [
    "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json",
    "docs/design/dashboard-production-proof-registry.json",
    "docs/design/dashboard-telemetry-contract-report.json",
    "docs/design/dashboard-visual-quality-report.json",
    "docs/design/dashboard-bridge-coverage-report.json",
    "docs/design/dashboard-deployment-metadata-report.json",
    "docs/design/dashboard-deployment-ledger.json",
    "docs/design/dashboard-kit-distribution-report.json",
    "docs/design/dashboard-runtime-data-report.json",
    "docs/design/dashboard-migration-codemod-plan.json",
    "docs/design/dashboard-readiness-impact.json"
  ],
  actionCount: actions.length,
  p0Count: actions.filter((action) => action.priority === "P0").length,
  projects: [...grouped.entries()].map(([project, projectActions]) => ({
    project,
    actionCount: projectActions.length,
    p0Count: projectActions.filter((action) => action.priority === "P0").length,
    nextAction: projectActions[0],
    actions: projectActions
  }))
};

fs.writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  "# Dashboard Next Actions Report",
  "",
  `Generated: ${report.generatedAt}`,
  `Open actions: ${report.actionCount}`,
  `P0 actions: ${report.p0Count}`,
  "",
  "## By Project",
  ""
];
for (const project of report.projects) {
  lines.push(`### ${project.project}`, "");
  lines.push(`Next: ${project.nextAction.priority} ${project.nextAction.title}`);
  lines.push("");
  for (const action of project.actions) {
    lines.push(`- ${action.priority} [${action.category}] ${action.title}`);
    lines.push(`  Evidence: ${action.evidence}`);
    lines.push(`  Command: \`${action.command}\``);
  }
  lines.push("");
}
fs.writeFileSync(mdOut, `${lines.join("\n")}\n`);

console.log(`Dashboard next actions generated: ${path.relative(root, jsonOut)}`);
