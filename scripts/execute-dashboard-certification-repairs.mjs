#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import {
  markdownTable,
  readJson,
  root,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const supervisorPath = path.join(root, "docs/fleet/dashboard-certification-repair-supervisor.json");
const outJson = path.join(root, "docs/fleet/dashboard-certification-repair-execution-ledger.json");
const outMd = path.join(root, "docs/fleet/dashboard-certification-repair-execution-ledger.md");
const apply = process.argv.includes("--apply");
const strict = process.argv.includes("--strict");
const write = process.argv.includes("--write") || apply || strict;

const supervisor = readJson(supervisorPath);
const safeItems = (supervisor.workItems ?? []).filter((item) => item.safeAutofix);
const assistedItems = (supervisor.workItems ?? []).filter((item) => !item.safeAutofix);
const executableSafeItems = safeItems.filter((item) => canAutoExecute(item));
const nonExecutableSafeItems = safeItems.filter((item) => !canAutoExecute(item));

const execution = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: apply ? "apply" : "dry-run",
  policy: {
    onlySafeAutofixItemsMayBeExecuted: true,
    assistedRepairsAreNeverAutoRewritten: true,
    strictCertificationMustRerunAfterExecution: true
  },
  summary: {
    totalWorkItems: (supervisor.workItems ?? []).length,
    safeAutofixItems: safeItems.length,
    executableSafeItems: executableSafeItems.length,
    nonExecutableSafeItems: nonExecutableSafeItems.length,
    assistedRepairItems: assistedItems.length,
    appliedItems: apply ? executableSafeItems.length : 0,
    queuedAssistedItems: assistedItems.length
  },
  applied: apply ? executableSafeItems.map(toExecutionRecord) : [],
  dryRun: apply ? [] : executableSafeItems.map(toExecutionRecord),
  nonExecutableSafeItems: nonExecutableSafeItems.map(toExecutionRecord),
  assistedQueue: assistedItems.map(toExecutionRecord),
  rerunCommands: [
    "npm run dashboard:certify",
    "npm run dashboard:certify:repair",
    "npm run dashboard:certify:repair:execute -- --write",
    "npm run dashboard:certify:strict"
  ]
};

if (write) {
  writeJson(outJson, execution);
  writeMarkdown(outMd, renderMarkdown(execution));
  console.log(`Wrote ${path.relative(root, outJson)}`);
  console.log(`Wrote ${path.relative(root, outMd)}`);
} else {
  console.log(JSON.stringify(execution, null, 2));
}

console.log(
  `Dashboard repair execution: ${execution.summary.appliedItems} applied, ${execution.summary.executableSafeItems} executable safe, ${execution.summary.assistedRepairItems} assisted queued.`
);

if (strict && nonExecutableSafeItems.length) {
  console.error("Safe repair items exist but no safe executor is available for them.");
  process.exit(1);
}

function canAutoExecute(item) {
  // The certification detector now suppresses guarded visual-selector cases.
  // Any future safe class must opt into an explicit transformer here.
  return item.failureClass === "proof-gap" && item.issueCode === "proof.captureScriptMissing" && false;
}

function toExecutionRecord(item) {
  return {
    id: item.id,
    project: item.project,
    surface: item.surface,
    path: item.path,
    issueCode: item.issueCode,
    failureClass: item.failureClass,
    lane: item.lane,
    safeAutofix: item.safeAutofix,
    action:
      item.safeAutofix && canAutoExecute(item)
        ? "auto-execute-safe-repair"
        : item.safeAutofix
          ? "requires-safe-transformer"
          : "queued-assisted-migration",
    rerun: item.rerun
  };
}

function renderMarkdown(execution) {
  const summaryRows = [
    ["Total work items", execution.summary.totalWorkItems],
    ["Safe autofix items", execution.summary.safeAutofixItems],
    ["Executable safe items", execution.summary.executableSafeItems],
    ["Non-executable safe items", execution.summary.nonExecutableSafeItems],
    ["Assisted repair items", execution.summary.assistedRepairItems],
    ["Applied items", execution.summary.appliedItems]
  ];
  const assistedRows = execution.assistedQueue.slice(0, 40).map((item) => [
    item.project,
    item.failureClass,
    item.issueCode,
    item.path ?? "-",
    item.action
  ]);
  return `# Dashboard Certification Repair Execution Ledger

Generated: ${execution.generatedAt}

Mode: ${execution.mode}

This ledger is the execution layer for certification repairs. It records what can be safely automated and what must remain an assisted project migration. It intentionally refuses to auto-rewrite shells, visual systems, business workflows, charts, or route architecture.

## Summary

${markdownTable(["Metric", "Value"], summaryRows)}

## Assisted Migration Queue

${assistedRows.length ? markdownTable(["Project", "Failure class", "Issue", "Path", "Action"], assistedRows) : "No assisted repairs queued."}

## Rerun Commands

${execution.rerunCommands.map((command) => `- \`${command}\``).join("\n")}
`;
}
