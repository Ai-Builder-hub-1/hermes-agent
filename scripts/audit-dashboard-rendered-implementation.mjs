#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const outputJsonPath = path.join(root, "docs/design/dashboard-rendered-implementation-report.json");
const outputMdPath = path.join(root, "docs/design/dashboard-rendered-implementation-report.md");
const args = new Set(process.argv.slice(2));
const write = args.has("--write") || args.has("--strict");
const strict = args.has("--strict");

const protectedPatterns = [
  {
    id: "local-sidebar",
    label: "local sidebar",
    pattern: /\b(?:sidebar|side-nav|side-rail|nav-rail)\b/gi,
    approved: /\bhdk-sidebar\b|data-sidebar-|DashboardSidebar|renderDashboardShell|renderOperationalSidebar/i
  },
  {
    id: "local-card",
    label: "local card/panel",
    pattern: /\b(?:card|panel)\b/gi,
    approved: /\bhdk-|data-hdk-|\bbg-card\b|data-panel=|renderMetricCard|renderStatePanel|renderDataTable|render[A-Za-z]+Panel/i
  },
  {
    id: "local-grid-spacing",
    label: "local grid/spacing",
    pattern: /\b(?:grid-template-columns|gap|padding|margin)\s*:\s*(?:\d+px|clamp\(|repeat\(|minmax\()/gi,
    approved: /--hdk-|hdk-section-grid|hdk-page-frame|hdk-section-stack/i
  },
  {
    id: "local-table",
    label: "local table",
    pattern: /<table\b|\btable\b/gi,
    approved: /renderDataTable|kitRenderDataTable|tableSurface|data-hdk-component=["']DataTable|hdk-table|data-table-|hdk-pagination|initializeSortableTable|setupTablePagination|querySelector\(["']table["']\)/i
  },
  {
    id: "local-chart",
    label: "local chart",
    pattern: /\bchart\b|<svg\b/gi,
    approved: /render(?:LineChart|AreaChart|BarChart|DonutChart|Heatmap|MultiSeriesLineChart|PremiumComparisonChart|FinancialCandlestickChart)|kitRender(?:LineChart|AreaChart|BarChart|DonutChart|Heatmap|MultiSeriesLineChart|PremiumComparisonChart|FinancialCandlestickChart)|data-chart-type=|data-hdk-component=["'](?:LineChart|AreaChart|BarChart|DonutChart|Heatmap|MultiSeriesLineChart|PremiumComparisonChart|FinancialCandlestickChart|ChartPanel|PriceMovementChart|SpreadBandChart|LiquidityDepthChart)|PriceMovementChart|SpreadBandChart|LiquidityDepthChart|\bhdk-chart\b|\bhdk-chart-/i
  },
  {
    id: "local-form",
    label: "local form",
    pattern: /<form\b|<input\b|<select\b|<textarea\b|\bform-\w+/gi,
    approved: /hdk-form|hdk-button|render(?:Drawer|ResearchProjectComposer|PremiumPlannerCalendar)|data-hdk-component=["'](?:Drawer|ResearchProjectComposer|PremiumPlannerCalendar)/i
  }
];

const registry = readJson(registryPath);
const items = (registry.projects ?? []).map(auditProject);
const summary = {
  totalProjects: items.length,
  pass: items.filter((item) => item.status === "pass").length,
  needsMigration: items.filter((item) => item.status === "needs-migration").length,
  findings: items.reduce((sum, item) => sum + item.findings.length, 0),
  fullyDecomposed: items.filter((item) => item.decompositionStatus === "fully-decomposed").length,
  bridgeAligned: items.filter((item) => item.decompositionStatus === "bridge-aligned").length,
  falseNativeRisk: items.filter((item) => item.falseNativeRisk).length
};
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: {
    definition: "Rendered implementation means the visible route is controlled by dashboard-kit shell, spacing, sidebar, card, table, chart, form, state, and proof primitives. Local classes may exist only as domain accents, not as primary layout machinery.",
    decompositionDefinition: "Fully decomposed means visible UI surfaces have no significant local layout/component machinery. Bridge-aligned means kit evidence exists, but local primitives still control meaningful parts of the page. Needs migration means errors or missing required kit evidence remain.",
    protectedPatterns: protectedPatterns.map((item) => item.id)
  },
  summary,
  items
};

if (write) {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outputMdPath, renderMarkdown(report));
  console.log(`Wrote ${path.relative(root, outputJsonPath)}`);
  console.log(`Wrote ${path.relative(root, outputMdPath)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

if (strict && items.some((item) => item.findings.some((finding) => finding.severity === "error"))) {
  console.error(`Rendered implementation audit failed (${summary.needsMigration} project(s) need migration).`);
  process.exit(1);
}

function auditProject(project) {
  const projectRoot = path.resolve(root, project.path);
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) {
    return {
      project: project.id,
      status: "needs-migration",
      findings: [finding("error", "manifest.missing", "Missing dashboard manifest.")],
      surfaces: []
    };
  }
  const manifest = readJson(manifestPath);
  const surfaces = (manifest.surfaces ?? []).map((surface) => auditSurface(projectRoot, surface));
  const findings = surfaces.flatMap((surface) =>
    surface.findings.map((entry) => ({ ...entry, surface: surface.id, path: surface.path }))
  );
  const localSignalCount = surfaces.reduce((sum, surface) => sum + surface.localSignals.total, 0);
  const uiSurfaces = surfaces.filter((surface) => surface.role !== "api" && surface.role !== "data-contract" && surface.role !== "proof-endpoint");
  const missingPageFrame = uiSurfaces.filter((surface) => !surface.hasPageFrame && surface.hasShellEvidence);
  for (const surface of missingPageFrame) {
    findings.push(finding("warning", "layout.pageFrameMissing", "Shell route should use hdk-page-frame/hdk-page/hdk-section-stack for route rhythm.", surface.id, surface.path));
  }
  const errorCount = findings.filter((item) => item.severity === "error").length;
  const warningCount = findings.filter((item) => item.severity === "warning").length;
  const decompositionStatus = errorCount
    ? "needs-migration"
    : localSignalCount === 0
      ? "fully-decomposed"
      : "bridge-aligned";
  return {
    project: project.id,
    name: project.name,
    status: errorCount ? "needs-migration" : "pass",
    decompositionStatus,
    localSignalCount,
    falseNativeRisk: decompositionStatus === "bridge-aligned",
    findings,
    surfaces
  };
}

function auditSurface(projectRoot, surface) {
  const surfacePath = path.resolve(projectRoot, surface.path ?? "");
  const source = fs.existsSync(surfacePath) ? fs.readFileSync(surfacePath, "utf8") : "";
  if (!source) {
    return {
      id: surface.id,
      path: surface.path,
      role: surface.role ?? "ui",
      hasShellEvidence: false,
      hasPageFrame: false,
      findings: [finding("error", "surface.missing", "Surface file is missing.")]
    };
  }
  const role = surface.role ?? "ui";
  const isUiSurface = !["api", "data-contract", "proof-endpoint", "server-route", "kit-source"].includes(role);
  const findings = [];
  const localSignals = {
    total: 0,
    byRule: {}
  };
  if (isUiSurface) {
    for (const rule of protectedPatterns) {
      const matches = countUnapprovedMatches(source, rule);
      localSignals.byRule[rule.id] = matches.debt;
      localSignals.total += matches.debt;
      if (!matches.debt) continue;
      const hasApproved = rule.approved.test(source);
      const severity = hasApproved ? "warning" : "error";
      const threshold = hasApproved ? 28 : 0;
      if (!hasApproved || matches.debt > threshold) {
        findings.push(finding(
          severity,
          `rendered.${rule.id}`,
          `${surface.id} has ${matches.debt} unapproved ${rule.label} signal(s); use dashboard-kit primitives for primary layout/components.`
        ));
      }
    }
  }
  return {
    id: surface.id,
    path: surface.path,
    role,
    hasShellEvidence: /renderDashboardShell|DashboardShell|hdk-shell|data-hdk-component=["']DashboardShell/.test(source),
    hasPageFrame: /hdk-page-frame|hdk-page|hdk-route|hdk-section-stack/.test(source),
    localSignals,
    findings
  };
}

function countUnapprovedMatches(source, rule) {
  const lines = source.split(/\r?\n/);
  let raw = 0;
  let approved = 0;
  let debt = 0;

  for (const line of lines) {
    const matches = [...line.matchAll(rule.pattern)].length;
    if (!matches) continue;
    raw += matches;
    if (rule.approved.test(line)) {
      approved += matches;
      continue;
    }
    debt += matches;
  }

  return {
    raw,
    approved,
    debt
  };
}

function finding(severity, code, message, surface = "", filePath = "") {
  return { severity, code, message, surface, path: filePath };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function renderMarkdown(report) {
  const rows = report.items.map((item) => `| ${item.project} | ${item.status} | ${item.decompositionStatus} | ${item.localSignalCount} | ${item.falseNativeRisk ? "yes" : "no"} | ${item.findings.length} | ${item.findings.slice(0, 4).map((finding) => `${finding.severity}:${finding.code}`).join("<br>") || "None"} |`).join("\n");
  const details = report.items.map((item) => {
    const findings = item.findings.length
      ? item.findings.map((finding) => `- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}${finding.path ? ` (${finding.path})` : ""}`).join("\n")
      : "- None";
    const surfaces = item.surfaces.map((surface) => {
      const counts = Object.entries(surface.localSignals?.byRule ?? {})
        .filter(([, value]) => value > 0)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ") || "none";
      return `- \`${surface.id}\` \`${surface.path}\`: ${surface.localSignals?.total ?? 0} local signal(s) (${counts})`;
    }).join("\n");
    return `## ${item.name || item.project}\n\nStatus: **${item.status}**\n\nDecomposition: **${item.decompositionStatus}**\n\nLocal signal count: ${item.localSignalCount}\n\nFalse-native risk: ${item.falseNativeRisk ? "yes" : "no"}\n\nFindings:\n${findings}\n\nSurface local signal counts:\n${surfaces}`;
  }).join("\n\n");
  return `# Dashboard Rendered Implementation Report\n\nGenerated: ${report.generatedAt}\n\nThis report checks whether visible dashboard routes are still controlled by local layout/component primitives instead of dashboard-kit primitives.\n\n## Summary\n\n- Total projects: ${report.summary.totalProjects}\n- Pass: ${report.summary.pass}\n- Need migration: ${report.summary.needsMigration}\n- Findings: ${report.summary.findings}\n\n## Decomposition Summary\n\n- Fully decomposed: ${report.summary.fullyDecomposed}\n- Bridge aligned: ${report.summary.bridgeAligned}\n- False-native risk: ${report.summary.falseNativeRisk}\n\n| Project | Status | Decomposition | Local signals | False-native risk | Findings | Sample |\n| --- | --- | --- | ---: | --- | ---: | --- |\n${rows}\n\n${details}\n`;
}
