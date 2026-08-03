#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const statusScript = path.join(root, "packages/hermes-dashboard-kit/scripts/status.mjs");
const args = process.argv.slice(2);
const write = args.includes("--write");
const jsonOnly = args.includes("--json");
const projectFilter = valueAfter("--project");

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function rel(file) {
  return path.relative(root, file) || ".";
}

function loadKitComponents() {
  const source = readText(statusScript);
  const statusMatches = [...source.matchAll(/"([A-Z][A-Za-z0-9]+)"/g)].map((match) => match[1]);
  const srcDir = path.join(root, "packages/hermes-dashboard-kit/src");
  const sourceMatches = [];
  for (const file of walk(srcDir)) {
    if (!/\.(js|ts|tsx)$/.test(file)) continue;
    const text = readText(file);
    for (const match of text.matchAll(/export function ([A-Za-z][A-Za-z0-9]+)/g)) {
      sourceMatches.push(normalizeComponentName(match[1]));
    }
  }
  const aliases = [
    ["ApprovalQueuePanel", "ApprovalQueue"],
    ["DetailDrawerShell", "DetailDrawer"],
    ["DashboardShell", "Header"],
    ["DashboardShell", "Sidebar"],
    ["DataTable", "Pagination"],
    ["ActionQueue", "TaskQueue"],
    ["OperationsFunnel", "LifecycleFunnel"],
    ["ContentPackageWorkspace", "MediaPackageCard"],
    ["ContentPackageWorkspace", "VideoPackageTable"],
    ["CampaignRiskRail", "CampaignRiskRail"],
    ["WasteCostPanel", "WasteCostPanel"],
    ["QueuePanel", "JobQueue"],
    ["ProviderSpendTimeline", "ProviderSpendTimeline"],
    ["AlertRail", "AlertRail"],
    ["GeneratedInsightCallout", "GeneratedInsightCallout"],
    ["ExpandableDataList", "ExpandableDataList"],
    ["EntitySummaryCard", "EntitySummaryCard"]
  ].flatMap(([sourceName, alias]) => sourceMatches.includes(sourceName) ? [alias] : []);
  return Array.from(new Set([...statusMatches, ...sourceMatches, ...aliases])).filter(Boolean).sort();
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function normalizeComponentName(name) {
  if (name.startsWith("render") && /[A-Z]/.test(name.charAt(6))) {
    return name.slice(6);
  }
  return name;
}

function parseGapAudit(projectRoot) {
  const auditPath = path.join(projectRoot, "docs/dashboard-component-gap-audit.md");
  if (!fs.existsSync(auditPath)) {
    return {
      exists:
        false,
      path:
        auditPath,
      requestedComponents:
        []
    };
  }
  const text = fs.readFileSync(auditPath, "utf8");
  const requested =
    [...text.matchAll(/`([A-Z][A-Za-z0-9]+(?:\s*\/\s*[A-Z][A-Za-z0-9]+)*)`/g)]
      .flatMap((match) => match[1].split("/").map((item) => item.trim()))
      .filter(Boolean);
  return {
    exists:
      true,
    path:
      auditPath,
    requestedComponents:
      Array.from(new Set(requested)).sort()
  };
}

function surfaceEvidence(surface, projectRoot, kitComponents) {
  const surfacePath = path.resolve(projectRoot, surface.path);
  const content = readText(surfacePath);
  const lower = content.toLowerCase();
  const required = surface.requiredComponents ?? [];
  const markers = surface.markers ?? [];
  const declaredComponents =
    Array.from(new Set([
      ...required,
      ...markers.flatMap((marker) => {
        const matches = [...String(marker).matchAll(/(?:data-hdk-component=\\?"|data-component=\\?"|render)([A-Z][A-Za-z0-9]+)/g)];
        return matches.map((match) => match[1]);
      })
    ].filter((component) => /^[A-Z]/.test(component))));
  const usedKnown =
    kitComponents.filter((component) => {
      const kebab = component.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "");
      return lower.includes(component.toLowerCase()) || lower.includes(`hdk-${kebab}`);
    });
  const missingEvidence =
    required.filter((component) => !usedKnown.includes(component) && !lower.includes(component.toLowerCase()));
  return {
    id:
      surface.id,
    path:
      surface.path,
    status:
      surface.status ?? "unknown",
    requiredComponents:
      required,
    declaredComponents,
    usedKnownComponents:
      usedKnown,
    missingEvidence,
    fileExists:
      fs.existsSync(surfacePath)
  };
}

function scoreProject({ manifest, surfaces, gapAudit, kitComponents }) {
  const requested = new Set(gapAudit.requestedComponents);
  const required = new Set(surfaces.flatMap((surface) => surface.requiredComponents));
  const missingShared = [...requested].filter((component) => !kitComponents.includes(component));
  const readyShared = [...requested].filter((component) => kitComponents.includes(component));
  const missingEvidence = surfaces.flatMap((surface) => surface.missingEvidence.map((component) => ({
    surface:
      surface.id,
    component
  })));
  const adoptionMode =
    manifest?.dashboardKit?.adoptionMode ?? "unknown";
  const implementationMode =
    manifest?.dashboardKit?.implementationMode ?? adoptionMode;
  const currentTier =
    manifest?.dashboardKit?.currentExperienceTier ?? null;
  const targetTier =
    manifest?.dashboardKit?.targetExperienceTier ?? null;

  return {
    adoptionMode,
    implementationMode,
    currentTier,
    targetTier,
    requiredComponents:
      [...required].sort(),
    requestedComponents:
      [...requested].sort(),
    sharedComponentsReady:
      readyShared.sort(),
    missingSharedComponents:
      missingShared.sort(),
    missingSurfaceEvidence:
      missingEvidence,
    status:
      missingShared.length ? "kit-gap" : missingEvidence.length ? "adoption-gap" : "covered"
  };
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing registry: ${rel(registryPath)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const kitComponents = loadKitComponents();
const projects =
  (registry.projects ?? []).filter((project) => !projectFilter || project.id === projectFilter);
const projectReports =
  projects.map((project) => {
    const projectRoot = path.resolve(root, project.path);
    const manifestPath = path.resolve(root, project.manifest);
    const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
    const gapAudit = parseGapAudit(projectRoot);
    const surfaces = (manifest?.surfaces ?? []).map((surface) => surfaceEvidence(surface, projectRoot, kitComponents));
    return {
      id:
        project.id,
      name:
        project.name,
      path:
        project.path,
      manifest:
        project.manifest,
      gapAudit:
        {
          exists:
            gapAudit.exists,
          path:
            fs.existsSync(gapAudit.path) ? rel(gapAudit.path) : null
        },
      ...scoreProject({
        manifest,
        surfaces,
        gapAudit,
        kitComponents
      }),
      surfaces
    };
  });

const aggregateMissing =
  new Map();
for (const project of projectReports) {
  for (const component of project.missingSharedComponents) {
    const current = aggregateMissing.get(component) ?? [];
    current.push(project.id);
    aggregateMissing.set(component, current);
  }
}

const report = {
  schemaVersion:
    1,
  generatedAt:
    new Date().toISOString(),
  kit:
    {
      package:
        registry.source?.package ?? "@hermes/dashboard-kit",
      version:
        registry.source?.version ?? "unknown",
      components:
        kitComponents
    },
  aggregate:
    {
      projectCount:
        projectReports.length,
      coveredProjects:
        projectReports.filter((project) => project.status === "covered").length,
      adoptionGapProjects:
        projectReports.filter((project) => project.status === "adoption-gap").length,
      kitGapProjects:
        projectReports.filter((project) => project.status === "kit-gap").length,
      missingSharedComponents:
        [...aggregateMissing.entries()]
          .map(([component, projects]) => ({ component, projects }))
          .sort((a, b) => b.projects.length - a.projects.length || a.component.localeCompare(b.component))
    },
  projects:
    projectReports
};

function renderMarkdown(data) {
  const lines = [
    "# Dashboard Component Gap Audit",
    "",
    `Generated: ${data.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Projects audited: ${data.aggregate.projectCount}`,
    `- Covered projects: ${data.aggregate.coveredProjects}`,
    `- Adoption-gap projects: ${data.aggregate.adoptionGapProjects}`,
    `- Kit-gap projects: ${data.aggregate.kitGapProjects}`,
    "",
    "## Missing Shared Components",
    ""
  ];

  if (data.aggregate.missingSharedComponents.length) {
    lines.push("| Component | Projects |", "| --- | --- |");
    for (const item of data.aggregate.missingSharedComponents) {
      lines.push(`| \`${item.component}\` | ${item.projects.join(", ")} |`);
    }
  } else {
    lines.push("No missing shared components detected from project manifests or gap-audit docs.");
  }

  lines.push("", "## Project Status", "", "| Project | Status | Mode | Tier | Missing shared | Missing evidence | Gap audit |", "| --- | --- | --- | --- | ---: | ---: | --- |");
  for (const project of data.projects) {
    lines.push(`| ${project.name} | ${project.status} | ${project.implementationMode} | ${project.currentTier ?? "?"}->${project.targetTier ?? "?"} | ${project.missingSharedComponents.length} | ${project.missingSurfaceEvidence.length} | ${project.gapAudit.exists ? project.gapAudit.path : "missing"} |`);
  }

  lines.push("", "## Next Actions", "");
  lines.push("1. Build missing shared components that appear across more than one dashboard.");
  lines.push("2. For projects with no gap audit, create `docs/dashboard-component-gap-audit.md` before redesign work.");
  lines.push("3. For projects with missing evidence only, migrate the surface to use existing kit components instead of local primitives.");
  lines.push("4. Only promote a dashboard toward T3C after the component audit, adoption audit, and visual proof pass.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

if (write) {
  const jsonPath = path.join(root, "docs/design/dashboard-cross-project-component-audit.json");
  const mdPath = path.join(root, "docs/design/dashboard-cross-project-component-audit.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(report));
}

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Hermes dashboard component gap audit");
  console.table(projectReports.map((project) => ({
    project:
      project.id,
    status:
      project.status,
    mode:
      project.implementationMode,
    tier:
      `${project.currentTier ?? "?"}->${project.targetTier ?? "?"}`,
    missingShared:
      project.missingSharedComponents.length,
    missingEvidence:
      project.missingSurfaceEvidence.length,
    gapAudit:
      project.gapAudit.exists ? "yes" : "no"
  })));
  if (write) {
    console.log("Wrote docs/design/dashboard-cross-project-component-audit.json");
    console.log("Wrote docs/design/dashboard-cross-project-component-audit.md");
  }
}
