import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { Navigate } from "react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CandlestickChart,
  Code2,
  Clock,
  Database,
  Cpu,
  FileText,
  FlaskConical,
  FolderOpen,
  GalleryVerticalEnd,
  GitBranch,
  Globe,
  KeyRound,
  ListChecks,
  MessageSquare,
  Package,
  Plug,
  Puzzle,
  Radio,
  RotateCw,
  Scale,
  SearchCheck,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ConfigPage = lazy(() => import("@/pages/ConfigPage"));
const DocsPage = lazy(() => import("@/pages/DocsPage"));
const EnvPage = lazy(() => import("@/pages/EnvPage"));
const FilesPage = lazy(() => import("@/pages/FilesPage"));
const SessionsPage = lazy(() => import("@/pages/SessionsPage"));
const LogsPage = lazy(() => import("@/pages/LogsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ModelsPage = lazy(() => import("@/pages/ModelsPage"));
const CronPage = lazy(() => import("@/pages/CronPage"));
const DashboardKitGalleryPage = lazy(() => import("@/pages/DashboardKitGalleryPage"));
const FleetMaturityReviewPage = lazy(() => import("@/pages/FleetMaturityReviewPage"));
const TradingIntelligencePage = lazy(() => import("@/pages/TradingIntelligencePage"));
const HeadTraderPage = lazy(() => import("@/pages/HeadTraderPage"));
const PortfolioRiskPage = lazy(() => import("@/pages/PortfolioRiskPage"));
const SecondBrainPage = lazy(() => import("@/pages/SecondBrainPage"));
const CompoundingIntelligencePage = lazy(() => import("@/pages/CompoundingIntelligencePage"));
const DecisionLineagePage = lazy(() => import("@/pages/DecisionLineagePage"));
const ContradictionDashboardPage = lazy(() => import("@/pages/ContradictionDashboardPage"));
const ResearchQueuePage = lazy(() => import("@/pages/ResearchQueuePage"));
const PreflightPage = lazy(() => import("@/pages/PreflightPage"));
const TradingEvidencePage = lazy(() => import("@/pages/TradingEvidencePage"));
const TradingResearchDevelopmentPage = lazy(() => import("@/pages/TradingDevelopmentPage").then((module) => ({ default: module.TradingResearchDevelopmentPage })));
const TradingBacktestingPage = lazy(() => import("@/pages/TradingDevelopmentPage").then((module) => ({ default: module.TradingBacktestingPage })));
const ProductionScreenshotRunnerPage = lazy(() => import("@/pages/ProductionScreenshotRunnerPage"));
const HetznerPromotionTransportPage = lazy(() => import("@/pages/HetznerPromotionTransportPage"));
const ServerSecretPostureScannerPage = lazy(() => import("@/pages/ServerSecretPostureScannerPage"));
const IncidentNotificationFanoutPage = lazy(() => import("@/pages/IncidentNotificationFanoutPage"));
const DurableArtifactBackendPage = lazy(() => import("@/pages/DurableArtifactBackendPage"));
const RemainingProjectOutcomeAdaptersPage = lazy(() => import("@/pages/RemainingProjectOutcomeAdaptersPage"));
const BreakerMiddlewareRolloutPage = lazy(() => import("@/pages/BreakerMiddlewareRolloutPage"));
const ProviderEvalExecutionPage = lazy(() => import("@/pages/ProviderEvalExecutionPage"));
const BillingProviderIntegrationsPage = lazy(() => import("@/pages/BillingProviderIntegrationsPage"));
const ReleaseTrainExecutionPage = lazy(() => import("@/pages/ReleaseTrainExecutionPage"));
const OperateOverviewPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateOverviewPage })));
const OperateBlockersPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateBlockersPage })));
const OperateActionsPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateActionsPage })));
const OperateIncidentsPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateIncidentsPage })));
const OperateApprovalsPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateApprovalsPage })));
const OperateRunsPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateRunsPage })));
const OperateChatActionsPage = lazy(() => import("@/pages/OperatePage").then((module) => ({ default: module.OperateChatActionsPage })));
const OperateEvidencePage = lazy(() => import("@/pages/OperateEvidencePage"));
const SystemWarehousePage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemWarehousePage })));
const SystemFreshnessPage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemFreshnessPage })));
const SystemStoragePage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemStoragePage })));
const SystemWorkersPage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemWorkersPage })));
const SystemDeploymentsPage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemDeploymentsPage })));
const SystemCredentialsPage = lazy(() => import("@/pages/SystemOperationsPage").then((module) => ({ default: module.SystemCredentialsPage })));
const ProfilesPage = lazy(() => import("@/pages/ProfilesPage"));
const ProfileBuilderPage = lazy(() => import("@/pages/ProfileBuilderPage"));
const SkillsPage = lazy(() => import("@/pages/SkillsPage"));
const PluginsPage = lazy(() => import("@/pages/PluginsPage"));
const McpPage = lazy(() => import("@/pages/McpPage"));
const PairingPage = lazy(() => import("@/pages/PairingPage"));
const ChannelsPage = lazy(() => import("@/pages/ChannelsPage"));
const WebhooksPage = lazy(() => import("@/pages/WebhooksPage"));
const SystemPage = lazy(() => import("@/pages/SystemPage"));

export type RouteComponent = ComponentType | LazyExoticComponent<ComponentType>;

export interface BuiltinNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  labelKey?: string;
}

export interface OperatorNavGroup {
  id: "operate" | "trading" | "system";
  label: string;
  path: string;
  icon: LucideIcon;
  legacyPaths?: string[];
  items: BuiltinNavItem[];
}

function RootRedirect() {
  return <Navigate to="/operate" replace />;
}

function RedirectToOperate() {
  return <Navigate to="/operate" replace />;
}

function RedirectToOperateActions() {
  return <Navigate to="/operate/actions" replace />;
}

function RedirectToOperateApprovals() {
  return <Navigate to="/operate/approvals" replace />;
}

function RedirectToOperateIncidents() {
  return <Navigate to="/operate/incidents" replace />;
}

function RedirectToOperateRuns() {
  return <Navigate to="/operate/runs" replace />;
}

function RedirectToOperateEvidence() {
  return <Navigate to="/operate/evidence" replace />;
}

function RedirectToTradingKhashi() {
  return <Navigate to="/trading/khashi" replace />;
}

function RedirectToTradingResearch() {
  return <Navigate to="/trading/strategies" replace />;
}

function RedirectToTradingBacktesting() {
  return <Navigate to="/trading/backtesting" replace />;
}

function RedirectToSystemWarehouse() {
  return <Navigate to="/system/warehouse" replace />;
}

function RedirectToSystemFreshness() {
  return <Navigate to="/system/freshness" replace />;
}

function RedirectToSystemWorkers() {
  return <Navigate to="/system/workers" replace />;
}

function RedirectToSystemDeployments() {
  return <Navigate to="/system/deployments" replace />;
}

function RedirectToSystemCredentials() {
  return <Navigate to="/system/credentials" replace />;
}

function RedirectToSystemStorage() {
  return <Navigate to="/system/storage" replace />;
}

function RedirectToSystemModels() {
  return <Navigate to="/system/models" replace />;
}

function RedirectToSystemAdmin() {
  return <Navigate to="/system/admin" replace />;
}

export const CHAT_NAV_ITEM: BuiltinNavItem = {
  path: "/chat",
  labelKey: "chat",
  label: "Chat",
  icon: Terminal,
};

export const BUILTIN_ROUTES_CORE: Record<string, RouteComponent> = {
  "/": RootRedirect,
  "/operate": OperateOverviewPage,
  "/operate/blockers": OperateBlockersPage,
  "/operate/actions": OperateActionsPage,
  "/operate/incidents": OperateIncidentsPage,
  "/operate/approvals": OperateApprovalsPage,
  "/operate/runs": OperateRunsPage,
  "/operate/evidence": OperateEvidencePage,
  "/operate/chat-actions": OperateChatActionsPage,
  "/trading": TradingIntelligencePage,
  "/trading/khashi": TradingIntelligencePage,
  "/trading/investing": TradingIntelligencePage,
  "/trading/strategies": TradingResearchDevelopmentPage,
  "/trading/backtesting": TradingBacktestingPage,
  "/trading/shadow-paper": TradingIntelligencePage,
  "/trading/risk": PortfolioRiskPage,
  "/trading/head-trader": HeadTraderPage,
  "/trading/evidence": TradingEvidencePage,
  "/system/warehouse": SystemWarehousePage,
  "/system/freshness": SystemFreshnessPage,
  "/system/storage": SystemStoragePage,
  "/system/workers": SystemWorkersPage,
  "/system/deployments": SystemDeploymentsPage,
  "/system/credentials": SystemCredentialsPage,
  "/system/models": ModelsPage,
  "/system/automations": CronPage,
  "/system/sessions": SessionsPage,
  "/system/logs": LogsPage,
  "/system/plugins": PluginsPage,
  "/system/admin": SystemPage,
  "/system/analytics": AnalyticsPage,
  "/sessions": SessionsPage,
  "/files": FilesPage,
  "/analytics": AnalyticsPage,
  "/hermes-os": RedirectToSystemAdmin,
  "/central-command": RedirectToOperate,
  "/trading-intelligence": TradingIntelligencePage,
  "/head-trader": HeadTraderPage,
  "/second-brain": SecondBrainPage,
  "/compounding-intelligence": CompoundingIntelligencePage,
  "/decision-lineage": DecisionLineagePage,
  "/contradictions": ContradictionDashboardPage,
  "/research-queue": ResearchQueuePage,
  "/preflight": PreflightPage,
  "/executive-summary": RedirectToOperate,
  "/executive-briefing": RedirectToOperateEvidence,
  "/dashboard-migrations": RedirectToSystemDeployments,
  "/package-native/khashi-vc": RedirectToTradingKhashi,
  "/hermes-command": RedirectToOperateActions,
  "/live-signals": RedirectToTradingKhashi,
  "/task-routing": RedirectToOperateActions,
  "/decision-ledger": RedirectToOperateApprovals,
  "/model-routing": RedirectToSystemModels,
  "/operating-loops": RedirectToOperateRuns,
  "/permission-security": RedirectToSystemCredentials,
  "/business-os": RedirectToOperate,
  "/project-snapshots": RedirectToSystemWarehouse,
  "/durable-memory": RedirectToSystemStorage,
  "/permission-runtime": RedirectToOperateApprovals,
  "/cost-governor": RedirectToTradingResearch,
  "/loop-runner": RedirectToSystemWorkers,
  "/business-command": RedirectToOperate,
  "/agent-workbench": RedirectToOperateActions,
  "/evaluation-gates": RedirectToTradingBacktesting,
  "/autonomy-readiness": RedirectToOperateEvidence,
  "/project-registry": RedirectToSystemWarehouse,
  "/project-plan-command-center": RedirectToOperateActions,
  "/telemetry-fabric": RedirectToSystemWarehouse,
  "/incident-command": RedirectToOperateIncidents,
  "/deployment-promotion": RedirectToSystemDeployments,
  "/secrets-posture": RedirectToSystemCredentials,
  "/data-source-catalog": RedirectToSystemWarehouse,
  "/finance-attribution": RedirectToTradingResearch,
  "/learning-engine": RedirectToTradingResearch,
  "/agent-eval-lab": RedirectToTradingBacktesting,
  "/executive-cockpit": RedirectToOperate,
  "/production-verification": RedirectToSystemFreshness,
  "/command-gates": RedirectToOperateApprovals,
  "/telemetry-adapters": RedirectToSystemWarehouse,
  "/incident-ingestion": RedirectToOperateIncidents,
  "/promotion-runner": RedirectToSystemDeployments,
  "/secret-scanner": RedirectToSystemCredentials,
  "/cost-attribution-engine": RedirectToTradingResearch,
  "/learning-ingestion": RedirectToTradingResearch,
  "/model-eval-harness": RedirectToTradingBacktesting,
  "/circuit-breakers": RedirectToOperateApprovals,
  "/production-sweep": RedirectToSystemFreshness,
  "/hetzner-promotion-execution": RedirectToSystemDeployments,
  "/command-gate-coverage": RedirectToOperateApprovals,
  "/project-adapter-rollout": RedirectToSystemWarehouse,
  "/incident-automation": RedirectToOperateIncidents,
  "/live-secret-scan": RedirectToSystemCredentials,
  "/cost-reconciliation": RedirectToTradingResearch,
  "/outcome-learning-feeds": RedirectToTradingResearch,
  "/golden-eval-execution": RedirectToTradingBacktesting,
  "/hard-breaker-enforcement": RedirectToOperateApprovals,
  "/network-runner-adapter": RedirectToSystemFreshness,
  "/hetzner-ssh-adapter": RedirectToSystemDeployments,
  "/secret-provider-adapter": RedirectToSystemCredentials,
  "/billing-provider-adapter": RedirectToTradingResearch,
  "/project-outcome-emitter": RedirectToTradingResearch,
  "/provider-eval-runner": RedirectToTradingBacktesting,
  "/breaker-middleware": RedirectToOperateApprovals,
  "/incident-subscriptions": RedirectToOperateIncidents,
  "/evidence-artifact-store": RedirectToSystemStorage,
  "/release-train-orchestrator": RedirectToSystemDeployments,
  "/production-screenshot-runner": ProductionScreenshotRunnerPage,
  "/hetzner-promotion-transport": HetznerPromotionTransportPage,
  "/server-secret-posture-scanner": ServerSecretPostureScannerPage,
  "/incident-notification-fanout": IncidentNotificationFanoutPage,
  "/durable-artifact-backend": DurableArtifactBackendPage,
  "/remaining-project-outcome-adapters": RemainingProjectOutcomeAdaptersPage,
  "/breaker-middleware-rollout": BreakerMiddlewareRolloutPage,
  "/provider-eval-execution": ProviderEvalExecutionPage,
  "/billing-provider-integrations": BillingProviderIntegrationsPage,
  "/release-train-execution": ReleaseTrainExecutionPage,
  "/dashboard-kit-gallery": DashboardKitGalleryPage,
  "/fleet-maturity-review": FleetMaturityReviewPage,
  "/models": ModelsPage,
  "/logs": LogsPage,
  "/cron": CronPage,
  "/skills": SkillsPage,
  "/plugins": PluginsPage,
  "/mcp": McpPage,
  "/pairing": PairingPage,
  "/channels": ChannelsPage,
  "/webhooks": WebhooksPage,
  "/system": SystemPage,
  "/profiles": ProfilesPage,
  "/profiles/new": ProfileBuilderPage,
  "/config": ConfigPage,
  "/env": EnvPage,
  "/docs": DocsPage,
};

export const BUILTIN_NAV_REST: BuiltinNavItem[] = [
  { path: "/sessions", labelKey: "sessions", label: "Sessions", icon: MessageSquare },
  { path: "/files", label: "Files", icon: FolderOpen },
  { path: "/analytics", labelKey: "analytics", label: "Analytics", icon: BarChart3 },
  { path: "/central-command", label: "Central Command", icon: Building2 },
  { path: "/package-native/khashi-vc", label: "Khashi Native", icon: Activity },
  { path: "/task-routing", label: "Task Routing", icon: ListChecks },
  { path: "/decision-ledger", label: "Decision Ledger", icon: BookOpen },
  { path: "/operating-loops", label: "Operating Loops", icon: RotateCw },
  { path: "/project-snapshots", label: "Snapshots", icon: Radio },
  { path: "/durable-memory", label: "Memory Store", icon: Database },
  { path: "/permission-runtime", label: "Permission Runtime", icon: ShieldCheck },
  { path: "/cost-governor", label: "Cost Governor", icon: Scale },
  { path: "/loop-runner", label: "Loop Runner", icon: RotateCw },
  { path: "/business-command", label: "Business Command", icon: BriefcaseBusiness },
  { path: "/agent-workbench", label: "Agent Workbench", icon: ListChecks },
  { path: "/evaluation-gates", label: "Evaluation Gates", icon: BookOpen },
  { path: "/project-registry", label: "Project Registry", icon: Building2 },
  { path: "/project-plan-command-center", label: "Plan Command", icon: ListChecks },
  { path: "/telemetry-fabric", label: "Telemetry Fabric", icon: Activity },
  { path: "/incident-command", label: "Incident Command", icon: Siren },
  { path: "/deployment-promotion", label: "Promotion", icon: GitBranch },
  { path: "/secrets-posture", label: "Secrets Posture", icon: KeyRound },
  { path: "/data-source-catalog", label: "Data Sources", icon: Database },
  { path: "/finance-attribution", label: "Attribution", icon: Scale },
  { path: "/learning-engine", label: "Learning Engine", icon: Sparkles },
  { path: "/agent-eval-lab", label: "Agent Eval Lab", icon: Code2 },
  { path: "/executive-cockpit", label: "Executive Cockpit", icon: Building2 },
  { path: "/production-verification", label: "Prod Verify", icon: Globe },
  { path: "/command-gates", label: "Command Gates", icon: ShieldCheck },
  { path: "/telemetry-adapters", label: "Telemetry Adapters", icon: Radio },
  { path: "/incident-ingestion", label: "Incident Ingest", icon: Siren },
  { path: "/promotion-runner", label: "Promotion Runner", icon: GitBranch },
  { path: "/secret-scanner", label: "Secret Scanner", icon: KeyRound },
  { path: "/cost-attribution-engine", label: "Cost Engine", icon: Scale },
  { path: "/learning-ingestion", label: "Learning Ingest", icon: Sparkles },
  { path: "/model-eval-harness", label: "Eval Harness", icon: Code2 },
  { path: "/circuit-breakers", label: "Circuit Breakers", icon: ShieldCheck },
  { path: "/production-sweep", label: "Prod Sweep", icon: Globe },
  { path: "/hetzner-promotion-execution", label: "Hetzner Promote", icon: GitBranch },
  { path: "/command-gate-coverage", label: "Gate Coverage", icon: ShieldCheck },
  { path: "/project-adapter-rollout", label: "Adapter Rollout", icon: Radio },
  { path: "/incident-automation", label: "Incident Auto", icon: Siren },
  { path: "/live-secret-scan", label: "Live Secret Scan", icon: KeyRound },
  { path: "/cost-reconciliation", label: "Cost Reconcile", icon: Scale },
  { path: "/outcome-learning-feeds", label: "Outcome Feeds", icon: Sparkles },
  { path: "/golden-eval-execution", label: "Eval Execution", icon: Code2 },
  { path: "/hard-breaker-enforcement", label: "Hard Breakers", icon: ShieldCheck },
  { path: "/network-runner-adapter", label: "Network Runner", icon: Globe },
  { path: "/hetzner-ssh-adapter", label: "Hetzner SSH", icon: Terminal },
  { path: "/secret-provider-adapter", label: "Secret Adapter", icon: KeyRound },
  { path: "/billing-provider-adapter", label: "Billing Adapter", icon: Scale },
  { path: "/project-outcome-emitter", label: "Outcome Emitter", icon: Radio },
  { path: "/provider-eval-runner", label: "Provider Runner", icon: Code2 },
  { path: "/breaker-middleware", label: "Breaker Middleware", icon: ShieldCheck },
  { path: "/incident-subscriptions", label: "Incident Subs", icon: Siren },
  { path: "/evidence-artifact-store", label: "Evidence Store", icon: Database },
  { path: "/release-train-orchestrator", label: "Release Train", icon: GitBranch },
  { path: "/production-screenshot-runner", label: "Screenshots", icon: GalleryVerticalEnd },
  { path: "/hetzner-promotion-transport", label: "SSH Promote", icon: Terminal },
  { path: "/server-secret-posture-scanner", label: "Server Secrets", icon: KeyRound },
  { path: "/incident-notification-fanout", label: "Incident Fanout", icon: Siren },
  { path: "/durable-artifact-backend", label: "Artifact Backend", icon: Database },
  { path: "/remaining-project-outcome-adapters", label: "Outcome Adapters", icon: Radio },
  { path: "/breaker-middleware-rollout", label: "Breaker Rollout", icon: ShieldCheck },
  { path: "/provider-eval-execution", label: "Provider Evals", icon: Code2 },
  { path: "/billing-provider-integrations", label: "Billing APIs", icon: Scale },
  { path: "/release-train-execution", label: "Train Execute", icon: GitBranch },
  { path: "/dashboard-kit-gallery", label: "Kit Gallery", icon: GalleryVerticalEnd },
  { path: "/trading-intelligence", label: "Command Center", icon: CandlestickChart },
  { path: "/head-trader", label: "Head Trader", icon: MessageSquare },
  { path: "/second-brain", label: "Second Brain", icon: Database },
  { path: "/compounding-intelligence", label: "Compounding Intel", icon: BrainCircuit },
  { path: "/decision-lineage", label: "Decision Lineage", icon: GitBranch },
  { path: "/contradictions", label: "Contradictions", icon: ShieldAlert },
  { path: "/research-queue", label: "Research Queue", icon: FlaskConical },
  { path: "/preflight", label: "Preflight", icon: SearchCheck },
  { path: "/fleet-maturity-review", label: "Fleet Review", icon: ListChecks },
  { path: "/models", labelKey: "models", label: "Models", icon: Cpu },
  { path: "/logs", labelKey: "logs", label: "Logs", icon: FileText },
  { path: "/cron", labelKey: "cron", label: "Cron", icon: Clock },
  { path: "/skills", labelKey: "skills", label: "Skills", icon: Package },
  { path: "/plugins", labelKey: "plugins", label: "Plugins", icon: Puzzle },
  { path: "/mcp", label: "MCP", icon: Plug },
  { path: "/channels", label: "Channels", icon: Radio },
  { path: "/webhooks", label: "Webhooks", icon: Webhook },
  { path: "/pairing", label: "Pairing", icon: ShieldCheck },
  { path: "/profiles", labelKey: "profiles", label: "Profiles", icon: Users },
  { path: "/config", labelKey: "config", label: "Config", icon: Settings },
  { path: "/env", labelKey: "keys", label: "Keys", icon: KeyRound },
  { path: "/system", label: "System", icon: Wrench },
  { path: "/docs", labelKey: "documentation", label: "Documentation", icon: BookOpen },
];

export const OPERATOR_NAV_GROUPS: OperatorNavGroup[] = [
  {
    id: "operate",
    label: "Operate",
    path: "/operate",
    icon: Activity,
    legacyPaths: [
      "/central-command",
      "/business-command",
      "/task-routing",
      "/decision-ledger",
      "/incident-command",
      "/operating-loops",
      "/fleet-maturity-review",
      "/second-brain",
      "/compounding-intelligence",
      "/decision-lineage",
      "/contradictions",
      "/research-queue",
      "/preflight",
    ],
    items: [
      { path: "/operate", label: "Overview", icon: Building2 },
      { path: "/operate/blockers", label: "Blockers", icon: ShieldCheck },
      { path: "/operate/actions", label: "Actions", icon: ListChecks },
      { path: "/operate/incidents", label: "Incidents", icon: Siren },
      { path: "/operate/approvals", label: "Approvals", icon: BookOpen },
      { path: "/operate/runs", label: "Recent Runs", icon: RotateCw },
      { path: "/operate/evidence", label: "Evidence", icon: Database },
      { path: "/second-brain", label: "Second Brain", icon: Database },
      { path: "/compounding-intelligence", label: "Compounding Intel", icon: BrainCircuit },
      { path: "/decision-lineage", label: "Decision Lineage", icon: GitBranch },
      { path: "/contradictions", label: "Contradictions", icon: ShieldAlert },
      { path: "/research-queue", label: "Research Queue", icon: FlaskConical },
      { path: "/preflight", label: "Preflight", icon: SearchCheck },
      { path: "/operate/chat-actions", label: "Chat Actions", icon: Terminal },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    path: "/trading",
    icon: CandlestickChart,
    legacyPaths: [
      "/trading-intelligence",
      "/head-trader",
      "/package-native/khashi-vc",
      "/finance-attribution",
    ],
    items: [
      { path: "/trading", label: "Overview", icon: CandlestickChart },
      { path: "/trading/khashi", label: "Khashi", icon: Activity },
      { path: "/trading/investing", label: "Investing System", icon: Scale },
      { path: "/trading/strategies", label: "Strategies", icon: Workflow },
      { path: "/trading/backtesting", label: "Backtesting", icon: BarChart3 },
      { path: "/trading/shadow-paper", label: "Shadow / Paper", icon: Radio },
      { path: "/trading/risk", label: "Risk & Capital", icon: ShieldCheck },
      { path: "/trading/head-trader", label: "Head Trader", icon: MessageSquare },
      { path: "/trading/evidence", label: "Trading Evidence", icon: Database },
    ],
  },
  {
    id: "system",
    label: "System",
    path: "/system",
    icon: Database,
    legacyPaths: [
      "/sessions",
      "/files",
      "/analytics",
      "/models",
      "/logs",
      "/cron",
      "/skills",
      "/plugins",
      "/mcp",
      "/pairing",
      "/channels",
      "/webhooks",
      "/profiles",
      "/config",
      "/env",
      "/docs",
      "/data-source-catalog",
      "/production-verification",
      "/durable-artifact-backend",
      "/deployment-promotion",
      "/secrets-posture",
    ],
    items: [
      { path: "/system", label: "Overview", icon: Wrench },
      { path: "/system/warehouse", label: "Data Warehouse", icon: Database },
      { path: "/system/freshness", label: "Freshness", icon: Globe },
      { path: "/system/storage", label: "Storage", icon: Database },
      { path: "/system/workers", label: "Workers", icon: RotateCw },
      { path: "/system/deployments", label: "Deployments", icon: GitBranch },
      { path: "/system/credentials", label: "Credentials", icon: KeyRound },
      { path: "/system/models", label: "Models", icon: Cpu },
      { path: "/system/automations", label: "Automations", icon: Clock },
      { path: "/system/sessions", label: "Sessions", icon: MessageSquare },
      { path: "/system/logs", label: "Logs", icon: FileText },
      { path: "/system/plugins", label: "Plugins", icon: Puzzle },
      { path: "/system/admin", label: "Admin", icon: Settings },
      { path: "/system/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];
