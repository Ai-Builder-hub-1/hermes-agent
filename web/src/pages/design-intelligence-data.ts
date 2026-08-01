export type BuildVersionStatus = "ready" | "in-progress" | "planned";

export interface BuildVersion {
  id: "V1" | "V2" | "V3" | "V4" | "V5" | "V6";
  title: string;
  goal: string;
  status: BuildVersionStatus;
  priority: "P0" | "P1" | "P2";
  gaps: string[];
  artifacts: string[];
  validation: string[];
  exitCriteria: string[];
}

export interface PatternRegistryEntry {
  id: string;
  title: string;
  classification: string;
  purpose: string;
  useWhen: string;
  avoidWhen: string;
  requiredComponents: string[];
  requiredStates: string[];
  responsiveRules: string[];
  accessibility: string[];
  dataContracts: string[];
  mobbinReferences: string[];
}

export interface ComponentOwnershipRule {
  layer: string;
  owner: string;
  useFor: string;
  avoidFor: string;
  examples: string[];
}

export interface ValidationCommand {
  id: string;
  command: string;
  version: string;
  purpose: string;
  expectedSignal: string;
}

export interface TierBand {
  band: string;
  tier: 0 | 1 | 2 | 3;
  label: string;
  meaning: string;
}

export interface ProjectTierAssessment {
  project: string;
  name: string;
  auditStatus: "current" | "needs-review" | "stale" | "missing" | "unregistered";
  coarseTier: string;
  currentBand: string;
  targetBand: string;
  warnings: string[];
  nextMove: string;
}

export const tierBands: TierBand[] = [
  { band: "T0P", tier: 0, label: "Planned or governance-only", meaning: "Project is registered for governance/readiness but has no audited operator surface yet." },
  { band: "T0L", tier: 0, label: "Raw legacy surface", meaning: "Dashboard exists as a raw report, debug table, prototype, or ungoverned screen." },
  { band: "T1A", tier: 1, label: "Adapter-aligned shell", meaning: "Canonical CSS/static adapter is synced, but no surface-level component inventory is enforceable." },
  { band: "T1B", tier: 1, label: "Inventoried one-shell report", meaning: "One-shell route and surfaces are inventoried, but the main operator path still reads as a report." },
  { band: "T2A", tier: 2, label: "Hybrid shared-component dashboard", meaning: "Primary surface uses shared-kit contracts through a static or hybrid implementation, but is not fully package-native." },
  { band: "T2B", tier: 2, label: "Package-native shared-component dashboard", meaning: "Primary surface imports shared components directly and covers required states, but is not yet a product-grade cockpit." },
  { band: "T3A", tier: 3, label: "Cockpit candidate with review gaps", meaning: "Dashboard targets product-grade cockpit behavior but still has Tier 3 visual, shell, chart, proof, or interaction warnings." },
  { band: "T3B", tier: 3, label: "Current static/hybrid product cockpit", meaning: "Audited product-grade cockpit is current, but delivery still depends on static or hybrid adapter infrastructure." },
  { band: "T3C", tier: 3, label: "Package-native product cockpit", meaning: "Highest maturity: audited Tier 3 cockpit implemented directly with shared package components and complete proof/validation." },
];

export const projectTierAssessments: ProjectTierAssessment[] = [
  {
    project: "khashi-vc",
    name: "Kashi VC",
    auditStatus: "needs-review",
    coarseTier: "3->3",
    currentBand: "T3A",
    targetBand: "T3C",
    warnings: ["packageNative.bridge", "tier3.sidebarRailMissing", "tier3.commandHeaderMissing", "tier3.chartPanelMissing"],
    nextMove: "Repair Tier 3 visual/shell/chart markers in the live command surface; then plan package-native route migration.",
  },
  {
    project: "media-engine",
    name: "Media Engine",
    auditStatus: "needs-review",
    coarseTier: "3->3",
    currentBand: "T3B",
    targetBand: "T3C",
    warnings: ["packageNative.bridge"],
    nextMove: "Preserve as the current static/hybrid Tier 3 reference; next maturity step is package-native implementation.",
  },
  {
    project: "media-business-os",
    name: "Media Business OS",
    auditStatus: "needs-review",
    coarseTier: "1->3",
    currentBand: "T1A",
    targetBand: "T3C",
    warnings: ["experienceTier.migrationRequired", "packageNative.bridge"],
    nextMove: "Add surface inventory, pick primary recipe, define data/state contracts, then build shared-component cockpit.",
  },
  {
    project: "business-mapper",
    name: "Business Mapper",
    auditStatus: "needs-review",
    coarseTier: "1->2",
    currentBand: "T1A",
    targetBand: "T2B",
    warnings: ["experienceTier.migrationRequired"],
    nextMove: "Add surface inventory and migrate primary dashboard path to shared components.",
  },
  {
    project: "meal-assistant",
    name: "Meal Assistant",
    auditStatus: "needs-review",
    coarseTier: "1->3",
    currentBand: "T1A",
    targetBand: "T3C",
    warnings: ["experienceTier.migrationRequired", "packageNative.bridge", "implementationMode.serverRenderedLegacy"],
    nextMove: "Add surface inventory, define the product cockpit routes, and migrate away from hand-authored server-rendered dashboard HTML/CSS.",
  },
  {
    project: "hermes-os",
    name: "Hermes OS",
    auditStatus: "needs-review",
    coarseTier: "0->3",
    currentBand: "T0P",
    targetBand: "T3C",
    warnings: ["experienceTier.migrationRequired", "packageNative.bridge"],
    nextMove: "Decide whether Hermes OS owns a production operator dashboard or remains governance-only; if dashboard-owned, add surfaces and target package-native cockpit.",
  },
  {
    project: "tlc-capital-group-os",
    name: "TLC Capital Group OS",
    auditStatus: "needs-review",
    coarseTier: "0->3",
    currentBand: "T0P",
    targetBand: "T3C",
    warnings: ["experienceTier.migrationRequired", "packageNative.bridge"],
    nextMove: "Inventory executive/operator surfaces and define whether this becomes a package-native cockpit or remains a readiness consumer.",
  },
];

export const buildVersions: BuildVersion[] = [
  {
    id: "V1",
    title: "Standards Gate Foundation",
    goal: "Stop new UI work from bypassing the existing Hermes standards.",
    status: "ready",
    priority: "P0",
    gaps: [
      "Standards documented but not fully agent-enforced",
      "Page-pattern classification not mandatory",
      "Mobbin workflow needs execution templates",
    ],
    artifacts: [
      "Agent-ready proposal template",
      "ReferenceCard data shape",
      "Standards gate checklist",
      "Design docs handoff",
    ],
    validation: [
      "npm run dashboard:design-system:status",
      "npm run architecture:standards:validate",
      "npm run dashboard:governance:validate",
      "npm run dashboard:interface-system:validate",
    ],
    exitCriteria: [
      "Every new page proposal includes classification, state map, component map, data contract, responsive behavior, and validation commands.",
      "Mobbin references are tied to specific patterns.",
      "Tier 3 pages cannot proceed without responsive and accessibility coverage.",
    ],
  },
  {
    id: "V2",
    title: "Component Ownership and Pattern Registry",
    goal: "Make component choices deterministic for humans and agents.",
    status: "ready",
    priority: "P0",
    gaps: [
      "Dashboard kit vs product UI boundaries need clearer decision rules",
      "Component catalog needs richer implementation guidance",
      "Form/configuration pattern is less mature than dashboard pattern",
    ],
    artifacts: [
      "Component ownership decision table",
      "Pattern registry",
      "Settings/configuration recipe",
      "Component usage rules",
    ],
    validation: [
      "npm run dashboard:recipe:score",
      "npm run dashboard-kit:adoption:audit",
      "V1 governance validators",
    ],
    exitCriteria: [
      "Agents can choose existing components before creating new ones.",
      "Local component duplication is easier to detect.",
      "Configuration pages have validation and state rules.",
    ],
  },
  {
    id: "V3",
    title: "Data Contracts and Runtime Readiness",
    goal: "Make dashboards decision-grade by requiring source, freshness, schema, and transformation ownership.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Live data contract maturity is uneven",
      "Runtime schema ownership is not visible enough to design agents",
      "Dashboard proposals need data fetching, caching, and rerender-risk notes",
    ],
    artifacts: [
      "Dashboard data contract template",
      "Freshness and stale-data checklist",
      "API type to UI model mapping convention",
      "ContractInspector spec",
    ],
    validation: [
      "npm run architecture:standards:validate",
      "npm run dashboard:governance:validate",
      "Data-contract checklist review",
    ],
    exitCriteria: [
      "Promoted dashboards state whether data is live, cached, stale, partial, simulated, or static.",
      "UI models are not implicitly coupled to raw API responses.",
      "Charts and tables include data ownership notes.",
    ],
  },
  {
    id: "V4",
    title: "Visual QA and Responsive Proof",
    goal: "Make visual quality, responsiveness, and accessibility measurable before promotion.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Visual QA is not yet a universal gate",
      "Responsive behavior needs proof across desktop, tablet, mobile, and embedded panes",
      "Accessibility acceptance criteria need to be present in every handoff",
    ],
    artifacts: [
      "Screenshot proof checklist",
      "Accessibility acceptance checklist",
      "ResponsiveProofMatrix spec",
      "StandardsGatePanel spec",
    ],
    validation: [
      "Playwright screenshot review",
      "Axe/accessibility checks where available",
      "V1 governance validators",
    ],
    exitCriteria: [
      "Promoted dashboards include visual proof.",
      "Text containment and overlap issues are checked before release.",
      "Accessibility is reviewed at pattern and implementation level.",
    ],
  },
  {
    id: "V5",
    title: "Advanced Workspaces, Tables, and Charts",
    goal: "Standardize high-density operational interfaces.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Chart behavior is standardized at chrome level but not always at interaction level",
      "Advanced table tiers are not explicit enough",
      "Cross-filtering, drill-down, export, and virtualization criteria need recipes",
    ],
    artifacts: [
      "Table tier decision matrix",
      "Chart selection guide",
      "Master-detail explorer recipe",
      "Drill-down and cross-filtering spec",
    ],
    validation: [
      "npm run dashboard:recipe:score",
      "npm run dashboard:world-class:audit",
      "Visual QA from V4",
    ],
    exitCriteria: [
      "Agents stop inventing table and chart behavior per page.",
      "Dense operational pages use known patterns.",
      "Virtualization and export are added only when justified.",
    ],
  },
  {
    id: "V6",
    title: "Package-Native Adoption and Downstream Rollout",
    goal: "Scale the standards across Hermes surfaces and downstream projects.",
    status: "ready",
    priority: "P2",
    gaps: [
      "Cross-project adoption remains uneven",
      "Static adapters are synced but package-native adoption is the higher maturity target",
      "Validator outputs need concise summaries for agent consumption",
    ],
    artifacts: [
      "Adoption dashboard",
      "Validator summary output format",
      "Downstream migration checklist",
      "Package-native dashboard starter",
    ],
    validation: [
      "npm run dashboard-kit:adoption:audit",
      "npm run dashboard:world-class:audit",
      "npm run dashboard:v80:validate",
      "npm run dashboard:standards:summary",
    ],
    exitCriteria: [
      "Agents can see which projects are synced, package-native, stale, or non-compliant.",
      "Downstream projects reuse kit contracts instead of copying static styles.",
      "Governance output is concise enough for CI and agent workflows.",
    ],
  },
];

export const componentOwnershipRules: ComponentOwnershipRule[] = [
  {
    layer: "Product primitives",
    owner: "@nous-research/ui",
    useFor: "Buttons, typography, app primitives, shared form controls, and product-level interaction primitives.",
    avoidFor: "Dashboard shells, dashboard metrics, dashboard table chrome, chart panels, and dashboard recipes.",
    examples: ["Button", "Typography", "SelectionSwitcher", "Spinner"],
  },
  {
    layer: "Dashboard patterns",
    owner: "@hermes/dashboard-kit",
    useFor: "Dashboard shells, metric grids, KPI cards, status pills, filter bars, data tables, chart panels, queues, timelines, launchers, and governance dashboards.",
    avoidFor: "Low-level app shell primitives and non-dashboard product controls already owned by @nous-research/ui.",
    examples: ["DashboardShell", "DashboardHeader", "MetricGrid", "DataTable", "ChartPanel", "CommandBar"],
  },
  {
    layer: "Domain components",
    owner: "Feature package or route module",
    useFor: "Typed wrappers around Hermes-specific data such as model routing, gateway health, project snapshots, permissions, and incidents.",
    avoidFor: "Reusable shell, card, table, chart, and filter behavior that belongs in the kit.",
    examples: ["ModelRoutingPolicyTable", "GatewayHealthInspector", "ProjectSnapshotAdapter"],
  },
  {
    layer: "Page routes",
    owner: "web/src/pages or apps/desktop route owner",
    useFor: "Composition, data loading, URL state, and page-specific orchestration.",
    avoidFor: "Inventing new primitives, raw visual values, or duplicate dashboard components.",
    examples: ["DesignIntelligenceCommandCenterPage", "AgentWorkbenchPage", "PermissionSecurityPage"],
  },
];

export const patternRegistry: PatternRegistryEntry[] = [
  {
    id: "command-center",
    title: "Command Center",
    classification: "command-center",
    purpose: "Show what is running, blocked, stale, and awaiting action.",
    useWhen: "Operators use the page repeatedly and need current state plus commands.",
    avoidWhen: "The page is mainly retrospective reporting or documentation.",
    requiredComponents: ["DashboardShell", "DashboardHeader", "MetricGrid", "KpiCard", "RunStatusPanel", "QueuePanel", "DataTable", "CommandBar"],
    requiredStates: ["loading", "partial-data", "stale-data", "empty", "error", "permission-restricted", "mobile"],
    responsiveRules: ["Desktop supports rail plus workspace plus optional inspector.", "Tablet moves inspector below content.", "Mobile prioritizes status, queue, and commands."],
    accessibility: ["Keyboard access for commands", "Visible focus states", "Non-color-only status labels"],
    dataContracts: ["DashboardSnapshot", "QueueSnapshot", "ActionNeeded", "RuntimeEvidenceRecord"],
    mobbinReferences: ["https://mobbin.com/screens/3910777c-e414-4971-a4b9-06f67f18f02c", "https://mobbin.com/screens/b06f4a90-1c59-4ec7-a9ff-11290860e8a4"],
  },
  {
    id: "agent-workbench",
    title: "Agent Workbench",
    classification: "agent-workbench",
    purpose: "Let users run, inspect, approve, and steer agent sessions.",
    useWhen: "The main task is active agent operation.",
    avoidWhen: "The surface is only a static list or settings page.",
    requiredComponents: ["SessionRail", "Thread", "ToolActivityTimeline", "ApprovalControls", "PreviewPanel", "ModelProfileControls"],
    requiredStates: ["loading", "connecting", "awaiting-approval", "tool-error", "offline", "permission-restricted", "mobile"],
    responsiveRules: ["Desktop uses split workbench.", "Narrow widths collapse preview and rail into drawers or tabs."],
    accessibility: ["Transcript landmarks", "Approval controls reachable by keyboard", "Status changes announced"],
    dataContracts: ["SessionState", "ToolCall", "ApprovalRequest", "ModelOptionsResponse"],
    mobbinReferences: ["https://mobbin.com/screens/6afb4b94-70da-4bf0-9174-b5a9479accc0"],
  },
  {
    id: "configuration-policy",
    title: "Configuration and Policy",
    classification: "configuration",
    purpose: "Safely configure providers, permissions, model routing, gateway, plugins, MCP, and preferences.",
    useWhen: "Fields persist and mistakes affect runtime behavior.",
    avoidWhen: "The task is mostly monitoring or discovery.",
    requiredComponents: ["SettingsNavigation", "FormSection", "ValidationMessage", "CommandBar", "AuditEventList", "PermissionLabel"],
    requiredStates: ["dirty", "saving", "saved", "validation-error", "server-error", "permission-restricted", "stale-configuration"],
    responsiveRules: ["Desktop uses side navigation plus form area.", "Mobile stacks sections and pins save/reset actions."],
    accessibility: ["Programmatic labels", "Error summaries", "Unsaved-change warning", "Keyboard save/reset path"],
    dataContracts: ["SettingsSchema", "ValidationResult", "PermissionPolicy", "AuditRecord"],
    mobbinReferences: ["https://mobbin.com/screens/17bfb444-4520-487d-9cf1-d1cc6584be43"],
  },
  {
    id: "master-detail-explorer",
    title: "Master-Detail Explorer",
    classification: "master-detail-explorer",
    purpose: "Scan high-density rows and inspect one selected item without losing list context.",
    useWhen: "Users sort, filter, compare, and drill into records repeatedly.",
    avoidWhen: "There are only a few low-complexity records.",
    requiredComponents: ["FilterBar", "SearchInput", "SegmentedControl", "DataTable", "InspectorPanel", "ActivityTimeline"],
    requiredStates: ["loading", "empty", "zero-results", "partial-data", "stale-data", "error", "mobile"],
    responsiveRules: ["Desktop uses table plus right inspector.", "Tablet moves inspector below.", "Mobile turns rows into summaries and inspector into sheet."],
    accessibility: ["Table headers and sort controls", "Selection state announced", "Inspector focus management"],
    dataContracts: ["ExplorerRow[]", "ExplorerDetail", "FilterState", "SortState"],
    mobbinReferences: ["https://mobbin.com/screens/79d68519-f53a-4cee-af87-32c39727a0dd", "https://mobbin.com/screens/54b4f913-aa07-40e0-9b51-3f6cc0d9b11d"],
  },
];

export const validationCommands: ValidationCommand[] = [
  {
    id: "design-system-status",
    command: "npm run dashboard:design-system:status",
    version: "V1",
    purpose: "Confirms dashboard-kit source and static adapters are synced.",
    expectedSignal: "Pass with current kit CSS hash and no stale adapter errors.",
  },
  {
    id: "architecture-standards",
    command: "npm run architecture:standards:validate",
    version: "V1",
    purpose: "Checks architecture and standards guardrails.",
    expectedSignal: "Zero errors.",
  },
  {
    id: "governance",
    command: "npm run dashboard:governance:validate",
    version: "V1",
    purpose: "Checks dashboard governance rules.",
    expectedSignal: "Zero errors.",
  },
  {
    id: "interface-system",
    command: "npm run dashboard:interface-system:validate",
    version: "V1",
    purpose: "Checks dashboard interface-system contract.",
    expectedSignal: "Zero errors.",
  },
  {
    id: "recipe-score",
    command: "npm run dashboard:recipe:score",
    version: "V2",
    purpose: "Scores governed routes against recipe metadata requirements.",
    expectedSignal: "All governed routes score at least 80.",
  },
  {
    id: "adoption-audit",
    command: "npm run dashboard-kit:adoption:audit",
    version: "V6",
    purpose: "Checks package-native/static adapter adoption state across projects.",
    expectedSignal: "No stale priority surfaces.",
  },
  {
    id: "summary",
    command: "npm run dashboard:standards:summary",
    version: "V6",
    purpose: "Runs high-signal validators and emits concise pass/fail lines for agents and CI.",
    expectedSignal: "Concise summary with non-zero exit on failed required checks.",
  },
];
