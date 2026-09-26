#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root, readJson } from "./dashboard-report-utils.mjs";

const reportPath = path.join(root, "docs/fleet/dashboard-certification-report.json");
const repairPath = path.join(root, "docs/fleet/dashboard-certification-repair-packets.json");
const ledgerPath = path.join(root, "docs/fleet/dashboard-certification-attempt-ledger.json");
const standardPath = path.join(root, "docs/design/dashboard-certification-standard.md");
const renderedReportPath = path.join(root, "docs/design/rendered-fleet-certification/report.json");
const renderedRepairPath = path.join(root, "docs/design/rendered-fleet-certification/repair-packets.json");
const renderedStandardPath = path.join(root, "docs/design/rendered-fleet-certification-standard.md");
const routeInventoryPath = path.join(root, "docs/design/dashboard-canonical-route-inventory.json");
const baselineRegistryPath = path.join(root, "docs/design/dashboard-visual-baseline-reference-registry.json");
const preRepairReadinessPath = path.join(root, "docs/design/dashboard-pre-repair-readiness.json");
const sourceDecompositionPath = path.join(root, "docs/design/dashboard-source-decomposition-report.json");
const sourceRouteContractPath = path.join(root, "docs/design/dashboard-route-ownership-contract.json");
const sourceRepairPath = path.join(root, "docs/design/dashboard-source-decomposition-repair-packets.json");
const comprehensiveEnforcementPath = path.join(root, "docs/design/dashboard-comprehensive-enforcement-stack.json");
const comprehensiveEnforcementMdPath = path.join(root, "docs/design/dashboard-comprehensive-enforcement-stack.md");
const strict = process.argv.includes("--strict");
const issues = [];

for (const file of [reportPath, repairPath, ledgerPath, standardPath, renderedReportPath, renderedRepairPath, renderedStandardPath, routeInventoryPath, baselineRegistryPath, preRepairReadinessPath, sourceDecompositionPath, sourceRouteContractPath, sourceRepairPath, comprehensiveEnforcementPath, comprehensiveEnforcementMdPath]) {
  if (!fs.existsSync(file)) issue("error", "artifact.missing", `${path.relative(root, file)} is missing.`);
}

if (issues.some((item) => item.severity === "error")) finish();

const report = readJson(reportPath);
const repairs = readJson(repairPath);
const ledger = readJson(ledgerPath);
const rendered = readJson(renderedReportPath);
const renderedRepairs = readJson(renderedRepairPath);
const routeInventory = readJson(routeInventoryPath);
const baselineRegistry = readJson(baselineRegistryPath);
const preRepairReadiness = readJson(preRepairReadinessPath);
const sourceDecomposition = readJson(sourceDecompositionPath);
const sourceRouteContract = readJson(sourceRouteContractPath);
const sourceRepairs = readJson(sourceRepairPath);
const comprehensiveEnforcement = readJson(comprehensiveEnforcementPath);
const standard = fs.readFileSync(standardPath, "utf8");
const renderedStandard = fs.readFileSync(renderedStandardPath, "utf8");

if (report.schemaVersion !== 1) issue("error", "report.schemaVersion", "Certification report schemaVersion must be 1.");
if (!Array.isArray(report.standard?.layers) || report.standard.layers.length < 20) {
  issue("error", "report.layers", "Certification report must include the full 20-layer certification model.");
}
if (!Array.isArray(report.standard?.promotionStateMachine) || report.standard.promotionStateMachine.length < 10) {
  issue("error", "report.stateMachine", "Certification report must include promotion state machine.");
}
if (!Array.isArray(report.projects) || report.projects.length === 0) {
  issue("error", "report.projects", "Certification report must include projects.");
}

const projectIds = new Set();
for (const project of report.projects ?? []) {
  if (!project.project) issue("error", "project.id", "Every certification project must include an id.");
  projectIds.add(project.project);
  if (!["certified", "needs-review", "blocked"].includes(project.verdict)) {
    issue("error", `project.${project.project}.verdict`, `${project.project} has invalid verdict ${project.verdict}.`);
  }
  if (!Array.isArray(project.blockers)) issue("error", `project.${project.project}.blockers`, `${project.project} blockers must be an array.`);
  if (!Array.isArray(project.warnings)) issue("error", `project.${project.project}.warnings`, `${project.project} warnings must be an array.`);
  if (!project.repairPacket?.id) issue("error", `project.${project.project}.repairPacket`, `${project.project} must include a repair packet reference.`);
  if (project.verdict === "blocked" && !project.repairPacket.actions?.length) {
    issue("error", `project.${project.project}.repairActions`, `${project.project} is blocked but has no repair actions.`);
  }
  if (project.declared?.targetExperienceBand === "T3C" && project.falseNativeClaim && project.verdict !== "blocked") {
    issue("error", `project.${project.project}.falseNativeVerdict`, `${project.project} has a false-native claim but was not blocked.`);
  }
}

if (repairs.schemaVersion !== 1) issue("error", "repairs.schemaVersion", "Repair packet schemaVersion must be 1.");
for (const packet of repairs.packets ?? []) {
  if (!projectIds.has(packet.project)) issue("error", `repair.${packet.id}.project`, `${packet.id} references unknown project ${packet.project}.`);
  if (!Array.isArray(packet.actions) || packet.actions.length === 0) {
    issue("error", `repair.${packet.id}.actions`, `${packet.id} must include repair actions.`);
  }
  if (!packet.rerun?.includes("dashboard:certify")) {
    issue("error", `repair.${packet.id}.rerun`, `${packet.id} must include certification rerun command.`);
  }
}

if (ledger.schemaVersion !== 1) issue("error", "ledger.schemaVersion", "Attempt ledger schemaVersion must be 1.");
if ((ledger.attempts ?? []).length !== (report.projects ?? []).length) {
  issue("error", "ledger.attempts", "Attempt ledger must include one entry per certified project.");
}
for (const attempt of ledger.attempts ?? []) {
  if (!projectIds.has(attempt.project)) issue("error", `ledger.${attempt.project}.project`, `Ledger references unknown project ${attempt.project}.`);
  if (!["preflight", "repair-needed", "certified"].includes(attempt.state)) {
    issue("error", `ledger.${attempt.project}.state`, `${attempt.project} has invalid promotion state ${attempt.state}.`);
  }
}

if (rendered.schemaVersion !== 1) issue("error", "rendered.schemaVersion", "Rendered certification report schemaVersion must be 1.");
if (!Array.isArray(rendered.items) || rendered.items.length === 0) {
  issue("error", "rendered.items", "Rendered certification report must include dashboard items.");
}
if (!rendered.standard?.blockingRules?.includes("hidden data-hdk/data-component markers used as compliance evidence")) {
  issue("error", "rendered.hiddenMarkerRule", "Rendered certification must block hidden compliance markers.");
}
for (const item of rendered.items ?? []) {
  if (!item.id) issue("error", "rendered.item.id", "Every rendered certification item must include an id.");
  if (!["certified", "needs-review", "blocked", "unreachable"].includes(item.verdict)) {
    issue("error", `rendered.${item.id}.verdict`, `${item.id} has invalid rendered verdict ${item.verdict}.`);
  }
  if (item.verdict !== "unreachable" && !Array.isArray(item.captures)) {
    issue("error", `rendered.${item.id}.captures`, `${item.id} must include rendered captures.`);
  }
  if (item.verdict !== "unreachable" && !Array.isArray(item.routeInventory)) {
    issue("error", `rendered.${item.id}.routeInventory`, `${item.id} must include rendered route inventory.`);
  }
  for (const capture of item.captures ?? []) {
    if (capture.audit && !capture.interaction) {
      issue("error", `rendered.${item.id}.${capture.viewport}.interaction`, `${item.id} ${capture.viewport} capture must include interaction inventory.`);
    }
    if (capture.audit && !capture.componentCoverage) {
      issue("error", `rendered.${item.id}.${capture.viewport}.componentCoverage`, `${item.id} ${capture.viewport} capture must include component coverage.`);
    }
  }
  if (item.verdict === "certified" && item.blockers?.length) {
    issue("error", `rendered.${item.id}.certifiedWithBlockers`, `${item.id} cannot be certified with rendered blockers.`);
  }
}

if (routeInventory.schemaVersion !== 1) issue("error", "routeInventory.schemaVersion", "Canonical route inventory schemaVersion must be 1.");
if (!Array.isArray(routeInventory.items) || routeInventory.items.length === 0) {
  issue("error", "routeInventory.items", "Canonical route inventory must include dashboard items.");
}
for (const item of routeInventory.items ?? []) {
  if (!item.id) issue("error", "routeInventory.item.id", "Every route inventory item must include an id.");
  if (!item.canonicalRoute) issue("error", `routeInventory.${item.id}.canonicalRoute`, `${item.id} must include a canonical route.`);
  if (!Array.isArray(item.priorityRoutes) || item.priorityRoutes.length === 0) {
    issue("error", `routeInventory.${item.id}.priorityRoutes`, `${item.id} must include priority routes.`);
  }
  if (!item.auth?.passwordEnv) issue("error", `routeInventory.${item.id}.auth`, `${item.id} must include an auth/password proof contract.`);
}

if (baselineRegistry.schemaVersion !== 1) issue("error", "baselineRegistry.schemaVersion", "Visual baseline registry schemaVersion must be 1.");
if (!Array.isArray(baselineRegistry.families) || baselineRegistry.families.length < 8) {
  issue("error", "baselineRegistry.families", "Visual baseline registry must include the required baseline families.");
}
for (const requiredFamily of ["shell-sidebar", "workspace-density", "tables", "charts", "auth-session", "sidecars-drawers", "state-feedback", "proof-strip"]) {
  if (!baselineRegistry.families?.some((family) => family.id === requiredFamily)) {
    issue("error", `baselineRegistry.${requiredFamily}`, `Visual baseline registry must include ${requiredFamily}.`);
  }
}

if (preRepairReadiness.schemaVersion !== 1) issue("error", "preRepairReadiness.schemaVersion", "Pre-repair readiness schemaVersion must be 1.");
if (!Array.isArray(preRepairReadiness.items) || preRepairReadiness.items.length === 0) {
  issue("error", "preRepairReadiness.items", "Pre-repair readiness must include dashboard items.");
}
for (const item of preRepairReadiness.items ?? []) {
  if (!["ready", "blocked"].includes(item.status)) {
    issue("error", `preRepairReadiness.${item.id}.status`, `${item.id} has invalid pre-repair status ${item.status}.`);
  }
  if (!Array.isArray(item.blockers) || !Array.isArray(item.warnings)) {
    issue("error", `preRepairReadiness.${item.id}.issues`, `${item.id} must include blockers and warnings arrays.`);
  }
}

if (renderedRepairs.schemaVersion !== 1) issue("error", "renderedRepairs.schemaVersion", "Rendered repair packets schemaVersion must be 1.");
if (!Array.isArray(renderedRepairs.packets)) issue("error", "renderedRepairs.packets", "Rendered repair packets must include packets.");
const renderedIds = new Set((rendered.items ?? []).map((item) => item.id));
for (const packet of renderedRepairs.packets ?? []) {
  if (!renderedIds.has(packet.dashboard)) issue("error", `renderedRepair.${packet.id}.dashboard`, `${packet.id} references an unknown rendered dashboard.`);
  if (!Array.isArray(packet.actions) || packet.actions.length === 0) {
    issue("error", `renderedRepair.${packet.id}.actions`, `${packet.id} must include repair actions.`);
  }
  if (!Array.isArray(packet.verification) || !packet.verification.some((step) => String(step).includes("dashboard:certify:rendered"))) {
    issue("error", `renderedRepair.${packet.id}.verification`, `${packet.id} must include rendered certification rerun command.`);
  }
}

if (sourceDecomposition.schemaVersion !== 1) issue("error", "sourceDecomposition.schemaVersion", "Source decomposition report schemaVersion must be 1.");
if (!Array.isArray(sourceDecomposition.standard?.requiredFamilies) || sourceDecomposition.standard.requiredFamilies.length < 9) {
  issue("error", "sourceDecomposition.requiredFamilies", "Source decomposition report must include required component families.");
}
if (!Array.isArray(sourceDecomposition.projects) || sourceDecomposition.projects.length === 0) {
  issue("error", "sourceDecomposition.projects", "Source decomposition report must include projects.");
}
const sourceProjectIds = new Set();
for (const project of sourceDecomposition.projects ?? []) {
  sourceProjectIds.add(project.project);
  if (!["source-certified", "source-review", "needs-source-decomposition"].includes(project.verdict)) {
    issue("error", `sourceDecomposition.${project.project}.verdict`, `${project.project} has invalid source decomposition verdict ${project.verdict}.`);
  }
  if (!Array.isArray(project.surfaces) || project.surfaces.length === 0) {
    issue("error", `sourceDecomposition.${project.project}.surfaces`, `${project.project} must include source surfaces.`);
  }
  for (const surface of project.surfaces ?? []) {
    if (!surface.id || !surface.path) issue("error", `sourceDecomposition.${project.project}.surface`, `${project.project} has a source surface missing id/path.`);
    if (!surface.sourceNativeLevel) issue("error", `sourceDecomposition.${project.project}.${surface.id}.level`, `${surface.id} must include sourceNativeLevel.`);
    if (!Array.isArray(surface.missingFamilies)) issue("error", `sourceDecomposition.${project.project}.${surface.id}.missingFamilies`, `${surface.id} must include missingFamilies.`);
    if (!surface.nextMigrationLayer) issue("error", `sourceDecomposition.${project.project}.${surface.id}.nextMigrationLayer`, `${surface.id} must include nextMigrationLayer.`);
  }
}

if (sourceRouteContract.schemaVersion !== 1) issue("error", "sourceRouteContract.schemaVersion", "Route ownership contract schemaVersion must be 1.");
if (!Array.isArray(sourceRouteContract.routes) || sourceRouteContract.routes.length === 0) {
  issue("error", "sourceRouteContract.routes", "Route ownership contract must include routes.");
}
for (const route of sourceRouteContract.routes ?? []) {
  if (!sourceProjectIds.has(route.project)) issue("error", `sourceRouteContract.${route.project}.${route.surface}`, `Route contract references unknown project ${route.project}.`);
  if (!route.path || !route.sourceNativeLevel || !route.allowedRendering) {
    issue("error", `sourceRouteContract.${route.project}.${route.surface}.fields`, `${route.project}/${route.surface} route contract is incomplete.`);
  }
}

if (sourceRepairs.schemaVersion !== 1) issue("error", "sourceRepairs.schemaVersion", "Source repair packets schemaVersion must be 1.");
if (!Array.isArray(sourceRepairs.packets)) issue("error", "sourceRepairs.packets", "Source repair packets must include packets.");
for (const packet of sourceRepairs.packets ?? []) {
  if (!sourceProjectIds.has(packet.project)) issue("error", `sourceRepair.${packet.id}.project`, `${packet.id} references unknown project ${packet.project}.`);
  if (!["P0", "P1", "P2"].includes(packet.priority)) issue("error", `sourceRepair.${packet.id}.priority`, `${packet.id} has invalid priority ${packet.priority}.`);
  if (!Array.isArray(packet.actions) || packet.actions.length === 0) {
    issue("error", `sourceRepair.${packet.id}.actions`, `${packet.id} must include source repair actions.`);
  }
  if (!Array.isArray(packet.verification) || !packet.verification.some((step) => String(step).includes("dashboard:source-decomposition"))) {
    issue("error", `sourceRepair.${packet.id}.verification`, `${packet.id} must include source decomposition verification.`);
  }
}

if (comprehensiveEnforcement.schemaVersion !== 1) issue("error", "comprehensiveEnforcement.schemaVersion", "Comprehensive enforcement stack schemaVersion must be 1.");
if (!Array.isArray(comprehensiveEnforcement.layers) || comprehensiveEnforcement.layers.length < 10) {
  issue("error", "comprehensiveEnforcement.layers", "Comprehensive enforcement stack must include all enforcement layers.");
}
for (const requiredLayer of ["fleet-registry", "route-manifest", "source-decomposition", "dom-rendered", "visual-baselines", "workflow-interaction", "data-state", "production-drift", "exception-ledger", "promotion-gate"]) {
  if (!comprehensiveEnforcement.layers?.some((layer) => layer.id === requiredLayer)) {
    issue("error", `comprehensiveEnforcement.${requiredLayer}`, `Comprehensive enforcement stack must include ${requiredLayer}.`);
  }
}
if (!Array.isArray(comprehensiveEnforcement.projects) || comprehensiveEnforcement.projects.length === 0) {
  issue("error", "comprehensiveEnforcement.projects", "Comprehensive enforcement stack must include project posture.");
}
if (!comprehensiveEnforcement.standard?.promotionRule?.includes("Marker strings and package dependencies alone never certify a route")) {
  issue("error", "comprehensiveEnforcement.promotionRule", "Comprehensive enforcement stack must explicitly reject marker/dependency-only certification.");
}

for (const required of [
  "Tool-Agnostic Rule",
  "Required Flow",
  "Blocking Rules",
  "Hidden `data-hdk-component`",
  "commit/deploy only after certification"
]) {
  if (!standard.includes(required)) issue("error", `standard.${required}`, `Certification standard must mention ${required}.`);
}

for (const required of [
  "HDK adoption is no longer satisfied by a dependency",
  "Run rendered browser certification",
  "Hidden `data-hdk-component`",
  "A dashboard is not certified until both source certification and rendered certification pass",
  "route inventory",
  "interaction inventory",
  "repair packets"
]) {
  if (!renderedStandard.includes(required)) issue("error", `renderedStandard.${required}`, `Rendered certification standard must mention ${required}.`);
}

for (const required of [
  "pre-repair readiness",
  "canonical route inventory",
  "visual baseline reference registry",
  "component coverage"
]) {
  if (!renderedStandard.includes(required)) issue("error", `renderedStandard.${required}`, `Rendered certification standard must mention ${required}.`);
}

finish();

function issue(severity, code, message) {
  issues.push({ severity, code, message });
}

function finish() {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`Dashboard certification artifact validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
  for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  if (errors.length || (strict && warnings.length)) process.exit(1);
}
