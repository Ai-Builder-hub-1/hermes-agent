#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-component-maturity-registry.json");
const jsonPath = path.join(root, "docs/design/dashboard-component-certification-checklist.json");
const mdPath = path.join(root, "docs/design/dashboard-component-certification-checklist.md");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const requiredEvidence = [
  "state-matrix",
  "keyboard-and-focus-proof",
  "mobile-or-compact-proof",
  "dark-and-density-proof",
  "loading-empty-error-proof",
  "documentation-example"
];
const items = (registry.components ?? []).map((component) => ({
  component: component.name,
  owner: component.owner,
  maturity: component.maturity,
  requiredForTier: component.requiredForTier,
  requiredEvidence,
  missingEvidence: component.missingEvidence ?? [],
  certified: component.maturity === "certified" && !(component.missingEvidence ?? []).length
}));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  itemCount: items.length,
  certifiedCount: items.filter((item) => item.certified).length,
  items
};
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Component Certification Checklist",
  "",
  `Generated: ${report.generatedAt}`,
  `Certified: ${report.certifiedCount}/${report.itemCount}`,
  "",
  ...items.map((item) => `- ${item.certified ? "certified" : "needs-evidence"} ${item.component}: missing=${item.missingEvidence.join(", ") || "none"}`)
].join("\n")}\n`);
console.log(`Dashboard component certification checklist generated: ${items.length} component(s).`);
