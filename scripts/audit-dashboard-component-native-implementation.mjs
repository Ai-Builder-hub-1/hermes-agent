#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "../..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const outputJsonPath = path.join(root, "docs/design/dashboard-component-native-implementation-report.json");
const outputMdPath = path.join(root, "docs/design/dashboard-component-native-implementation-report.md");
const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");

const requiredComponentFamilies = [
  {
    id: "shell",
    label: "Shell",
    patterns: [/data-(?:hdk-)?component=["']DashboardShell["']/, /renderDashboardShell/, /<DashboardShell\b/, /\bhdk-shell\b/]
  },
  {
    id: "sidebar",
    label: "Sidebar",
    patterns: [/data-(?:hdk-)?component=["'](?:DashboardSidebar|Sidebar)["']/, /renderDashboardSidebar/, /<DashboardSidebar\b/, /\bhdk-sidebar\b/]
  },
  {
    id: "header",
    label: "Header",
    patterns: [/data-(?:hdk-)?component=["'](?:DashboardHeader|Header)["']/, /renderDashboardHeader/, /<DashboardHeader\b/, /\bhdk-header\b/]
  },
  {
    id: "state",
    label: "State and freshness",
    patterns: [/data-hdk-component=["'](?:DashboardQueryBoundary|DataFreshnessStrip|StatePanel|PartialDataBanner|StaleDataBadge)["']/, /render(?:DashboardQueryBoundary|DataFreshnessStrip|StatePanel|PartialDataBanner|StaleDataBadge)/]
  },
  {
    id: "metrics",
    label: "Metrics/cards",
    patterns: [/data-hdk-component=["'](?:MetricCard|MetricCardGroup|StatePanel)["']/, /render(?:MetricCard|StatePanel)/]
  },
  {
    id: "tables",
    label: "Tables",
    patterns: [/data-hdk-component=["'](?:DataTable|DataTableTabs|Pagination|TableSurface)["']/, /render(?:DataTable|DataTableTabs)/]
  },
  {
    id: "charts",
    label: "Charts",
    patterns: [/data-hdk-component=["'](?:LineChart|AreaChart|BarChart|DonutChart|Heatmap|PremiumComparisonChart|FinancialCandlestickChart)["']/, /render(?:LineChart|AreaChart|BarChart|DonutChart|Heatmap|PremiumComparisonChart|CandlestickChart)/]
  },
  {
    id: "workflow",
    label: "Workflow/detail",
    patterns: [/data-hdk-component=["'](?:Drawer|DrilldownPanel|ApprovalQueue|QaReviewPanel|ActionQueue|AlertQueue|ResearchDeskWorkspace|MarketBrowserLayout|PremiumPlannerCalendar)["']/, /render(?:Drawer|ApprovalQueue|QaReviewPanel|ActionQueue|AlertQueue|ResearchDeskWorkspace|MarketBrowserLayout|PremiumPlannerCalendar)/]
  },
  {
    id: "proof",
    label: "Proof",
    patterns: [/data-hdk-component=["'](?:ProofStrip|ProofStateStrip)["']/, /renderProofStrip/]
  }
];

const bridgeLanguagePatterns = [
  /\bcompatibility\b/i,
  /\bstatic\b/i,
  /\bhybrid\b/i,
  /\bbridge\b/i,
  /\bproject-owned\b/i,
  /\blocal (?:chart|table|drawer|state|primitive|render)/i,
  /\bmust migrate\b/i,
  /\bneeds? (?:one-shell|package-native|migration|adoption|shared components?)\b/i,
  /\bpending (?:full )?(?:component|package-native|migration|adoption|decomposition)/i,
  /\bshould be replaced\b/i,
  /\bremains? .* (?:static|legacy|compatibility|domain renderers?)\b/i
];

const localPrimitivePatterns = [
  { id: "local-sidebar-class", pattern: /class=["'][^"']*\b(?:sidebar|side-bar|nav-rail)\b(?![^"']*hdk-)/i },
  { id: "local-topbar-class", pattern: /class=["'][^"']*\b(?:topbar|top-bar|app-header)\b(?![^"']*hdk-)/i },
  { id: "local-card-class", pattern: /class=["'][^"']*\b(?:card|panel)\b(?![^"']*hdk-)/i },
  { id: "local-chart-function", pattern: /\bfunction\s+(?:chart|drawChart|renderChart|sparkline|depthChart)\b/i },
  { id: "inline-svg-chart", pattern: /<svg[\s\S]{0,600}(?:polyline|path|rect)[\s\S]{0,600}<\/svg>/i },
  { id: "hand-authored-table", pattern: /<table\b/i },
  { id: "hardcoded-spacing", pattern: /(?:gap|padding|margin|grid-template-columns)\s*:\s*(?:\d+px|repeat\(|minmax\()/i },
  { id: "hardcoded-color", pattern: /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/i }
];

const manifest = readJson(registryPath);
const projects = (manifest.projects ?? []).map(auditProject);
const summary = {
  totalProjects: projects.length,
  componentNative: projects.filter((project) => project.status === "component-native").length,
  needsImplementationMigration: projects.filter((project) => project.status === "needs-implementation-migration").length,
  blockedFalseNativeClaims: projects.filter((project) => project.blockers.length > 0).length
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: {
    definition: "Component-native means the production dashboard route is implemented with @hermes/dashboard-kit primitives across shell, navigation, state, metrics/cards, tables, charts/workflow surfaces, and proof. A project is not component-native simply because the package is installed, CSS is copied, or hdk markers are present.",
    requiredFamilies: requiredComponentFamilies.map((family) => family.id),
    falseNativeSignals: [
      "manifest or surface notes mention compatibility/static/hybrid bridge delivery",
      "T3C project still has local chart/table/drawer/state primitives",
      "surface has mostly local card/table/chart/sidebar classes without kit component evidence",
      "proof is limited to CSS/vendor sync instead of rendered component evidence"
    ]
  },
  summary,
  projects
};

if (write) {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outputMdPath, renderMarkdown(report));
  console.log(`Wrote ${path.relative(root, outputJsonPath)}`);
  console.log(`Wrote ${path.relative(root, outputMdPath)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (strict && projects.some((project) => project.blockers.length > 0)) {
  console.error(`Component-native implementation audit failed (${summary.blockedFalseNativeClaims} project(s) blocked).`);
  for (const project of projects.filter((item) => item.blockers.length > 0)) {
    console.error(`- ${project.project}: ${project.blockers.join("; ")}`);
  }
  process.exit(1);
}

function auditProject(project) {
  const projectRoot = path.resolve(root, project.path ?? "");
  const projectManifestPath = path.resolve(root, project.manifest ?? "");
  const projectManifest = fs.existsSync(projectManifestPath) ? readJson(projectManifestPath) : {};
  const surfaces = projectManifest.surfaces ?? [];
  const surfaceAudits = surfaces.map((surface) => auditSurface(projectRoot, surface));
  const mode = projectManifest.dashboardKit?.implementationMode ?? project.implementationMode ?? "unknown";
  const adoptionMode = projectManifest.dashboardKit?.adoptionMode ?? project.expectedMode ?? "unknown";
  const targetBand = projectManifest.dashboardKit?.targetExperienceBand ?? project.targetExperienceBand ?? "unknown";
  const noteBlob = [
    project.bridgeStatus,
    project.tierMigrationNote,
    projectManifest.dashboardKit?.bridgeStatus,
    projectManifest.dashboardKit?.tierMigrationNote,
    ...surfaces.map((surface) => surface.status),
    ...surfaces.map((surface) => surface.notes)
  ].filter(Boolean).join(" ");
  const hasBridgeLanguage = bridgeLanguagePatterns.some((pattern) => pattern.test(noteBlob));
  const componentCoverage = coverageFor(surfaceAudits);
  const visibleSurfaceAudits = surfaceAudits.filter((surface) => !["api", "data-contract", "proof-endpoint", "server-route", "kit-source"].includes(surface.role ?? "ui"));
  const visibleRouteCoverage = coverageFor(visibleSurfaceAudits);
  const blockers = [];
  const warnings = [];

  if (!fs.existsSync(projectManifestPath)) {
    blockers.push("missing project dashboard manifest");
  }
  if (adoptionMode !== "package-native") {
    blockers.push(`adoptionMode is ${adoptionMode}, expected package-native`);
  }
  if (mode !== "package-native") {
    blockers.push(`implementationMode is ${mode}, expected package-native`);
  }
  if (targetBand === "T3C" && hasBridgeLanguage) {
    blockers.push("T3C/package-native claim still contains static, compatibility, bridge, local primitive, or migration language");
  }
  const missingCore = ["shell", "sidebar", "header", "state"].filter((family) => !componentCoverage.presentFamilies.includes(family));
  if (missingCore.length) {
    blockers.push(`missing core kit component evidence: ${missingCore.join(", ")}`);
  }
  const missingDataFamilies = ["tables", "charts", "workflow", "proof"].filter((family) => !componentCoverage.presentFamilies.includes(family));
  if (targetBand === "T3C" && missingDataFamilies.length > 1) {
    blockers.push(`insufficient Tier 3 component family evidence: ${missingDataFamilies.join(", ")}`);
  }
  const visibleMissingDataFamilies = ["tables", "charts", "workflow", "proof"].filter((family) => !visibleRouteCoverage.presentFamilies.includes(family));
  if (targetBand === "T3C" && visibleSurfaceAudits.length && visibleMissingDataFamilies.length > 1) {
    blockers.push(`operator-facing routes are not decomposed with Tier 3 component families: ${visibleMissingDataFamilies.join(", ")}`);
  }
  const hiddenByKitSource = componentCoverage.presentFamilies.filter((family) => !visibleRouteCoverage.presentFamilies.includes(family));
  if (targetBand === "T3C" && hiddenByKitSource.length && visibleSurfaceAudits.length) {
    warnings.push(`kit-source evidence is masking route-level gaps: ${hiddenByKitSource.join(", ")}`);
  }
  const localFindings = surfaceAudits.flatMap((surface) => surface.localPrimitiveFindings.map((finding) => `${surface.id}:${finding}`));
  if (targetBand === "T3C" && localFindings.length > 6) {
    warnings.push(`${localFindings.length} local primitive signals found; route likely needs deeper decomposition`);
  }
  if (surfaceAudits.some((surface) => !surface.exists)) {
    blockers.push("one or more declared surfaces are missing");
  }

  return {
    project: project.id,
    name: project.name,
    path: path.relative(workspaceRoot, projectRoot),
    adoptionMode,
    implementationMode: mode,
    targetBand,
    registryBridgeStatus: project.bridgeStatus ?? null,
    status: blockers.length ? "needs-implementation-migration" : "component-native",
    componentCoverage,
    visibleRouteCoverage,
    blockers,
    warnings,
    surfaces: surfaceAudits
  };
}

function auditSurface(projectRoot, surface) {
  const surfacePath = path.resolve(projectRoot, surface.path ?? "");
  const source = fs.existsSync(surfacePath) ? fs.readFileSync(surfacePath, "utf8") : "";
  const familyEvidence = requiredComponentFamilies
    .filter((family) => family.patterns.some((pattern) => pattern.test(source)))
    .map((family) => family.id);
  const importEvidence =
    /@hermes\/dashboard-kit|vendor\/hermes-dashboard-kit|hermes-dashboard-kit\.css|data-hdk-component/.test(source);
  const localPrimitiveFindings = localPrimitivePatterns
    .filter((candidate) => candidate.pattern.test(source))
    .map((candidate) => candidate.id);
  return {
    id: surface.id,
    path: surface.path,
    role: surface.role ?? "ui",
    status: surface.status ?? "unknown",
    exists: fs.existsSync(surfacePath),
    importEvidence,
    familyEvidence,
    localPrimitiveFindings,
    noteFlags: bridgeLanguagePatterns.filter((pattern) => pattern.test(`${surface.status ?? ""} ${surface.notes ?? ""}`)).length
  };
}

function coverageFor(surfaceAudits) {
  const presentFamilies = Array.from(new Set(surfaceAudits.flatMap((surface) => surface.familyEvidence))).sort();
  const missingFamilies = requiredComponentFamilies.map((family) => family.id).filter((id) => !presentFamilies.includes(id));
  return {
    presentFamilies,
    missingFamilies,
    score: Math.round((presentFamilies.length / requiredComponentFamilies.length) * 100)
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function renderMarkdown(data) {
  const rows = data.projects
    .map((project) => `| ${project.project} | ${project.status} | ${project.implementationMode} | ${project.targetBand} | ${project.componentCoverage.score}% | ${project.visibleRouteCoverage.score}% | ${project.blockers.join("<br>") || "None"} |`)
    .join("\n");
  const detail = data.projects
    .map((project) => {
      const surfaces = project.surfaces
        .map((surface) => `- \`${surface.id}\` \`${surface.path}\` (${surface.role}): families ${surface.familyEvidence.join(", ") || "none"}; local signals ${surface.localPrimitiveFindings.join(", ") || "none"}`)
        .join("\n");
      return `### ${project.name}\n\nStatus: **${project.status}**\n\nAll-surface families: ${project.componentCoverage.presentFamilies.join(", ") || "none"}\n\nVisible-route families: ${project.visibleRouteCoverage.presentFamilies.join(", ") || "none"}\n\nMissing visible-route families: ${project.visibleRouteCoverage.missingFamilies.join(", ") || "none"}\n\nBlockers:\n${project.blockers.map((item) => `- ${item}`).join("\n") || "- None"}\n\nWarnings:\n${project.warnings.map((item) => `- ${item}`).join("\n") || "- None"}\n\nSurfaces:\n${surfaces}`;
    })
    .join("\n\n");
  return `# Dashboard Component-Native Implementation Report\n\nGenerated: ${data.generatedAt}\n\nComponent-native is an implementation standard, not an installation label. The production route must render with dashboard-kit primitives across the shell, sidebar, header, data states, metrics, tables, charts/workflow, and proof surfaces.\n\n## Summary\n\n- Total projects: ${data.summary.totalProjects}\n- Component-native by implementation: ${data.summary.componentNative}\n- Need implementation migration: ${data.summary.needsImplementationMigration}\n- Blocked false-native claims: ${data.summary.blockedFalseNativeClaims}\n\n## Fleet Table\n\n| Project | Status | Mode | Target | All Evidence | Visible Route | Blockers |\n| --- | --- | --- | --- | ---: | ---: | --- |\n${rows}\n\n## Project Details\n\n${detail}\n`;
}
