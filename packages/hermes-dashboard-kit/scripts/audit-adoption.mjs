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

function experienceTierLabel(registry, tier) {
  const match =
    (registry.experienceTiers ?? []).find((item) => Number(item.tier) === Number(tier));
  return match ? `${match.label} (Tier ${match.tier})` : `Tier ${tier}`;
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

  const currentExperienceTier =
    project.currentExperienceTier ?? manifest.dashboardKit?.currentExperienceTier ?? null;
  const targetExperienceTier =
    project.targetExperienceTier ?? manifest.dashboardKit?.targetExperienceTier ?? null;
  const implementationMode =
    project.implementationMode ?? manifest.dashboardKit?.implementationMode ?? manifest.dashboardKit?.adoptionMode ?? project.expectedMode ?? null;
  const targetExperienceBand =
    project.targetExperienceBand ?? manifest.dashboardKit?.targetExperienceBand ?? null;
  const tierMigrationRequired =
    project.tierMigrationRequired ?? (
      currentExperienceTier !== null &&
      targetExperienceTier !== null &&
      Number(currentExperienceTier) < Number(targetExperienceTier)
    );

  if (currentExperienceTier === null || targetExperienceTier === null) {
    issues.push(issue(
      "warning",
      "experienceTier.missing",
      "Dashboard adoption should declare currentExperienceTier and targetExperienceTier so shell compliance is not confused with product-grade completion."
    ));
  } else if (Number(currentExperienceTier) < Number(targetExperienceTier)) {
    issues.push(issue(
      "warning",
      "experienceTier.migrationRequired",
      `Experience tier is ${experienceTierLabel(registry, currentExperienceTier)} but target is ${experienceTierLabel(registry, targetExperienceTier)}.`,
      {
        currentExperienceTier:
          Number(currentExperienceTier),
        targetExperienceTier:
          Number(targetExperienceTier),
        tierMigrationRequired,
        tierMigrationNote:
          project.tierMigrationNote || manifest.dashboardKit?.tierMigrationNote || ""
      }
    ));
  }

  if (!implementationMode) {
    issues.push(issue(
      "warning",
      "implementationMode.missing",
      "Dashboard adoption should declare implementationMode so static/server-rendered bridges are not confused with package-native completion."
    ));
  }

  if (targetExperienceBand === "T3C" && project.packageNativeRequired === true && implementationMode !== "package-native") {
    issues.push(issue(
      "warning",
      "packageNative.bridge",
      `Target band is T3C, but current implementation mode is ${implementationMode}. Treat this as a bridge, not the final standard.`,
      {
        implementationMode,
        targetExperienceBand,
        bridgeStatus:
          project.bridgeStatus || manifest.dashboardKit?.bridgeStatus || ""
      }
    ));
  }

  if (implementationMode === "server-rendered-legacy" && Number(targetExperienceTier) >= 3) {
    issues.push(issue(
      "warning",
      "implementationMode.serverRenderedLegacy",
      "Server-rendered dashboard HTML/CSS cannot be the default path for Tier 3 completion; migrate to package-native/shared dashboard-kit components.",
      {
        implementationMode,
        targetExperienceBand:
          targetExperienceBand || ""
      }
    ));
  }

  if (Number(targetExperienceTier) >= 3 && project.mobbinReferenceRequired !== true) {
    issues.push(issue(
      "warning",
      "referenceEvidence.mobbinMissing",
      "Tier 3 dashboard migrations should require Mobbin/reference extraction before implementation."
    ));
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
        if (pattern.requiresDevOnlyGuard && hasDevOnlyGuard(content)) continue;
        issues.push(issue(pattern.severity, `legacy.${pattern.id}`, pattern.message, { surface: surface.id, path: surface.path }));
      }
    }
    if (Number(targetExperienceTier) >= 3 && surface.status !== "prototype" && surface.status !== "planned") {
      const shellQualityIssues =
        evaluateTier3ShellQuality(content, surface);
      issues.push(...shellQualityIssues);
    }
  }

  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  const status = errorCount ? "stale" : warningCount ? "needs-review" : "current";
  return {
    project:
      project.id,
    name:
      project.name,
    status,
    experienceTier: {
      current:
        currentExperienceTier === null ? null : Number(currentExperienceTier),
      target:
        targetExperienceTier === null ? null : Number(targetExperienceTier),
      targetBand:
        targetExperienceBand,
      implementationMode,
      migrationRequired:
        Boolean(tierMigrationRequired),
      note:
        project.tierMigrationNote || manifest?.dashboardKit?.tierMigrationNote || ""
    },
    issues
  };
}

function hasDevOnlyGuard(content) {
  const lower = content.toLowerCase();
  return (
    lower.includes("localhost") &&
    lower.includes("127.0.0.1") &&
    lower.includes("window.location.hostname")
  );
}

function evaluateTier3ShellQuality(content, surface) {
  const lower =
    content.toLowerCase();
  const issues = [];
  const sidebarEvidence = [
    "dashboardsidebar",
    "data-component=\"dashboardsidebar\"",
    "hdk-sidebar-rail",
    "hdk-sidebar"
  ];
  const headerEvidence = [
    "dashboardheader",
    "data-component=\"dashboardheader\"",
    "hdk-command-header",
    "hdk-header"
  ];
  const overflowEvidence = [
    "text-overflow",
    "truncate",
    "overflow-wrap",
    "white-space: nowrap",
    "minmax(13.5rem",
    "max-width"
  ];
  const tableEvidence = [
    "hdk-table-tabs",
    "hdk-table-layout",
    "data-component=\"datatabletabs\"",
    "data-component=\"datatable\""
  ];
  const chartEvidence = [
    "data-component=\"chartpanel\"",
    "hdk-chart-panel",
    "data-chart-type="
  ];
  const axisChartEvidence =
    lower.includes("data-chart-type=\"line\"") ||
    lower.includes("data-chart-type=\"area\"") ||
    lower.includes("data-chart-type=\"bar\"") ||
    lower.includes("data-chart-type=\"column\"");
  const axisContractEvidence =
    lower.includes("data-x-axis=") &&
    lower.includes("data-x-axis-label=") &&
    lower.includes("data-y-axis=") &&
    lower.includes("data-y-axis-label=");
  const partToWholeEvidence =
    lower.includes("data-chart-type=\"donut\"") ||
    lower.includes("data-chart-type=\"ring\"") ||
    lower.includes("data-chart-type=\"pie\"");
  const partToWholeContractEvidence =
    lower.includes("data-dimension=") &&
    lower.includes("data-measure=");

  if (!sidebarEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.sidebarRailMissing",
      "Tier 3 surfaces must show a real sidebar rail/nav standard instead of a loose card stack.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (!headerEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.commandHeaderMissing",
      "Tier 3 surfaces must show compact command-header evidence instead of a fat dashboard banner.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  const routerIndex =
    lower.indexOf("data-media-ops-router");
  const commandHeaderIndex =
    lower.indexOf("hdk-command-header");
  if (routerIndex >= 0 && commandHeaderIndex >= 0 && commandHeaderIndex < routerIndex) {
    issues.push(issue(
      "warning",
      "tier3.shellLevelCommandBanner",
      "Command/overview banners should be route-owned content, not shell-level banners repeated above every dashboard page.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (!overflowEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.overflowProtectionMissing",
      "Tier 3 surfaces should show sidebar/header overflow protection so labels, cards, and actions do not spill out of the shell.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (lower.includes("hdk-table") && !tableEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.tableCompositionMissing",
      "Tier 3 surfaces with data tables should show table composition evidence such as DataTableTabs, hdk-table-tabs, hdk-table-layout, or DataTable.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if ((lower.includes("chart") || lower.includes("svg")) && !chartEvidence.some((marker) => lower.includes(marker))) {
    issues.push(issue(
      "warning",
      "tier3.chartPanelMissing",
      "Tier 3 surfaces with charts should use ChartPanel/hdk-chart-panel evidence instead of local decorative chart cards.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (axisChartEvidence && !axisContractEvidence) {
    issues.push(issue(
      "warning",
      "tier3.axisChartContractMissing",
      "Axis charts must declare x/y axis fields and labels so line, area, bar, and column charts are semantically reviewable.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  if (partToWholeEvidence && !partToWholeContractEvidence) {
    issues.push(issue(
      "warning",
      "tier3.partToWholeContractMissing",
      "Donut/ring/pie charts must declare their dimension and measure contract.",
      {
        surface:
          surface.id,
        path:
          surface.path
      }
    ));
  }

  return issues;
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
    tier: result.experienceTier?.current === null
      ? "unset"
      : `${result.experienceTier.current}->${result.experienceTier.target}${result.experienceTier.targetBand ? ` ${result.experienceTier.targetBand}` : ""}`,
    mode: result.experienceTier?.implementationMode || "unset",
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
