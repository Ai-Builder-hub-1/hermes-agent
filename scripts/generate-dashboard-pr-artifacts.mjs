#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs/design/dashboard-pr-artifacts");
const sources = [
  "docs/design/dashboard-review-packets/latest.json",
  "docs/design/dashboard-promotion-readiness.json",
  "docs/design/dashboard-visual-coverage-report.json",
  "docs/design/dashboard-token-scan-report.json",
  "docs/design/dashboard-component-evidence-backlog.json"
];
fs.mkdirSync(outDir, { recursive: true });
const bundle = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sources,
  artifacts: Object.fromEntries(sources.map((file) => [file, JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))]))
};
fs.writeFileSync(path.join(outDir, "latest.json"), `${JSON.stringify(bundle, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "latest.md"), `${[
  "# Dashboard PR Artifact Bundle",
  "",
  `Generated: ${bundle.generatedAt}`,
  "",
  ...sources.map((file) => `- ${file}`)
].join("\n")}\n`);
console.log(`Dashboard PR artifacts generated: ${sources.length} source artifact(s).`);
