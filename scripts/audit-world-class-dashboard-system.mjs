#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const json = args.includes("--json");
const writeReport = args.includes("--write-report");
const writeBacklog = args.includes("--write-backlog") || writeReport;
const configPath = path.join(root, "docs/design/world-class-dashboard-system-audit.json");
const reportPath = path.join(root, "docs/design/world-class-dashboard-system-audit-report.json");
const backlogPath = path.join(root, "docs/design/world-class-dashboard-system-backlog.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readOptionalJson(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

function valueAtPath(source, fieldPath) {
  return String(fieldPath ?? "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => {
      if (value == null) return undefined;
      return value[key];
    }, source);
}

function packageScripts() {
  return readJson(path.join(root, "package.json")).scripts ?? {};
}

function loadAdoptionReport() {
  const file = path.join(root, "packages/hermes-dashboard-kit/adoption/reports/latest-adoption-report.json");
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

function ageHours(timestamp) {
  const time = Date.parse(timestamp ?? "");
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return (Date.now() - time) / 36e5;
}

function loadAdoptionRegistry() {
  const file = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

function loadProjectManifest(project) {
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) return null;
  return readJson(manifestPath);
}

function surfaceContents() {
  const registry = loadAdoptionRegistry();
  if (!registry) return [];
  const entries = [];
  for (const project of registry.projects ?? []) {
    const manifest = loadProjectManifest(project);
    if (!manifest) continue;
    const projectRoot = path.resolve(root, project.path);
    for (const surface of manifest.surfaces ?? []) {
      const surfacePath = path.resolve(projectRoot, surface.path);
      if (!fs.existsSync(surfacePath)) continue;
      entries.push({
        project: project.id,
        surface: surface.id,
        path: surface.path,
        content: fs.readFileSync(surfacePath, "utf8")
      });
    }
  }
  return entries;
}

function evaluateCheck(check, scripts, adoptionReport) {
  if (check.type === "file") {
    return fileExists(check.path);
  }
  if (check.type === "content") {
    return fileExists(check.path) && readText(check.path).includes(check.contains);
  }
  if (check.type === "package-script") {
    return Boolean(scripts[check.name]);
  }
  if (check.type === "package-version") {
    if (!fileExists(check.path)) return false;
    const packageJson = readJson(path.join(root, check.path));
    return Boolean(packageJson.version);
  }
  if (check.type === "adoption-manifests") {
    const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
    if (!fs.existsSync(registryPath)) return false;
    const registry = readJson(registryPath);
    return (registry.projects ?? []).every((project) => fs.existsSync(path.resolve(root, project.manifest)));
  }
  if (check.type === "adoption-no-stale") {
    if (!adoptionReport) return false;
    return !(adoptionReport.results ?? []).some((result) => result.status === "stale");
  }
  if (check.type === "fresh-report") {
    const report = check.report === "adoption" ? adoptionReport : null;
    if (!report) return false;
    return ageHours(report.generatedAt) <= (check.maxAgeHours ?? 24);
  }
  if (check.type === "no-surface-copy") {
    const forbidden = (check.contains ?? []).map((value) => value.toLowerCase());
    return surfaceContents().every((surface) => !forbidden.some((text) => surface.content.toLowerCase().includes(text)));
  }
  if (check.type === "manifest-sync-fresh") {
    const registry = loadAdoptionRegistry();
    if (!registry) return false;
    return (registry.projects ?? []).every((project) => {
      const manifest = loadProjectManifest(project);
      if (!manifest) return false;
      if (manifest.dashboardKit?.adoptionMode === "planned" || manifest.dashboardKit?.adoptionMode === "package-native") return true;
      return ageHours(manifest.dashboardKit?.lastSyncedAt) <= (check.maxAgeHours ?? 168);
    });
  }
  if (check.type === "json-number-zero") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    return valueAtPath(report, check.field) === 0;
  }
  if (check.type === "json-array-all-status") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => (check.allowed ?? []).includes(item.status));
  }
  if (check.type === "json-array-no-status") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => !(check.disallowed ?? []).includes(item.status));
  }
  if (check.type === "json-array-empty") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    return Array.isArray(items) && items.length === 0;
  }
  if (check.type === "json-array-min-number") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => Number(valueAtPath(item, check.field)) >= Number(check.min));
  }
  if (check.type === "json-array-max-number") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => Number(valueAtPath(item, check.field)) <= Number(check.max));
  }
  if (check.type === "json-array-all-file-exists") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => {
      const relativePath = valueAtPath(item, check.field);
      return typeof relativePath === "string" && fs.existsSync(path.join(root, relativePath));
    });
  }
  if (check.type === "json-array-all-truthy") {
    const report = readOptionalJson(check.path);
    if (!report) return false;
    const items = valueAtPath(report, check.array) ?? [];
    if (!Array.isArray(items)) return false;
    return items.every((item) => Boolean(valueAtPath(item, check.field)));
  }
  if (check.type === "manual-gap") {
    return false;
  }
  return false;
}

function severityForLayer(layerId) {
  if (["adoption", "runtime-proof", "data-contract", "governance"].includes(layerId)) return "high";
  if (["migration", "observability", "operator-experience"].includes(layerId)) return "medium";
  return "medium";
}

function nextActionForGap(layerId, check) {
  const actionById = {
    "no-stale-priority-surfaces": "Run dashboard-kit adoption migrate for Kashi and Media Engine, then replace local/prototype UI with dashboard-kit-backed surfaces until the adoption audit reports current.",
    "codemod-gap": "Build a codemod or patch generator that can replace declared legacy surface patterns with kit-backed static or package-native scaffolds.",
    "production-screenshot-gap": "Add production screenshot capture for registered dashboard URLs and store current baselines as release evidence.",
    "mock-state-proof-gap": "Add a production-surface text/state scan that fails when live surfaces expose mock, sample, placeholder, or prototype-only copy.",
    "real-endpoint-gap": "Map each project dashboard API into shared DashboardSnapshot, CostSnapshot, CapacitySnapshot, QueueSnapshot, and ActionNeeded contracts.",
    "readiness-gate-gap": "Wire stale dashboard adoption status into TLC/Hermes readiness scoring so stale priority surfaces cap readiness.",
    "project-wide-bridge-gap": "Require visual-selection bridge markers in every active/prototype dashboard surface manifest and fail adoption audit when missing."
  };
  if (actionById[check.id]) return actionById[check.id];
  const actionByType = {
    "adoption-no-stale": "Run the adoption migration plan for stale priority surfaces, then replace local UI primitives with dashboard-kit components.",
    "fresh-report": "Regenerate the dependent report before scoring world-class readiness.",
    "no-surface-copy": "Remove production-facing prototype/mock copy from declared live surfaces or mark the surface as prototype-only.",
    "manifest-sync-fresh": "Run dashboard-kit adoption sync across stale static-adapter projects.",
    "manual-gap": "Promote this manual gap into an executable proof check or a tracked implementation slice.",
    "package-script": "Add the missing package script and wire it into docs/CI.",
    "file": "Add the missing artifact and connect it to the audit.",
    "content": "Update the referenced document with the required governance language."
  };
  if (layerId === "design-quality") return "Add proof-based visual scoring using screenshots, chart criteria, and approved reference patterns.";
  if (layerId === "observability") return "Normalize cost, token, provider, health, queue, storage, and stale-data telemetry across registered projects.";
  if (layerId === "operator-experience") return "Make visual-selection bridge coverage a required surface manifest check.";
  return actionByType[check.type] ?? "Close the failed audit check and rerun the world-class report.";
}

function createBacklog(report) {
  const items = [];
  for (const layer of report.layers) {
    for (const check of layer.checks) {
      if (check.passed) continue;
      items.push({
        id: `dashboard-world-class-${layer.id}-${check.id}`,
        title: check.message,
        layer: layer.id,
        layerName: layer.name,
        severity: severityForLayer(layer.id),
        status: "open",
        source: "world-class-dashboard-system-audit",
        suggestedAction: nextActionForGap(layer.id, check),
        createdAt: report.generatedAt
      });
    }
  }
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    sourceReport: "docs/design/world-class-dashboard-system-audit-report.json",
    openItems: items.length,
    items
  };
}

function summarizeLayer(layer, scripts, adoptionReport) {
  const checks = layer.checks.map((check) => {
    const passed = evaluateCheck(check, scripts, adoptionReport);
    return {
      id: check.id,
      passed,
      points: passed ? check.points : 0,
      possiblePoints: check.points,
      message: check.message
    };
  });
  const earned = checks.reduce((sum, check) => sum + check.points, 0);
  const possible = checks.reduce((sum, check) => sum + check.possiblePoints, 0);
  return {
    id: layer.id,
    name: layer.name,
    question: layer.question,
    score: possible ? Math.round((earned / possible) * layer.weight * 10) / 10 : 0,
    weight: layer.weight,
    earned,
    possible,
    checks,
    gaps: checks.filter((check) => !check.passed).map((check) => check.message)
  };
}

if (!fileExists("docs/design/world-class-dashboard-system-audit.json")) {
  console.error("Missing world-class dashboard system audit config.");
  process.exit(1);
}

const config = readJson(configPath);
const scripts = packageScripts();
const adoptionReport = loadAdoptionReport();
const layers = config.layers.map((layer) => summarizeLayer(layer, scripts, adoptionReport));
const score = Math.round(layers.reduce((sum, layer) => sum + layer.score, 0) * 10) / 10;
const openGapCount = layers.reduce((sum, layer) => sum + layer.gaps.length, 0);
const ready = score >= config.minimumWorldClassScore && openGapCount === 0;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  minimumWorldClassScore: config.minimumWorldClassScore,
  score,
  openGapCount,
  status: ready ? "world-class-ready" : "not-world-class-yet",
  layers
};

if (writeReport) {
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (writeBacklog) {
  fs.writeFileSync(backlogPath, `${JSON.stringify(createBacklog(report), null, 2)}\n`);
}

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Hermes world-class dashboard system audit");
  console.log(`Score: ${score}/100 (${report.status})`);
  console.table(layers.map((layer) => ({
    layer: layer.name,
    score: `${layer.score}/${layer.weight}`,
    gaps: layer.gaps.length
  })));
  for (const layer of layers) {
    if (!layer.gaps.length) continue;
    console.log(`\n${layer.name}`);
    for (const gap of layer.gaps) console.log(`- ${gap}`);
  }
  if (writeReport) console.log(`\nWrote report: docs/design/world-class-dashboard-system-audit-report.json`);
  if (writeBacklog) console.log(`Wrote backlog: docs/design/world-class-dashboard-system-backlog.json`);
}

if (strict && score < config.minimumWorldClassScore) {
  process.exit(1);
}
