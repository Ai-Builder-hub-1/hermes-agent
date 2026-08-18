#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  markdownTable,
  readJson,
  root,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const reportPath = path.join(root, "docs/fleet/dashboard-certification-report.json");
const repairPacketsPath = path.join(root, "docs/fleet/dashboard-certification-repair-packets.json");
const playbookPath = path.join(root, "docs/design/dashboard-certification-repair-playbooks.json");
const supervisorJsonPath = path.join(root, "docs/fleet/dashboard-certification-repair-supervisor.json");
const supervisorMdPath = path.join(root, "docs/fleet/dashboard-certification-repair-supervisor.md");
const strict = process.argv.includes("--strict");
const write = process.argv.includes("--write") || strict;

const failureClasses = [
  {
    id: "manifest-truth",
    match: [/tier3c\.implementationMode/, /falseNative\.migrationLanguage/],
    severity: 100,
    lane: "manual-or-assisted",
    safeAutofix: false,
    description: "Declared maturity does not match actual implementation state.",
    repairPattern: "Split target maturity from certified maturity, then complete package-native route migration before restoring T3C."
  },
  {
    id: "shell-anatomy",
    match: [/anatomy\./, /local-shell-class/, /evidence\.sidebarMissing/, /evidence\.shellMissing/, /evidence\.headerMissing/],
    severity: 90,
    lane: "assisted-code-migration",
    safeAutofix: false,
    description: "Rendered shell/sidebar/header anatomy is local, nested, duplicated, or incomplete.",
    repairPattern: "Use a real DashboardShell with one direct sidebar child, one main child, one header region, and one scroll owner."
  },
  {
    id: "hidden-marker",
    match: [/hidden-compliance-marker/],
    severity: 85,
    lane: "assisted-code-migration",
    safeAutofix: false,
    description: "Hidden markers are satisfying old validators without rendering real components.",
    repairPattern: "Remove hidden markers and render the actual kit components or direct package imports."
  },
  {
    id: "static-route-retirement",
    match: [/surface\.compatibilityClaim/],
    severity: 80,
    lane: "manual-or-assisted",
    safeAutofix: false,
    description: "Compatibility/static route is still treated as package-native production UI.",
    repairPattern: "Demote static routes to dev-review/redirect status and register the true package-native operator route."
  },
  {
    id: "local-visual-debt",
    match: [/localDebt\./, /hardcoded-visual-token/],
    severity: 65,
    lane: "assisted-component-replacement",
    safeAutofix: false,
    description: "Local CSS/spacing/colors/layout primitives still control the dashboard.",
    repairPattern: "Replace local primitives with kit components/tokens or add expiring exceptions for narrow domain accents."
  },
  {
    id: "chart-contract",
    match: [/raw-svg-or-hand-chart/, /evidence\.dataMissing/],
    severity: 55,
    lane: "assisted-component-replacement",
    safeAutofix: false,
    description: "Charts are fake, hand-drawn, missing axes/states, or not backed by approved chart components.",
    repairPattern: "Use approved chart wrappers with x/y units, hover/legend/state contracts, and proof screenshots."
  },
  {
    id: "proof-gap",
    match: [/proof\./],
    severity: 45,
    lane: "safe-infra-repair",
    safeAutofix: true,
    description: "Proof capture or Playwright evidence is missing.",
    repairPattern: "Restore proof script/config and run local screenshot/workflow capture."
  },
  {
    id: "dev-tool-production-risk",
    match: [/visual-selector-production-risk/],
    severity: 35,
    lane: "safe-code-guard",
    safeAutofix: true,
    description: "Development-only visual selector can load in production.",
    repairPattern: "Guard selector scripts behind localhost/dev checks and assert production exclusion."
  }
];

const projectPriority = new Map([
  ["investing-system", 100],
  ["khashi-vc", 95],
  ["media-engine", 90],
  ["media-business-os", 85],
  ["meal-assistant", 75],
  ["tlc-capital-group-os", 70],
  ["hermes-os", 65],
  ["business-mapper", 55],
  ["rinseables-os", 50],
  ["nous-hermes-agent", 45]
]);

const report = readJson(reportPath);
const repairPackets = readJson(repairPacketsPath);
const playbook = buildPlaybook();
const workItems = report.projects
  .flatMap((project) => classifyProject(project))
  .sort((a, b) => b.priorityScore - a.priorityScore || a.project.localeCompare(b.project));

const byProject = report.projects.map((project) => {
  const items = workItems.filter((item) => item.project === project.project);
  const safeItems = items.filter((item) => item.safeAutofix);
  const firstBlocking = items.find((item) => item.severity >= 80) ?? items[0] ?? null;
  return {
    project: project.project,
    verdict: project.verdict,
    priorityScore: items.reduce((sum, item) => sum + item.priorityScore, 0),
    repairState: project.verdict === "certified" ? "certified" : safeItems.length === items.length ? "safe-repair-ready" : "assisted-repair-needed",
    nextFailureClass: firstBlocking?.failureClass ?? null,
    safeAutofixCount: safeItems.length,
    assistedRepairCount: items.length - safeItems.length,
    nextCommand: `npm run dashboard:certify -- --project ${project.project}`,
    proofAfterRepair: [
      "npm run dashboard:certify:strict",
      "npm run fleet:ship-check",
      "project-local proof capture when visual/shell/chart behavior changed"
    ],
    repairPacket: repairPackets.packets.find((packet) => packet.project === project.project)?.id ?? null
  };
}).sort((a, b) => b.priorityScore - a.priorityScore);

const reportOut = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Turn dashboard certification blockers into a sequenced repair program with failure classes, playbooks, safe/assisted lanes, and proof commands.",
  policy: {
    doesNotAutoRewriteBusinessLogic: true,
    safeAutofixRequiresRerun: true,
    assistedRepairsRequireProjectProof: true,
    deploymentBlockedUntilStrictCertificationPasses: true
  },
  summary: {
    projects: byProject.length,
    workItems: workItems.length,
    safeAutofixItems: workItems.filter((item) => item.safeAutofix).length,
    assistedRepairItems: workItems.filter((item) => !item.safeAutofix).length,
    failureClasses: failureClasses.length
  },
  executionOrder: byProject,
  workItems,
  playbook
};

if (write) {
  writeJson(playbookPath, playbook);
  writeJson(supervisorJsonPath, reportOut);
  writeMarkdown(supervisorMdPath, renderMarkdown(reportOut));
  console.log(`Wrote ${path.relative(root, playbookPath)}`);
  console.log(`Wrote ${path.relative(root, supervisorJsonPath)}`);
  console.log(`Wrote ${path.relative(root, supervisorMdPath)}`);
} else {
  console.log(JSON.stringify(reportOut, null, 2));
}

console.log(`Dashboard repair supervisor: ${reportOut.summary.workItems} work item(s), ${reportOut.summary.safeAutofixItems} safe, ${reportOut.summary.assistedRepairItems} assisted.`);
if (strict && reportOut.summary.workItems === 0 && report.summary.blocked > 0) process.exit(1);

function classifyProject(project) {
  const issues = [...(project.blockers ?? []), ...(project.warnings ?? [])];
  return issues.map((issue) => {
    const failureClass = failureClasses.find((candidate) => candidate.match.some((pattern) => pattern.test(issue.code))) ?? {
      id: "uncategorized",
      severity: 25,
      lane: "manual-review",
      safeAutofix: false,
      description: "Issue needs manual classification.",
      repairPattern: "Classify the failure and add a repair playbook."
    };
    const blockerBoost = (project.blockers ?? []).includes(issue) ? 30 : 0;
    const surfaceBoost = issue.surface ? 5 : 0;
    const priorityScore = (projectPriority.get(project.project) ?? 40) + failureClass.severity + blockerBoost + surfaceBoost;
    return {
      id: `${project.project}.${issue.surface ?? "project"}.${issue.code}`,
      project: project.project,
      surface: issue.surface ?? null,
      path: issue.path ?? null,
      issueCode: issue.code,
      message: issue.message,
      failureClass: failureClass.id,
      lane: failureClass.lane,
      safeAutofix: failureClass.safeAutofix,
      severity: failureClass.severity,
      priorityScore,
      repairPattern: failureClass.repairPattern,
      rerun: "npm run dashboard:certify:strict"
    };
  });
}

function buildPlaybook() {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    failureClasses: failureClasses.map((item) => ({
      id: item.id,
      lane: item.lane,
      safeAutofix: item.safeAutofix,
      severity: item.severity,
      description: item.description,
      repairPattern: item.repairPattern,
      requiredProof: requiredProofFor(item.id)
    }))
  };
}

function requiredProofFor(id) {
  const common = ["dashboard:certify:strict", "fleet:ship-check"];
  const extra = {
    "manifest-truth": ["manifest diff proves certified state is not overstated"],
    "shell-anatomy": ["desktop expanded screenshot", "desktop collapsed screenshot", "mobile screenshot", "DOM anatomy check"],
    "hidden-marker": ["source scan shows no hidden hdk/component markers"],
    "static-route-retirement": ["production nav points to package-native route", "compatibility route is dev-review or redirect only"],
    "local-visual-debt": ["local override scan", "spacing/card/table proof screenshots"],
    "chart-contract": ["chart proof screenshot", "axis/unit/state contract"],
    "proof-gap": ["Playwright proof output exists"],
    "dev-tool-production-risk": ["production source excludes visual-selection bridge"]
  };
  return [...(extra[id] ?? ["manual review evidence"]), ...common];
}

function renderMarkdown(report) {
  const orderRows = report.executionOrder.map((item) => [
    item.project,
    item.repairState,
    item.nextFailureClass,
    item.safeAutofixCount,
    item.assistedRepairCount,
    item.repairPacket
  ]);
  const workRows = report.workItems.slice(0, 40).map((item) => [
    item.project,
    item.failureClass,
    item.lane,
    item.safeAutofix ? "yes" : "no",
    item.priorityScore,
    item.issueCode,
    item.path ?? "-"
  ]);
  return `# Dashboard Certification Repair Supervisor\n\nGenerated: ${report.generatedAt}\n\nThis report is the repair layer above certification. It does not replace project migrations; it sequences them, classifies failures, names safe versus assisted repair lanes, and records proof commands.\n\n## Summary\n\n- Projects: ${report.summary.projects}\n- Work items: ${report.summary.workItems}\n- Safe autofix items: ${report.summary.safeAutofixItems}\n- Assisted repair items: ${report.summary.assistedRepairItems}\n- Failure classes: ${report.summary.failureClasses}\n\n## Execution Order\n\n${markdownTable(["Project", "Repair state", "Next failure class", "Safe", "Assisted", "Repair packet"], orderRows)}\n\n## Top Work Items\n\n${markdownTable(["Project", "Failure class", "Lane", "Safe", "Priority", "Issue", "Path"], workRows)}\n\n## Playbook Classes\n\n${report.playbook.failureClasses.map((item) => `### ${item.id}\n\nLane: ${item.lane}  \nSafe autofix: ${item.safeAutofix ? "yes" : "no"}  \nSeverity: ${item.severity}\n\n${item.description}\n\nRepair: ${item.repairPattern}\n\nProof:\n${item.requiredProof.map((proof) => `- ${proof}`).join("\n")}`).join("\n\n")}\n`;
}
