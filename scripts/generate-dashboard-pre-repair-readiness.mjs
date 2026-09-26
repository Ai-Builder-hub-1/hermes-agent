#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { dashboardRegistry, designDir, markdownTable, readJson, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const strict = process.argv.includes("--strict");

const renderedReportPath = path.join(designDir, "rendered-fleet-certification/report.json");
const renderedRepairPath = path.join(designDir, "rendered-fleet-certification/repair-packets.json");
const routeInventoryJsonPath = path.join(designDir, "dashboard-canonical-route-inventory.json");
const routeInventoryMdPath = path.join(designDir, "dashboard-canonical-route-inventory.md");
const baselineJsonPath = path.join(designDir, "dashboard-visual-baseline-reference-registry.json");
const baselineMdPath = path.join(designDir, "dashboard-visual-baseline-reference-registry.md");
const readinessJsonPath = path.join(designDir, "dashboard-pre-repair-readiness.json");
const readinessMdPath = path.join(designDir, "dashboard-pre-repair-readiness.md");

const knownLocalRoutes = {
  "nous-hermes-agent.dashboard": ["/", "/dashboard-kit-gallery", "/dashboard/proof"],
  "khashi-vc.roc": ["/", "/dashboard/proof?view=mission-control", "/dashboard/proof?view=market-intelligence", "/dashboard/proof?view=collection-capacity", "/dashboard/proof?view=live-market-intelligence"],
  "media-engine.ops": ["/", "/dashboard", "/dashboard/proof"],
  "media-business-operations.main": ["/dashboard", "/research-desk", "/dashboard/proof"],
  "business-mapper.workspace": ["/dashboard", "/dashboard/proof"],
  "meal-assistant.main": ["/", "/login", "/planner", "/analytics", "/dashboard/proof"],
  "rinseables-os.main": ["/", "/dashboard", "/dashboard/proof"],
  "investing-system.roc": ["/roc", "/dashboard/proof"],
  "hermes.workspace": ["/", "/dashboard/proof"],
  "tlc-capital-group-os.main": ["/", "/dashboard", "/dashboard/proof"]
};

const baselineRegistry = buildBaselineRegistry();
const routeInventory = buildRouteInventory();
const renderedReport = fs.existsSync(renderedReportPath) ? readJson(renderedReportPath) : null;
const renderedRepairs = fs.existsSync(renderedRepairPath) ? readJson(renderedRepairPath) : null;
const readiness = buildReadiness(routeInventory, baselineRegistry, renderedReport, renderedRepairs);

writeJson(routeInventoryJsonPath, routeInventory);
writeMarkdown(routeInventoryMdPath, renderRouteInventoryMarkdown(routeInventory));
writeJson(baselineJsonPath, baselineRegistry);
writeMarkdown(baselineMdPath, renderBaselineMarkdown(baselineRegistry));
writeJson(readinessJsonPath, readiness);
writeMarkdown(readinessMdPath, renderReadinessMarkdown(readiness));

console.log(`Wrote ${path.relative(root, routeInventoryJsonPath)}`);
console.log(`Wrote ${path.relative(root, baselineJsonPath)}`);
console.log(`Wrote ${path.relative(root, readinessJsonPath)}`);
console.log(`Dashboard pre-repair readiness: ${readiness.summary.ready}/${readiness.summary.total} ready to repair, ${readiness.summary.blocked} blocked.`);
if (strict && readiness.summary.blocked) process.exit(1);

function buildRouteInventory() {
  const dashboards = dashboardRegistry();
  const items = dashboards.map((dashboard) => {
    const canonicalRoute = dashboard.route ?? routePath(dashboard.url) ?? "/";
    const proofRoute = routePath(dashboard.proofUrl);
    const priorityRoutes = [...new Set([
      canonicalRoute,
      ...(knownLocalRoutes[dashboard.id] ?? []),
      proofRoute
    ].filter(Boolean))];
    return {
      id: dashboard.id,
      label: dashboard.label,
      projectPath: dashboard.projectPath,
      implementationMode: dashboard.implementationMode ?? "unspecified",
      canonicalRoute,
      proofRoute,
      priorityRoutes,
      productionUrl: dashboard.url ?? null,
      localProofUrl: dashboard.localProofUrl ?? null,
      auth: {
        proofAuthEnv: dashboard.proofAuth?.env ?? null,
        passwordEnv: `DASHBOARD_AUTH_PASSWORD_${dashboard.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        acceptsFleetPassword: true
      },
      requiredEvidence: [
        "desktop screenshot",
        "mobile screenshot",
        "route inventory",
        "interaction inventory",
        "component coverage",
        "repair packet when blocked"
      ]
    };
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    standard: "Dashboard Canonical Route Inventory",
    total: items.length,
    items
  };
}

function buildBaselineRegistry() {
  const families = [
    {
      id: "shell-sidebar",
      label: "Shell And Sidebar",
      requiredComponents: ["DashboardShell", "DashboardSidebar", "DashboardHeader"],
      requiredProof: ["desktop screenshot", "mobile screenshot", "no mobile full-screen sidebar cover", "visible route navigation"],
      notes: "Every project must use the shared shell rhythm before page-level redesign begins."
    },
    {
      id: "workspace-density",
      label: "Workspace Density And Spacing",
      requiredComponents: ["PageFrame", "SectionStack", "MetricCard", "StatePanel"],
      requiredProof: ["consistent card gaps", "no card nesting", "no horizontal overflow"],
      notes: "Cards must look placed by a system, not dropped behind existing content."
    },
    {
      id: "tables",
      label: "Tables And Pagination",
      requiredComponents: ["DataTable", "TableSurface", "Pagination"],
      requiredProof: ["table inside card", "10/25/50 page size control", "single footer"],
      notes: "Every data table needs a surface, density, and pagination contract."
    },
    {
      id: "charts",
      label: "Charts And Time Series",
      requiredComponents: ["LineChart", "BarChart", "DonutChart", "ChartPanel"],
      requiredProof: ["not hand-drawn", "labeled axes or meaningful tooltip", "loading and empty states"],
      notes: "Chart work must use real chart components or approved domain libraries."
    },
    {
      id: "auth-session",
      label: "Auth And Session Controls",
      requiredComponents: ["SessionStatus", "AuthPanel", "CommandHeader"],
      requiredProof: ["professional placement", "proof route bypass or test password", "save/update state visible"],
      notes: "Auth can exist, but it cannot block certification from reaching the real dashboard surface."
    },
    {
      id: "sidecars-drawers",
      label: "Sidecars And Drawers",
      requiredComponents: ["SidecarPanel", "Drawer", "InspectorPanel"],
      requiredProof: ["does not trap chart/workspace height", "collapses to a predictable rail", "scrolls internally"],
      notes: "Inspectors belong in reusable sidecar/drawer patterns instead of one-off local panels."
    },
    {
      id: "state-feedback",
      label: "Empty Loading Error States",
      requiredComponents: ["LoadingState", "EmptyState", "ErrorState", "DataFreshnessStrip"],
      requiredProof: ["no permanent dashes without reason", "freshness and source visible", "operator next action"],
      notes: "Missing data must explain whether it is loading, unavailable, stale, or misconfigured."
    },
    {
      id: "proof-strip",
      label: "Proof And Runtime Status",
      requiredComponents: ["ProofStrip", "RuntimeStatus", "HealthBadge"],
      requiredProof: ["runtime heartbeat", "data source freshness", "environment mode", "repair target"],
      notes: "Proof surfaces must tell the truth about running, stopped, stale, and unknown states."
    }
  ];
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    standard: "Dashboard Visual Baseline Reference Registry",
    families
  };
}

function buildReadiness(routeInventory, baselineRegistry, renderedReport, renderedRepairs) {
  const renderedById = new Map((renderedReport?.items ?? []).map((item) => [item.id, item]));
  const repairById = new Map((renderedRepairs?.packets ?? []).map((packet) => [packet.dashboard, packet]));
  const items = routeInventory.items.map((routeItem) => {
    const rendered = renderedById.get(routeItem.id);
    const repair = repairById.get(routeItem.id);
    const blockers = [];
    const warnings = [];
    if (!routeItem.priorityRoutes.length) blockers.push(issue("route.inventoryMissing", "No canonical or priority route is registered."));
    if (!routeItem.proofRoute && !routeItem.localProofUrl) warnings.push(issue("proof.routeMissing", "No proof route is registered."));
    if (!baselineRegistry.families?.length) blockers.push(issue("baseline.registryMissing", "No visual baseline family registry exists."));
    if (!renderedReport) blockers.push(issue("rendered.reportMissing", "Rendered certification report has not been generated."));
    if (!renderedRepairs) blockers.push(issue("rendered.repairMissing", "Rendered repair packets have not been generated."));
    if (renderedReport && !rendered) blockers.push(issue("rendered.itemMissing", "Dashboard is missing from rendered certification."));
    if (rendered) {
      if (rendered.verdict === "unreachable") blockers.push(issue("rendered.unreachable", "Dashboard route is unreachable in rendered certification."));
      if (!hasViewport(rendered, "desktop")) blockers.push(issue("capture.desktopMissing", "Desktop screenshot was not captured."));
      if (!hasViewport(rendered, "mobile")) blockers.push(issue("capture.mobileMissing", "Mobile screenshot was not captured."));
      if (!Array.isArray(rendered.routeInventory) || rendered.routeInventory.length === 0) blockers.push(issue("route.renderedInventoryMissing", "Rendered route inventory is missing."));
      if (!(rendered.captures ?? []).every((capture) => capture.interaction)) blockers.push(issue("interaction.inventoryMissing", "Interaction inventory is missing for one or more captures."));
      if (!(rendered.captures ?? []).every((capture) => capture.componentCoverage)) warnings.push(issue("component.coverageMissing", "Component coverage is missing for one or more captures."));
    }
    if (rendered && rendered.verdict !== "certified" && !repair) blockers.push(issue("repair.packetMissing", "Blocked/non-certified dashboard has no rendered repair packet."));
    const status = blockers.length ? "blocked" : "ready";
    return {
      id: routeItem.id,
      label: routeItem.label,
      status,
      renderedVerdict: rendered?.verdict ?? "missing",
      repairPacket: repair?.id ?? null,
      baselineFamilies: baselineRegistry.families.map((family) => family.id),
      blockers,
      warnings
    };
  });
  const summary = {
    total: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    warnings: items.reduce((sum, item) => sum + item.warnings.length, 0)
  };
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    standard: "Dashboard Pre-Repair Readiness Gate",
    meaning: "This gate proves the fleet has enough route, screenshot, interaction, component, baseline, and repair-packet evidence to begin project-by-project visual standard repairs.",
    summary,
    items
  };
}

function hasViewport(rendered, viewport) {
  return (rendered.captures ?? []).some((capture) => capture.viewport === viewport && capture.screenshot);
}

function routePath(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.startsWith("/") ? url : null;
  }
}

function issue(code, message) {
  return { code, message };
}

function renderRouteInventoryMarkdown(inventory) {
  const rows = inventory.items.map((item) => [
    item.id,
    item.canonicalRoute,
    item.proofRoute ?? "none",
    item.auth.proofAuthEnv ?? item.auth.passwordEnv,
    item.priorityRoutes.join("<br>")
  ]);
  return `# Dashboard Canonical Route Inventory\n\nGenerated: ${inventory.generatedAt}\n\nThis is the route contract used before visual repair begins. A project cannot hide behind one passing route if the operator-critical routes are different.\n\n${markdownTable(["Dashboard", "Canonical", "Proof", "Auth/Proof Env", "Priority Routes"], rows)}\n`;
}

function renderBaselineMarkdown(registry) {
  const rows = registry.families.map((family) => [
    family.id,
    family.requiredComponents.join(", "),
    family.requiredProof.join("<br>")
  ]);
  const details = registry.families.map((family) => `## ${family.label}\n\n${family.notes}`).join("\n\n");
  return `# Dashboard Visual Baseline Reference Registry\n\nGenerated: ${registry.generatedAt}\n\nThese are the shared visual families every dashboard must prove. They are intentionally broader than package dependency checks because the user sees layout, density, state, and interaction quality.\n\n${markdownTable(["Family", "Components", "Required Proof"], rows)}\n\n${details}\n`;
}

function renderReadinessMarkdown(readiness) {
  const rows = readiness.items.map((item) => [
    item.id,
    item.status,
    item.renderedVerdict,
    item.repairPacket ?? "none",
    item.blockers.map((blocker) => blocker.code).join("<br>") || "none",
    item.warnings.map((warning) => warning.code).join("<br>") || "none"
  ]);
  const details = readiness.items.map((item) => {
    const blockers = item.blockers.length ? item.blockers.map((blocker) => `- BLOCKER ${blocker.code}: ${blocker.message}`).join("\n") : "- None";
    const warnings = item.warnings.length ? item.warnings.map((warning) => `- WARNING ${warning.code}: ${warning.message}`).join("\n") : "- None";
    return `## ${item.label}\n\nStatus: **${item.status}**  \nRendered verdict: ${item.renderedVerdict}  \nRepair packet: ${item.repairPacket ?? "none"}\n\n### Blockers\n${blockers}\n\n### Warnings\n${warnings}`;
  }).join("\n\n");
  return `# Dashboard Pre-Repair Readiness\n\nGenerated: ${readiness.generatedAt}\n\n${readiness.meaning}\n\n## Summary\n\n- Total: ${readiness.summary.total}\n- Ready to repair: ${readiness.summary.ready}\n- Blocked: ${readiness.summary.blocked}\n- Warnings: ${readiness.summary.warnings}\n\n${markdownTable(["Dashboard", "Status", "Rendered", "Repair Packet", "Blockers", "Warnings"], rows)}\n\n${details}\n`;
}
