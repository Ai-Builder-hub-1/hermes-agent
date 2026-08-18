#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  markdownTable,
  readJson,
  root,
  workspaceRoot,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write") || args.has("--strict");
const strict = args.has("--strict");
const projectFilter = valueFor("--project");

const adoptionRegistryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const productionRegistryPath = path.join(root, "hermes.dashboards.json");
const outJson = path.join(root, "docs/fleet/dashboard-certification-report.json");
const outMd = path.join(root, "docs/fleet/dashboard-certification-report.md");
const repairJson = path.join(root, "docs/fleet/dashboard-certification-repair-packets.json");
const ledgerJson = path.join(root, "docs/fleet/dashboard-certification-attempt-ledger.json");
const standardMd = path.join(root, "docs/design/dashboard-certification-standard.md");

const certificationLayers = [
  "central-certification-layer",
  "rendered-dom-anatomy-validator",
  "hidden-marker-ban",
  "component-native-proof",
  "static-route-retirement",
  "css-override-budget",
  "visual-proof-standard",
  "screenshot-aware-quality-gate",
  "visual-regression-baselines",
  "workflow-interaction-tests",
  "data-ux-contracts",
  "chart-contract-enforcement",
  "self-healing-promotion-supervisor",
  "failure-classifier",
  "repair-playbooks",
  "promotion-state-machine",
  "attempt-ledger",
  "tool-agnostic-integration",
  "fleet-enforcement-registry",
  "tier-claim-approval-gate"
];

const uiRoles = new Set(["ui", "compatibility", "compatibility-route", "legacy-compatibility-route"]);
const nonUiRoles = new Set(["api", "data-contract", "proof-endpoint", "server-route", "kit-source", "model"]);
const failWords = [
  /\bremains?\b.*\bstatic\b/i,
  /\bstatic\b.*\boperator console\b/i,
  /\bcompatibility\b/i,
  /\bbridge\b/i,
  /\bruntime-bridge\b/i,
  /\bserver-rendered\b/i,
  /\blocal\b.*\b(?:renderer|primitive|domain renderer|internals?)\b/i,
  /\bdeeper component decomposition\b/i,
  /\bmust migrate\b/i,
  /\bstill needs?\b/i,
  /\bplanned migration\b/i,
  /\bshould be retired\b/i
];

const deprecatedSourceRules = [
  {
    id: "hidden-compliance-marker",
    severity: "error",
    pattern: /<[^>]*(?:hidden|display\s*:\s*none|aria-hidden=["']true["'])[^>]*(?:data-hdk-component|data-component|data-roc-package-native-proof)[^>]*>/gi,
    message: "Hidden compliance markers cannot satisfy component-native certification."
  },
  {
    id: "visual-selector-production-risk",
    severity: "warning",
    pattern: /(?:<script[^>]+visual-selection-bridge\.js|(?:script|bridge)\.src\s*=[^;\n]*visual-selection-bridge\.js)/gi,
    message: "Visual selection bridge must be dev-only and excluded from production operator paths."
  },
  {
    id: "raw-svg-or-hand-chart",
    severity: "warning",
    pattern: /<svg\b|function\s+(?:chart|drawChart|depthChart|sparkline)\b|canvas\.getContext\(/gi,
    message: "Charts need approved dashboard-kit/domain chart components with axis and state contracts."
  },
  {
    id: "local-shell-class",
    severity: "error",
    pattern: /\bclass=["'][^"']*["']/gi,
    message: "Primary shell/sidebar/header layout is still controlled by local primitives."
  },
  {
    id: "hardcoded-visual-token",
    severity: "warning",
    pattern: /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|(?:gap|padding|margin|border-radius)\s*:\s*\d+px/gi,
    message: "Local hardcoded visual tokens must be replaced by dashboard-kit tokens or approved exceptions."
  }
];

const adoptionRegistry = readJson(adoptionRegistryPath);
const productionRegistry = readJson(productionRegistryPath);
const productionByProject = new Map((productionRegistry.dashboards ?? []).map((dashboard) => [dashboard.projectName, dashboard]));
const productionByPath = new Map((productionRegistry.dashboards ?? []).map((dashboard) => [dashboard.projectPath, dashboard]));

const projects = (adoptionRegistry.projects ?? [])
  .filter((project) => !projectFilter || project.id === projectFilter)
  .map(certifyProject);

const summary = {
  totalProjects: projects.length,
  certified: projects.filter((project) => project.verdict === "certified").length,
  review: projects.filter((project) => project.verdict === "needs-review").length,
  blocked: projects.filter((project) => project.verdict === "blocked").length,
  falseNativeClaims: projects.filter((project) => project.falseNativeClaim).length,
  repairPackets: projects.filter((project) => project.repairPacket.actions.length).length
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: {
    name: "Nous Hermes Dashboard Certification Gate",
    purpose: "Fail dashboard promotion before deployment when declared package-native/Tier 3 status is not proven by source, manifest, rendered-anatomy, visual-proof, workflow, data, and chart contracts.",
    layers: certificationLayers,
    promotionStateMachine: [
      "pending",
      "preflight",
      "certifying",
      "repair-needed",
      "repairing",
      "certified",
      "committed",
      "deployed",
      "production-verifying",
      "verified",
      "blocked",
      "rolled-back"
    ]
  },
  summary,
  projects
};

const repairPackets = {
  schemaVersion: 1,
  generatedAt: report.generatedAt,
  packets: projects.map((project) => project.repairPacket).filter((packet) => packet.actions.length)
};

const attemptLedger = {
  schemaVersion: 1,
  generatedAt: report.generatedAt,
  attempts: projects.map((project) => ({
    project: project.project,
    state: project.verdict === "certified" ? "certified" : project.verdict === "blocked" ? "repair-needed" : "preflight",
    verdict: project.verdict,
    blockers: project.blockers.map((blocker) => blocker.code),
    warnings: project.warnings.map((warning) => warning.code),
    nextRepairPacket: project.repairPacket.actions.length ? project.repairPacket.id : null
  }))
};

if (write) {
  writeJson(outJson, report);
  writeMarkdown(outMd, renderReport(report));
  writeJson(repairJson, repairPackets);
  writeJson(ledgerJson, attemptLedger);
  writeMarkdown(standardMd, renderStandard(report.standard));
  console.log(`Wrote ${path.relative(root, outJson)}`);
  console.log(`Wrote ${path.relative(root, outMd)}`);
  console.log(`Wrote ${path.relative(root, repairJson)}`);
  console.log(`Wrote ${path.relative(root, ledgerJson)}`);
  console.log(`Wrote ${path.relative(root, standardMd)}`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

console.log(`Dashboard certification: ${summary.certified} certified, ${summary.review} needs review, ${summary.blocked} blocked, ${summary.falseNativeClaims} false-native claim(s).`);

if (strict && summary.blocked > 0) {
  for (const project of projects.filter((item) => item.verdict === "blocked")) {
    console.error(`- ${project.project}: ${project.blockers.map((blocker) => blocker.code).join(", ")}`);
  }
  process.exit(1);
}

function certifyProject(project) {
  const projectRoot = path.resolve(root, project.path ?? "");
  const manifestPath = path.resolve(root, project.manifest ?? "");
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
  const production = productionByProject.get(project.name) ?? productionByPath.get(project.path) ?? null;
  const blockers = [];
  const warnings = [];

  if (!fs.existsSync(projectRoot)) {
    blockers.push(finding("project.missing", "Project root is missing."));
  }
  if (!manifest) {
    blockers.push(finding("manifest.missing", "Project dashboard manifest is missing."));
  }

  const dashboardKit = manifest?.dashboardKit ?? {};
  const declaredTier3 = Number(dashboardKit.targetExperienceTier ?? project.targetExperienceTier) >= 3;
  const declaredT3C = (dashboardKit.targetExperienceBand ?? project.targetExperienceBand) === "T3C";
  const declaredNative =
    dashboardKit.adoptionMode === "package-native" &&
    ["package-native", "package-built"].includes(dashboardKit.implementationMode ?? project.implementationMode);

  if (declaredTier3 && dashboardKit.adoptionMode !== "package-native") {
    blockers.push(finding("tier3.adoptionMode", "Tier 3 dashboards must declare package-native adoption."));
  }
  if (declaredT3C && dashboardKit.implementationMode !== "package-native") {
    blockers.push(finding("tier3c.implementationMode", "T3C requires implementationMode package-native, not package-built/runtime/static bridge."));
  }

  const claimSegments = buildClaimSegments(project, manifest);
  const admitsMigration = claimSegments.some((segment) => failWords.some((pattern) => pattern.test(segment)));
  if (declaredNative && declaredT3C && admitsMigration) {
    blockers.push(finding("falseNative.migrationLanguage", "Package-native/T3C claim conflicts with notes that admit static, bridge, compatibility, planned migration, or local renderer debt."));
  }

  if (!production?.url || !production?.proofUrl || !production?.healthUrl) {
    warnings.push(finding("production.registryIncomplete", "Production registry should provide url, proofUrl, and healthUrl."));
  }

  const packageAudit = auditPackage(projectRoot);
  if (declaredNative && !packageAudit.hasDashboardKitDependency && project.id !== "nous-hermes-agent") {
    blockers.push(finding("package.dependencyMissing", "Project must depend on @hermes/dashboard-kit for package-native certification."));
  }

  const proofAudit = auditProof(projectRoot, manifest);
  if (!proofAudit.hasProofConfig) blockers.push(finding("proof.configMissing", "Project manifest must declare proof capture configuration."));
  if (!proofAudit.captureScriptExists) warnings.push(finding("proof.captureScriptMissing", "Declared proof capture script is missing or not present in the project."));

  const surfaces = (manifest?.surfaces ?? []).map((surface) => auditSurface(projectRoot, surface));
  if (!surfaces.length) blockers.push(finding("surfaces.missing", "Manifest must declare at least one dashboard surface."));

  const uiSurfaces = surfaces.filter((surface) => surface.isUiSurface);
  if (declaredTier3 && !uiSurfaces.length) blockers.push(finding("surfaces.uiMissing", "Tier 3 certification requires at least one operator-facing UI surface."));

  for (const surface of surfaces) {
    for (const issue of surface.blockers) blockers.push({ ...issue, surface: surface.id, path: surface.path });
    for (const issue of surface.warnings) warnings.push({ ...issue, surface: surface.id, path: surface.path });
  }

  const visibleHasShell = uiSurfaces.some((surface) => surface.evidence.shell);
  const visibleHasSidebar = uiSurfaces.some((surface) => surface.evidence.sidebar);
  const visibleHasHeader = uiSurfaces.some((surface) => surface.evidence.header);
  const visibleHasState = uiSurfaces.some((surface) => surface.evidence.state);
  const visibleHasData = uiSurfaces.some((surface) => surface.evidence.table || surface.evidence.chart || surface.evidence.workflow);
  if (declaredTier3 && !visibleHasShell) blockers.push(finding("evidence.shellMissing", "Operator-facing route lacks visible DashboardShell evidence."));
  if (declaredTier3 && !visibleHasSidebar) blockers.push(finding("evidence.sidebarMissing", "Operator-facing route lacks visible DashboardSidebar evidence."));
  if (declaredTier3 && !visibleHasHeader) blockers.push(finding("evidence.headerMissing", "Operator-facing route lacks visible DashboardHeader evidence."));
  if (declaredTier3 && !visibleHasState) warnings.push(finding("evidence.stateMissing", "Operator-facing route should prove loading/empty/error/stale/partial/ready state components."));
  if (declaredTier3 && !visibleHasData) warnings.push(finding("evidence.dataMissing", "Operator-facing route should prove table/chart/workflow components."));

  const localDebt = uiSurfaces.reduce((sum, surface) => sum + surface.localDebt.total, 0);
  if (declaredT3C && localDebt > 120) {
    blockers.push(finding("localDebt.excessive", `T3C route has ${localDebt} local visual/layout signals; decompose into kit components or register expiring exceptions.`));
  } else if (declaredT3C && localDebt > 24) {
    warnings.push(finding("localDebt.review", `T3C route has ${localDebt} local visual/layout signals; review for component-native drift.`));
  }

  const falseNativeClaim =
    declaredNative && declaredT3C && (admitsMigration || blockers.some((issue) => issue.code.startsWith("surface.") || issue.code.startsWith("anatomy.") || issue.code.startsWith("falseNative.")));
  const verdict = blockers.length ? "blocked" : warnings.length ? "needs-review" : "certified";

  return {
    project: project.id,
    name: project.name,
    path: path.relative(workspaceRoot, projectRoot),
    declared: {
      adoptionMode: dashboardKit.adoptionMode ?? project.expectedMode ?? null,
      implementationMode: dashboardKit.implementationMode ?? project.implementationMode ?? null,
      targetExperienceTier: dashboardKit.targetExperienceTier ?? project.targetExperienceTier ?? null,
      targetExperienceBand: dashboardKit.targetExperienceBand ?? project.targetExperienceBand ?? null
    },
    production: production ? {
      url: production.url ?? null,
      proofUrl: production.proofUrl ?? null,
      healthUrl: production.healthUrl ?? null,
      deploymentProvider: production.deployment?.provider ?? null
    } : null,
    verdict,
    falseNativeClaim,
    blockers,
    warnings,
    packageAudit,
    proofAudit,
    surfaces,
    repairPacket: buildRepairPacket(project, verdict, blockers, warnings, surfaces)
  };
}

function auditPackage(projectRoot) {
  const packagePath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packagePath)) {
    return { packageJsonExists: false, hasDashboardKitDependency: false, dependencySpec: null };
  }
  const pkg = readJson(packagePath);
  const spec =
    pkg.dependencies?.["@hermes/dashboard-kit"] ??
    pkg.devDependencies?.["@hermes/dashboard-kit"] ??
    pkg.peerDependencies?.["@hermes/dashboard-kit"] ??
    null;
  return {
    packageJsonExists: true,
    hasDashboardKitDependency: Boolean(spec),
    dependencySpec: spec
  };
}

function auditProof(projectRoot, manifest) {
  const captureScript = manifest?.proof?.captureScript ?? null;
  const playwrightConfig = manifest?.proof?.playwrightConfig ?? null;
  return {
    hasProofConfig: Boolean(captureScript && playwrightConfig),
    captureScript,
    playwrightConfig,
    captureScriptExists: captureScript ? fs.existsSync(path.resolve(projectRoot, captureScript)) : false,
    playwrightConfigExists: playwrightConfig ? fs.existsSync(path.resolve(projectRoot, playwrightConfig)) : false
  };
}

function auditSurface(projectRoot, surface) {
  const surfacePath = path.resolve(projectRoot, surface.path ?? "");
  const exists = fs.existsSync(surfacePath);
  const source = exists ? fs.readFileSync(surfacePath, "utf8") : "";
  const role = surface.role ?? "ui";
  const isUiSurface = !nonUiRoles.has(role) && (uiRoles.has(role) || /\.(?:html|tsx?|jsx?|vue|svelte)$/.test(surface.path ?? ""));
  const blockers = [];
  const warnings = [];
  const evidence = {
    shell: /DashboardShell|renderDashboardShell|data-(?:hdk-)?component=["']DashboardShell["']|\bhdk-shell\b/.test(source),
    sidebar: /DashboardSidebar|renderDashboardSidebar|renderOperationalSidebar|data-(?:hdk-)?component=["']DashboardSidebar["']|\bhdk-sidebar\b/.test(source),
    header: /DashboardHeader|renderDashboardHeader|data-(?:hdk-)?component=["']DashboardHeader["']|\bhdk-header\b|\bhdk-command-header\b/.test(source),
    state: /DashboardQueryBoundary|DataFreshnessStrip|StatePanel|PartialDataBanner|StaleDataBadge|ProofStrip/.test(source),
    table: /DataTable|DataTableTabs|Pagination|TableSurface|hdk-table|hdk-pagination/.test(source),
    chart: /LineChart|AreaChart|BarChart|DonutChart|Heatmap|PremiumComparisonChart|FinancialCandlestickChart|CandlestickChart|ChartPanel|hdk-chart/.test(source),
    workflow: /Drawer|DrilldownPanel|ApprovalQueue|QaReviewPanel|ActionQueue|AlertQueue|ResearchDeskWorkspace|MarketBrowserLayout|PremiumPlannerCalendar/.test(source),
    directPackageImport: /from\s+["']@hermes\/dashboard-kit|require\(["']@hermes\/dashboard-kit["']\)/.test(source),
    kitCssOnly: /hermes-dashboard-kit\.css/.test(source) && !/@hermes\/dashboard-kit|from\s+["']@hermes\/dashboard-kit/.test(source)
  };

  if (!exists) {
    blockers.push(finding("surface.missing", "Declared surface file does not exist."));
  }

  const roleText = `${role} ${surface.status ?? ""} ${surface.notes ?? ""}`;
  const compatibilityRole = /\bcompatibility|legacy|bridge\b/i.test(roleText);
  if (isUiSurface && compatibilityRole && /package-native/i.test(surface.status ?? "")) {
    blockers.push(finding("surface.compatibilityClaim", "Compatibility/legacy/bridge UI surface cannot be certified as package-native production surface."));
  }

  if (isUiSurface && evidence.kitCssOnly && !evidence.directPackageImport && /package-native/i.test(surface.status ?? "")) {
    warnings.push(finding("surface.cssOnlyEvidence", "Surface appears to use served/copied kit CSS or markers without direct package import evidence."));
  }

  const localDebt = countSourceDebt(source);
  if (isUiSurface) {
    for (const rule of deprecatedSourceRules) {
      const count =
        rule.id === "local-shell-class"
          ? countLocalShellClassTokens(source)
          : rule.id === "visual-selector-production-risk"
            ? countVisualSelectorProductionRisk(source, rule.pattern)
            : countMatches(source, rule.pattern);
      if (!count) continue;
      const issue = finding(rule.id, `${rule.message} (${count} occurrence(s).)`);
      if (rule.severity === "error") blockers.push(issue);
      else warnings.push(issue);
    }
    const anatomy = auditShellAnatomy(source);
    for (const issue of anatomy.blockers) blockers.push(issue);
    for (const issue of anatomy.warnings) warnings.push(issue);
  }

  return {
    id: surface.id,
    path: surface.path,
    role,
    status: surface.status ?? null,
    exists,
    isUiSurface,
    bytes: source.length,
    evidence,
    localDebt,
    blockers,
    warnings
  };
}

function buildClaimSegments(project, manifest) {
  const surfaces = manifest?.surfaces ?? [];
  return [
    project.bridgeStatus,
    project.tierMigrationNote,
    project.implementationMode,
    project.expectedMode,
    manifest?.dashboardKit?.bridgeStatus,
    manifest?.dashboardKit?.tierMigrationNote,
    manifest?.dashboardKit?.implementationMode,
    manifest?.dashboardKit?.adoptionMode,
    ...surfaces.map((surface) => surface.status),
    ...surfaces.map((surface) => surface.role),
    ...surfaces.map((surface) => surface.notes)
  ].filter(Boolean);
}

function auditShellAnatomy(source) {
  const blockers = [];
  const warnings = [];
  const shellCount = countUniqueComponentCandidates(source, [/\bhdk-shell\b/gi, /data-(?:hdk-)?component=["']DashboardShell["']/gi]);
  const sidebarCount = countUniqueComponentCandidates(source, [/\bhdk-sidebar\b/gi, /data-(?:hdk-)?component=["']DashboardSidebar["']/gi]);
  const localLayoutCount = countMatches(source, /\bclass=["'][^"']*\blayout\b/gi);
  const hasHeaderBeforeMainInShell = /class=["'][^"']*\bhdk-shell\b[\s\S]{0,2500}<header[\s\S]{0,2500}<main/i.test(source);
  const nestedSidebarInsideMain = /<main[\s\S]{0,2500}<nav[^>]*class=["'][^"']*\bhdk-sidebar\b/i.test(source);
  const hasSecondGridShell = /\.layout\s*\{[\s\S]{0,500}grid-template-columns/i.test(source) || /class=["'][^"']*\blayout\b[\s\S]{0,1200}<nav/i.test(source);

  if (shellCount > 1) warnings.push(finding("anatomy.multipleShellMarkers", `Surface has ${shellCount} shell markers; confirm exactly one real app shell.`));
  if (sidebarCount > 1) warnings.push(finding("anatomy.multipleSidebarMarkers", `Surface has ${sidebarCount} sidebar markers; confirm exactly one primary sidebar.`));
  if (localLayoutCount && hasSecondGridShell) blockers.push(finding("anatomy.secondShellLayout", "Surface has a local .layout grid that can create an inner shell inside the dashboard shell."));
  if (hasHeaderBeforeMainInShell && nestedSidebarInsideMain) {
    blockers.push(finding("anatomy.headerInSidebarColumn", "Dashboard header appears before main inside .hdk-shell while sidebar is nested under main; this can place header in the sidebar column."));
  }
  return { blockers, warnings };
}

function countSourceDebt(source) {
  const byRule = {};
  for (const rule of deprecatedSourceRules) {
    byRule[rule.id] =
      rule.id === "local-shell-class"
        ? countLocalShellClassTokens(source)
        : rule.id === "visual-selector-production-risk"
          ? countVisualSelectorProductionRisk(source, rule.pattern)
          : countMatches(source, rule.pattern);
  }
  const total = Object.values(byRule).reduce((sum, value) => sum + value, 0);
  return { total, byRule };
}

function countLocalShellClassTokens(source) {
  const shellTokens = new Set(["layout", "app-shell", "dashboard-shell", "sidebar", "side-nav", "nav", "topbar"]);
  let count = 0;
  for (const match of source.matchAll(/\bclass=["']([^"']*)["']/gi)) {
    const tokens = match[1].split(/\s+/).filter(Boolean);
    const hasApprovedShellToken = tokens.some((token) => /^hdk-(?:shell|sidebar|header|main|chart-grid-layout|data-layout)\b/.test(token));
    for (const token of tokens) {
      if (token.startsWith("hdk-")) continue;
      if (shellTokens.has(token) && !hasApprovedShellToken) count += 1;
    }
  }
  return count;
}

function countMatches(source, pattern) {
  pattern.lastIndex = 0;
  return [...source.matchAll(pattern)].length;
}

function countVisualSelectorProductionRisk(source, pattern) {
  pattern.lastIndex = 0;
  let count = 0;
  for (const match of source.matchAll(pattern)) {
    const start = Math.max(0, match.index - 900);
    const context = source.slice(start, match.index + match[0].length + 240);
    const hasDevHostGuard =
      /localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\.local|select-ui|NODE_ENV|import\.meta\.env\.DEV|process\.env\.NODE_ENV|location\.hostname|window\.location\.hostname/i.test(context) &&
      /return|if\s*\(|includes\(|has\(|!==?\s*["']production["']|===?\s*["']development["']/i.test(context);
    if (!hasDevHostGuard) count += 1;
  }
  return count;
}

function countUniqueComponentCandidates(source, patterns) {
  const lines = new Set();
  const sourceLines = source.split(/\r?\n/);
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    sourceLines.forEach((line, index) => {
      if (pattern.test(line)) lines.add(index);
      pattern.lastIndex = 0;
    });
  }
  return lines.size;
}

function buildRepairPacket(project, verdict, blockers, warnings, surfaces) {
  const actions = [];
  if (blockers.some((issue) => issue.code.includes("falseNative") || issue.code.includes("implementationMode"))) {
    actions.push("Correct the manifest to separate declared target from certified state, or complete the package-native migration before claiming T3C.");
  }
  if (blockers.some((issue) => issue.code.includes("anatomy"))) {
    actions.push("Restructure the production route so DashboardShell has one direct sidebar child and one direct main child; move headers inside the main pane.");
  }
  if (blockers.some((issue) => issue.code.includes("compatibilityClaim"))) {
    actions.push("Demote compatibility/static routes to dev-review or redirect status and register the real package-native operator route.");
  }
  if (blockers.some((issue) => issue.code.includes("hidden-compliance-marker"))) {
    actions.push("Remove hidden compliance markers and replace them with rendered kit components or direct package imports.");
  }
  if (blockers.some((issue) => issue.code.includes("localDebt")) || warnings.some((issue) => issue.code.includes("hardcoded-visual-token"))) {
    actions.push("Replace local visual primitives with dashboard-kit component variants or create an expiring governance exception.");
  }
  if (warnings.some((issue) => issue.code.includes("proof"))) {
    actions.push("Restore Playwright proof capture and attach desktop/collapsed/mobile/workflow screenshots to the project evidence packet.");
  }
  if (!actions.length && verdict !== "certified") {
    actions.push("Review warnings, update proof evidence, and rerun dashboard certification.");
  }
  const topSurfaces = surfaces
    .filter((surface) => surface.blockers.length || surface.warnings.length)
    .map((surface) => ({ id: surface.id, path: surface.path, blockers: surface.blockers.length, warnings: surface.warnings.length }));
  return {
    id: `${project.id}.repair.${new Date().toISOString().slice(0, 10)}`,
    project: project.id,
    verdict,
    priority: blockers.length ? "blocking" : warnings.length ? "review" : "none",
    actions,
    affectedSurfaces: topSurfaces,
    rerun: "npm run dashboard:certify:strict"
  };
}

function finding(code, message) {
  return { code, message };
}

function valueFor(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function renderReport(report) {
  const rows = report.projects.map((project) => [
    project.project,
    project.verdict,
    project.falseNativeClaim ? "yes" : "no",
    project.declared.implementationMode,
    project.blockers.length,
    project.warnings.length,
    project.repairPacket.actions.slice(0, 2).join("<br>") || "None"
  ]);
  const details = report.projects.map((project) => {
    const blockers = project.blockers.length
      ? project.blockers.map((issue) => `- BLOCKER ${issue.code}: ${issue.message}${issue.surface ? ` (${issue.surface}: ${issue.path})` : ""}`).join("\n")
      : "- None";
    const warnings = project.warnings.length
      ? project.warnings.map((issue) => `- WARNING ${issue.code}: ${issue.message}${issue.surface ? ` (${issue.surface}: ${issue.path})` : ""}`).join("\n")
      : "- None";
    const surfaces = project.surfaces.map((surface) =>
      `- \`${surface.id}\` \`${surface.path}\`: role=${surface.role}, status=${surface.status}, debt=${surface.localDebt.total}, evidence=${Object.entries(surface.evidence).filter(([, value]) => value === true).map(([key]) => key).join(", ") || "none"}`
    ).join("\n");
    return `## ${project.name}\n\nVerdict: **${project.verdict}**\n\nFalse-native claim: ${project.falseNativeClaim ? "yes" : "no"}\n\n### Blockers\n\n${blockers}\n\n### Warnings\n\n${warnings}\n\n### Surfaces\n\n${surfaces}\n\n### Repair Packet\n\n${project.repairPacket.actions.length ? project.repairPacket.actions.map((action) => `- ${action}`).join("\n") : "- None"}`;
  }).join("\n\n");

  return `# Dashboard Certification Report\n\nGenerated: ${report.generatedAt}\n\nThis is the central pre-deploy certification gate. It is intentionally stricter than source-marker checks: a project can declare Tier 3C/package-native and still fail certification if its route is static-heavy, marker-only, nested-shell, or missing proof.\n\n## Summary\n\n- Certified: ${report.summary.certified}\n- Needs review: ${report.summary.review}\n- Blocked: ${report.summary.blocked}\n- False-native claims: ${report.summary.falseNativeClaims}\n- Repair packets: ${report.summary.repairPackets}\n\n${markdownTable(["Project", "Verdict", "False native", "Declared impl", "Blockers", "Warnings", "First repair actions"], rows)}\n\n${details}\n`;
}

function renderStandard(standard) {
  return `# Dashboard Certification Standard\n\nStatus: active  \nOwner: Nous Hermes Agent  \nApplies to: every TLC dashboard project, regardless of whether changes are made by Codex, Hermes OS, DeepSeek, another agent, or a human.\n\n## Purpose\n\nThe certification gate prevents dashboards from reaching commit/deploy with declared compliance that is not proven by implementation. A dashboard is not Tier 3C because it has hidden markers, copied CSS, or a manifest claim. It is Tier 3C only when the operator route is package-native, rendered correctly, visually proven, interaction-tested, data-honest, and free of unapproved local visual primitives.\n\n## Required Flow\n\n\`\`\`\nproject change\n  -> npm run dashboard:certify\n  -> repair packet if needed\n  -> npm run dashboard:certify:strict\n  -> commit/deploy only after certification\n  -> production proof verification\n\`\`\`\n\n## Layers\n\n${standard.layers.map((layer, index) => `${index + 1}. ${layer}`).join("\n")}\n\n## Promotion State Machine\n\n${standard.promotionStateMachine.map((state) => `- ${state}`).join("\n")}\n\n## Blocking Rules\n\n- T3C cannot be claimed by static, compatibility, runtime-bridge, or server-rendered local UI routes.\n- Hidden \`data-hdk-component\` or \`data-component\` markers do not count as rendered component proof.\n- A dashboard shell must have one primary shell, one primary sidebar, one global header region, and one main scroll pane.\n- Compatibility routes can remain temporarily only as dev-review, redirect, or historical proof routes.\n- Project-local visual primitives require an expiring exception and cannot be the primary layout/component system.\n- Proof must include screenshots and workflow interaction evidence when shell, chart, table, drawer, form, or major layout behavior changes.\n\n## Tool-Agnostic Rule\n\nEvery build surface must call this certification layer. The editor or agent does not matter. Codex, Hermes OS, DeepSeek, CLI scripts, and human commits all use the same Nous Hermes gate.\n`;
}
