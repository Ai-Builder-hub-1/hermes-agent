#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  dashboardRegistry,
  designDir,
  markdownTable,
  readJson,
  root,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const strict = process.argv.includes("--strict");
const outJson = path.join(designDir, "dashboard-comprehensive-enforcement-stack.json");
const outMd = path.join(designDir, "dashboard-comprehensive-enforcement-stack.md");

const artifactPaths = {
  fleetRegistry: "hermes.dashboards.json",
  certification: "docs/fleet/dashboard-certification-report.json",
  certificationRepairs: "docs/fleet/dashboard-certification-repair-packets.json",
  sourceDecomposition: "docs/design/dashboard-source-decomposition-report.json",
  sourceRepairs: "docs/design/dashboard-source-decomposition-repair-packets.json",
  routeContract: "docs/design/dashboard-route-ownership-contract.json",
  renderedCertification: "docs/design/rendered-fleet-certification/report.json",
  renderedRepairs: "docs/design/rendered-fleet-certification/repair-packets.json",
  routeInventory: "docs/design/dashboard-canonical-route-inventory.json",
  visualBaselineRegistry: "docs/design/dashboard-visual-baseline-reference-registry.json",
  preRepairReadiness: "docs/design/dashboard-pre-repair-readiness.json",
  visualScorecard: "docs/design/dashboard-fleet-ui-maturity-scorecard.json",
  visualCoverage: "docs/design/dashboard-visual-coverage-report.json",
  visualRegression: "docs/design/dashboard-visual-regression-matrix.json",
  runtimeData: "docs/design/dashboard-runtime-data-report.json",
  health: "docs/design/dashboard-health-report.json",
  monitoring: "docs/design/dashboard-monitoring-registry.json",
  productionProof: "docs/design/dashboard-production-proof-registry.json",
  productionScreenshots: "docs/design/production-dashboard-screenshots-report.json",
  governanceExceptions: "docs/design/dashboard-design-debt-registry.json",
  shipCheck: "docs/fleet/fleet-ship-check.json",
  releaseReadiness: "docs/fleet/fleet-release-readiness.json"
};

const layers = [
  layer("fleet-registry", "Fleet Registry", ["fleetRegistry"], "Names every governed project, production URL, local route, maturity role, and dashboard identity."),
  layer("route-manifest", "Route And Ownership Contract", ["routeInventory", "routeContract"], "Prevents one passing route from hiding broken operator-critical routes."),
  layer("source-decomposition", "Source Decomposition Gate", ["sourceDecomposition", "sourceRepairs"], "Blocks false-native declarations, static shells, server string renderers, marker bridges, and high local primitive debt."),
  layer("dom-rendered", "Rendered DOM Contract Gate", ["renderedCertification", "renderedRepairs"], "Uses Playwright to inspect visible shell/sidebar/header/main/card/table/state/control geometry in a real browser."),
  layer("visual-baselines", "Golden Visual Baseline Families", ["visualBaselineRegistry", "visualScorecard", "visualCoverage", "visualRegression"], "Tracks reusable visual families, screenshot coverage, visual scoring, and regression evidence."),
  layer("workflow-interaction", "Workflow And Interaction Proof", ["renderedCertification", "preRepairReadiness"], "Records sidebar controls, tabs, filters, disabled controls, route inventory, and repair readiness."),
  layer("data-state", "Data Contract And Runtime State", ["runtimeData", "health", "monitoring"], "Separates missing, stale, loading, partial, error, and ready data states from permanent blank cards."),
  layer("production-drift", "Production Drift Monitor", ["productionProof", "productionScreenshots", "releaseReadiness"], "Compares production proof, screenshots, health, and release readiness against local certification expectations."),
  layer("exception-ledger", "Exception And Design Debt Ledger", ["governanceExceptions", "certificationRepairs", "sourceRepairs", "renderedRepairs"], "Requires repair packets and debt records instead of silent pass-through exceptions."),
  layer("promotion-gate", "Commit And Deploy Promotion Gate", ["shipCheck", "certification", "releaseReadiness"], "Gives the final safe-to-commit/safe-to-deploy decision and blocks promotion when certification artifacts disagree.")
];

const artifacts = Object.entries(artifactPaths).map(([id, relativePath]) => artifact(id, relativePath));
const artifactById = new Map(artifacts.map((item) => [item.id, item]));
const dashboards = dashboardRegistry();
const projectFindings = dashboards.map(projectPosture);
const layerFindings = layers.map((item) => layerPosture(item, artifactById));
const blockers = [
  ...layerFindings.flatMap((item) => item.blockers.map((blocker) => ({ ...blocker, layer: item.id }))),
  ...projectFindings.flatMap((item) => item.blockers.map((blocker) => ({ ...blocker, project: item.id })))
];
const warnings = [
  ...layerFindings.flatMap((item) => item.warnings.map((warning) => ({ ...warning, layer: item.id }))),
  ...projectFindings.flatMap((item) => item.warnings.map((warning) => ({ ...warning, project: item.id })))
];

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: {
    name: "Comprehensive Dashboard Enforcement Stack",
    purpose: "Turn HDK adoption from paperwork into a full source, rendered, visual, workflow, data, production, exception, and promotion enforcement system.",
    promotionRule: "A dashboard is not standard-compliant until every required layer is present and the project has no source/rendered/promotion blockers. Marker strings and package dependencies alone never certify a route.",
    strictFailureMeaning: "Strict mode fails when any required artifact is missing, any enforcement layer is blocked, or any project has a source/rendered/promotion blocker."
  },
  summary: {
    layers: layers.length,
    activeLayers: layerFindings.filter((item) => item.status === "active").length,
    blockedLayers: layerFindings.filter((item) => item.status === "blocked").length,
    warningLayers: layerFindings.filter((item) => item.status === "needs-review").length,
    projects: projectFindings.length,
    certifiedProjects: projectFindings.filter((item) => item.status === "enforcement-certified").length,
    blockedProjects: projectFindings.filter((item) => item.status === "blocked").length,
    needsReviewProjects: projectFindings.filter((item) => item.status === "needs-review").length,
    blockers: blockers.length,
    warnings: warnings.length
  },
  commands: {
    generate: "npm run dashboard:enforcement:stack",
    strict: "npm run dashboard:enforcement:stack:strict",
    fullCertification: "npm run dashboard:fleet:certify",
    strictCertification: "npm run dashboard:fleet:certify:strict",
    shipGate: "npm run fleet:ship-check:full"
  },
  artifacts,
  layers: layerFindings,
  projects: projectFindings,
  blockers,
  warnings,
  nextActions: buildNextActions(layerFindings, projectFindings)
};

writeJson(outJson, report);
writeMarkdown(outMd, renderMarkdown(report));

console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outMd)}`);
console.log(`Dashboard comprehensive enforcement stack: ${report.summary.activeLayers}/${report.summary.layers} layers active, ${report.summary.blockedProjects} blocked project(s), ${report.summary.blockers} blocker(s).`);

if (strict && report.summary.blockers) process.exit(1);

function layer(id, label, requiredArtifacts, proves) {
  return { id, label, requiredArtifacts, proves };
}

function artifact(id, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const exists = fs.existsSync(absolutePath);
  const stat = exists ? fs.statSync(absolutePath) : null;
  let generatedAt = null;
  let summary = null;
  if (exists && relativePath.endsWith(".json")) {
    try {
      const json = readJson(absolutePath);
      generatedAt = json.generatedAt ?? json.checkedAt ?? null;
      summary = json.summary ?? json.totals ?? null;
    } catch {
      summary = { parseError: true };
    }
  }
  return {
    id,
    path: relativePath,
    exists,
    bytes: stat?.size ?? 0,
    modifiedAt: stat?.mtime?.toISOString?.() ?? null,
    generatedAt,
    staleDays: generatedAt ? daysSince(generatedAt) : null,
    summary
  };
}

function layerPosture(item, artifactMap) {
  const requiredArtifacts = item.requiredArtifacts.map((id) => artifactMap.get(id)).filter(Boolean);
  const blockers = [];
  const warnings = [];
  for (const required of requiredArtifacts) {
    if (!required.exists) blockers.push(finding("artifact.missing", `${required.path} is missing.`));
    if (required.exists && required.staleDays !== null && required.staleDays > 14) warnings.push(finding("artifact.stale", `${required.path} is ${required.staleDays} day(s) old.`));
  }
  if (item.id === "source-decomposition") {
    const source = readArtifact("sourceDecomposition");
    if ((source?.summary?.projectsNeedingDecomposition ?? 0) > 0) blockers.push(finding("source.projectsNeedDecomposition", `${source.summary.projectsNeedingDecomposition} project(s) still need source decomposition.`));
  }
  if (item.id === "dom-rendered") {
    const rendered = readArtifact("renderedCertification");
    if ((rendered?.summary?.blocked ?? 0) > 0) blockers.push(finding("rendered.blocked", `${rendered.summary.blocked} dashboard(s) are blocked in rendered certification.`));
    if ((rendered?.summary?.unreachable ?? 0) > 0) blockers.push(finding("rendered.unreachable", `${rendered.summary.unreachable} dashboard(s) are unreachable in rendered certification.`));
  }
  if (item.id === "promotion-gate") {
    const ship = readArtifact("shipCheck");
    if (ship && ship.safeToDeploy === false) blockers.push(finding("promotion.deployBlocked", `Fleet ship gate says safeToDeploy=${ship.safeToDeploy}.`));
    if (ship && ship.safeToCommit === false) blockers.push(finding("promotion.commitBlocked", `Fleet ship gate says safeToCommit=${ship.safeToCommit}.`));
  }
  const status = blockers.length ? "blocked" : warnings.length ? "needs-review" : "active";
  return {
    ...item,
    status,
    artifacts: requiredArtifacts.map((artifact) => artifact.id),
    blockers,
    warnings
  };
}

function projectPosture(dashboard) {
  const source = readArtifact("sourceDecomposition");
  const rendered = readArtifact("renderedCertification");
  const certification = readArtifact("certification");
  const preRepair = readArtifact("preRepairReadiness");
  const sourceProject = source?.projects?.find((item) => dashboardIdentityCandidates(dashboard).includes(normalizeProjectId(item.project)));
  const renderedItem = rendered?.items?.find((item) => item.id === dashboard.id);
  const certifiedProject = certification?.projects?.find((item) => dashboardIdentityCandidates(dashboard).includes(normalizeProjectId(item.project)) || item.dashboard === dashboard.id);
  const preRepairItem = preRepair?.items?.find((item) => item.id === dashboard.id);
  const blockers = [];
  const warnings = [];

  if (!sourceProject) blockers.push(finding("source.missing", "No source decomposition record exists for this dashboard."));
  if (sourceProject && sourceProject.verdict !== "source-certified") blockers.push(finding("source.notCertified", `Source verdict is ${sourceProject.verdict}.`));
  if (!renderedItem) blockers.push(finding("rendered.missing", "No rendered certification record exists for this dashboard."));
  if (renderedItem && renderedItem.verdict !== "certified") blockers.push(finding("rendered.notCertified", `Rendered verdict is ${renderedItem.verdict}.`));
  if (certifiedProject && certifiedProject.verdict === "blocked") blockers.push(finding("certification.blocked", "Base dashboard certification is blocked."));
  if (preRepairItem?.status === "blocked") warnings.push(finding("preRepair.blocked", "Pre-repair readiness is blocked, so visual repair cannot start cleanly."));
  if (dashboard.implementationMode === "package-native" && sourceProject?.verdict !== "source-certified") {
    blockers.push(finding("falseNativeRisk", "Dashboard declares package-native but source certification does not confirm package-native route implementation."));
  }
  if (renderedItem?.blockers?.some((item) => /titleStacked|sidebarGeometryInvalid|mainBelowFold/.test(item.code))) {
    blockers.push(finding("shell.geometryBroken", "Rendered shell geometry has a visible layout blocker."));
  }

  const status = blockers.length ? "blocked" : warnings.length ? "needs-review" : "enforcement-certified";
  return {
    id: dashboard.id,
    label: dashboard.label,
    projectPath: dashboard.projectPath,
    status,
    declaredMode: dashboard.implementationMode ?? "unknown",
    sourceVerdict: sourceProject?.verdict ?? "missing",
    renderedVerdict: renderedItem?.verdict ?? "missing",
    baseCertificationVerdict: certifiedProject?.verdict ?? "missing",
    preRepairStatus: preRepairItem?.status ?? "missing",
    blockers,
    warnings
  };
}

function dashboardIdentityCandidates(dashboard) {
  const candidates = new Set([
    dashboard.id,
    dashboard.id?.replace(/\.(dashboard|roc|ops|main|workspace)$/u, ""),
    dashboard.projectId,
    dashboard.project,
    dashboard.repo,
    dashboard.projectName,
    dashboard.projectPath ? path.basename(dashboard.projectPath) : null
  ].filter(Boolean).map(normalizeProjectId));
  const aliases = {
    "media-business-operations": "media-business-os",
    hermes: "hermes-os",
    "khashi-vc-roc": "khashi-vc",
    "investing-system-roc": "investing-system",
    "media-engine-ops": "media-engine",
    "business-mapper-workspace": "business-mapper",
    "nous-hermes-agent-dashboard": "nous-hermes-agent",
    "tlc-capital-group-os-main": "tlc-capital-group-os",
    "rinseables-os-main": "rinseables-os",
    "meal-assistant-main": "meal-assistant"
  };
  for (const candidate of [...candidates]) {
    if (aliases[candidate]) candidates.add(aliases[candidate]);
  }
  return [...candidates];
}

function normalizeProjectId(value) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildNextActions(layerFindings, projectFindings) {
  const actions = [];
  for (const layer of layerFindings.filter((item) => item.status === "blocked")) {
    actions.push({
      id: `repair-layer-${layer.id}`,
      priority: "P0",
      scope: "standards",
      title: `Repair blocked enforcement layer: ${layer.label}`,
      evidence: layer.blockers.map((item) => `${item.code}: ${item.message}`),
      command: "npm run dashboard:enforcement:stack"
    });
  }
  for (const project of projectFindings.filter((item) => item.status === "blocked")) {
    actions.push({
      id: `repair-project-${project.id}`,
      priority: "P0",
      scope: project.id,
      title: `Repair dashboard enforcement blockers for ${project.label}`,
      evidence: project.blockers.map((item) => `${item.code}: ${item.message}`),
      command: `npm run dashboard:certify:rendered -- --id ${project.id}`
    });
  }
  return actions;
}

function readArtifact(id) {
  const artifactInfo = artifactPaths[id];
  if (!artifactInfo) return null;
  const absolutePath = path.join(root, artifactInfo);
  if (!fs.existsSync(absolutePath) || !artifactInfo.endsWith(".json")) return null;
  try {
    return readJson(absolutePath);
  } catch {
    return null;
  }
}

function daysSince(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return Math.floor((Date.now() - time) / 86_400_000);
}

function finding(code, message) {
  return { code, message };
}

function renderMarkdown(report) {
  const layerRows = report.layers.map((layer) => [
    layer.id,
    layer.status,
    layer.artifacts.join("<br>"),
    layer.blockers.map((item) => item.code).join("<br>") || "none",
    layer.warnings.map((item) => item.code).join("<br>") || "none"
  ]);
  const projectRows = report.projects.map((project) => [
    project.id,
    project.status,
    project.sourceVerdict,
    project.renderedVerdict,
    project.baseCertificationVerdict,
    project.blockers.map((item) => item.code).join("<br>") || "none"
  ]);
  const artifactRows = report.artifacts.map((artifact) => [
    artifact.id,
    artifact.exists ? "yes" : "no",
    artifact.generatedAt ?? artifact.modifiedAt ?? "n/a",
    artifact.staleDays ?? "n/a",
    artifact.path
  ]);
  const actionRows = report.nextActions.map((action) => [
    action.priority,
    action.scope,
    action.title,
    action.command
  ]);
  return `# Dashboard Comprehensive Enforcement Stack

Generated: ${report.generatedAt}

${report.standard.purpose}

## Decision

- Active layers: ${report.summary.activeLayers}/${report.summary.layers}
- Blocked layers: ${report.summary.blockedLayers}
- Enforcement-certified projects: ${report.summary.certifiedProjects}/${report.summary.projects}
- Blocked projects: ${report.summary.blockedProjects}
- Total blockers: ${report.summary.blockers}
- Total warnings: ${report.summary.warnings}

## Commands

- Generate: \`${report.commands.generate}\`
- Strict: \`${report.commands.strict}\`
- Full certification: \`${report.commands.fullCertification}\`
- Strict certification: \`${report.commands.strictCertification}\`
- Ship gate: \`${report.commands.shipGate}\`

## Enforcement Layers

${markdownTable(["Layer", "Status", "Artifacts", "Blockers", "Warnings"], layerRows)}

## Project Posture

${markdownTable(["Project", "Status", "Source", "Rendered", "Base Cert", "Blockers"], projectRows)}

## Artifact Inventory

${markdownTable(["Artifact", "Exists", "Generated/Modified", "Stale Days", "Path"], artifactRows)}

## Next Actions

${actionRows.length ? markdownTable(["Priority", "Scope", "Action", "Command"], actionRows) : "No enforcement repair actions are currently required."}

## Promotion Rule

${report.standard.promotionRule}
`;
}
