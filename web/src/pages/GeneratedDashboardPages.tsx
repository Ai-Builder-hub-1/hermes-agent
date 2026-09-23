import { useEffect, useMemo, useState } from "react";
import { dashboardGovernanceDefaults, dashboardPageMetadata } from "@/dashboard-page-metadata";
import {
  loadGeneratedDashboardRouteEvidenceBindings,
  type GeneratedDashboardRouteEvidenceBinding,
  type GeneratedDashboardRouteEvidenceBindingsReport,
} from "./generated-dashboard-route-evidence-bindings-data";
import {
  loadGeneratedDashboardRouteMaturity,
  type GeneratedDashboardRouteMaturityEntry,
  type GeneratedDashboardRouteMaturityReport,
} from "./generated-dashboard-route-maturity-data";

type GovernanceFamily =
  | "Executive"
  | "Design System"
  | "Operations"
  | "Agents"
  | "Data"
  | "Security"
  | "Finance"
  | "Learning"
  | "Deployment"
  | "Adapters";

interface GeneratedPageSpec {
  exportName: string;
  route: string;
  title: string;
  family: GovernanceFamily;
  purpose: string;
  priority: "P0" | "P1" | "P2" | "P3";
  widgets: string[];
  proofFocus: string;
  nextAction: string;
}

const generatedPageRows: Array<[string, string, string]> = [
  ["HermesOsPage", "/hermes-os", "Hermes OS"],
  ["DesignSystemPage", "/design-system", "Design System"],
  ["DesignIntelligenceCommandCenterPage", "/design-intelligence", "Design Intelligence Command Center"],
  ["PackageNativeMigrationsPage", "/dashboard-migrations", "Package Native Migrations"],
  ["ExecutiveSummaryPage", "/executive-summary", "Executive Summary"],
  ["ExecutiveBriefingRoomPage", "/executive-briefing", "Executive Briefing Room"],
  ["CentralCommandPage", "/central-command", "Central Command"],
  ["ThemeSystemPage", "/theme-system", "Theme System"],
  ["DashboardMarketplacePage", "/dashboard-marketplace", "Dashboard Marketplace"],
  ["DashboardPrototypeLabPage", "/dashboard-prototypes", "Dashboard Prototype Lab"],
  ["MainHermesAgentDashboardPrototypePage", "/hermes-command", "Hermes Command"],
  ["LiveSignalsPage", "/live-signals", "Live Signals"],
  ["TaskRoutingPage", "/task-routing", "Task Routing"],
  ["DecisionLedgerPage", "/decision-ledger", "Decision Ledger"],
  ["ModelRoutingPage", "/model-routing", "Model Routing"],
  ["OperatingLoopsPage", "/operating-loops", "Operating Loops"],
  ["PermissionSecurityPage", "/permission-security", "Permission Security"],
  ["BusinessOSPage", "/business-os", "Business OS"],
  ["ProjectSnapshotsPage", "/project-snapshots", "Project Snapshots"],
  ["DurableMemoryPage", "/durable-memory", "Durable Memory"],
  ["PermissionRuntimePage", "/permission-runtime", "Permission Runtime"],
  ["CostGovernorPage", "/cost-governor", "Cost Governor"],
  ["LoopRunnerPage", "/loop-runner", "Loop Runner"],
  ["BusinessCommandPage", "/business-command", "Business Command"],
  ["AgentWorkbenchPage", "/agent-workbench", "Agent Workbench"],
  ["EvaluationGatesPage", "/evaluation-gates", "Evaluation Gates"],
  ["AutonomyReadinessPage", "/autonomy-readiness", "Autonomy Readiness"],
  ["ProjectRegistryPage", "/project-registry", "Project Registry"],
  ["ProjectPlanCommandCenterPage", "/project-plan-command", "Project Plan Command Center"],
  ["TelemetryFabricPage", "/telemetry-fabric", "Telemetry Fabric"],
  ["IncidentCommandPage", "/incident-command", "Incident Command"],
  ["DeploymentPromotionPage", "/deployment-promotion", "Deployment Promotion"],
  ["SecretsPosturePage", "/secrets-posture", "Secrets Posture"],
  ["DataSourceCatalogPage", "/data-source-catalog", "Data Source Catalog"],
  ["FinanceAttributionPage", "/finance-attribution", "Finance Attribution"],
  ["LearningEnginePage", "/learning-engine", "Learning Engine"],
  ["AgentEvalLabPage", "/agent-eval-lab", "Agent Eval Lab"],
  ["ExecutiveCockpitPage", "/executive-cockpit", "Executive Cockpit"],
  ["ProductionVerificationPage", "/production-verification", "Production Verification"],
  ["CommandGateRuntimePage", "/command-gate-runtime", "Command Gate Runtime"],
  ["TelemetryAdapterKitPage", "/telemetry-adapter-kit", "Telemetry Adapter Kit"],
  ["IncidentIngestionPage", "/incident-ingestion", "Incident Ingestion"],
  ["PromotionRunnerPage", "/promotion-runner", "Promotion Runner"],
  ["SecretScannerPage", "/secret-scanner", "Secret Scanner"],
  ["CostAttributionEnginePage", "/cost-attribution-engine", "Cost Attribution Engine"],
  ["LearningIngestionPage", "/learning-ingestion", "Learning Ingestion"],
  ["ModelEvalHarnessPage", "/model-eval-harness", "Model Eval Harness"],
  ["CircuitBreakersPage", "/circuit-breakers", "Circuit Breakers"],
  ["ProductionSweepPage", "/production-sweep", "Production Sweep"],
  ["HetznerPromotionExecutionPage", "/hetzner-promotion-execution", "Hetzner Promotion Execution"],
  ["CommandGateCoveragePage", "/command-gate-coverage", "Command Gate Coverage"],
  ["ProjectAdapterRolloutPage", "/project-adapter-rollout", "Project Adapter Rollout"],
  ["IncidentAutomationPage", "/incident-automation", "Incident Automation"],
  ["LiveSecretScanPage", "/live-secret-scan", "Live Secret Scan"],
  ["CostReconciliationPage", "/cost-reconciliation", "Cost Reconciliation"],
  ["OutcomeLearningFeedsPage", "/outcome-learning-feeds", "Outcome Learning Feeds"],
  ["GoldenEvalExecutionPage", "/golden-eval-execution", "Golden Eval Execution"],
  ["HardBreakerEnforcementPage", "/hard-breaker-enforcement", "Hard Breaker Enforcement"],
  ["NetworkRunnerAdapterPage", "/network-runner-adapter", "Network Runner Adapter"],
  ["HetznerSshAdapterPage", "/hetzner-ssh-adapter", "Hetzner SSH Adapter"],
  ["SecretProviderAdapterPage", "/secret-provider-adapter", "Secret Provider Adapter"],
  ["BillingProviderAdapterPage", "/billing-provider-adapter", "Billing Provider Adapter"],
  ["ProjectOutcomeEmitterPage", "/project-outcome-emitter", "Project Outcome Emitter"],
  ["ProviderEvalRunnerPage", "/provider-eval-runner", "Provider Eval Runner"],
  ["BreakerMiddlewarePage", "/breaker-middleware", "Breaker Middleware"],
  ["IncidentSubscriptionPage", "/incident-subscriptions", "Incident Subscriptions"],
  ["EvidenceArtifactStorePage", "/evidence-artifact-store", "Evidence Artifact Store"],
  ["ReleaseTrainOrchestratorPage", "/release-train-orchestrator", "Release Train Orchestrator"],
];

const metadataByRoute = new Map(dashboardPageMetadata.map((entry) => [entry.route, entry]));

const generatedPageSpecs: GeneratedPageSpec[] = generatedPageRows.map(([exportName, route, title]) => ({
  exportName,
  route,
  title,
  family: familyFor(exportName, route),
  purpose: purposeFor(exportName, title),
  priority: priorityFor(exportName, route),
  widgets: widgetsFor(exportName, route),
  proofFocus: proofFocusFor(exportName, route),
  nextAction: nextActionFor(exportName, route),
}));

const specsByExportName = new Map(generatedPageSpecs.map((spec) => [spec.exportName, spec]));

function GeneratedGovernancePage({ exportName }: { exportName: string }) {
  const [evidenceReport, setEvidenceReport] = useState<GeneratedDashboardRouteEvidenceBindingsReport | null>(null);
  const [maturityReport, setMaturityReport] = useState<GeneratedDashboardRouteMaturityReport | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([loadGeneratedDashboardRouteEvidenceBindings(), loadGeneratedDashboardRouteMaturity()])
      .then(([nextEvidenceReport, nextMaturityReport]) => {
        if (!active) return;
        setEvidenceReport(nextEvidenceReport);
        setMaturityReport(nextMaturityReport);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setRuntimeError(error instanceof Error ? error.message : "Unable to load generated dashboard maturity evidence.");
      });
    return () => {
      active = false;
    };
  }, []);
  const evidenceBindingByExportName = useMemo(
    () => new Map<string, GeneratedDashboardRouteEvidenceBinding>((evidenceReport?.routeBindings ?? []).map((entry) => [entry.exportName, entry])),
    [evidenceReport]
  );
  const maturityByExportName = useMemo(
    () => new Map<string, GeneratedDashboardRouteMaturityEntry>((maturityReport?.entries ?? []).map((entry) => [entry.exportName, entry])),
    [maturityReport]
  );
  const spec = specsByExportName.get(exportName) ?? fallbackSpec(exportName);
  const metadata = metadataByRoute.get(spec.route);
  const dataContracts = metadata?.dataContracts ?? defaultDataContracts(spec.family);
  const requiredStates = metadata?.requiredStates ?? defaultStates(spec.family);
  const validation = metadata?.validation ?? dashboardGovernanceDefaults.finalHandoffEvidence;
  const routeMaturity = maturityByExportName.get(spec.exportName);
  const evidenceBinding = evidenceBindingByExportName.get(spec.exportName);
  const maturity = routeMaturity?.score ?? maturityFor(Boolean(metadata), dataContracts, requiredStates, validation);
  const evidenceLoading = !evidenceReport || !maturityReport;

  return (
    <main
      className="min-h-screen bg-[#f7f8fb] px-5 py-6 text-slate-950 md:px-8 lg:px-10"
      data-hdk-component="GeneratedGovernancePage"
      data-dashboard-route={spec.route}
      data-dashboard-review-id={`generated-${slugFor(spec.title)}`}
    >
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{spec.family}</Badge>
            <Badge>{spec.priority}</Badge>
            <Badge>{metadata ? "Registered contract" : "Family contract"}</Badge>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                Hermes governance route
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-4xl">
                {metadata?.title ?? spec.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {spec.purpose}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <MiniFact label="Route" value={spec.route} />
              <MiniFact label="Owner" value={metadata?.owner ?? ownerFor(spec.family)} />
              <MiniFact label="Recipe" value={metadata?.recipe ?? recipeFor(spec.family)} />
              <MiniFact label="Category" value={metadata?.category ?? categoryFor(spec.family)} />
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Maturity" value={`${maturity}%`} detail={metadata ? "Route contract is registered." : "Family defaults are active."} />
          <MetricCard label="Data Contracts" value={String(dataContracts.length)} detail="Typed inputs expected before bespoke build." />
          <MetricCard label="Evidence Sources" value={String(evidenceBinding?.sourceBindings.filter((source) => source.status !== "missing").length ?? 0)} detail={evidenceBinding?.freshnessStatus ?? "evidence not bound"} />
          <MetricCard label="Operational" value={evidenceBinding?.operationalStatus ?? "unbound"} detail={evidenceBinding?.nextOperationalAction ?? "Operational evidence has not been generated."} />
          <MetricCard label="Freshness" value={evidenceBinding?.freshnessSummary.severity ?? (evidenceLoading ? "loading" : "unknown")} detail={evidenceBinding ? `${evidenceBinding.freshnessSummary.currentCount} current / ${evidenceBinding.freshnessSummary.staleCount} stale / ${evidenceBinding.freshnessSummary.missingCount} missing` : "Runtime freshness evidence loads outside the page bundle."} />
          <MetricCard label="Payload" value={evidenceBinding?.payloadMaturity.status ?? (evidenceLoading ? "loading" : "unknown")} detail={evidenceBinding?.payloadMaturity.strategy ?? "Runtime asset split protects the generated route bundle."} />
          <MetricCard label="Validation" value={String(validation.length)} detail="Checks needed for handoff evidence." />
          <MetricCard label="Open Layers" value={String(routeMaturity?.openLayers.length ?? 0)} detail={routeMaturity?.nextOpenLayer ?? spec.proofFocus} />
        </section>

        {runtimeError ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            {runtimeError}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Page composition
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Expected front-end maturity</h2>
              </div>
              <Badge>{dashboardGovernanceDefaults.designSystem.sourcePackage}</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {spec.widgets.map((widget) => (
                <article key={widget} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">{widget}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{widgetDetail(widget, spec.family)}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Next build packet
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{spec.nextAction}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This route is now viewable and governed. The next maturity layer is to replace the contract preview with live cards, tables, filters, commands, and drill-throughs backed by the listed data contracts.
            </p>
            <div className="mt-5 rounded-lg bg-slate-950 p-4 text-sm leading-6 text-white">
              Final handoff requires screenshot evidence, successful validation, data-state coverage, and a production or local-only decision.
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ChecklistPanel title="Data Bindings" items={dataContracts} />
          <ChecklistPanel title="State Coverage" items={requiredStates} />
          <ChecklistPanel title="Validation Evidence" items={validation} />
        </section>

        {evidenceBinding ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <ChecklistPanel title="Bound Evidence Sources" items={evidenceBinding.sourceBindings.filter((source) => source.status !== "missing").map((source) => `${source.label}: ${source.status}`)} />
            <ChecklistPanel title="Operational Categories" items={evidenceBinding.operationalCategories.map((category) => `${category.label}: ${category.status}`)} />
            <ChecklistPanel title="Freshness Reasons" items={evidenceBinding.staleReasons.length ? [...evidenceBinding.staleReasons] : [`Current within ${evidenceBinding.freshnessPolicy.slaDays} day policy`]} />
          </section>
        ) : null}

        {evidenceBinding ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <ChecklistPanel title="Data Signals" items={[...evidenceBinding.dataSignals]} />
            <ChecklistPanel title="Drill-Down Targets" items={evidenceBinding.drillDownTargets.map((target) => `${target.label}: ${target.source}`)} />
            <ChecklistPanel title="Next Operational Action" items={[evidenceBinding.nextOperationalAction]} />
          </section>
        ) : null}

        {evidenceBinding ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <ChecklistPanel title="State Fixtures" items={[...evidenceBinding.stateCoverage.stateFixtures]} />
            <ChecklistPanel title="State Evidence" items={[...evidenceBinding.stateCoverage.evidence]} />
            <ChecklistPanel title="UX Review" items={[...evidenceBinding.uxVisualMaturity.reviewChecklist]} />
          </section>
        ) : null}

        {evidenceBinding ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <ChecklistPanel title="Freshness Summary" items={freshnessItems(evidenceBinding)} />
            <ChecklistPanel title="Infrastructure Connections" items={evidenceBinding.infrastructureConnections.connections.map((connection) => `${connection.kind}: ${connection.label} (${connection.target})`)} />
            <ChecklistPanel title="Payload Maturity" items={[evidenceBinding.payloadMaturity.strategy, evidenceBinding.payloadMaturity.mainBundlePolicy, evidenceBinding.payloadMaturity.lazyLoadTrigger, ...evidenceBinding.payloadMaturity.guardEvidence]} />
          </section>
        ) : null}

        {routeMaturity ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <ChecklistPanel title="Completed Maturity Layers" items={[...routeMaturity.completedLayers]} />
            <ChecklistPanel title="Open Maturity Layers" items={[...routeMaturity.openLayers]} />
            <ChecklistPanel title="Layer Blockers" items={routeMaturity.layerStatus.filter((layer) => layer.status === "open").slice(0, 6).map((layer) => `${layer.id}: ${layer.blocker}`)} />
          </section>
        ) : null}

        {routeMaturity ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <ChecklistPanel title="Proof Required" items={[...routeMaturity.proofRequired]} />
            <ChecklistPanel title="Completed Evidence" items={routeMaturity.layerStatus.filter((layer) => layer.status === "complete").flatMap((layer) => layer.evidence.map((item) => `${layer.id}: ${item}`))} />
          </section>
        ) : null}

        {evidenceBinding && evidenceBinding.remainingBindingWork.length ? (
          <ChecklistPanel title="Remaining Binding Work" items={[...evidenceBinding.remainingBindingWork]} />
        ) : null}
      </section>
    </main>
  );
}

function freshnessItems(evidenceBinding: GeneratedDashboardRouteEvidenceBinding) {
  return [
    `status: ${evidenceBinding.freshnessSummary.freshnessStatus}`,
    `severity: ${evidenceBinding.freshnessSummary.severity}`,
    `current sources: ${evidenceBinding.freshnessSummary.currentCount}`,
    `stale sources: ${evidenceBinding.freshnessSummary.staleCount}`,
    `missing sources: ${evidenceBinding.freshnessSummary.missingCount}`,
    evidenceBinding.freshnessSummary.nextRefreshAction,
  ];
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function ChecklistPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 py-1 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="break-words text-slate-800">{value}</span>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
      {children}
    </span>
  );
}

function makePage(exportName: string) {
  return function GeneratedDashboardPage() {
    return <GeneratedGovernancePage exportName={exportName} />;
  };
}

function familyFor(exportName: string, route: string): GovernanceFamily {
  const key = `${exportName} ${route}`.toLowerCase();
  if (key.includes("design") || key.includes("theme") || key.includes("prototype") || key.includes("marketplace")) return "Design System";
  if (key.includes("executive") || key.includes("cockpit") || key.includes("business-os") || key.includes("central-command") || key.includes("hermes-os")) return "Executive";
  if (key.includes("secret") || key.includes("permission") || key.includes("breaker") || key.includes("gate")) return "Security";
  if (key.includes("cost") || key.includes("billing") || key.includes("finance")) return "Finance";
  if (key.includes("learning") || key.includes("eval") || key.includes("outcome")) return "Learning";
  if (key.includes("adapter") || key.includes("provider") || key.includes("ssh") || key.includes("network")) return "Adapters";
  if (key.includes("data") || key.includes("telemetry") || key.includes("memory") || key.includes("artifact") || key.includes("subscription")) return "Data";
  if (key.includes("deployment") || key.includes("promotion") || key.includes("production") || key.includes("release")) return "Deployment";
  if (key.includes("agent") || key.includes("task") || key.includes("model") || key.includes("loop") || key.includes("autonomy")) return "Agents";
  return "Operations";
}

function priorityFor(exportName: string, route: string): GeneratedPageSpec["priority"] {
  const key = `${exportName} ${route}`.toLowerCase();
  if (key.includes("central-command") || key.includes("incident") || key.includes("secret") || key.includes("production") || key.includes("hard-breaker")) return "P0";
  if (key.includes("data") || key.includes("telemetry") || key.includes("deployment") || key.includes("cost") || key.includes("permission")) return "P1";
  if (key.includes("design") || key.includes("marketplace") || key.includes("prototype") || key.includes("learning")) return "P2";
  return "P3";
}

function fallbackSpec(exportName: string): GeneratedPageSpec {
  const title = exportName.replace(/Page$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
  return {
    exportName,
    route: `/${slugFor(title)}`,
    title,
    family: "Operations",
    purpose: `Governance cockpit for ${title}.`,
    priority: "P3",
    widgets: widgetsFor(exportName, title),
    proofFocus: "Route registration, data contract selection, and component handoff evidence.",
    nextAction: "Register the route-specific contract and connect live dashboard data.",
  };
}

function purposeFor(exportName: string, title: string): string {
  const family = familyFor(exportName, title);
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("central command")) return "A command-level view for health, incidents, queues, project posture, and the actions that need human attention first.";
  if (lowerTitle.includes("migrations")) return "A migration workbench for retiring static dashboard shells and proving package-native component adoption across the fleet.";
  if (lowerTitle.includes("secrets")) return "A security posture page for secret inventory, scan coverage, exposure risk, and remediation readiness.";
  if (lowerTitle.includes("data source")) return "A catalog for every data source, freshness expectation, durable storage contract, ownership path, and known collection gap.";
  if (lowerTitle.includes("telemetry")) return "A telemetry fabric view for event flow, aggregation health, alerting coverage, and drill-through readiness.";
  if (lowerTitle.includes("incident")) return "An incident command surface for active failures, subscriptions, routing, automation, and evidence capture.";
  if (lowerTitle.includes("cost") || lowerTitle.includes("billing") || lowerTitle.includes("finance")) return "A financial controls view for attribution, reconciliation, spend guardrails, and operational cost proof.";
  if (lowerTitle.includes("eval") || lowerTitle.includes("learning")) return "A learning and evaluation console for golden checks, outcome feeds, model quality, and continuous improvement evidence.";
  if (lowerTitle.includes("adapter") || lowerTitle.includes("provider")) return "An adapter readiness page for provider contracts, rollout status, failure modes, and operational proof.";
  return `A ${family.toLowerCase()} governance page for ${title}, giving the dashboard a real front-end contract before the bespoke implementation begins.`;
}

function widgetsFor(exportName: string, route: string): string[] {
  const family = familyFor(exportName, route);
  const baseByFamily: Record<GovernanceFamily, string[]> = {
    Executive: ["Portfolio health rail", "Action queue", "Risk and blocker map", "Executive drill-through"],
    "Design System": ["Component adoption matrix", "Recipe coverage board", "Exception register", "Visual proof queue"],
    Operations: ["Operational status grid", "Runner activity stream", "SLA breach watch", "Remediation queue"],
    Agents: ["Agent routing board", "Loop health timeline", "Human approval lane", "Autonomy readiness score"],
    Data: ["Source freshness ledger", "Storage and mirror health", "Retention policy map", "Gap investigation queue"],
    Security: ["Control coverage matrix", "Blocked action ledger", "Exposure scanner", "Remediation evidence"],
    Finance: ["Attribution ledger", "Budget guardrail chart", "Reconciliation queue", "Spend anomaly review"],
    Learning: ["Evaluation suite", "Outcome feedback lane", "Model comparison table", "Regression watch"],
    Deployment: ["Promotion train", "Environment health", "Rollback readiness", "Release evidence"],
    Adapters: ["Provider contract matrix", "Adapter rollout board", "Failure mode table", "Connectivity proof"],
  };
  return baseByFamily[family];
}

function widgetDetail(widget: string, family: GovernanceFamily): string {
  const details: Record<string, string> = {
    "Portfolio health rail": "Aggregates project health, fleet status, incident posture, and stale signals in one scannable rail.",
    "Action queue": "Lists the decisions, approvals, incidents, and maturity gaps that need owner action.",
    "Risk and blocker map": "Groups blockers by impact, owner, age, and required evidence before work can move.",
    "Executive drill-through": "Links from the aggregate signal into project, data, runner, and proof-level views.",
    "Component adoption matrix": "Shows which pages are still static, generated, package-native, or fully bespoke.",
    "Recipe coverage board": "Maps each route to its intended recipe, components, states, and validation requirements.",
    "Exception register": "Tracks design-system bypasses, owners, reasons, and retirement dates.",
    "Visual proof queue": "Holds screenshots, responsive checks, and visual review status for each dashboard page.",
    "Operational status grid": "Summarizes uptime, freshness, queue age, failure count, and current operating mode.",
    "Runner activity stream": "Shows recent worker runs, schedule adherence, throughput, and slowdowns.",
    "SLA breach watch": "Highlights freshness, latency, sync, pruning, and alerting thresholds that crossed tolerance.",
    "Remediation queue": "Prioritizes fixes by operational impact, owner, blocker, and evidence needed.",
    "Agent routing board": "Shows how work is assigned across agents, runners, permissions, and approval gates.",
    "Loop health timeline": "Tracks recurring loop starts, completions, failures, retries, and missing heartbeats.",
    "Human approval lane": "Separates work waiting on user, Discord, production gates, or manual review.",
    "Autonomy readiness score": "Scores whether a workflow can run unattended based on coverage and rollback proof.",
    "Source freshness ledger": "Lists source-by-source collection status, last successful ingest, and expected cadence.",
    "Storage and mirror health": "Shows database growth, external mirror lag, archive status, and sync failures.",
    "Retention policy map": "Connects tables, folders, and artifacts to retention class, pruning gate, and recovery proof.",
    "Gap investigation queue": "Ranks missing, slow, and unexpectedly small datasets for root-cause follow-up.",
    "Control coverage matrix": "Maps permissions, breakers, policy gates, and sensitive actions to enforcement evidence.",
    "Blocked action ledger": "Records commands blocked by safety policy with owner, reason, and unlock path.",
    "Exposure scanner": "Surfaces secret, token, credential, and public-route exposure findings.",
    "Remediation evidence": "Captures proof that a security issue was fixed, retested, and monitored.",
    "Attribution ledger": "Connects cost, usage, provider, project, owner, and business outcome.",
    "Budget guardrail chart": "Shows budget limits, current burn, anomalies, and projected overrun windows.",
    "Reconciliation queue": "Lists mismatches between provider billing, local accounting, and dashboard totals.",
    "Spend anomaly review": "Highlights unusual spend changes with drill-through to provider and workload context.",
    "Evaluation suite": "Shows golden tests, latest results, failures, and regression ownership.",
    "Outcome feedback lane": "Connects production outcomes back into learning feeds and model improvement loops.",
    "Model comparison table": "Compares candidate models by quality, latency, cost, safety, and task fit.",
    "Regression watch": "Tracks failing or degrading evaluations that need rollback or prompt repair.",
    "Promotion train": "Shows what is ready, blocked, deployed, rolled back, or waiting on evidence.",
    "Environment health": "Summarizes production, staging, local, and worker health in one operational surface.",
    "Rollback readiness": "Confirms rollback path, artifact availability, database safety, and owner coverage.",
    "Release evidence": "Holds commit, build, validation, screenshot, and smoke-test proof for promotion.",
    "Provider contract matrix": "Maps every provider to credentials, rate limits, health checks, and supported commands.",
    "Adapter rollout board": "Shows which projects have adopted the adapter and where parity still needs work.",
    "Failure mode table": "Documents provider failures, retries, fallbacks, and escalation behavior.",
    "Connectivity proof": "Displays live or latest verified connectivity checks with timestamps and owner context.",
  };
  return details[widget] ?? `Core ${family.toLowerCase()} component for the route-specific build.`;
}

function proofFocusFor(exportName: string, route: string): string {
  const family = familyFor(exportName, route);
  const byFamily: Record<GovernanceFamily, string> = {
    Executive: "Aggregate health and drill-through evidence.",
    "Design System": "Package-native adoption and visual proof.",
    Operations: "Runner health and remediation evidence.",
    Agents: "Loop coverage and approval evidence.",
    Data: "Freshness, retention, storage, and mirror evidence.",
    Security: "Control enforcement and exposure evidence.",
    Finance: "Attribution and reconciliation evidence.",
    Learning: "Evaluation and outcome evidence.",
    Deployment: "Promotion, rollback, and smoke-test evidence.",
    Adapters: "Provider contract and connectivity evidence.",
  };
  return byFamily[family];
}

function nextActionFor(exportName: string, route: string): string {
  const family = familyFor(exportName, route);
  const byFamily: Record<GovernanceFamily, string> = {
    Executive: "Bind portfolio summaries and priority drill-throughs.",
    "Design System": "Connect adoption registry, screenshots, and exception data.",
    Operations: "Wire runner telemetry, thresholds, and remediation actions.",
    Agents: "Connect routing, loop, approval, and autonomy-readiness data.",
    Data: "Bind source freshness, storage growth, mirror lag, and pruning status.",
    Security: "Wire control coverage, secret scans, and blocked-command evidence.",
    Finance: "Connect provider bills, project attribution, and anomaly review.",
    Learning: "Bind evaluation runs, outcomes, regressions, and model comparisons.",
    Deployment: "Connect promotion state, release proof, rollback readiness, and smoke checks.",
    Adapters: "Wire provider health, adapter adoption, failures, and connectivity checks.",
  };
  return byFamily[family];
}

function recipeFor(family: GovernanceFamily): string {
  const recipes: Record<GovernanceFamily, string> = {
    Executive: "executive-command-center",
    "Design System": "system-health-deployment",
    Operations: "operations-control-room",
    Agents: "agent-control-room",
    Data: "data-warehouse-governance",
    Security: "security-governance",
    Finance: "finance-attribution",
    Learning: "evaluation-lab",
    Deployment: "promotion-control-room",
    Adapters: "provider-adapter-governance",
  };
  return recipes[family];
}

function categoryFor(family: GovernanceFamily): string {
  return family.toLowerCase().replace(/\s+/g, "-");
}

function ownerFor(family: GovernanceFamily): string {
  if (family === "Finance") return "Finance Operations";
  if (family === "Security") return "Hermes Security";
  if (family === "Adapters") return "Provider Operations";
  return "Hermes";
}

function defaultDataContracts(family: GovernanceFamily): string[] {
  const contracts: Record<GovernanceFamily, string[]> = {
    Executive: ["DashboardSnapshot", "ProjectHealth[]", "ActionNeeded[]", "IncidentSummary[]"],
    "Design System": ["DashboardRecipe[]", "ComponentAdoption[]", "DesignException[]", "ScreenshotEvidence[]"],
    Operations: ["RunnerHealth[]", "QueueSnapshot[]", "SlaBreach[]", "RemediationAction[]"],
    Agents: ["AgentRoute[]", "LoopRun[]", "ApprovalGate[]", "AutonomyReadiness"],
    Data: ["DataSource[]", "FreshnessCheck[]", "StorageMirrorStatus", "RetentionPolicy[]"],
    Security: ["ControlCoverage[]", "SecretScanFinding[]", "BlockedCommand[]", "RemediationEvidence[]"],
    Finance: ["CostAttribution[]", "BudgetGuardrail[]", "BillingReconciliation[]", "SpendAnomaly[]"],
    Learning: ["EvaluationRun[]", "OutcomeFeedback[]", "ModelComparison[]", "RegressionSignal[]"],
    Deployment: ["PromotionStatus[]", "ReleaseEvidence[]", "RollbackCheck[]", "SmokeTestResult[]"],
    Adapters: ["ProviderContract[]", "AdapterRollout[]", "FailureMode[]", "ConnectivityCheck[]"],
  };
  return contracts[family];
}

function defaultStates(family: GovernanceFamily): string[] {
  const shared = ["normal", "loading", "empty", "error", "stale", "mobile"];
  const states: Record<GovernanceFamily, string[]> = {
    Executive: [...shared, "warning", "critical", "drill-through"],
    "Design System": [...shared, "draft", "review-ready", "approved", "exception"],
    Operations: [...shared, "degraded", "blocked", "retrying", "critical"],
    Agents: [...shared, "queued", "assigned", "waiting-for-human", "autonomous"],
    Data: [...shared, "late", "mirroring", "pruning-disabled", "retention-risk"],
    Security: [...shared, "blocked", "exposed", "quarantined", "remediated"],
    Finance: [...shared, "over-budget", "unreconciled", "anomaly", "approved"],
    Learning: [...shared, "passing", "failing", "regressing", "candidate"],
    Deployment: [...shared, "ready", "promoting", "rolled-back", "maintenance-window"],
    Adapters: [...shared, "connected", "rate-limited", "provider-down", "fallback"],
  };
  return states[family];
}

function maturityFor(hasMetadata: boolean, dataContracts: string[], requiredStates: string[], validation: string[]) {
  const metadataScore = hasMetadata ? 25 : 12;
  const dataScore = Math.min(25, dataContracts.length * 5);
  const stateScore = Math.min(25, requiredStates.length * 3);
  const validationScore = Math.min(25, validation.length * 6);
  return Math.min(100, metadataScore + dataScore + stateScore + validationScore);
}

function slugFor(title: string) {
  return title
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const HermesOsPage = makePage("HermesOsPage");
export const DesignSystemPage = makePage("DesignSystemPage");
export const DesignIntelligenceCommandCenterPage = makePage("DesignIntelligenceCommandCenterPage");
export const PackageNativeMigrationsPage = makePage("PackageNativeMigrationsPage");
export const ExecutiveSummaryPage = makePage("ExecutiveSummaryPage");
export const ExecutiveBriefingRoomPage = makePage("ExecutiveBriefingRoomPage");
export const CentralCommandPage = makePage("CentralCommandPage");
export const ThemeSystemPage = makePage("ThemeSystemPage");
export const DashboardMarketplacePage = makePage("DashboardMarketplacePage");
export const DashboardPrototypeLabPage = makePage("DashboardPrototypeLabPage");
export const MainHermesAgentDashboardPrototypePage = makePage("MainHermesAgentDashboardPrototypePage");
export const LiveSignalsPage = makePage("LiveSignalsPage");
export const TaskRoutingPage = makePage("TaskRoutingPage");
export const DecisionLedgerPage = makePage("DecisionLedgerPage");
export const ModelRoutingPage = makePage("ModelRoutingPage");
export const OperatingLoopsPage = makePage("OperatingLoopsPage");
export const PermissionSecurityPage = makePage("PermissionSecurityPage");
export const BusinessOSPage = makePage("BusinessOSPage");
export const ProjectSnapshotsPage = makePage("ProjectSnapshotsPage");
export const DurableMemoryPage = makePage("DurableMemoryPage");
export const PermissionRuntimePage = makePage("PermissionRuntimePage");
export const CostGovernorPage = makePage("CostGovernorPage");
export const LoopRunnerPage = makePage("LoopRunnerPage");
export const BusinessCommandPage = makePage("BusinessCommandPage");
export const AgentWorkbenchPage = makePage("AgentWorkbenchPage");
export const EvaluationGatesPage = makePage("EvaluationGatesPage");
export const AutonomyReadinessPage = makePage("AutonomyReadinessPage");
export const ProjectRegistryPage = makePage("ProjectRegistryPage");
export const ProjectPlanCommandCenterPage = makePage("ProjectPlanCommandCenterPage");
export const TelemetryFabricPage = makePage("TelemetryFabricPage");
export const IncidentCommandPage = makePage("IncidentCommandPage");
export const DeploymentPromotionPage = makePage("DeploymentPromotionPage");
export const SecretsPosturePage = makePage("SecretsPosturePage");
export const DataSourceCatalogPage = makePage("DataSourceCatalogPage");
export const FinanceAttributionPage = makePage("FinanceAttributionPage");
export const LearningEnginePage = makePage("LearningEnginePage");
export const AgentEvalLabPage = makePage("AgentEvalLabPage");
export const ExecutiveCockpitPage = makePage("ExecutiveCockpitPage");
export const ProductionVerificationPage = makePage("ProductionVerificationPage");
export const CommandGateRuntimePage = makePage("CommandGateRuntimePage");
export const TelemetryAdapterKitPage = makePage("TelemetryAdapterKitPage");
export const IncidentIngestionPage = makePage("IncidentIngestionPage");
export const PromotionRunnerPage = makePage("PromotionRunnerPage");
export const SecretScannerPage = makePage("SecretScannerPage");
export const CostAttributionEnginePage = makePage("CostAttributionEnginePage");
export const LearningIngestionPage = makePage("LearningIngestionPage");
export const ModelEvalHarnessPage = makePage("ModelEvalHarnessPage");
export const CircuitBreakersPage = makePage("CircuitBreakersPage");
export const ProductionSweepPage = makePage("ProductionSweepPage");
export const HetznerPromotionExecutionPage = makePage("HetznerPromotionExecutionPage");
export const CommandGateCoveragePage = makePage("CommandGateCoveragePage");
export const ProjectAdapterRolloutPage = makePage("ProjectAdapterRolloutPage");
export const IncidentAutomationPage = makePage("IncidentAutomationPage");
export const LiveSecretScanPage = makePage("LiveSecretScanPage");
export const CostReconciliationPage = makePage("CostReconciliationPage");
export const OutcomeLearningFeedsPage = makePage("OutcomeLearningFeedsPage");
export const GoldenEvalExecutionPage = makePage("GoldenEvalExecutionPage");
export const HardBreakerEnforcementPage = makePage("HardBreakerEnforcementPage");
export const NetworkRunnerAdapterPage = makePage("NetworkRunnerAdapterPage");
export const HetznerSshAdapterPage = makePage("HetznerSshAdapterPage");
export const SecretProviderAdapterPage = makePage("SecretProviderAdapterPage");
export const BillingProviderAdapterPage = makePage("BillingProviderAdapterPage");
export const ProjectOutcomeEmitterPage = makePage("ProjectOutcomeEmitterPage");
export const ProviderEvalRunnerPage = makePage("ProviderEvalRunnerPage");
export const BreakerMiddlewarePage = makePage("BreakerMiddlewarePage");
export const IncidentSubscriptionPage = makePage("IncidentSubscriptionPage");
export const EvidenceArtifactStorePage = makePage("EvidenceArtifactStorePage");
export const ReleaseTrainOrchestratorPage = makePage("ReleaseTrainOrchestratorPage");
