#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  markdownTable,
  readJson,
  root,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const outJson = path.join(root, "docs/fleet/fleet-ship-check.json");
const outMd = path.join(root, "docs/fleet/fleet-ship-check.md");
const full = process.argv.includes("--full");

const requiredSteps = [
  {
    id: "release-readiness",
    label: "Release readiness",
    command: ["npm", ["run", "fleet:release-readiness"]]
  },
  {
    id: "release-readiness-validate",
    label: "Release readiness schema",
    command: ["npm", ["run", "fleet:release-readiness:validate"]]
  },
  {
    id: "release-readiness-strict",
    label: "Release readiness strict gate",
    command: ["npm", ["run", "fleet:release-readiness:strict"]]
  },
  {
    id: "web-build-budget",
    label: "Web build budget",
    command: ["npm", ["run", "dashboard:web:build-budget"]]
  },
  {
    id: "dashboard-governance",
    label: "Dashboard governance",
    command: ["npm", ["run", "dashboard:governance:validate"]]
  }
];

const fullOnlySteps = [
  {
    id: "dashboard-kit-adoption",
    label: "Dashboard kit adoption strict gate",
    command: ["npm", ["run", "dashboard-kit:adoption:audit:strict"]]
  },
  {
    id: "fleet-maturity",
    label: "Fleet maturity validation",
    command: ["npm", ["run", "fleet:maturity:validate"]]
  },
  {
    id: "dashboard-review-packet",
    label: "Dashboard review packet validation",
    command: ["npm", ["run", "dashboard:review-packet:validate"]]
  }
];

function runStep(step) {
  const startedAt = new Date().toISOString();
  const [cmd, args] = step.command;
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    id: step.id,
    label: step.label,
    command: [cmd, ...args].join(" "),
    startedAt,
    finishedAt: new Date().toISOString(),
    passed: result.status === 0,
    exitCode: result.status,
    stdoutTail: result.stdout.trim().split("\n").slice(-10),
    stderrTail: result.stderr.trim().split("\n").filter(Boolean).slice(-10)
  };
}

const steps = [...requiredSteps, ...(full ? fullOnlySteps : [])].map(runStep);
const readiness = readJson(path.join(root, "docs/fleet/fleet-release-readiness.json"));
const failedSteps = steps.filter((step) => !step.passed);
const blockedProjects = readiness.projects.filter((project) => project.recommendation === "blocked");
const reviewProjects = readiness.projects.filter((project) => project.recommendation === "needs-review");
const safeToCommit = failedSteps.length === 0 && blockedProjects.length === 0 && reviewProjects.length === 0;
const safeToDeploy =
  safeToCommit && readiness.projects.every((project) => project.deployReady || project.recommendation === "clean");

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: full ? "full" : "standard",
  safeToCommit,
  safeToDeploy,
  summary: {
    steps: steps.length,
    failedSteps: failedSteps.length,
    dirtyProjects: readiness.totals.dirtyProjects,
    blockedProjects: blockedProjects.length,
    needsReviewProjects: reviewProjects.length,
    commitReadyProjects: readiness.totals.commitReadyProjects,
    deployReadyProjects: readiness.totals.deployReadyProjects
  },
  blockedBy: [
    ...failedSteps.map((step) => `step:${step.id}`),
    ...blockedProjects.map((project) => `blocked-project:${project.id}`),
    ...reviewProjects.map((project) => `needs-review:${project.id}`)
  ],
  readinessReport: "docs/fleet/fleet-release-readiness.json",
  steps
};

writeJson(outJson, report);
writeMarkdown(outMd, `# Fleet Ship Check

Generated: ${report.generatedAt}

Mode: ${report.mode}

## Decision

- **Safe to commit:** ${report.safeToCommit ? "yes" : "no"}
- **Safe to deploy:** ${report.safeToDeploy ? "yes" : "no"}
- **Blocked by:** ${report.blockedBy.length ? report.blockedBy.join(", ") : "nothing"}

## Summary

${markdownTable(
  ["Steps", "Failed", "Dirty projects", "Blocked projects", "Needs review", "Commit-ready projects", "Deploy-ready projects"],
  [[
    report.summary.steps,
    report.summary.failedSteps,
    report.summary.dirtyProjects,
    report.summary.blockedProjects,
    report.summary.needsReviewProjects,
    report.summary.commitReadyProjects,
    report.summary.deployReadyProjects
  ]]
)}

## Step Results

${markdownTable(
  ["Step", "Command", "Passed", "Exit", "Output tail"],
  report.steps.map((step) => [
    step.label,
    step.command,
    step.passed ? "yes" : "no",
    step.exitCode,
    [...step.stdoutTail, ...step.stderrTail].join("<br>")
  ])
)}
`);

console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
console.log(`Fleet ship check: safeToCommit=${safeToCommit ? "yes" : "no"}, safeToDeploy=${safeToDeploy ? "yes" : "no"}, failedSteps=${failedSteps.length}.`);
if (!safeToCommit || !safeToDeploy) process.exit(1);
