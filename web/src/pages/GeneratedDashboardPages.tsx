const pageNames: Record<string, string> = {
  HermesOsPage: "Hermes OS",
  DesignSystemPage: "Design System",
  DesignIntelligenceCommandCenterPage: "Design Intelligence Command Center",
  PackageNativeMigrationsPage: "Package Native Migrations",
  ExecutiveSummaryPage: "Executive Summary",
  ExecutiveBriefingRoomPage: "Executive Briefing Room",
  CentralCommandPage: "Central Command",
  ThemeSystemPage: "Theme System",
  DashboardMarketplacePage: "Dashboard Marketplace",
  DashboardPrototypeLabPage: "Dashboard Prototype Lab",
  MainHermesAgentDashboardPrototypePage: "Hermes Command",
  LiveSignalsPage: "Live Signals",
  TaskRoutingPage: "Task Routing",
  DecisionLedgerPage: "Decision Ledger",
  ModelRoutingPage: "Model Routing",
  OperatingLoopsPage: "Operating Loops",
  PermissionSecurityPage: "Permission Security",
  BusinessOSPage: "Business OS",
  ProjectSnapshotsPage: "Project Snapshots",
  DurableMemoryPage: "Durable Memory",
  PermissionRuntimePage: "Permission Runtime",
  CostGovernorPage: "Cost Governor",
  LoopRunnerPage: "Loop Runner",
  BusinessCommandPage: "Business Command",
  AgentWorkbenchPage: "Agent Workbench",
  EvaluationGatesPage: "Evaluation Gates",
  AutonomyReadinessPage: "Autonomy Readiness",
  ProjectRegistryPage: "Project Registry",
  ProjectPlanCommandCenterPage: "Project Plan Command Center",
  TelemetryFabricPage: "Telemetry Fabric",
  IncidentCommandPage: "Incident Command",
  DeploymentPromotionPage: "Deployment Promotion",
  SecretsPosturePage: "Secrets Posture",
  DataSourceCatalogPage: "Data Source Catalog",
  FinanceAttributionPage: "Finance Attribution",
  LearningEnginePage: "Learning Engine",
  AgentEvalLabPage: "Agent Eval Lab",
  ExecutiveCockpitPage: "Executive Cockpit",
  ProductionVerificationPage: "Production Verification",
  CommandGateRuntimePage: "Command Gate Runtime",
  TelemetryAdapterKitPage: "Telemetry Adapter Kit",
  IncidentIngestionPage: "Incident Ingestion",
  PromotionRunnerPage: "Promotion Runner",
  SecretScannerPage: "Secret Scanner",
  CostAttributionEnginePage: "Cost Attribution Engine",
  LearningIngestionPage: "Learning Ingestion",
  ModelEvalHarnessPage: "Model Eval Harness",
  CircuitBreakersPage: "Circuit Breakers",
  ProductionSweepPage: "Production Sweep",
  HetznerPromotionExecutionPage: "Hetzner Promotion Execution",
  CommandGateCoveragePage: "Command Gate Coverage",
  ProjectAdapterRolloutPage: "Project Adapter Rollout",
  IncidentAutomationPage: "Incident Automation",
  LiveSecretScanPage: "Live Secret Scan",
  CostReconciliationPage: "Cost Reconciliation",
  OutcomeLearningFeedsPage: "Outcome Learning Feeds",
  GoldenEvalExecutionPage: "Golden Eval Execution",
  HardBreakerEnforcementPage: "Hard Breaker Enforcement",
  NetworkRunnerAdapterPage: "Network Runner Adapter",
  HetznerSshAdapterPage: "Hetzner SSH Adapter",
  SecretProviderAdapterPage: "Secret Provider Adapter",
  BillingProviderAdapterPage: "Billing Provider Adapter",
  ProjectOutcomeEmitterPage: "Project Outcome Emitter",
  ProviderEvalRunnerPage: "Provider Eval Runner",
  BreakerMiddlewarePage: "Breaker Middleware",
  IncidentSubscriptionPage: "Incident Subscriptions",
  EvidenceArtifactStorePage: "Evidence Artifact Store",
  ReleaseTrainOrchestratorPage: "Release Train Orchestrator",
};

function titleFor(name: string) {
  return pageNames[name] ?? name.replace(/Page$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function DashboardStub({ name }: { name: string }) {
  const title = titleFor(name);
  return (
    <main style={{ padding: "32px", maxWidth: "1120px" }}>
      <p style={{ margin: 0, color: "#667085", fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>
        Dashboard route
      </p>
      <h1 style={{ margin: "8px 0 12px", color: "#101828", fontSize: "32px", letterSpacing: 0 }}>
        {title}
      </h1>
      <p style={{ color: "#475467", fontSize: "16px", lineHeight: 1.6 }}>
        This route is registered for the Hermes dashboard governance system and is ready for package-native component composition.
      </p>
    </main>
  );
}

function makePage(name: string) {
  return function GeneratedDashboardPage() {
    return <DashboardStub name={name} />;
  };
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
