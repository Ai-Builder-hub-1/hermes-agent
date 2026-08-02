#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const projectId = args.project;
const requestedBand = args.targetBand || args.band || null;
const requestedTier = args.targetTier ? Number(args.targetTier) : null;
const strict = args.strict === "true";
const write = args.write !== "false";

if (!projectId) {
  console.error("Usage: npm run dashboard:tier-approval:request -- --project <project-id> [--target-band T3C] [--strict]");
  process.exit(1);
}

const reportPath = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
if (!fs.existsSync(reportPath)) {
  console.error(`Missing adoption report: ${relative(reportPath)}`);
  console.error("Run: npm run dashboard-kit:adoption:report");
  process.exit(1);
}

const report = readJson(reportPath);
const result = (report.results ?? []).find((item) => item.project === projectId);
if (!result) {
  console.error(`Project ${projectId} is not present in the latest adoption report.`);
  process.exit(1);
}

const issues = result.issues ?? [];
const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
const currentBand = result.experienceTier?.currentBand ?? "T0L";
const targetBand = requestedBand || result.experienceTier?.targetBand || currentBand;
const currentTier = Number(result.experienceTier?.current ?? 0);
const targetTier = requestedTier ?? Number(result.experienceTier?.target ?? bandTier(targetBand));
const promotionDirection = `${currentBand} -> ${targetBand}`;
const readiness = evaluateReadiness({ result, errors, warnings, currentBand, targetBand, currentTier, targetTier });
const generatedAt = new Date().toISOString();
const packet = {
  schemaVersion: 1,
  generatedAt,
  sourceReport: "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json",
  project: result.project,
  name: result.name,
  requested: {
    currentTier,
    targetTier,
    currentBand,
    targetBand,
    promotionDirection
  },
  decision: readiness.decision,
  approvalStatus: readiness.status,
  approvalSummary: readiness.summary,
  blockers: readiness.blockers,
  requiredEvidence: requiredEvidence({ targetTier, targetBand }),
  machineChecks: {
    auditStatus: result.status,
    issueCount: issues.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    packageNative: result.packageNative ?? null,
    experienceTier: result.experienceTier ?? null
  },
  issues: issues.map((item) => ({
    severity: item.severity,
    code: item.code,
    message: item.message,
    path: item.path ?? null,
    surface: item.surface ?? null
  })),
  nextAction: result.experienceTier?.nextAction ?? "",
  externalWorkItems: result.externalWorkItems ?? []
};

if (write) {
  const outDir = path.join(root, "docs/design/dashboard-review-packets");
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `${projectId}-tier-approval.json`);
  const mdPath = path.join(outDir, `${projectId}-tier-approval.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown(packet));
  fs.writeFileSync(path.join(outDir, "latest-tier-approval.json"), `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "latest-tier-approval.md"), markdown(packet));
  console.log(`Wrote ${relative(jsonPath)}`);
  console.log(`Wrote ${relative(mdPath)}`);
}

console.log(`${packet.name}: ${packet.approvalStatus} (${promotionDirection})`);
console.log(packet.approvalSummary);

if (strict && packet.approvalStatus !== "approved") {
  process.exit(1);
}

function evaluateReadiness({ result, errors, warnings, currentBand, targetBand, currentTier, targetTier }) {
  const blockers = [];
  if (errors.length) blockers.push(`${errors.length} error(s) in adoption audit`);
  if (warnings.length) blockers.push(`${warnings.length} warning(s) in adoption audit`);
  if (result.status !== "current") blockers.push(`audit status is ${result.status}`);
  if (bandRank(currentBand) < bandRank(targetBand)) blockers.push(`current band ${currentBand} is below requested band ${targetBand}`);
  if (currentTier < targetTier) blockers.push(`current tier ${currentTier} is below requested tier ${targetTier}`);
  if ((result.externalWorkItems ?? []).length) blockers.push(`${result.externalWorkItems.length} external work item(s) remain`);

  if (!blockers.length) {
    return {
      status: "approved",
      decision: "approve",
      blockers,
      summary: "The project has enough central evidence to approve the requested tier movement."
    };
  }
  if (!errors.length && warnings.length && currentTier >= targetTier) {
    return {
      status: "needs-review",
      decision: "hold",
      blockers,
      summary: "The project is close, but human review should not approve the movement until warnings are resolved or explicitly waived."
    };
  }
  return {
    status: "blocked",
    decision: "deny",
    blockers,
    summary: "The requested tier movement is blocked until the listed audit issues and evidence gaps are fixed."
  };
}

function requiredEvidence({ targetTier, targetBand }) {
  const base = [
    "adoption audit result is current",
    "project manifest declares current/target tier and implementation mode",
    "registered production surfaces exist",
    "proof route or approved screenshot proof exists"
  ];
  if (targetTier >= 2) {
    base.push("surfaces use shared dashboard-kit components");
    base.push("empty/loading/error states are implemented");
    base.push("tables and charts use approved kit primitives");
  }
  if (targetTier >= 3) {
    base.push("single shell with sidebar/header contract");
    base.push("Mobbin/reference intake and design review artifact");
    base.push("loading performance contract: freshness, stale, partial, empty, error states");
    base.push("pagination or bounded table windows for large datasets");
    base.push("visual proof for desktop/mobile and relevant states");
  }
  if (targetBand === "T3C") {
    base.push("production surface imports and renders @hermes/dashboard-kit directly");
    base.push("static adapter is not the final delivery mode");
  }
  return base;
}

function markdown(packet) {
  const issueRows = packet.issues.length
    ? packet.issues.map((item) => `| ${item.severity} | \`${item.code}\` | ${item.surface || ""} | ${item.path || ""} | ${item.message} |`).join("\n")
    : "| pass | `none` |  |  | No audit issues. |";
  const blockers = packet.blockers.length
    ? packet.blockers.map((item) => `- ${item}`).join("\n")
    : "- None";
  const evidence = packet.requiredEvidence.map((item) => `- ${item}`).join("\n");
  const external = packet.externalWorkItems.length
    ? packet.externalWorkItems.map((item) => `- ${item.priority}: ${item.action} (${item.reason})`).join("\n")
    : "- None";

  return `# Dashboard Tier Approval Packet

Generated: ${packet.generatedAt}  
Project: ${packet.name} (\`${packet.project}\`)  
Requested movement: \`${packet.requested.promotionDirection}\`  
Decision: **${packet.decision}**  
Status: **${packet.approvalStatus}**

## Summary

${packet.approvalSummary}

## Blockers

${blockers}

## Required Evidence

${evidence}

## Machine Checks

- Audit status: \`${packet.machineChecks.auditStatus}\`
- Errors: ${packet.machineChecks.errorCount}
- Warnings: ${packet.machineChecks.warningCount}
- Current tier: ${packet.requested.currentTier}
- Target tier: ${packet.requested.targetTier}
- Current band: \`${packet.requested.currentBand}\`
- Target band: \`${packet.requested.targetBand}\`

## Audit Issues

| Severity | Code | Surface | Path | Message |
| --- | --- | --- | --- | --- |
${issueRows}

## External Work Items

${external}

## Next Action

${packet.nextAction || "Keep evidence fresh and rerun the approval request after project changes."}
`;
}

function bandRank(band) {
  const order = ["T0P", "T0L", "T1A", "T1B", "T2A", "T2B", "T3A", "T3B", "T3C"];
  const index = order.indexOf(band);
  return index >= 0 ? index : -1;
}

function bandTier(band) {
  const match = /^T(\d)/.exec(String(band));
  return match ? Number(match[1]) : 0;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function relative(file) {
  return path.relative(root, file) || ".";
}

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
