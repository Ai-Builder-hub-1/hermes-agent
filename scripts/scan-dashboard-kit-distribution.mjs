#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { dashboardRegistry, designDir, markdownTable, resolveProjectPath, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const strict = process.argv.includes("--strict");
const jsonPath = path.join(designDir, "dashboard-kit-distribution-report.json");
const mdPath = path.join(designDir, "dashboard-kit-distribution-report.md");

function classify(value) {
  if (!value) return { mode: "missing", severity: "blocking", recommendation: "Add @hermes/dashboard-kit from an approved package source." };
  if (value === "workspace:*" || value.startsWith("workspace:")) return { mode: "workspace", severity: "none", recommendation: "Keep workspace protocol pinned by monorepo policy." };
  if (value.startsWith("file:vendor/hermes-dashboard-kit")) return { mode: "vendored-file", severity: "none", recommendation: "Keep vendor copy refreshed from Nous before promotion." };
  if (value.includes("../nous-hermes-agent/packages/hermes-dashboard-kit")) return { mode: "sibling-file", severity: "warning", recommendation: "Replace with an approved package artifact, workspace protocol, or vendored copy before independent deploy." };
  if (value.startsWith("file:")) return { mode: "local-file", severity: "warning", recommendation: "Document and validate the local package source." };
  return { mode: "package", severity: "none", recommendation: "Track package version in release notes." };
}

const seen = new Map();
for (const dashboard of dashboardRegistry()) {
  if (!seen.has(dashboard.projectPath)) seen.set(dashboard.projectPath, dashboard);
}

const entries = [...seen.values()].map((dashboard) => {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const packagePath = path.join(projectRoot, "package.json");
  const sourcePackagePath = path.join(projectRoot, "packages/hermes-dashboard-kit/package.json");
  if (dashboard.projectPath === "." && fs.existsSync(sourcePackagePath)) {
    return {
      id: dashboard.id,
      label: dashboard.label,
      projectPath: dashboard.projectPath,
      status: "ready",
      dependency: "source-package",
      mode: "source-package",
      severity: "none",
      recommendation: "Nous owns the canonical package source; downstream projects consume a package artifact or approved local copy."
    };
  }
  if (!fs.existsSync(packagePath)) {
    return {
      id: dashboard.id,
      label: dashboard.label,
      projectPath: dashboard.projectPath,
      status: "missing-package-json",
      dependency: null,
      mode: "missing",
      severity: "blocking",
      recommendation: "Add package.json or remove this project from package distribution reporting."
    };
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const dependency = pkg.dependencies?.["@hermes/dashboard-kit"] ?? pkg.devDependencies?.["@hermes/dashboard-kit"] ?? null;
  const classification = classify(dependency);
  return {
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    status: classification.severity === "blocking" ? "blocked" : classification.severity === "warning" ? "advisory" : "ready",
    dependency,
    ...classification
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Tracks how registered dashboard projects consume @hermes/dashboard-kit.",
  checkedCount: entries.length,
  blockingGapCount: entries.filter((entry) => entry.severity === "blocking").length,
  warningCount: entries.filter((entry) => entry.severity === "warning").length,
  entries
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, `# Dashboard Kit Distribution Report

Generated: ${report.generatedAt}

${markdownTable(
  ["Project", "Status", "Dependency", "Mode", "Recommendation"],
  entries.map((entry) => [entry.label, entry.status, entry.dependency ?? "missing", entry.mode, entry.recommendation])
)}
`);

console.log(`Dashboard kit distribution: ${report.blockingGapCount} blocking gap(s), ${report.warningCount} warning(s).`);
console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
if (strict && report.blockingGapCount) process.exit(1);
