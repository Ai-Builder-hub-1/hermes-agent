#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { dashboardRegistry, root, workspaceRoot, writeJson } from "./dashboard-report-utils.mjs";

const generatedAt = new Date().toISOString();

const routeProfiles = {
  "nous-hermes-agent.dashboard": {
    intent: "command-cockpit",
    blueprint: "command-center",
    density: "standard",
    businessObjective: "Operate the dashboard/design-system control plane and fleet maturity console.",
    pages: ["dashboard-kit-gallery", "fleet-maturity-review", "system", "sessions"],
    workflowActions: ["review standards", "inspect downstream blockers", "generate reports", "validate promotion gates"],
    targetVisualTier: "V4"
  },
  "khashi-vc.roc": {
    intent: "market-browser",
    blueprint: "market-browser",
    density: "standard",
    businessObjective: "Find live markets worth inspecting, prove live data quality, and feed experiment decisions.",
    pages: ["live-command", "market-browser", "daily-intelligence", "experiment-lab", "learning-ledger", "system-cost"],
    workflowActions: ["browse category", "select market", "inspect chart", "review stale/partial/error states", "page dense market lists"],
    targetVisualTier: "V3"
  },
  "media-engine.ops": {
    intent: "approval-queue",
    blueprint: "review-queue",
    density: "standard",
    businessObjective: "Move content packages through QA, approval, rejection, Discord handoff, and publish-result visibility.",
    pages: ["command-center", "qa-review", "brand-operations", "production-runs", "issue-log"],
    workflowActions: ["review package", "approve", "decline with reason", "inspect posting targets", "verify posting result"],
    targetVisualTier: "V3"
  },
  "media-business-operations.main": {
    intent: "research-workspace",
    blueprint: "research-desk",
    density: "comfortable",
    businessObjective: "Manage story research projects, evidence, operating decisions, and media business readiness.",
    pages: ["command-center", "research-desk", "network", "brand-portfolio", "readiness"],
    workflowActions: ["create project", "resume project", "define research plan", "save workflow update", "review evidence"],
    targetVisualTier: "V3"
  },
  "business-mapper.workspace": {
    intent: "research-workspace",
    blueprint: "research-desk",
    density: "standard",
    businessObjective: "Map business entities, validate relationships, and produce deliverable-ready business intelligence.",
    pages: ["workspace", "graph", "validation", "deliverables", "advisory"],
    workflowActions: ["inspect entity", "validate relationship", "review coverage", "generate deliverable", "open advisory detail"],
    targetVisualTier: "V3"
  },
  "meal-assistant.main": {
    intent: "planner-workspace",
    blueprint: "calendar-planner",
    density: "comfortable",
    businessObjective: "Plan meals across month/week/day flows, save household decisions, and export shopping/checklist outputs.",
    pages: ["planner", "calendar", "meal-library", "checklist-export", "household", "history"],
    workflowActions: ["select day", "multi-select days", "open planner drawer", "save meal plan", "export checklist"],
    targetVisualTier: "V3"
  },
  "rinseables-os.main": {
    intent: "command-cockpit",
    blueprint: "command-center",
    density: "standard",
    businessObjective: "Operate Rinseables product, audience, commerce, and readiness workflows.",
    pages: ["command-center", "audience", "commerce", "product", "readiness"],
    workflowActions: ["inspect status", "review blockers", "open work queue", "verify proof", "track readiness"],
    targetVisualTier: "V3"
  },
  "investing-system.roc": {
    intent: "trading-terminal",
    blueprint: "trading-terminal",
    density: "compact",
    businessObjective: "Review market data, indicators, risk gates, paper execution, and promotion readiness without unsafe live execution.",
    pages: ["roc", "analysis", "paper-trading", "risk", "screening"],
    workflowActions: ["load chart", "toggle indicators", "preview order", "run paper trade", "verify risk gate"],
    targetVisualTier: "V3"
  },
  "hermes.workspace": {
    intent: "command-cockpit",
    blueprint: "command-center",
    density: "standard",
    businessObjective: "Coordinate cross-project routing, deployment state, workspace health, and adoption governance.",
    pages: ["workspace", "projects", "deployments", "proof", "health"],
    workflowActions: ["inspect project", "check health", "review deployment", "verify proof", "open adoption state"],
    targetVisualTier: "V3"
  },
  "tlc-capital-group-os.main": {
    intent: "okr-kpi-cockpit",
    blueprint: "command-center",
    density: "standard",
    businessObjective: "Govern TLC-level OKRs, KPIs, business-unit ownership, task attribution, and operating cadence.",
    pages: ["command-center", "okr-kpi", "business-units", "tasks", "review-cadence"],
    workflowActions: ["inspect objective", "review key result", "assign task", "update progress", "review cadence"],
    targetVisualTier: "V3"
  }
};

const validatorSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const issues = [];

const manifest = readJson(".hermes-dashboard.json");
const platform = readJson(".hermes-dashboard-platform.json");

if (platform.schemaVersion !== 1) issue("error", "schemaVersion", "Platform manifest must declare schemaVersion 1.");
if (platform.status !== "active") issue("error", "status", "Platform manifest must be active.");
if (platform.projectId !== manifest.projectId) issue("error", "projectId", "Platform manifest projectId must match .hermes-dashboard.json.");

for (const field of ["dashboardId", "screenIntent", "experienceBlueprint", "density", "businessObjective", "targetVisualTier"]) requireString(platform, field, "platform");
for (const field of ["pages", "requiredComponents", "dataStates", "proofStates", "workflowActions", "qualitySignals", "downstreamRequirements"]) requireArray(platform, field, "platform");

const allowedDensity = new Set(["compact", "standard", "comfortable", "dense"]);
if (!allowedDensity.has(platform.density)) issue("error", "density", \`Unsupported density: \${platform.density}\`);

for (const required of ["loading", "empty", "partial", "stale", "error", "ready"]) {
  if (!platform.dataStates.includes(required)) issue("error", \`dataStates.\${required}\`, \`Missing data state \${required}.\`);
}
for (const required of ["desktop-expanded", "desktop-collapsed", "overflow-scan", "primary-workflow", "production-proof"]) {
  if (!platform.proofStates.includes(required)) issue("error", \`proofStates.\${required}\`, \`Missing proof state \${required}.\`);
}
for (const required of ["visual score", "workflow proof", "design debt", "component dependencies", "promotion blockers", "proof freshness"]) {
  if (!platform.qualitySignals.includes(required)) issue("error", \`qualitySignals.\${required}\`, \`Missing quality signal \${required}.\`);
}
for (const required of [
  "project-local dashboard:standard:check",
  "route/page manifest",
  "rendered visual proof",
  "workflow proof",
  "quality snapshot",
  "component enrichment RFC for missing local UI"
]) {
  if (!platform.downstreamRequirements.includes(required)) issue("error", \`downstreamRequirements.\${required}\`, \`Missing downstream requirement \${required}.\`);
}

if (manifest.dashboardKit?.adoptionMode !== "package-native") issue("error", "dashboardKit.adoptionMode", "Dashboard adoptionMode must be package-native.");
if (manifest.dashboardKit?.targetExperienceBand !== "T3C") issue("error", "dashboardKit.targetExperienceBand", "Dashboard targetExperienceBand must be T3C.");

const surfaceComponents = new Set((manifest.surfaces ?? []).flatMap((surface) => surface.requiredComponents ?? []));
for (const component of platform.requiredComponents) {
  if (!surfaceComponents.has(component) && !isGenericShellComponent(component)) {
    issue("warning", \`requiredComponents.\${component}\`, \`\${component} is required by platform manifest but not declared by surface manifest.\`);
  }
}

const result = {
  schemaVersion: 1,
  projectId: platform.projectId,
  dashboardId: platform.dashboardId,
  checkedAt: new Date().toISOString(),
  screenIntent: platform.screenIntent,
  experienceBlueprint: platform.experienceBlueprint,
  density: platform.density,
  targetVisualTier: platform.targetVisualTier,
  errors: issues.filter((item) => item.severity === "error"),
  warnings: issues.filter((item) => item.severity === "warning")
};

console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function requireString(object, field, prefix) {
  if (typeof object[field] !== "string" || object[field].trim() === "") issue("error", \`\${prefix}.\${field}\`, \`\${prefix} must declare \${field}.\`);
}

function requireArray(object, field, prefix) {
  if (!Array.isArray(object[field]) || object[field].length === 0) issue("error", \`\${prefix}.\${field}\`, \`\${prefix} must declare non-empty \${field}.\`);
}

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function isGenericShellComponent(component) {
  return ["DashboardShell", "DashboardSidebar", "DashboardHeader", "DashboardQueryBoundary", "DataFreshnessStrip", "ProofStrip", "StatePanel", "DataTable"].includes(component);
}
`;

const proofSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registry = readJsonIfExists("hermes.dashboards.json");
const platform = readJsonIfExists(".hermes-dashboard-platform.json");
const dashboard = registry?.dashboards?.[0] ?? {};
const url =
  process.env.DASHBOARD_PROOF_URL ||
  dashboard.url ||
  platform?.productionUrl;

if (!url) {
  console.error("No dashboard URL available for proof capture.");
  process.exit(1);
}

const startedAt = Date.now();
const response = await fetch(url, {
  signal:
    AbortSignal.timeout(15000)
});
const text =
  await response.text();
const contentType =
  response.headers.get("content-type") || "";
const markers = [
  "data-component=\\\"DashboardShell\\\"",
  "data-hdk-component",
  "hdk-",
  "dashboard",
  "Dashboard"
];
const matchedMarkers =
  markers.filter((marker) => text.includes(marker));
const proof = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectId: platform?.projectId || "unknown",
  dashboardId: platform?.dashboardId || dashboard.id || "unknown",
  url,
  status: response.status,
  ok: response.ok,
  contentType,
  bytes: Buffer.byteLength(text),
  elapsedMs: Date.now() - startedAt,
  matchedMarkers,
  proofStates: platform?.proofStates || [],
  result:
    response.ok && matchedMarkers.length > 0 ? "passed" : "failed"
};

fs.mkdirSync(path.join(root, "docs/design"), {
  recursive:
    true
});
fs.writeFileSync(
  path.join(root, "docs/design/dashboard-platform-proof.json"),
  \`\${JSON.stringify(proof, null, 2)}\\n\`
);
console.log(JSON.stringify(proof, null, 2));
if (proof.result !== "passed") process.exitCode = 1;

function readJsonIfExists(relativePath) {
  const file =
    path.join(root, relativePath);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
`;

const dashboards = dashboardRegistry();
for (const dashboard of dashboards) {
  const projectPath = path.resolve(root, dashboard.projectPath);
  const profile = routeProfiles[dashboard.id];
  if (!profile) throw new Error(`Missing route profile for ${dashboard.id}`);
  if (!fs.existsSync(path.join(projectPath, "package.json"))) throw new Error(`Missing package.json for ${dashboard.id} at ${projectPath}`);
  const projectManifestPath = path.join(projectPath, ".hermes-dashboard.json");
  const manifest = fs.existsSync(projectManifestPath) ? JSON.parse(fs.readFileSync(projectManifestPath, "utf8")) : {};
  const platformManifest = {
    schemaVersion: 1,
    version: "V1",
    status: "active",
    generatedAt,
    projectId: manifest.projectId ?? normalizeProjectId(dashboard),
    dashboardId: dashboard.id,
    owner: dashboard.owner,
    productionUrl: dashboard.url,
    proofUrl: dashboard.proofUrl,
    healthUrl: dashboard.healthUrl,
    screenIntent: profile.intent,
    experienceBlueprint: profile.blueprint,
    density: profile.density,
    businessObjective: profile.businessObjective,
    targetVisualTier: profile.targetVisualTier,
    pages: profile.pages.map((page) => ({
      id: page,
      intent: profile.intent,
      blueprint: profile.blueprint,
      density: profile.density,
      requiresSpacingContract: true,
      requiresCardDensityContract: true,
      requiresTableContainmentContract: true,
      requiresDrawerOverlayProof: true,
      requiresWorkflowProof: true
    })),
    requiredComponents: inferRequiredComponents(profile.intent, profile.blueprint),
    dataStates: ["loading", "empty", "partial", "stale", "error", "ready"],
    proofStates: ["desktop-expanded", "desktop-collapsed", "overflow-scan", "primary-workflow", "production-proof"],
    workflowActions: profile.workflowActions,
    qualitySignals: ["visual score", "workflow proof", "design debt", "component dependencies", "promotion blockers", "proof freshness"],
    downstreamRequirements: [
      "project-local dashboard:standard:check",
      "route/page manifest",
      "rendered visual proof",
      "workflow proof",
      "quality snapshot",
      "component enrichment RFC for missing local UI"
    ],
    componentEnrichmentPolicy: {
      missingComponentRequiresRfc: true,
      localUiRequiresExpiry: true,
      approvedComponentsComeFromDashboardKit: true,
      proofRerunRequiredAfterAutopatch: true
    }
  };
  writeJson(path.join(projectPath, ".hermes-dashboard-platform.json"), platformManifest);
  syncSurfaceManifest(projectManifestPath, platformManifest);
  fs.mkdirSync(path.join(projectPath, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(projectPath, "scripts/check-dashboard-platform-standard.mjs"), validatorSource);
  fs.writeFileSync(path.join(projectPath, "scripts/capture-dashboard-platform-proof.mjs"), proofSource);
  updatePackageScripts(path.join(projectPath, "package.json"));
  console.log(`synced ${dashboard.id}`);
}

function syncSurfaceManifest(projectManifestPath, platformManifest) {
  if (!fs.existsSync(projectManifestPath)) return;
  const manifest =
    JSON.parse(fs.readFileSync(projectManifestPath, "utf8"));
  const surfaces =
    manifest.surfaces ?? [];
  if (!surfaces.length) return;

  const surface =
    choosePrimarySurface(surfaces);
  const components =
    new Set(surface.requiredComponents ?? []);
  for (const component of platformManifest.requiredComponents ?? []) {
    components.add(component);
  }
  surface.requiredComponents =
    Array.from(components);

  const note =
    "Platform-required component families are synchronized from .hermes-dashboard-platform.json so local routes cannot pass with only generic shell declarations.";
  const currentNotes =
    surface.notes || "";
  if (!currentNotes.includes(note)) {
    surface.notes =
      currentNotes ? `${currentNotes} ${note}` : note;
  }

  writeJson(projectManifestPath, manifest);
}

function choosePrimarySurface(surfaces) {
  return surfaces.find((surface) =>
    surface.status === "production" ||
    surface.role === "server-route" ||
    surface.status === "package-native"
  ) || surfaces[0];
}

function updatePackageScripts(packageJsonPath) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["dashboard:platform:check"] = "node scripts/check-dashboard-platform-standard.mjs";
  if (!pkg.scripts["dashboard:proof"] && !pkg.scripts["dashboard:proof:capture"] && !pkg.scripts["dashboard:proof:screenshot"]) {
    pkg.scripts["dashboard:proof"] = "node scripts/capture-dashboard-platform-proof.mjs";
  }
  if (!pkg.scripts["dashboard:proof:capture"] && pkg.scripts["proof:capture"]) {
    pkg.scripts["dashboard:proof:capture"] = "npm run proof:capture";
  }
  const current = pkg.scripts["dashboard:standard:check"];
  if (!current) {
    pkg.scripts["dashboard:standard:check"] = "npm run dashboard:platform:check";
  } else if (!current.includes("dashboard:platform:check")) {
    pkg.scripts["dashboard:standard:check"] = `${current} && npm run dashboard:platform:check`;
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function inferRequiredComponents(intent, blueprint) {
  const shared = ["DashboardShell", "DashboardSidebar", "DashboardHeader", "DashboardQueryBoundary", "DataFreshnessStrip", "ProofStrip", "StatePanel"];
  if (intent === "approval-queue") return [...shared, "DataTable", "ContentPackageWorkspace", "ActionQueue"];
  if (intent === "planner-workspace") return [...shared, "MealPlannerCalendar", "MealWeekDrawer", "MealLibrary", "ShoppingListExportPanel"];
  if (intent === "research-workspace") return [...shared, "DataTable", "ResearchDeskWorkspace", "DrilldownPanel"];
  if (intent === "market-browser") return [...shared, "DataTable", "PremiumMarketBrowser", "LineChart", "Drawer"];
  if (intent === "trading-terminal") return [...shared, "DataTable", "CandlestickChart", "TradingTerminal", "ActionQueue"];
  if (intent === "okr-kpi-cockpit") return [...shared, "DataTable", "GovernanceChecklist", "ActionQueue"];
  if (blueprint === "command-center") return [...shared, "MetricCard", "ActionQueue"];
  return [...shared, "MetricCard", "DataTable"];
}

function normalizeProjectId(dashboard) {
  return String(dashboard.projectName ?? dashboard.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
