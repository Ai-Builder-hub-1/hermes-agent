#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");

const required = {
  "khashi-vc": {
    files: ["public/roc/index.html", "public/roc/market-intelligence-live.html", "src/web/server.ts"],
    patterns: ["/hermes-dashboard-kit.css", "vendor', 'hermes-dashboard-kit', 'static', 'hermes-dashboard-kit.css"]
  },
  "media-engine": {
    files: ["core/operations/unified-publishing-dashboard.js", "core/operations/hermes-dashboard-kit.css"],
    patterns: ["@hermes/dashboard-kit/static/hermes-dashboard-kit.css"]
  },
  "media-business-os": {
    files: ["public/dashboard/index.html", "public/dashboard/hermes-dashboard-kit.css"],
    patterns: ["/dashboard/hermes-dashboard-kit.css"]
  },
  "business-mapper": {
    files: ["business_mapper/static/index.html", "business_mapper/static/hermes-dashboard-kit.css"],
    patterns: ["/static/hermes-dashboard-kit.css"]
  },
  "meal-assistant": {
    files: ["src/server.js", "vendor/hermes-dashboard-kit/static/hermes-dashboard-kit.css"],
    patterns: ["vendor/hermes-dashboard-kit/static/hermes-dashboard-kit.css"]
  },
  "tlc-capital-group-os": {
    files: ["public/dashboard/index.html", "public/dashboard/hermes-dashboard-kit.css"],
    patterns: ["/dashboard/hermes-dashboard-kit.css"]
  },
  "rinseables-os": {
    files: ["public/dashboard/index.html", "public/dashboard/hermes-dashboard-kit.css"],
    patterns: ["/dashboard/hermes-dashboard-kit.css"]
  },
  "investing-system": {
    files: ["public/roc/index.html", "public/roc/hermes-dashboard-kit.css"],
    patterns: ["/roc/hermes-dashboard-kit.css"]
  }
};

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const rows = [];
const findings = [];

for (const project of registry.projects ?? []) {
  const contract = required[project.id];
  if (!contract) {
    rows.push({ project: project.id, status: "not-applicable", missingFiles: [], missingPatterns: [] });
    continue;
  }
  const projectRoot = path.resolve(root, project.path);
  const missingFiles = contract.files.filter((file) => !fs.existsSync(path.join(projectRoot, file)));
  const text = contract.files
    .filter((file) => fs.existsSync(path.join(projectRoot, file)))
    .map((file) => fs.readFileSync(path.join(projectRoot, file), "utf8"))
    .join("\n");
  const missingPatterns = contract.patterns.filter((pattern) => !text.includes(pattern));
  const status = missingFiles.length || missingPatterns.length ? "needs-served-css" : "passed";
  rows.push({ project: project.id, status, missingFiles, missingPatterns });
  for (const file of missingFiles) {
    findings.push({ project: project.id, severity: "error", code: "servedCss.fileMissing", message: `${file} is required so dashboard-kit CSS is served by the app.` });
  }
  for (const pattern of missingPatterns) {
    findings.push({ project: project.id, severity: "error", code: "servedCss.linkMissing", message: `Missing dashboard-kit CSS reference: ${pattern}` });
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  summary: {
    totalProjects: rows.length,
    passed: rows.filter((row) => row.status === "passed" || row.status === "not-applicable").length,
    needsServedCss: rows.filter((row) => row.status === "needs-served-css").length,
    findings: findings.length
  },
  rows,
  findings
};

if (write) {
  const jsonPath = path.join(root, "docs/design/dashboard-kit-served-css-report.json");
  const mdPath = path.join(root, "docs/design/dashboard-kit-served-css-report.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(report));
  console.log(`Wrote ${path.relative(root, jsonPath)}`);
  console.log(`Wrote ${path.relative(root, mdPath)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (strict && findings.length) {
  process.exitCode = 1;
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Kit Served CSS Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "This report catches the specific regression where a project has @hermes/dashboard-kit installed or vendored, but the visible dashboard route does not actually load the kit stylesheet.",
    "",
    "## Summary",
    "",
    `- Projects: ${report.summary.totalProjects}`,
    `- Passed / not applicable: ${report.summary.passed}`,
    `- Need served CSS wiring: ${report.summary.needsServedCss}`,
    `- Findings: ${report.summary.findings}`,
    "",
    "| Project | Status | Missing files | Missing references |",
    "| --- | --- | --- | --- |"
  ];
  for (const row of report.rows) {
    lines.push(`| ${row.project} | ${row.status} | ${row.missingFiles.join("<br>") || "none"} | ${row.missingPatterns.join("<br>") || "none"} |`);
  }
  return `${lines.join("\n")}\n`;
}
