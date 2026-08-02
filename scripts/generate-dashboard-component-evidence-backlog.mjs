#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-component-maturity-registry.json");
const jsonPath = path.join(root, "docs/design/dashboard-component-evidence-backlog.json");
const mdPath = path.join(root, "docs/design/dashboard-component-evidence-backlog.md");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const items = (registry.components ?? []).flatMap((component) =>
  (component.missingEvidence ?? []).map((evidence) => ({
    component: component.name,
    owner: component.owner,
    layer: component.layer,
    maturity: component.maturity,
    requiredForTier: component.requiredForTier,
    evidence,
    priority: component.requiredForTier?.startsWith("T3") ? "P0" : "P1"
  }))
);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "docs/design/dashboard-component-maturity-registry.json",
  itemCount: items.length,
  items
};

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Component Evidence Backlog",
  "",
  `Generated: ${report.generatedAt}`,
  `Items: ${items.length}`,
  "",
  ...items.map((item) => `- ${item.priority} ${item.component}: ${item.evidence} (${item.requiredForTier})`)
].join("\n")}\n`);

console.log(`Dashboard component evidence backlog generated: ${items.length} item(s).`);
