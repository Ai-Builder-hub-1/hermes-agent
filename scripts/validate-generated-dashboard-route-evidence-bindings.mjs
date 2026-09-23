#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "docs/design/generated-dashboard-route-evidence-bindings.json");
const webDataPath = path.join(root, "web/src/pages/generated-dashboard-route-evidence-bindings-data.ts");
const webRuntimeJsonPath = path.join(root, "web/src/pages/generated-dashboard-route-evidence-bindings.runtime.json");
const maturityPath = path.join(root, "docs/design/generated-dashboard-route-maturity-ledger.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(reportPath)) issue("error", "Generated route evidence binding report is missing.", "docs/design/generated-dashboard-route-evidence-bindings.json");
if (!fs.existsSync(webDataPath)) issue("error", "Generated route evidence binding web data is missing.", "web/src/pages/generated-dashboard-route-evidence-bindings-data.ts");
if (!fs.existsSync(webRuntimeJsonPath)) issue("error", "Generated route evidence binding runtime asset is missing.", "web/src/pages/generated-dashboard-route-evidence-bindings.runtime.json");
if (!fs.existsSync(maturityPath)) issue("error", "Generated route maturity ledger is missing.", "docs/design/generated-dashboard-route-maturity-ledger.json");

if (!issues.some((item) => item.severity === "error")) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const maturity = JSON.parse(fs.readFileSync(maturityPath, "utf8"));
  const webData = fs.readFileSync(webDataPath, "utf8");
  const runtimeAsset = JSON.parse(fs.readFileSync(webRuntimeJsonPath, "utf8"));
  const routeCount = maturity.totals?.routeCount ?? 0;

  if (report.schemaVersion !== 1) issue("error", "Generated route evidence binding report has invalid schemaVersion.");
  if (!report.generatedAt) issue("error", "Generated route evidence binding report is missing generatedAt.");
  if (!report.policy?.generatedEvidenceDataCountsForDataBinding) issue("error", "Generated route evidence binding policy must declare generated evidence data binding.");
  if (!report.policy?.observabilityRequiresOperationalEvidence) issue("error", "Generated route evidence binding policy must require operational evidence.");
  if (!report.policy?.drillDownRequiresEvidenceTargets) issue("error", "Generated route evidence binding policy must require drill-down evidence targets.");
  if (typeof report.policy?.freshnessSlaDays !== "number") issue("error", "Generated route evidence binding policy must include freshnessSlaDays.");
  if (!report.policy?.routeEvidenceShipsAsRuntimeAsset) issue("error", "Generated route evidence binding policy must require runtime asset shipping.");
  if (!report.policy?.generatedPageBundleMustNotEmbedFullEvidenceLedger) issue("error", "Generated route evidence binding policy must prohibit embedding the full evidence ledger in the generated page bundle.");
  if (!report.policy?.liveSourceContractsRequiredBeforeBespokeComponents) issue("error", "Generated route evidence binding policy must require live source contracts before bespoke components.");
  if (!report.policy?.regressionProofRequiredBeforeProductionReadiness) issue("error", "Generated route evidence binding policy must require regression proof before production readiness.");
  if (!report.policy?.commandExecutionRequiresSeparateAuthorization) issue("error", "Generated route evidence binding policy must keep command execution separately authorized.");
  if ((report.routeBindings ?? []).length !== routeCount) issue("error", "Generated route evidence binding count must match maturity route count.", `${report.routeBindings?.length ?? 0} bindings vs ${routeCount} routes`);
  if ((runtimeAsset.routeBindings ?? []).length !== routeCount) issue("error", "Generated route evidence runtime asset count must match maturity route count.", `${runtimeAsset.routeBindings?.length ?? 0} bindings vs ${routeCount} routes`);
  if ((report.totals?.dataBoundCount ?? 0) < routeCount) issue("error", "Every generated route must be evidence data-bound.", `${report.totals?.dataBoundCount ?? 0}/${routeCount}`);
  if ((report.totals?.observabilityBoundCount ?? 0) < routeCount) issue("error", "Every generated route must have operational observability bindings for the 43-to-53 band.", `${report.totals?.observabilityBoundCount ?? 0}/${routeCount}`);
  if ((report.totals?.drillDownBoundCount ?? 0) < routeCount) issue("error", "Every generated route must have evidence drill-down bindings for the 43-to-53 band.", `${report.totals?.drillDownBoundCount ?? 0}/${routeCount}`);
  if ((report.totals?.stateCoveredCount ?? 0) < routeCount) issue("error", "Every generated route must have state coverage for the 53-to-63 band.", `${report.totals?.stateCoveredCount ?? 0}/${routeCount}`);
  if ((report.totals?.uxVisualReadyCount ?? 0) < routeCount) issue("error", "Every generated route must have UX visual maturity for the 53-to-63 band.", `${report.totals?.uxVisualReadyCount ?? 0}/${routeCount}`);
  if ((report.totals?.freshnessVisibleCount ?? 0) < routeCount) issue("error", "Every generated route must expose freshness for the 63-to-75 band.", `${report.totals?.freshnessVisibleCount ?? 0}/${routeCount}`);
  if ((report.totals?.infrastructureConnectedCount ?? 0) < routeCount) issue("error", "Every generated route must expose infrastructure connections for the 63-to-75 band.", `${report.totals?.infrastructureConnectedCount ?? 0}/${routeCount}`);
  if ((report.totals?.runtimeAssetExternalizedCount ?? 0) < routeCount) issue("error", "Every generated route must externalize generated evidence payload for the 63-to-75 band.", `${report.totals?.runtimeAssetExternalizedCount ?? 0}/${routeCount}`);
  if ((report.totals?.liveSourceContractedCount ?? 0) < routeCount) issue("error", "Every generated route must declare live source contracts for the 80-to-87 band.", `${report.totals?.liveSourceContractedCount ?? 0}/${routeCount}`);
  if ((report.totals?.regressionProofReadyCount ?? 0) < routeCount) issue("error", "Every generated route must include regression proof for the 80-to-87 band.", `${report.totals?.regressionProofReadyCount ?? 0}/${routeCount}`);
  if ((report.totals?.readOnlyCommandReadyCount ?? 0) < routeCount) issue("error", "Every generated route must include read-only command readiness.", `${report.totals?.readOnlyCommandReadyCount ?? 0}/${routeCount}`);
  if (!report.rollups?.priority || !report.rollups?.family) issue("error", "Generated route evidence binding report must include priority and family rollups.");
  for (const binding of report.routeBindings ?? []) {
    if (!binding.route || !binding.title || !binding.priority || !binding.family) issue("error", "Route evidence binding is missing identity fields.", binding.exportName);
    if (binding.dataBindingStatus !== "bound") issue("error", "Route evidence binding must be bound.", binding.route);
    if (binding.observabilityStatus !== "bound") issue("error", "Route observability binding must be bound.", binding.route);
    if (binding.drillDownStatus !== "bound") issue("error", "Route drill-down binding must be bound.", binding.route);
    if (!binding.operationalStatus) issue("error", "Route evidence binding must include operationalStatus.", binding.route);
    if (!binding.nextOperationalAction) issue("error", "Route evidence binding must include nextOperationalAction.", binding.route);
    if (!binding.freshnessPolicy || typeof binding.freshnessPolicy.slaDays !== "number") issue("error", "Route evidence binding must include freshnessPolicy.", binding.route);
    if (!Array.isArray(binding.staleReasons)) issue("error", "Route evidence binding must include staleReasons.", binding.route);
    if (!Array.isArray(binding.operationalCategories) || binding.operationalCategories.length < 5) issue("error", "Route evidence binding must include operationalCategories.", binding.route);
    if (binding.stateCoverage?.status !== "covered") issue("error", "Route evidence binding must include covered stateCoverage.", binding.route);
    if (!Array.isArray(binding.stateCoverage?.stateFixtures) || binding.stateCoverage.stateFixtures.length < 10) issue("error", "Route stateCoverage must include core state fixtures.", binding.route);
    if (binding.uxVisualMaturity?.status !== "ready") issue("error", "Route evidence binding must include ready uxVisualMaturity.", binding.route);
    if (!Array.isArray(binding.uxVisualMaturity?.reviewChecklist) || binding.uxVisualMaturity.reviewChecklist.length < 6) issue("error", "Route uxVisualMaturity must include a review checklist.", binding.route);
    if (binding.freshnessSummary?.status !== "visible") issue("error", "Route evidence binding must expose freshnessSummary.", binding.route);
    if (!Array.isArray(binding.freshnessSummary?.visibleFields) || binding.freshnessSummary.visibleFields.length < 5) issue("error", "Route freshnessSummary must include visible fields.", binding.route);
    if (binding.infrastructureConnections?.status !== "connected") issue("error", "Route evidence binding must include connected infrastructureConnections.", binding.route);
    if (!Array.isArray(binding.infrastructureConnections?.connections) || binding.infrastructureConnections.connections.length < 5) issue("error", "Route infrastructureConnections must include core relationships.", binding.route);
    if (binding.payloadMaturity?.status !== "externalized") issue("error", "Route evidence binding must externalize generated payload maturity.", binding.route);
    if (binding.payloadMaturity?.strategy !== "runtime-json-asset") issue("error", "Route payloadMaturity must use runtime-json-asset strategy.", binding.route);
    if (binding.liveSourceContracts?.status !== "contracted") issue("error", "Route evidence binding must include contracted liveSourceContracts.", binding.route);
    if (!Array.isArray(binding.liveSourceContracts?.sourceContracts) || binding.liveSourceContracts.sourceContracts.length < 5) issue("error", "Route liveSourceContracts must include core source contracts.", binding.route);
    if (!Array.isArray(binding.liveSourceContracts?.liveProbeExpectations) || binding.liveSourceContracts.liveProbeExpectations.length < 5) issue("error", "Route liveSourceContracts must include live probe expectations.", binding.route);
    if (binding.regressionProof?.status !== "ready") issue("error", "Route evidence binding must include ready regressionProof.", binding.route);
    if (!Array.isArray(binding.regressionProof?.proofChecks) || binding.regressionProof.proofChecks.length < 7) issue("error", "Route regressionProof must include proof checks.", binding.route);
    if (binding.commandReadiness?.status !== "read-only-ready") issue("error", "Route evidence binding must include read-only commandReadiness.", binding.route);
    if (!Array.isArray(binding.commandReadiness?.readOnlyActions) || binding.commandReadiness.readOnlyActions.length < 5) issue("error", "Route commandReadiness must include read-only actions.", binding.route);
    if (!Array.isArray(binding.commandReadiness?.gatedActions) || binding.commandReadiness.gatedActions.length < 5) issue("error", "Route commandReadiness must include gated actions.", binding.route);
    if (!Array.isArray(binding.sourceBindings) || binding.sourceBindings.filter((source) => source.status !== "missing").length < 5) issue("error", "Route evidence binding must include at least five available sources.", binding.route);
    if (!Array.isArray(binding.dataSignals) || binding.dataSignals.length < 5) issue("error", "Route evidence binding must include data signals.", binding.route);
    if (!Array.isArray(binding.drillDownTargets) || binding.drillDownTargets.length < 5) issue("error", "Route evidence binding must include drill-down targets.", binding.route);
  }
  if (!webData.includes("loadGeneratedDashboardRouteEvidenceBindings")) issue("error", "Generated route evidence web data must export loadGeneratedDashboardRouteEvidenceBindings.");
  if (!webData.includes("generated-dashboard-route-evidence-bindings.runtime.json")) issue("error", "Generated route evidence web data must reference the runtime JSON asset.");
  if (webData.includes('"routeBindings": [')) issue("error", "Generated route evidence web data must not embed the full routeBindings ledger.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Generated dashboard route evidence binding validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
