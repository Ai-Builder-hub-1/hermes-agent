#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { dashboardRegistry, designDir, markdownTable, resolveProjectPath, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");
const registryPath = path.join(designDir, "dashboard-domain-library-registry.json");
const adoptionRegistryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const jsonPath = path.join(designDir, "dashboard-domain-library-usage-report.json");
const mdPath = path.join(designDir, "dashboard-domain-library-usage-report.md");

const ignoredDirs = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", "vendor"]);
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function dashboardSurfaceFiles(projectRoot, projectPath) {
  if (!fs.existsSync(adoptionRegistryPath)) return null;
  const adoption = readJson(adoptionRegistryPath);
  const project = (adoption.projects ?? []).find((item) => item.path === projectPath);
  if (!project?.manifest) return null;
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  const files = (manifest.surfaces ?? [])
    .filter((surface) => surface.status !== "dev-only")
    .map((surface) => path.resolve(projectRoot, surface.path))
    .filter((file) => fs.existsSync(file));
  return files.length ? files : null;
}

function packageNames(registry) {
  const packages = new Map();
  for (const domain of registry.domains ?? []) {
    for (const candidate of domain.libraryCandidates ?? []) {
      const pkg = candidate.package;
      if (!pkg || pkg.includes(" ") || pkg.startsWith("external-") || pkg.startsWith("system-")) continue;
      for (const part of pkg.split("+").map((item) => item.trim()).filter(Boolean)) {
        if (!part || part.includes("*")) continue;
        packages.set(part, { domain: domain.id, candidate: candidate.id });
      }
    }
  }
  return packages;
}

function importPattern(pkg) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:from\\s+["']${escaped}(?:/[^"']*)?["']|import\\s*\\(["']${escaped}(?:/[^"']*)?["']\\)|require\\(["']${escaped}(?:/[^"']*)?["']\\))`);
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing registry: ${path.relative(root, registryPath)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const trackedPackages = packageNames(registry);
const dashboards = dashboardRegistry();
const projectMap = new Map();
for (const dashboard of dashboards) {
  if (!projectMap.has(dashboard.projectPath)) projectMap.set(dashboard.projectPath, dashboard);
}

const entries = [];
for (const dashboard of projectMap.values()) {
  const projectRoot = resolveProjectPath(dashboard.projectPath);
  const isCanonicalKit = dashboard.projectPath === ".";
  const surfaceFiles = dashboardSurfaceFiles(projectRoot, dashboard.projectPath);
  const files = surfaceFiles ?? walk(projectRoot);
  const findings = [];
  for (const file of files) {
    const text = readText(file);
    for (const [pkg, meta] of trackedPackages.entries()) {
      if (importPattern(pkg).test(text)) {
        findings.push({
          package: pkg,
          domain: meta.domain,
          candidate: meta.candidate,
          file: path.relative(root, file),
          allowed: isCanonicalKit || text.includes("@hermes/dashboard-kit")
        });
      }
    }
  }
  const directFindings = findings.filter((finding) => !finding.allowed);
  entries.push({
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    status: directFindings.length ? "direct-domain-library-usage" : findings.length ? "kit-owned-or-local-wrapper" : "no-domain-library-imports",
    scanScope: surfaceFiles ? "declared-dashboard-surfaces" : "project-fallback",
    findingCount: findings.length,
    directFindingCount: directFindings.length,
    findings
  });
}

const directFindingCount = entries.reduce((sum, entry) => sum + entry.directFindingCount, 0);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Scans registered dashboard projects for direct imports of approved domain libraries. Direct imports outside @hermes/dashboard-kit are drift risks.",
  projectCount: entries.length,
  directFindingCount,
  entries
};

if (write) {
  writeJson(jsonPath, report);
  writeMarkdown(mdPath, `# Dashboard Domain Library Usage Report

Generated: ${report.generatedAt}

${markdownTable(
  ["Project", "Scope", "Status", "Findings", "Direct findings"],
  entries.map((entry) => [entry.label, entry.scanScope, entry.status, entry.findingCount, entry.directFindingCount])
)}

## Direct Findings

${entries.flatMap((entry) => entry.findings.filter((finding) => !finding.allowed).map((finding) => `- ${entry.label}: \`${finding.package}\` in \`${finding.file}\` should be routed through @hermes/dashboard-kit or an approved exception.`)).join("\n") || "No direct downstream domain-library imports found."}
`);
}

console.log(`Dashboard domain library usage: ${directFindingCount} direct downstream finding(s).`);
if (write) {
  console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
}
if (strict && directFindingCount > 0) process.exit(1);
