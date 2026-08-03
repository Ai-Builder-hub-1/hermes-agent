#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { dashboardRegistry, designDir, markdownTable, resolveProjectPath, root, runGit, statusLines, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const strict = process.argv.includes("--strict");
const jsonPath = path.join(designDir, "dashboard-runtime-data-report.json");
const mdPath = path.join(designDir, "dashboard-runtime-data-report.md");

const runtimePattern = /(^|\/)data\/|\.jsonl$|\.sqlite|\.db(\.|$)|events|adjudications|snapshot|ledger|cache/i;

function trackedData(projectRoot) {
  const output = runGit(projectRoot, ["ls-files", "data"]);
  return output.split("\n").filter(Boolean);
}

function classifyFile(file) {
  if (!runtimePattern.test(file)) return "project-data";
  if (/README|schema|fixture|sample|seed|mock/i.test(file)) return "documented-fixture";
  return "runtime-data";
}

const seen = new Map();
for (const dashboard of dashboardRegistry()) {
  if (!seen.has(dashboard.projectPath)) seen.set(dashboard.projectPath, dashboard);
}

const entries = [...seen.values()].map((dashboard) => {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const tracked = trackedData(projectRoot).map((file) => ({ file, classification: classifyFile(file) }));
  const status = statusLines(projectRoot, "data").map((line) => line.trim());
  const runtimeTracked = tracked.filter((item) => item.classification === "runtime-data");
  const generatedDirty = status.filter((line) => runtimePattern.test(line));
  const risks = [];
  if (runtimeTracked.length) risks.push("tracked runtime-like data files");
  if (generatedDirty.length) risks.push("dirty generated data files");
  return {
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    status: risks.length ? "policy-review-needed" : "clean",
    trackedDataCount: tracked.length,
    runtimeTrackedCount: runtimeTracked.length,
    dirtyGeneratedCount: generatedDirty.length,
    tracked,
    dirtyGenerated: generatedDirty,
    risks
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Finds tracked or dirty generated runtime data across registered dashboard projects.",
  checkedCount: entries.length,
  reviewNeededCount: entries.filter((entry) => entry.status !== "clean").length,
  runtimeTrackedCount: entries.reduce((sum, entry) => sum + entry.runtimeTrackedCount, 0),
  dirtyGeneratedCount: entries.reduce((sum, entry) => sum + entry.dirtyGeneratedCount, 0),
  entries
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard Runtime Data Report

Generated: ${report.generatedAt}

Runtime data should be either generated/ignored, explicitly treated as fixture data, or promoted into a durable datastore. This report is advisory by default because several older projects still need per-project cleanup.

${markdownTable(
  ["Project", "Status", "Tracked data", "Runtime tracked", "Dirty generated", "Risks"],
  entries.map((entry) => [
    entry.label,
    entry.status,
    entry.trackedDataCount,
    entry.runtimeTrackedCount,
    entry.dirtyGeneratedCount,
    entry.risks.length ? entry.risks.join("; ") : "none"
  ])
)}
`);

console.log(`Dashboard runtime data scan: ${report.reviewNeededCount} project(s) need review.`);
console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
if (strict && report.reviewNeededCount) process.exit(1);
