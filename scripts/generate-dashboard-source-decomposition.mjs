#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  designDir,
  markdownTable,
  readJson,
  resolveProjectPath,
  root,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write") || args.has("--strict");
const strict = args.has("--strict");

const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const outJson = path.join(designDir, "dashboard-source-decomposition-report.json");
const outMd = path.join(designDir, "dashboard-source-decomposition-report.md");
const routeContractJson = path.join(designDir, "dashboard-route-ownership-contract.json");
const repairPacketsJson = path.join(designDir, "dashboard-source-decomposition-repair-packets.json");
const repairPacketsMd = path.join(designDir, "dashboard-source-decomposition-repair-packets.md");

const requiredFamilies = [
  "shell",
  "sidebar",
  "header",
  "state",
  "metrics",
  "tables",
  "charts",
  "workflow",
  "proof"
];

const familyPatterns = {
  shell: [/\bDashboardShell\b/, /\brenderDashboardShell\b/, /\bhdk-shell\b/, /data-component=["']DashboardShell["']/],
  sidebar: [/\bDashboardSidebar\b/, /\bSidebar\b/, /\brenderDashboardSidebar\b/, /\bhdk-sidebar\b/, /data-component=["']DashboardSidebar["']/],
  header: [/\bDashboardHeader\b/, /\bHeader\b/, /\brenderDashboardHeader\b/, /\bhdk-header\b/, /data-component=["']DashboardHeader["']/],
  state: [/\bDashboardQueryBoundary\b/, /\bDataFreshnessStrip\b/, /\bStatePanel\b/, /\bPartialDataBanner\b/, /\bStaleDataBadge\b/],
  metrics: [/\bMetricCard\b/, /\bMetricCardGroup\b/, /\bhdk-metric\b/, /\bhdk-card\b/],
  tables: [/\bDataTable\b/, /\bTableSurface\b/, /\bPagination\b/, /\bhdk-table\b/, /<table\b/],
  charts: [/\bLineChart\b/, /\bBarChart\b/, /\bDonutChart\b/, /\bAreaChart\b/, /\bFinancialCandlestickChart\b/, /\bhdk-chart\b/],
  workflow: [/\bDrawer\b/, /\bActionQueue\b/, /\bApprovalQueue\b/, /\bResearchDeskWorkspace\b/, /\bMarketBrowserLayout\b/, /\bPremiumPlannerCalendar\b/],
  proof: [/\bProofStrip\b/, /\bProofStateStrip\b/, /data-proof-route=|proof-signals|data-proof-signals/]
};

const localDebtRules = [
  { id: "local-shell", pattern: /\b(?:shell|workspace|layout)\b(?![^"'\n]*hdk-)/gi, weight: 4 },
  { id: "local-sidebar", pattern: /\b(?:sidebar|sidecar|nav-rail|rail)\b(?![^"'\n]*hdk-)/gi, weight: 5 },
  { id: "local-card-panel", pattern: /\b(?:card|panel)\b(?![^"'\n]*hdk-)/gi, weight: 2 },
  { id: "hand-chart", pattern: /<svg\b|canvas\.getContext\(|function\s+(?:drawChart|chart|sparkline|depthChart)\b/gi, weight: 8 },
  { id: "hand-table", pattern: /<table\b|document\.createElement\(["'](?:tr|td|th|table)["']\)/gi, weight: 5 },
  { id: "hardcoded-token", pattern: /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|(?:padding|margin|gap|border-radius)\s*:\s*\d+px/gi, weight: 1 },
  { id: "static-render-string", pattern: /return\s+`[\s\S]{0,1200}<|innerHTML\s*=|res\.send\(\s*`/gi, weight: 6 }
];

const legacyRoles = new Set(["legacy-compatibility-route", "compatibility-route", "compatibility", "mount-route"]);
const nonOperatorRoles = new Set(["api", "data-contract", "proof-endpoint", "server-route", "kit-source"]);

const registry = readJson(registryPath);
const projects = (registry.projects ?? []).map(analyzeProject);
const routeContract = buildRouteContract(projects);
const repairPackets = buildRepairPackets(projects);

const summary = {
  totalProjects: projects.length,
  totalSurfaces: projects.reduce((sum, project) => sum + project.surfaces.length, 0),
  packageNativeRoutes: projects.reduce((sum, project) => sum + project.surfaces.filter((surface) => surface.sourceNativeLevel === "package-native-route").length, 0),
  bridgeOrStaticRoutes: projects.reduce((sum, project) => sum + project.surfaces.filter((surface) => ["runtime-bridge", "server-rendered", "static-html", "mount-only"].includes(surface.sourceNativeLevel)).length, 0),
  projectsReadyForStrictSourceGate: projects.filter((project) => project.verdict === "source-certified").length,
  projectsNeedingDecomposition: projects.filter((project) => project.verdict !== "source-certified").length,
  highPriorityRepairPackets: repairPackets.packets.filter((packet) => packet.priority === "P0").length
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: {
    definition: "Source decomposition verifies that the dashboard route implementation imports or calls shared @hermes/dashboard-kit primitives directly. Rendered HDK markers, copied CSS, mount-only shells, and server-rendered string HTML are tracked as partial until the route is package-native by source.",
    requiredFamilies,
    maturityLevels: [
      "package-native-route",
      "package-native-runtime",
      "runtime-bridge",
      "server-rendered",
      "static-html",
      "mount-only",
      "compatibility-only",
      "missing"
    ],
    blockingRule: "A project can pass rendered certification while still needing source decomposition. Strict source promotion requires all primary operator surfaces to be package-native-route or explicitly exceptioned."
  },
  summary,
  projects
};

if (write) {
  writeJson(outJson, report);
  writeMarkdown(outMd, renderReport(report));
  writeJson(routeContractJson, routeContract);
  writeJson(repairPacketsJson, repairPackets);
  writeMarkdown(repairPacketsMd, renderRepairPackets(repairPackets));
  console.log(`Wrote ${path.relative(root, outJson)}`);
  console.log(`Wrote ${path.relative(root, outMd)}`);
  console.log(`Wrote ${path.relative(root, routeContractJson)}`);
  console.log(`Wrote ${path.relative(root, repairPacketsJson)}`);
  console.log(`Wrote ${path.relative(root, repairPacketsMd)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

console.log(`Dashboard source decomposition: ${summary.projectsReadyForStrictSourceGate}/${summary.totalProjects} source-certified, ${summary.projectsNeedingDecomposition} need decomposition, ${summary.bridgeOrStaticRoutes} bridge/static/server/mount surfaces.`);

if (strict && summary.projectsNeedingDecomposition > 0) {
  for (const project of projects.filter((item) => item.verdict !== "source-certified")) {
    console.error(`- ${project.project}: ${project.blockers.map((item) => item.code).join(", ")}`);
  }
  process.exit(1);
}

function analyzeProject(project) {
  const projectRoot = resolveProjectPath(project.path ?? "");
  const manifestPath = resolveProjectPath(project.manifest ?? "");
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
  const dashboardKit = manifest?.dashboardKit ?? {};
  const surfaces = (manifest?.surfaces ?? []).map((surface) => analyzeSurface(projectRoot, surface));
  const primarySurfaces = surfaces.filter((surface) => surface.operatorSurface && !surface.exceptioned);
  const blockers = [];
  const warnings = [];
  const targetBand = dashboardKit.targetExperienceBand ?? project.targetExperienceBand ?? "unknown";
  const implementationMode = dashboardKit.implementationMode ?? project.implementationMode ?? "unknown";

  if (!manifest) blockers.push(finding("manifest.missing", "Project has no dashboard manifest."));
  if (dashboardKit.adoptionMode !== "package-native") blockers.push(finding("adoption.notPackageNative", `adoptionMode is ${dashboardKit.adoptionMode ?? "missing"}.`));
  if (targetBand === "T3C" && implementationMode !== "package-native") {
    blockers.push(finding("mode.notStrictPackageNative", `implementationMode is ${implementationMode}; strict T3C source gate expects package-native.`));
  }
  if (!primarySurfaces.length) blockers.push(finding("surface.primaryMissing", "No primary operator surface is available for source certification."));

  for (const surface of primarySurfaces) {
    if (!surface.exists) blockers.push(finding("surface.missing", `${surface.id} is declared but missing.`, surface.id));
    if (!["package-native-route", "package-native-runtime"].includes(surface.sourceNativeLevel)) {
      blockers.push(finding("surface.notSourceNative", `${surface.id} is ${surface.sourceNativeLevel}, not package-native by source.`, surface.id));
    }
    const missingFamilies = requiredFamilies.filter((family) => !surface.families.includes(family));
    if (missingFamilies.length > 3) {
      blockers.push(finding("families.missing", `${surface.id} is missing ${missingFamilies.join(", ")}.`, surface.id));
    } else if (missingFamilies.length) {
      warnings.push(finding("families.partial", `${surface.id} is missing ${missingFamilies.join(", ")}.`, surface.id));
    }
    if (surface.localDebt.score > 80) blockers.push(finding("localDebt.high", `${surface.id} has local visual debt score ${surface.localDebt.score}.`, surface.id));
    else if (surface.localDebt.score > 32) warnings.push(finding("localDebt.moderate", `${surface.id} has local visual debt score ${surface.localDebt.score}.`, surface.id));
  }

  for (const surface of surfaces.filter((item) => item.compatibilitySurface)) {
    warnings.push(finding("compatibility.routeTracked", `${surface.id} remains a compatibility/review surface and must not be promoted as primary.`, surface.id));
  }

  const verdict = blockers.length ? "needs-source-decomposition" : warnings.length ? "source-review" : "source-certified";
  return {
    project: project.id,
    name: project.name,
    path: path.relative(root, projectRoot),
    manifest: path.relative(root, manifestPath),
    targetBand,
    implementationMode,
    verdict,
    blockers: uniqueFindings(blockers),
    warnings: uniqueFindings(warnings),
    sourceScore: scoreProject(primarySurfaces, blockers, warnings),
    surfaces
  };
}

function analyzeSurface(projectRoot, surface) {
  const file = path.resolve(projectRoot, surface.path ?? "");
  const exists = fs.existsSync(file);
  const source = exists ? fs.readFileSync(file, "utf8") : "";
  const ext = path.extname(file).toLowerCase();
  const role = surface.role ?? "ui";
  const notes = `${surface.status ?? ""} ${surface.notes ?? ""}`;
  const directPackageImports = countMatches(source, /from\s+["']@hermes\/dashboard-kit["']|require\(["']@hermes\/dashboard-kit["']\)/g);
  const directCssPackageImports = countMatches(source, /@hermes\/dashboard-kit\/static|require\.resolve\(["']@hermes\/dashboard-kit/g);
  const hdkMarkers = countMatches(source, /data-hdk-component=|data-component=["']Dashboard|hdk-/g);
  const reactEntrypoint = /\bcreateRoot\b|<[\w.]+[\s>]|import\s+React\b|from\s+["']react["']/.test(source);
  const viteEntrypoint = /\/src\/main\.(?:t|j)sx|type=["']module["']/.test(source);
  const serverRendered = /res\.send\(|return\s+`[\s\S]*data-component=["']DashboardShell|function\s+\w*Html\b|const\s+\w*Html\s*=/.test(source);
  const staticHtml = ext === ".html";
  const mountOnly = staticHtml && /id=["'][^"']*(?:root|dashboard-root|roc-dashboard-root)["']/.test(source) && /<script[^>]+(?:src=|type=["']module["'])/.test(source);
  const compatibilitySurface =
    legacyRoles.has(role) ||
    /compatibility|legacy|review only/i.test(String(surface.status ?? ""));
  const operatorSurface = !nonOperatorRoles.has(role) && !compatibilitySurface;
  const families = requiredFamilies.filter((family) => familyPatterns[family].some((pattern) => pattern.test(source)));
  const localDebt = localDebtFor(source);
  const exceptioned = Boolean(surface.sourceNativeExceptionUntil || surface.exceptionUntil);
  const sourceNativeLevel = classifySurface({
    exists,
    role,
    staticHtml,
    mountOnly,
    compatibilitySurface,
    directPackageImports,
    directCssPackageImports,
    hdkMarkers,
    reactEntrypoint,
    viteEntrypoint,
    serverRendered
  });

  return {
    id: surface.id,
    path: surface.path,
    role,
    status: surface.status ?? "unknown",
    exists,
    operatorSurface,
    compatibilitySurface,
    exceptioned,
    sourceNativeLevel,
    sourceShape: {
      extension: ext || "none",
      reactEntrypoint,
      viteEntrypoint,
      serverRendered,
      staticHtml,
      mountOnly
    },
    evidence: {
      directPackageImports,
      directCssPackageImports,
      hdkMarkers,
      families
    },
    families,
    missingFamilies: requiredFamilies.filter((family) => !families.includes(family)),
    localDebt,
    nextMigrationLayer: migrationLayerFor(sourceNativeLevel, localDebt.score, families.length)
  };
}

function classifySurface(details) {
  if (!details.exists) return "missing";
  if (details.compatibilitySurface) return "compatibility-only";
  if (details.mountOnly) return "mount-only";
  if (details.directPackageImports > 0 && (details.reactEntrypoint || details.viteEntrypoint)) return "package-native-route";
  if (details.directPackageImports > 0) return "package-native-runtime";
  if (details.serverRendered) return "server-rendered";
  if (details.staticHtml) return "static-html";
  if (details.hdkMarkers > 0 || details.directCssPackageImports > 0) return "runtime-bridge";
  return "unknown";
}

function localDebtFor(source) {
  const findings = localDebtRules.map((rule) => {
    const count = countMatches(source, rule.pattern);
    return { id: rule.id, count, score: count * rule.weight };
  }).filter((finding) => finding.count);
  return {
    score: findings.reduce((sum, finding) => sum + finding.score, 0),
    findings
  };
}

function migrationLayerFor(level, debtScore, familyCount) {
  if (level === "missing") return "restore-declared-surface";
  if (level === "compatibility-only") return "retire-or-isolate-compatibility-route";
  if (level === "mount-only") return "bind-mount-to-owned-react-entrypoint";
  if (level === "static-html") return "replace-static-html-with-react-vite-route";
  if (level === "server-rendered") return "extract-server-html-into-package-native-components";
  if (level === "runtime-bridge") return "replace-runtime-markers-with-direct-kit-imports";
  if (level === "package-native-runtime") return "decompose-runtime-renderer-into-component-files";
  if (debtScore > 32) return "reduce-local-visual-primitive-debt";
  if (familyCount < requiredFamilies.length) return "complete-component-family-coverage";
  return "maintain-with-source-gate";
}

function scoreProject(primarySurfaces, blockers, warnings) {
  if (!primarySurfaces.length) return 0;
  const raw = primarySurfaces.reduce((sum, surface) => {
    const levelScore = {
      "package-native-route": 100,
      "package-native-runtime": 82,
      "runtime-bridge": 58,
      "server-rendered": 48,
      "static-html": 32,
      "mount-only": 46,
      "compatibility-only": 20,
      missing: 0,
      unknown: 20
    }[surface.sourceNativeLevel] ?? 20;
    const familyScore = Math.round((surface.families.length / requiredFamilies.length) * 100);
    const debtPenalty = Math.min(40, Math.round(surface.localDebt.score / 8));
    return sum + Math.max(0, Math.round(levelScore * 0.55 + familyScore * 0.45 - debtPenalty));
  }, 0);
  return Math.max(0, Math.round(raw / primarySurfaces.length) - blockers.length * 8 - warnings.length * 2);
}

function buildRouteContract(projects) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    purpose: "Route ownership contract for dashboard source-native enforcement. Every operator route must declare implementation ownership, allowed rendering mode, required component families, and whether legacy/static behavior is allowed.",
    rules: [
      "Primary operator routes cannot be static HTML, mount-only, server-rendered string HTML, or runtime marker bridges without an explicit expiring exception.",
      "Compatibility routes are allowed only for rollback/review and cannot satisfy T3C source certification.",
      "Rendered certification is necessary but not sufficient for source-native promotion."
    ],
    routes: projects.flatMap((project) => project.surfaces.map((surface) => ({
      project: project.project,
      surface: surface.id,
      path: surface.path,
      role: surface.role,
      operatorSurface: surface.operatorSurface,
      allowedRendering: surface.operatorSurface ? "react-typescript-hdk-or-direct-package-runtime" : "non-primary",
      sourceNativeLevel: surface.sourceNativeLevel,
      legacyStaticAllowed: surface.compatibilitySurface || surface.exceptioned,
      requiredFamilies,
      missingFamilies: surface.missingFamilies,
      nextMigrationLayer: surface.nextMigrationLayer
    })))
  };
}

function buildRepairPackets(projects) {
  const packets = projects
    .filter((project) => project.verdict !== "source-certified")
    .map((project) => {
      const targetSurfaces = project.surfaces.filter((surface) => surface.operatorSurface && surface.nextMigrationLayer !== "maintain-with-source-gate");
      const worstDebt = Math.max(0, ...targetSurfaces.map((surface) => surface.localDebt.score));
      const priority = project.blockers.some((blocker) => blocker.code === "surface.notSourceNative") || worstDebt > 120 ? "P0" : project.blockers.length ? "P1" : "P2";
      return {
        id: `${project.project}.source-decomposition`,
        project: project.project,
        priority,
        verdict: project.verdict,
        sourceScore: project.sourceScore,
        blockers: project.blockers,
        warnings: project.warnings,
        targetSurfaces: targetSurfaces.map((surface) => ({
          id: surface.id,
          path: surface.path,
          sourceNativeLevel: surface.sourceNativeLevel,
          localDebtScore: surface.localDebt.score,
          missingFamilies: surface.missingFamilies,
          nextMigrationLayer: surface.nextMigrationLayer
        })),
        actions: repairActions(project, targetSurfaces),
        verification: [
          "npm run dashboard:source-decomposition:report",
          "npm run dashboard:certify:rendered",
          "npm run dashboard:certify:validate"
        ]
      };
    });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    packets
  };
}

function repairActions(project, surfaces) {
  const actions = [];
  for (const surface of surfaces) {
    if (surface.sourceNativeLevel === "mount-only") actions.push(`Bind ${surface.id} to a single owned React/Vite entrypoint and move route logic out of static mount HTML.`);
    if (surface.sourceNativeLevel === "server-rendered") actions.push(`Extract ${surface.id} server-rendered HTML into importable dashboard-kit component modules.`);
    if (surface.sourceNativeLevel === "static-html") actions.push(`Replace ${surface.id} static HTML route with a package-native route wrapper.`);
    if (surface.sourceNativeLevel === "runtime-bridge") actions.push(`Replace ${surface.id} marker/CSS compliance with direct @hermes/dashboard-kit imports.`);
    if (surface.sourceNativeLevel === "package-native-runtime") actions.push(`Decompose ${surface.id} runtime renderer into route components, data adapter, and domain panels.`);
    if (surface.localDebt.score > 32) actions.push(`Reduce local primitive debt in ${surface.id}: ${surface.localDebt.findings.map((item) => `${item.id}=${item.count}`).join(", ")}.`);
    if (surface.missingFamilies.length) actions.push(`Add route-level component coverage for ${surface.id}: ${surface.missingFamilies.join(", ")}.`);
  }
  if (!actions.length) actions.push(`Review ${project.project} warnings and add an expiring exception or source-native route proof.`);
  return Array.from(new Set(actions));
}

function renderReport(report) {
  const rows = report.projects.map((project) => [
    project.project,
    project.verdict,
    project.sourceScore,
    project.implementationMode,
    project.surfaces.filter((surface) => surface.operatorSurface).map((surface) => `${surface.id}: ${surface.sourceNativeLevel}`).join("<br>") || "none",
    project.blockers.map((item) => item.code).join("<br>") || "None"
  ]);
  const details = report.projects.map((project) => {
    const surfaceRows = project.surfaces.map((surface) => [
      surface.id,
      surface.role,
      surface.sourceNativeLevel,
      surface.operatorSurface ? "yes" : "no",
      surface.families.join(", ") || "none",
      surface.localDebt.score,
      surface.nextMigrationLayer
    ]);
    return `### ${project.name}\n\nVerdict: **${project.verdict}**  \nSource score: ${project.sourceScore}\n\nBlockers:\n${project.blockers.map((item) => `- ${item.code}: ${item.message}`).join("\n") || "- None"}\n\nWarnings:\n${project.warnings.map((item) => `- ${item.code}: ${item.message}`).join("\n") || "- None"}\n\n${markdownTable(["Surface", "Role", "Level", "Operator", "Families", "Debt", "Next Layer"], surfaceRows)}`;
  }).join("\n\n");
  return `# Dashboard Source Decomposition Report\n\nGenerated: ${report.generatedAt}\n\nThis is the deeper source-native gate. Rendered certification proves what the browser shows; this report proves how the route is actually implemented.\n\n## Summary\n\n- Total projects: ${report.summary.totalProjects}\n- Total surfaces: ${report.summary.totalSurfaces}\n- Source-certified projects: ${report.summary.projectsReadyForStrictSourceGate}\n- Projects needing decomposition: ${report.summary.projectsNeedingDecomposition}\n- Package-native route surfaces: ${report.summary.packageNativeRoutes}\n- Bridge/static/server/mount surfaces: ${report.summary.bridgeOrStaticRoutes}\n- High-priority repair packets: ${report.summary.highPriorityRepairPackets}\n\n## Fleet Matrix\n\n${markdownTable(["Project", "Verdict", "Score", "Mode", "Primary Surfaces", "Blockers"], rows)}\n\n## Project Details\n\n${details}\n`;
}

function renderRepairPackets(repairs) {
  const rows = repairs.packets.map((packet) => [
    packet.id,
    packet.priority,
    packet.sourceScore,
    packet.targetSurfaces.map((surface) => `${surface.id}: ${surface.nextMigrationLayer}`).join("<br>") || "review",
    packet.actions.join("<br>")
  ]);
  return `# Dashboard Source Decomposition Repair Packets\n\nGenerated: ${repairs.generatedAt}\n\nThese are the route-level repair packets for moving from rendered HDK compliance to source-native HDK implementation.\n\n${markdownTable(["Packet", "Priority", "Score", "Targets", "Actions"], rows)}\n`;
}

function countMatches(source, pattern) {
  pattern.lastIndex = 0;
  return [...source.matchAll(pattern)].length;
}

function finding(code, message, surface = null) {
  return { code, message, surface };
}

function uniqueFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.code}:${finding.surface ?? ""}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
