#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "docs/design/dashboard-component-evidence-backlog.json",
  "docs/design/dashboard-component-certification-checklist.json",
  "docs/design/dashboard-visual-coverage-report.json",
  "docs/design/dashboard-visual-evidence-tasks.json",
  "docs/design/dashboard-promotion-history.json",
  "docs/design/dashboard-promotion-readiness.json",
  "docs/design/dashboard-route-a11y-matrix.json",
  "docs/design/dashboard-token-scan-report.json",
  "docs/design/dashboard-token-suppressions.json",
  "docs/design/dashboard-token-debt-backlog.json",
  "docs/design/dashboard-governance-refresh-report.json",
  "docs/design/dashboard-deployment-ledger.json",
  "docs/design/dashboard-kit-distribution-report.json",
  "docs/design/dashboard-runtime-data-report.json",
  "docs/design/generated-dashboard-route-evidence-bindings.json",
  "docs/design/generated-dashboard-route-maturity-ledger.json",
  "docs/design/dashboard-operational-maturity-packets.json",
  "docs/design/dashboard-live-source-gap-ledger.json",
  "docs/design/dashboard-command-governance-ledger.json",
  "docs/design/dashboard-action-unlock-ledger.json",
  "docs/fleet/dashboard-fully-operational-certification.json",
  "docs/fleet/dashboard-maturity-drift-monitor.json",
  "docs/design/dashboard-production-visual-gate.json",
  "docs/fleet/dashboard-executive-daily-operating-view.json",
  "docs/fleet/dashboard-operating-history-policy.json",
  "docs/fleet/dashboard-operating-history-ledger.json",
  "docs/fleet/dashboard-predictive-causal-intelligence.json",
  "docs/fleet/dashboard-governed-recovery-audit.json",
  "docs/design/project-status-ledger.json",
  "docs/design/dashboard-pr-artifacts/latest.json",
  "web/src/pages/dashboard-executive-daily-operating-data.ts",
  "web/src/pages/dashboard-maturity-data.ts"
];
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    issue("error", "Required maturity report is missing.", file);
    continue;
  }
  if (file.endsWith(".ts")) continue;
  const json = JSON.parse(fs.readFileSync(full, "utf8"));
  if (json.schemaVersion !== 1) issue("error", "Maturity report has invalid schemaVersion.", file);
  if (!json.generatedAt) issue("error", "Maturity report is missing generatedAt.", file);
}

if (!issues.some((item) => item.severity === "error")) {
  const componentBacklog = JSON.parse(fs.readFileSync(path.join(root, required[0]), "utf8"));
  const certification = JSON.parse(fs.readFileSync(path.join(root, required[1]), "utf8"));
  const visualCoverage = JSON.parse(fs.readFileSync(path.join(root, required[2]), "utf8"));
  const visualTasks = JSON.parse(fs.readFileSync(path.join(root, required[3]), "utf8"));
  const promotionHistory = JSON.parse(fs.readFileSync(path.join(root, required[4]), "utf8"));
  const readiness = JSON.parse(fs.readFileSync(path.join(root, required[5]), "utf8"));
  const a11yMatrix = JSON.parse(fs.readFileSync(path.join(root, required[6]), "utf8"));
  const tokenReport = JSON.parse(fs.readFileSync(path.join(root, required[7]), "utf8"));
  const tokenSuppressions = JSON.parse(fs.readFileSync(path.join(root, required[8]), "utf8"));
  const tokenDebt = JSON.parse(fs.readFileSync(path.join(root, required[9]), "utf8"));
  const governanceRefresh = JSON.parse(fs.readFileSync(path.join(root, required[10]), "utf8"));
  const deploymentLedger = JSON.parse(fs.readFileSync(path.join(root, required[11]), "utf8"));
  const kitDistribution = JSON.parse(fs.readFileSync(path.join(root, required[12]), "utf8"));
  const runtimeData = JSON.parse(fs.readFileSync(path.join(root, required[13]), "utf8"));
  const generatedRouteEvidence = JSON.parse(fs.readFileSync(path.join(root, required[14]), "utf8"));
  const generatedRouteMaturity = JSON.parse(fs.readFileSync(path.join(root, required[15]), "utf8"));
  const operationalMaturityPackets = JSON.parse(fs.readFileSync(path.join(root, required[16]), "utf8"));
  const liveSourceGapLedger = JSON.parse(fs.readFileSync(path.join(root, required[17]), "utf8"));
  const commandGovernanceLedger = JSON.parse(fs.readFileSync(path.join(root, required[18]), "utf8"));
  const actionUnlockLedger = JSON.parse(fs.readFileSync(path.join(root, required[19]), "utf8"));
  const fullyOperationalCertification = JSON.parse(fs.readFileSync(path.join(root, required[20]), "utf8"));
  const maturityDriftMonitor = JSON.parse(fs.readFileSync(path.join(root, required[21]), "utf8"));
  const productionVisualGate = JSON.parse(fs.readFileSync(path.join(root, required[22]), "utf8"));
  const executiveDailyOperatingView = JSON.parse(fs.readFileSync(path.join(root, required[23]), "utf8"));
  const operatingHistoryPolicy = JSON.parse(fs.readFileSync(path.join(root, required[24]), "utf8"));
  const operatingHistoryLedger = JSON.parse(fs.readFileSync(path.join(root, required[25]), "utf8"));
  const predictiveCausalIntelligence = JSON.parse(fs.readFileSync(path.join(root, required[26]), "utf8"));
  const governedRecoveryAudit = JSON.parse(fs.readFileSync(path.join(root, required[27]), "utf8"));
  const projectStatusLedger = JSON.parse(fs.readFileSync(path.join(root, required[28]), "utf8"));
  if (!Array.isArray(componentBacklog.items)) issue("error", "Component evidence backlog must include items.");
  if ((certification.itemCount ?? 0) < 1) issue("error", "Component certification checklist must include components.");
  if ((visualCoverage.dashboardCount ?? 0) < 1) issue("error", "Visual coverage report must include dashboards.");
  if (typeof visualCoverage.freshnessSlaDays !== "number") issue("error", "Visual coverage report must include freshnessSlaDays.");
  if (!Array.isArray(visualTasks.items)) issue("error", "Visual evidence tasks must include items.");
  if (!Array.isArray(promotionHistory.events)) issue("error", "Promotion history must include events.");
  if ((readiness.itemCount ?? 0) < 1) issue("error", "Promotion readiness report must include projects.");
  if ((a11yMatrix.routeCount ?? 0) < 1) issue("error", "Route a11y matrix must include routes.");
  if (tokenReport.advisory !== true) issue("error", "Full token scan report must be advisory.");
  if (!Array.isArray(tokenSuppressions.suppressions)) issue("error", "Token suppressions must include suppressions.");
  if (!Array.isArray(tokenDebt.items)) issue("error", "Token debt backlog must include items.");
  if ((governanceRefresh.checkedCount ?? 0) < 1) issue("error", "Governance refresh report must include checks.");
  if ((deploymentLedger.checkedCount ?? 0) < 1) issue("error", "Deployment ledger must include projects.");
  if ((kitDistribution.checkedCount ?? 0) < 1) issue("error", "Kit distribution report must include projects.");
  if ((runtimeData.checkedCount ?? 0) < 1) issue("error", "Runtime data report must include projects.");
  if ((generatedRouteEvidence.totals?.routeCount ?? 0) < 1) issue("error", "Generated route evidence bindings must include routes.");
  if ((generatedRouteEvidence.totals?.dataBoundCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must bind every route.");
  if ((generatedRouteEvidence.totals?.observabilityBoundCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must add observability to every route.");
  if ((generatedRouteEvidence.totals?.drillDownBoundCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must add drill-downs to every route.");
  if ((generatedRouteEvidence.totals?.stateCoveredCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must add state coverage to every route.");
  if ((generatedRouteEvidence.totals?.uxVisualReadyCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must add UX visual maturity to every route.");
  if ((generatedRouteEvidence.totals?.freshnessVisibleCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must expose freshness on every route.");
  if ((generatedRouteEvidence.totals?.infrastructureConnectedCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must connect infrastructure on every route.");
  if ((generatedRouteEvidence.totals?.runtimeAssetExternalizedCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must externalize runtime evidence payloads.");
  if ((generatedRouteEvidence.totals?.liveSourceContractedCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must declare live source contracts on every route.");
  if ((generatedRouteEvidence.totals?.regressionProofReadyCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must include regression proof on every route.");
  if ((generatedRouteEvidence.totals?.readOnlyCommandReadyCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must include read-only command readiness on every route.");
  if ((generatedRouteEvidence.totals?.commandControlReadyCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must include governed command-control readiness on every route.");
  if ((generatedRouteEvidence.totals?.productionReadyCount ?? 0) < (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Generated route evidence bindings must include production readiness on every route.");
  if (!generatedRouteEvidence.rollups?.priority || !generatedRouteEvidence.rollups?.family) issue("error", "Generated route evidence bindings must include priority and family rollups.");
  if ((generatedRouteMaturity.totals?.routeCount ?? 0) < 1) issue("error", "Generated route maturity ledger must include routes.");
  if ((generatedRouteMaturity.layers ?? []).length < 15) issue("error", "Generated route maturity ledger must include comprehensive layers.");
  if ((generatedRouteMaturity.entries ?? []).some((entry) => !entry.nextMaturityAction)) issue("error", "Generated route maturity entries must include nextMaturityAction.");
  if ((operationalMaturityPackets.totals?.routeCount ?? 0) !== (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Operational maturity packets must track every generated route.");
  if ((operationalMaturityPackets.policy?.requiredLayerCount ?? 0) !== 10) issue("error", "Operational maturity packets must define the ten-layer operator model.");
  if (operationalMaturityPackets.policy?.routeCertificationIsNotOperationalCertification !== true) issue("error", "Operational maturity packets must distinguish route certification from operational certification.");
  if ((operationalMaturityPackets.packets ?? []).some((packet) => (packet.layers ?? []).length !== 10)) issue("error", "Every operational maturity packet must include exactly ten layers.");
  if ((operationalMaturityPackets.packets ?? []).some((packet) => (packet.totals?.buildWorkCount ?? 0) < 30)) issue("error", "Every operational maturity packet must include at least 30 build-work items.");
  if ((operationalMaturityPackets.packets ?? []).some((packet) => (packet.totals?.testProofCount ?? 0) < 30)) issue("error", "Every operational maturity packet must include at least 30 test proof requirements.");
  if ((liveSourceGapLedger.totals?.routeCount ?? 0) !== (generatedRouteEvidence.totals?.routeCount ?? 0)) issue("error", "Live source gap ledger must track every generated route.");
  for (const field of ["sourceGapCount", "p0SourceGapCount", "p1SourceGapCount"]) {
    if (!Number.isFinite(liveSourceGapLedger.totals?.[field])) issue("error", "Live source gap ledger must expose numeric source-gap totals.");
  }
  if ((liveSourceGapLedger.totals?.blockedMutatingActionCount ?? 0) < 1) issue("error", "Live source gap ledger must expose blocked mutating actions.");
  if (commandGovernanceLedger.safePosture !== true) issue("error", "Command governance ledger must prove a safe command posture.");
  if ((commandGovernanceLedger.totals?.unsafeMutationCount ?? 0) !== 0) issue("error", "Command governance ledger must have zero unsafe enabled mutations.");
  if ((commandGovernanceLedger.totals?.mutatingBlockedCount ?? 0) !== (liveSourceGapLedger.totals?.blockedMutatingActionCount ?? 0)) issue("error", "Command governance blocked mutation count must match live-source gap ledger.");
  if (actionUnlockLedger.safeForFullyOperational !== true) issue("error", "Action unlock ledger must be safe for fully-operational certification.");
  if ((actionUnlockLedger.totals?.unknownActionCount ?? 1) !== 0) issue("error", "Action unlock ledger must have zero unknown actions.");
  if ((actionUnlockLedger.totals?.unsafeMutationCount ?? 1) !== 0) issue("error", "Action unlock ledger must have zero unsafe mutations.");
  if (fullyOperationalCertification.status !== "fully-operational-certified") issue("error", "Fully operational certification must pass.");
  if ((fullyOperationalCertification.summary?.failed ?? 1) !== 0) issue("error", "Fully operational certification must have zero failed checks.");
  if ((fullyOperationalCertification.score ?? 0) !== 100) issue("error", "Fully operational certification score must be 100.");
  if (maturityDriftMonitor.status !== "stable") issue("error", "Maturity drift monitor must be stable.");
  if ((maturityDriftMonitor.summary?.failed ?? 1) !== 0) issue("error", "Maturity drift monitor must have zero failed signals.");
  if ((maturityDriftMonitor.summary?.signalCount ?? 0) < 10) issue("error", "Maturity drift monitor must include the comprehensive operating signal set.");
  if (productionVisualGate.status !== "visual-gate-passed") issue("error", "Production visual gate must pass.");
  if ((productionVisualGate.summary?.failed ?? 1) !== 0) issue("error", "Production visual gate must have zero failed dashboards.");
  if ((productionVisualGate.summary?.dashboardCount ?? 0) < 1) issue("error", "Production visual gate must include dashboards.");
  if (!["clear", "needs-attention"].includes(executiveDailyOperatingView.status)) issue("error", "Executive daily operating view must include a valid status.");
  if ((executiveDailyOperatingView.summary?.dashboardCount ?? 0) < 1) issue("error", "Executive daily operating view must include dashboards.");
  if (!executiveDailyOperatingView.dataOperations) issue("error", "Executive daily operating view must include data operations maturity.");
  if (!["ready", "watch", "blocked", "missing", "unknown"].includes(executiveDailyOperatingView.summary?.dataOpsStatus)) issue("error", "Executive daily operating view must include valid data operations status.");
  if (!Number.isFinite(executiveDailyOperatingView.summary?.dataOpsScore)) issue("error", "Executive daily operating view must include numeric data operations score.");
  if (!Number.isFinite(executiveDailyOperatingView.summary?.dataOpsBlockedLayers)) issue("error", "Executive daily operating view must include numeric blocked data operations layer count.");
  if ((executiveDailyOperatingView.actionPosture?.unsafeMutations ?? 1) !== 0) issue("error", "Executive daily operating view must show zero unsafe mutations.");
  if ((executiveDailyOperatingView.actionPosture?.unknownActions ?? 1) !== 0) issue("error", "Executive daily operating view must show zero unknown actions.");
  if (operatingHistoryPolicy.status !== "inside-policy") issue("error", "Operating history policy must be inside-policy.");
  if ((operatingHistoryPolicy.objectives ?? []).length < 6) issue("error", "Operating history policy must include the core objectives.");
  if ((operatingHistoryPolicy.objectives ?? []).some((item) => item.status !== "inside-policy")) issue("error", "Operating history policy objectives must all be inside-policy.");
  if (!Array.isArray(operatingHistoryLedger.entries) || operatingHistoryLedger.entries.length < 1) issue("error", "Operating history ledger must include entries.");
  if (predictiveCausalIntelligence.status !== "low-risk") issue("error", "Predictive causal intelligence must be low-risk.");
  if ((predictiveCausalIntelligence.summary?.elevatedRisk ?? 1) !== 0) issue("error", "Predictive causal intelligence must have zero elevated forecasts.");
  if ((predictiveCausalIntelligence.summary?.causalPlaybookCount ?? 0) < 6) issue("error", "Predictive causal intelligence must include causal playbooks.");
  if (governedRecoveryAudit.status !== "recovery-ready") issue("error", "Governed recovery audit must be recovery-ready.");
  if ((governedRecoveryAudit.summary?.failedAuditChecks ?? 1) !== 0) issue("error", "Governed recovery audit must have zero failed checks.");
  if ((governedRecoveryAudit.summary?.blockedCount ?? 0) < 1) issue("error", "Governed recovery audit must keep destructive actions blocked.");
  if (!Array.isArray(projectStatusLedger.projects) || projectStatusLedger.projects.length < 1) issue("error", "Project status ledger must include projects.");
  if (!projectStatusLedger.crossProject) issue("error", "Project status ledger must include crossProject summary.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard maturity report validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
