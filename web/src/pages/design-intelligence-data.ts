export type BuildVersionStatus = "ready" | "in-progress" | "planned";

export interface BuildVersion {
  id: "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" | "V11" | "V12";
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

export interface CentralMaturityGap {
  id: string;
  version: string;
  area: string;
  gap: string;
  enhancement: string;
  status: "built" | "tracked" | "external";
  validation: string;
}

export interface GovernanceException {
  id: string;
  owner: string;
  reviewer: string;
  blockedGate: string;
  reason: string;
  replacementPlan: string;
  expiresAt: string;
}

export const governanceExceptions: GovernanceException[] = [];

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
  {
    id: "V7",
    title: "Visual Evidence Layer",
    goal: "Make screenshots, viewport coverage, and visual proof explicit before promotion.",
    status: "ready",
    priority: "P0",
    gaps: [
      "Project tiers can classify structure without proving visual quality",
      "Responsive proof needs a stable viewport matrix",
      "Production screenshot evidence needs a reusable registry",
    ],
    artifacts: [
      "docs/design/dashboard-visual-evidence-layer.json",
      "scripts/validate-dashboard-visual-evidence.mjs",
      "production screenshot evidence contract",
    ],
    validation: [
      "npm run dashboard:visual-evidence:validate",
      "npm run dashboard:visual:check",
      "npm run dashboard:visual-quality:score",
    ],
    exitCriteria: [
      "Tier 3 promotion requires screenshot or visual-quality evidence.",
      "Desktop, tablet, mobile, and embedded panel viewports are part of the standard.",
      "Visual proof includes nonblank render, text containment, overlap, and state coverage signals.",
    ],
  },
  {
    id: "V8",
    title: "Component Maturity Registry",
    goal: "Grade shared components independently from project tiers.",
    status: "ready",
    priority: "P0",
    gaps: [
      "Project maturity can hide weak component evidence",
      "Component documentation and accessibility proof are uneven",
      "New primitives need promotion rules",
    ],
    artifacts: [
      "docs/design/dashboard-component-maturity-registry.json",
      "scripts/validate-dashboard-component-maturity.mjs",
      "component maturity levels and promotion rules",
    ],
    validation: [
      "npm run dashboard:component-maturity:validate",
      "npm run dashboard:usage:audit:strict",
    ],
    exitCriteria: [
      "Core shell, table, chart, filter, drawer, and command components have ownership and evidence.",
      "Missing component evidence is visible as maturity backlog.",
      "Certified components cannot list unresolved evidence gaps.",
    ],
  },
  {
    id: "V9",
    title: "Token and Styling Enforcement",
    goal: "Prevent drift from Hermes/Kaoshi visual identity.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Hard-coded colors, radii, and shadows can bypass tokens",
      "Token families need a centralized enforcement contract",
      "Dark-mode and density rules need explicit source artifacts",
    ],
    artifacts: [
      "docs/design/dashboard-token-enforcement.json",
      "scripts/validate-dashboard-token-enforcement.mjs",
      "forbidden styling pattern registry",
    ],
    validation: [
      "npm run dashboard:token-enforcement:validate",
      "npm run dashboard:theme-contract:validate",
    ],
    exitCriteria: [
      "Token families and forbidden raw-style patterns are declared.",
      "Token source artifacts exist and are enforceable.",
      "New visual values require token mapping rather than page-local styling drift.",
    ],
  },
  {
    id: "V10",
    title: "Review Packet Generator",
    goal: "Produce one human-review artifact from tier, backlog, visual, component, and reference data.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Review evidence is spread across many docs",
      "Human approval needs a consistent packet",
      "Agents need a Codex-ready packet before implementation",
    ],
    artifacts: [
      "docs/design/dashboard-review-packet-standard.json",
      "docs/design/dashboard-review-packets/latest.json",
      "docs/design/dashboard-review-packets/latest.md",
      "scripts/generate-dashboard-review-packet.mjs",
      "scripts/validate-dashboard-review-packet.mjs",
    ],
    validation: [
      "npm run dashboard:review-packet:generate",
      "npm run dashboard:review-packet:validate",
    ],
    exitCriteria: [
      "Review packets include project tiers, external backlog, Mobbin references, visual evidence, and component maturity.",
      "Packets include approval checklist and source hash.",
      "Major redesigns have a single handoff artifact before implementation.",
    ],
  },
  {
    id: "V11",
    title: "Mobbin Reference Map Runtime",
    goal: "Operationalize Mobbin as pattern evidence without copying full screens.",
    status: "ready",
    priority: "P1",
    gaps: [
      "Mobbin references exist but need structured extraction",
      "References must map to patterns and Kaoshi adaptations",
      "Do-not-copy guidance must be explicit",
    ],
    artifacts: [
      "docs/design/dashboard-mobbin-reference-map.json",
      "scripts/validate-dashboard-mobbin-reference-map.mjs",
      "Mobbin usefulFor/doNotCopy/kaoshiAdaptation fields",
    ],
    validation: [
      "npm run dashboard:mobbin-reference-map:validate",
      "npm run dashboard:mobbin-intake:generate",
    ],
    exitCriteria: [
      "Every reference maps to one or more patterns.",
      "Every reference includes extraction notes and do-not-copy notes.",
      "Kaoshi adaptation rules keep Hermes tokens and components as source of truth.",
    ],
  },
  {
    id: "V12",
    title: "Governance and CI Gates",
    goal: "Define advisory, blocking, and human-approval gates for dashboard promotion.",
    status: "ready",
    priority: "P0",
    gaps: [
      "Standards need explicit promotion rules",
      "CI needs clear advisory vs blocking responsibilities",
      "Exceptions need owner, expiry, and replacement plans",
    ],
    artifacts: [
      "docs/design/dashboard-governance-ci-gates.json",
      "scripts/validate-dashboard-governance-ci.mjs",
      "promotion and exception rules",
    ],
    validation: [
      "npm run dashboard:governance-ci:validate",
      "npm run dashboard:standards:summary",
    ],
    exitCriteria: [
      "Registered governance commands exist in package.json.",
      "Tier promotion rules are explicit from T0/T1 through T3C.",
      "Expired or incomplete exceptions block promotion.",
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
  {
    id: "visual-evidence",
    command: "npm run dashboard:visual-evidence:validate",
    version: "V7",
    purpose: "Validates viewport matrix, visual proof signals, screenshot evidence, and quality report linkage.",
    expectedSignal: "Zero errors; warnings identify thin or low-scoring visual evidence.",
  },
  {
    id: "component-maturity",
    command: "npm run dashboard:component-maturity:validate",
    version: "V8",
    purpose: "Validates shared component ownership, maturity, tier requirement, and evidence paths.",
    expectedSignal: "Zero errors; warnings identify missing maturity evidence.",
  },
  {
    id: "token-enforcement",
    command: "npm run dashboard:token-enforcement:validate",
    version: "V9",
    purpose: "Validates token families, source artifacts, and forbidden styling-pattern rules.",
    expectedSignal: "Zero errors.",
  },
  {
    id: "review-packet",
    command: "npm run dashboard:review-packet:validate",
    version: "V10",
    purpose: "Validates the generated human-review packet and required design approval sections.",
    expectedSignal: "Zero errors after dashboard:review-packet:generate.",
  },
  {
    id: "mobbin-reference-map",
    command: "npm run dashboard:mobbin-reference-map:validate",
    version: "V11",
    purpose: "Validates pattern-specific Mobbin extraction and Kaoshi adaptation notes.",
    expectedSignal: "Zero errors.",
  },
  {
    id: "governance-ci",
    command: "npm run dashboard:governance-ci:validate",
    version: "V12",
    purpose: "Validates advisory, blocking, human-review, promotion, and exception gates.",
    expectedSignal: "Zero errors and all commands registered.",
  },
];

export const centralMaturityGaps: CentralMaturityGap[] = [
  {
    id: "component-evidence",
    version: "V8",
    area: "Component maturity",
    gap: "Core components still need Storybook/state, accessibility, mobile, and behavior evidence.",
    enhancement: "Track evidence per component in the maturity registry and block certified status until resolved.",
    status: "tracked",
    validation: "npm run dashboard:component-maturity:validate",
  },
  {
    id: "visual-regression",
    version: "V7",
    area: "Visual proof",
    gap: "Visual quality uses screenshots and heuristics, but approved baselines are not complete for every governed route.",
    enhancement: "Use visual baseline capture/compare and production screenshots as promotion evidence.",
    status: "tracked",
    validation: "npm run dashboard:visual-evidence:validate",
  },
  {
    id: "token-scanner",
    version: "V9",
    area: "Styling enforcement",
    gap: "Raw colors, radii, shadows, and viewport-scaled type need changed-file scanning.",
    enhancement: "Run the dashboard token scanner in strict mode through the standards summary.",
    status: "built",
    validation: "npm run dashboard:token-scan:strict",
  },
  {
    id: "live-mobbin-refresh",
    version: "V11",
    area: "Mobbin workflow",
    gap: "References are structured, but live MCP refresh remains a human or agent action.",
    enhancement: "Keep the reference map validated and refresh it through Mobbin intake when material redesigns start.",
    status: "tracked",
    validation: "npm run dashboard:mobbin-reference-map:validate",
  },
  {
    id: "per-project-packets",
    version: "V10",
    area: "Review packets",
    gap: "Review packets were global only.",
    enhancement: "Generate project-specific packets with `--project <id>` for targeted approval.",
    status: "built",
    validation: "npm run dashboard:review-packet:validate",
  },
  {
    id: "ci-governance",
    version: "V12",
    area: "CI gates",
    gap: "Governance rules needed actual workflow coverage.",
    enhancement: "Run fast and full standards summaries, token scan, visual, and accessibility checks in dashboard CI.",
    status: "built",
    validation: "npm run dashboard:governance-ci:validate",
  },
  {
    id: "accessibility-route-check",
    version: "V7",
    area: "Accessibility",
    gap: "Accessibility proof needed a focused Design Intelligence route check.",
    enhancement: "Add an `@a11y` Playwright/axe check for the central standards console.",
    status: "built",
    validation: "npm run dashboard:a11y:check",
  },
  {
    id: "exception-expiry",
    version: "V12",
    area: "Promotion governance",
    gap: "Exceptions needed owner/reviewer/expiry enforcement.",
    enhancement: "Validate the governance exception registry and block expired exceptions.",
    status: "built",
    validation: "npm run dashboard:governance-exceptions:validate",
  },
  {
    id: "downstream-migrations",
    version: "V6",
    area: "External projects",
    gap: "Project-local package-native migrations and T0/T1 uplift remain outside this repo.",
    enhancement: "Keep those items in the external work backlog until implemented inside each project.",
    status: "external",
    validation: "npm run dashboard:tier-assessment:validate",
  },
  {
    id: "visual-freshness",
    version: "V7",
    area: "Visual coverage",
    gap: "Visual evidence needs freshness metadata and an SLA, not only screenshot existence.",
    enhancement: "Track screenshot age and a 30-day freshness SLA in the visual coverage report.",
    status: "built",
    validation: "npm run dashboard:visual-coverage:report",
  },
  {
    id: "promotion-readiness-score",
    version: "V12",
    area: "Promotion readiness",
    gap: "Tier, visual coverage, external backlog, component debt, and token debt needed one combined readiness signal.",
    enhancement: "Generate project-level promotion readiness scores from maturity reports.",
    status: "built",
    validation: "npm run dashboard:promotion-readiness:generate",
  },
  {
    id: "token-baseline",
    version: "V9",
    area: "Token debt",
    gap: "Legacy token findings needed explicit suppressions so new debt can be blocked.",
    enhancement: "Baseline token findings by file/rule count and fail strict scans when counts increase.",
    status: "built",
    validation: "npm run dashboard:token-suppressions:generate",
  },
  {
    id: "branch-protection-verification",
    version: "V12",
    area: "Release governance",
    gap: "Branch protection requirements were documented but not machine-checkable.",
    enhancement: "Verify configured GitHub branch protection when gh API access is available.",
    status: "built",
    validation: "npm run dashboard:branch-protection:verify",
  },
];
