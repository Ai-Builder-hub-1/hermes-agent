#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const json = args.includes("--json");
const writeReport = args.includes("--write-report");
const projectArg = valueAfter("--project");

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rel(file) {
  return path.relative(root, file) || ".";
}

function compareVersions(actual, required) {
  const clean = (value) => String(value ?? "").replace(/^[^\d]*/, "").split(".").map((part) => Number(part) || 0);
  const a = clean(actual);
  const b = clean(required);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return 1;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return -1;
  }
  return 0;
}

function issue(severity, code, message, details = {}) {
  return { severity, code, message, ...details };
}

function evaluateProject(registry, project, sourceHash) {
  const projectRoot = path.resolve(root, project.path);
  const manifestPath = path.resolve(root, project.manifest);
  const issues = [];
  let manifest = null;

  if (!fs.existsSync(projectRoot)) {
    issues.push(issue("error", "project.missing", "Project path is missing.", { path: project.path }));
    return { project: project.id, name: project.name, status: "missing", issues };
  }

  if (!fs.existsSync(manifestPath)) {
    issues.push(issue("error", "manifest.missing", "Project is not declaring dashboard-kit adoption.", { manifest: project.manifest }));
    return { project: project.id, name: project.name, status: "unregistered", issues };
  }

  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    issues.push(issue("error", "manifest.invalid-json", `Manifest cannot be parsed: ${error.message}`, { manifest: project.manifest }));
    return { project: project.id, name: project.name, status: "invalid", issues };
  }

  if (manifest.schemaVersion !== 1) issues.push(issue("error", "manifest.schemaVersion", "schemaVersion must be 1."));
  if (manifest.projectId !== project.id) issues.push(issue("error", "manifest.projectId", `Expected projectId ${project.id}.`));
  if (manifest.dashboardKit?.package !== registry.source.package) issues.push(issue("error", "manifest.package", `dashboardKit.package must be ${registry.source.package}.`));
  if (compareVersions(manifest.dashboardKit?.requiredVersion, registry.source.minimumRequiredVersion) < 0) {
    issues.push(issue("error", "manifest.requiredVersion", `Required version ${manifest.dashboardKit?.requiredVersion ?? "(missing)"} is below ${registry.source.minimumRequiredVersion}.`));
  }
  if (project.expectedMode !== "planned" && manifest.dashboardKit?.adoptionMode !== project.expectedMode && manifest.dashboardKit?.adoptionMode !== "hybrid") {
    issues.push(issue("warning", "manifest.adoptionMode", `Expected ${project.expectedMode} or hybrid adoption mode.`));
  }

  const adapterTarget = manifest.dashboardKit?.staticAdapterPath
    ? path.resolve(projectRoot, manifest.dashboardKit.staticAdapterPath)
    : project.adapterTarget
      ? path.resolve(root, project.adapterTarget)
      : null;
  if (adapterTarget && manifest.dashboardKit?.adoptionMode !== "package-native" && manifest.dashboardKit?.adoptionMode !== "planned") {
    if (!fs.existsSync(adapterTarget)) {
      issues.push(issue("error", "adapter.missing", "Static adapter is missing.", { path: rel(adapterTarget) }));
    } else {
      const adapterHash = hash(adapterTarget);
      if (adapterHash !== sourceHash) {
        issues.push(issue("error", "adapter.drifted", "Static adapter has drifted from the canonical dashboard-kit CSS.", {
          path: rel(adapterTarget),
          expectedHash: sourceHash.slice(0, 12),
          actualHash: adapterHash.slice(0, 12)
        }));
      }
      if (manifest.dashboardKit?.canonicalCssHash && manifest.dashboardKit.canonicalCssHash !== sourceHash) {
        issues.push(issue("warning", "adapter.recordedHashStale", "Manifest recorded canonicalCssHash does not match current kit CSS hash.", {
          recordedHash: manifest.dashboardKit.canonicalCssHash.slice(0, 12),
          currentHash: sourceHash.slice(0, 12)
        }));
      }
    }
  }

  const surfaces = new Map((manifest.surfaces ?? []).map((surface) => [surface.id, surface]));
  for (const requiredSurface of project.requiredSurfaces ?? []) {
    if (!surfaces.has(requiredSurface)) {
      issues.push(issue("error", "surface.missing", `Required surface ${requiredSurface} is not listed in manifest.`));
    }
  }

  for (const surface of manifest.surfaces ?? []) {
    const surfacePath = path.resolve(projectRoot, surface.path);
    if (!fs.existsSync(surfacePath)) {
      issues.push(issue("error", "surface.fileMissing", `Surface file is missing: ${surface.path}`, { surface: surface.id }));
      continue;
    }
    const content = fs.readFileSync(surfacePath, "utf8");
    for (const marker of surface.markers ?? []) {
      if (!content.includes(marker)) {
        issues.push(issue("error", "surface.markerMissing", `Surface ${surface.id} is missing required marker: ${marker}`, { path: surface.path }));
      }
    }
    for (const component of surface.requiredComponents ?? []) {
      const componentMarkers = [
        component,
        `hdk-${component.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "")}`,
      ];
      if (!componentMarkers.some((marker) => content.includes(marker))) {
        const severity = surface.status === "prototype" || surface.status === "planned" ? "warning" : "error";
        issues.push(issue(severity, "surface.componentMissing", `Surface ${surface.id} does not show adoption evidence for ${component}.`, { path: surface.path }));
      }
    }
    const allowed = new Set(surface.allowedLegacyPatterns ?? []);
    for (const pattern of registry.legacyPatterns ?? []) {
      if (allowed.has(pattern.id)) continue;
      if (content.toLowerCase().includes(pattern.pattern.toLowerCase())) {
        issues.push(issue(pattern.severity, `legacy.${pattern.id}`, pattern.message, { surface: surface.id, path: surface.path }));
      }
    }
  }

  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  const status = errorCount ? "stale" : warningCount ? "needs-review" : "current";
  return { project: project.id, name: project.name, status, issues };
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing dashboard-kit adoption registry: ${rel(registryPath)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const sourcePath = path.resolve(root, registry.source.cssPath);
if (!fs.existsSync(sourcePath)) {
  console.error(`Missing canonical CSS: ${registry.source.cssPath}`);
  process.exit(1);
}
const sourceHash = hash(sourcePath);
const projects = (registry.projects ?? []).filter((project) => !projectArg || project.id === projectArg);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: registry.source,
  sourceHash,
  results: projects.map((project) => evaluateProject(registry, project, sourceHash))
};
const results = report.results;
const failing = results.filter((result) => result.issues.some((item) => item.severity === "error"));

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Hermes dashboard-kit adoption audit`);
  console.log(`Source: ${registry.source.package}@${registry.source.version}`);
  console.log(`CSS hash: ${sourceHash}`);
  console.table(results.map((result) => ({
    project: result.project,
    status: result.status,
    errors: result.issues.filter((item) => item.severity === "error").length,
    warnings: result.issues.filter((item) => item.severity === "warning").length
  })));
  for (const result of results) {
    if (!result.issues.length) continue;
    console.log(`\n${result.name} (${result.project})`);
    for (const item of result.issues) {
      console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}${item.path ? ` [${item.path}]` : ""}`);
    }
  }
}

if (writeReport) {
  const reportDir = path.join(root, "packages/hermes-dashboard-kit/adoption/reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "latest-adoption-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!json) console.log(`\nWrote adoption report: ${rel(reportPath)}`);
}

if (strict && failing.length) process.exit(1);
