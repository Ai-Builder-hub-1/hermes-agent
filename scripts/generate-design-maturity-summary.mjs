#!/usr/bin/env node
import fs from "node:fs";

const registryPath = "docs/design/canonical-main-design-maturity-port.json";
const jsonOut = "docs/design/canonical-main-design-maturity-summary.json";
const mdOut = "docs/design/canonical-main-design-maturity-summary.md";

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const slices = registry.slices ?? [];
const externalWork = registry.externalWork ?? [];
const completed = slices.filter((slice) => slice.status === "completed");
const blocked = slices.filter((slice) => slice.status === "blocked" || slice.status === "pending-decision");
const pending = slices.filter((slice) => slice.status === "pending" || slice.status === "in-progress");

const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  canonicalBranch: registry.canonicalBranch,
  canonicalRemote: registry.canonicalRemote,
  legacyBranch: registry.legacyBranch,
  deployedLegacyRef: registry.deployedLegacyRef,
  deployedCommit: registry.deployedCommit,
  productionUrl: registry.productionUrl,
  healthUrl: registry.healthUrl,
  productionProvider: registry.productionProvider,
  deployAutomationStatus: registry.deployAutomationStatus,
  deploymentSourceOfTruth: registry.deploymentSourceOfTruth,
  sliceCount: slices.length,
  completedCount: completed.length,
  pendingCount: pending.length,
  blockedCount: blocked.length,
  externalWorkCount: externalWork.length,
  nextCanonicalActions: [
    "Keep new work branched from ai-builder/main.",
    "Treat Hetzner as the production provider and deploy-site.yml as docs-only automation.",
    "Complete the Hetzner artifact/restart/rollback contract for /root/apps/deploy before attempting automated production deploys.",
    "Decide whether dashboard-kit is a canonical workspace package, external package, or legacy-only artifact.",
    "Capture project-owned visual evidence outside this canonical repo cleanup."
  ],
  slices,
  externalWork
};

const tableRows = slices
  .map((slice) => `| ${slice.id} | ${slice.name} | ${slice.status} | ${(slice.blocks ?? []).join(", ") || "none"} |`)
  .join("\n");
const externalRows = externalWork
  .map((item) => `| ${item.id} | ${item.name} | ${item.status} | ${item.owner} |`)
  .join("\n");

const markdown = `# Canonical Main Design Maturity Summary

Generated: ${summary.generatedAt}

| Metric | Value |
| --- | --- |
| Canonical branch | ${summary.canonicalBranch} |
| Canonical remote | ${summary.canonicalRemote} |
| Legacy branch | ${summary.legacyBranch} |
| Deployed legacy ref | ${summary.deployedLegacyRef} |
| Production URL | ${summary.productionUrl} |
| Production provider | ${summary.productionProvider} |
| Deploy automation | ${summary.deployAutomationStatus} |
| Deployment source of truth | ${summary.deploymentSourceOfTruth} |
| Completed slices | ${summary.completedCount}/${summary.sliceCount} |
| Pending slices | ${summary.pendingCount} |
| Blocked or decision slices | ${summary.blockedCount} |
| External work items | ${summary.externalWorkCount} |

## Port Slices

| Slice | Name | Status | Blocks |
| --- | --- | --- | --- |
${tableRows}

## Next Canonical Actions

${summary.nextCanonicalActions.map((item) => `- ${item}`).join("\n")}

## External Work

| ID | Work | Status | Owner |
| --- | --- | --- | --- |
${externalRows}
`;

fs.writeFileSync(jsonOut, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(mdOut, markdown);
console.log(`Design maturity summary generated: ${completed.length}/${slices.length} completed slice(s).`);
