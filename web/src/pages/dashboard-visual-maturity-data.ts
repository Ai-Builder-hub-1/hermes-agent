export interface DashboardVisualTier {
  tier: string;
  label: string;
  minimumScore: number;
  meaning: string;
}

export interface DashboardVisualCriterion {
  id: string;
  weight: number;
  checks: readonly string[];
}

export interface DashboardVisualReviewItem {
  id: string;
  project: string;
  route: string;
  surface: string;
  state: "queued" | "in-review" | "changes-requested" | "approved" | "excepted";
  targetVisualTier: string;
  currentVisualTier: string;
  priority: string;
  reason: string;
  requiredEvidence: readonly string[];
  nextAction: string;
}

export interface DashboardDesignPreference {
  id: string;
  type: "approval" | "rejection";
  scope: string;
  preference: string;
  appliesTo: readonly string[];
}

export const dashboardVisualMaturityGeneratedAt = "2026-08-14";

export const dashboardVisualTiers: DashboardVisualTier[] = [
  {
    tier: "V0",
    label: "Raw functional surface",
    minimumScore: 0,
    meaning: "The route renders and may be usable, but visual hierarchy, spacing, interaction polish, and product fit are not approved.",
  },
  {
    tier: "V1",
    label: "Readable organized surface",
    minimumScore: 55,
    meaning: "One-shell and readable, with no catastrophic overflow, but still visually generic or uneven.",
  },
  {
    tier: "V2",
    label: "Consistent system surface",
    minimumScore: 72,
    meaning: "Uses shared shell, spacing, cards, tables, forms, and states consistently, but still needs product-grade hierarchy.",
  },
  {
    tier: "V3",
    label: "Product-grade cockpit",
    minimumScore: 88,
    meaning: "Modern, task-oriented, polished, responsive, interaction-complete, and aligned with approved reference families.",
  },
  {
    tier: "V4",
    label: "Reference-grade pattern leader",
    minimumScore: 96,
    meaning: "Approved as a reusable visual reference for future dashboards and component-kit evolution.",
  },
];

export const dashboardVisualCriteria: DashboardVisualCriterion[] = [
  { id: "sidebar-navigation", weight: 10, checks: ["one sidebar only", "clear grouping and active state", "polished collapsed and expanded states", "labels never overflow"] },
  { id: "page-hierarchy", weight: 10, checks: ["primary task is obvious", "no repeated hero clutter", "supporting information stays secondary"] },
  { id: "spacing-rhythm", weight: 10, checks: ["same horizontal and vertical rhythm", "cards do not touch or crowd", "page edges align consistently"] },
  { id: "card-composition", weight: 8, checks: ["headers and controls align", "no dropped-in background cards", "density matches content type"] },
  { id: "typography-copy", weight: 8, checks: ["container-appropriate heading scale", "helper text moves into help affordances", "labels are scannable"] },
  { id: "tables-data-surfaces", weight: 10, checks: ["tables sit inside cards", "pagination above threshold", "sort and filters are consolidated", "wide data scrolls inside the table only"] },
  { id: "charts-visualizations", weight: 10, checks: ["real chart components", "axes and labels where applicable", "honest loading, empty, stale, and error states", "no hand-drawn chart look"] },
  { id: "forms-drawers-actions", weight: 9, checks: ["modern compact forms", "clear drawer persistence", "buttons have predictable verified results"] },
  { id: "responsive-containment", weight: 9, checks: ["desktop, tablet, mobile, and collapsed-sidebar proof", "no clipping", "intentional scroll behavior"] },
  { id: "reference-alignment", weight: 8, checks: ["Mobbin/reference family cited", "approved screenshots compared", "rejected patterns are not repeated"] },
  { id: "product-workflow-fit", weight: 8, checks: ["supports a real workflow", "critical actions are clickable", "state persists or explains why not"] },
];

export const dashboardVisualReviewQueue: DashboardVisualReviewItem[] = [
  {
    id: "visual-review-meal-assistant-planner-v3",
    project: "meal-assistant",
    route: "/",
    surface: "meal-dashboard-shell",
    state: "queued",
    targetVisualTier: "V3",
    currentVisualTier: "V1",
    priority: "high",
    reason: "Technically clean, but the visible planner/sidebar/calendar experience still looks generic and uneven.",
    requiredEvidence: [
      "current desktop screenshot",
      "current mobile screenshot",
      "planner drawer screenshot",
      "Mobbin/reference intake for calendar/planner and household operations",
      "rubric score before and after",
      "human approval or changes-requested decision",
    ],
    nextAction: "Use the Meal Assistant V3 migration packet, then redesign only against the approved target structure.",
  },
];

export const dashboardDesignPreferences: DashboardDesignPreference[] = [
  {
    id: "avoid-generic-static-dashboards",
    type: "rejection",
    scope: "fleet",
    preference: "Do not call a dashboard complete just because it is technically compliant; it must look like a modern product surface.",
    appliesTo: ["all dashboards"],
  },
  {
    id: "avoid-fat-repeated-banners",
    type: "rejection",
    scope: "fleet",
    preference: "Avoid large repeated banners on every page. Keep command context compact unless it is the main command-center surface.",
    appliesTo: ["command center", "media operations", "market intelligence", "business operations"],
  },
  {
    id: "tables-inside-card-with-pagination",
    type: "approval",
    scope: "fleet",
    preference: "Tables should sit inside a coherent card, use tabs for related tables, and paginate at 10/25/50 above threshold.",
    appliesTo: ["data tables", "queues", "evidence tables", "runs"],
  },
  {
    id: "help-text-becomes-help-icon",
    type: "approval",
    scope: "fleet",
    preference: "Long helper text should move into a help icon/tooltip pattern instead of visible paragraph clutter.",
    appliesTo: ["page headers", "cards", "sections"],
  },
  {
    id: "modern-real-chart-components",
    type: "approval",
    scope: "fleet",
    preference: "Charts must use real modern chart components with axes, labels, tooltips, states, and comparison controls where relevant.",
    appliesTo: ["charts", "financial dashboards", "media dashboards", "operations dashboards"],
  },
];

export const mealAssistantVisualMigrationPacket = {
  id: "meal-assistant-visual-v3-migration",
  project: "meal-assistant",
  currentVisualTier: "V1",
  targetVisualTier: "V3",
  targetPages: [
    "Month-first planning workspace with one real calendar grid and a right-side drawer for day or multi-day planning.",
    "Modern searchable meal library with filters, broad meal attributes, and quick edit drawer.",
    "Small insight surface for repeated proteins, skipped days, checklist history, and planning rhythm.",
  ],
  componentsNeeded: [
    "PremiumSidebar",
    "PlannerMonthCalendar",
    "PlannerDayDrawer",
    "MultiDaySelectionBar",
    "MealLibrarySurface",
    "FilterRail",
    "ChecklistExportPanel",
    "HelpTooltip",
  ],
  workflowProof: [
    "select one day",
    "select multiple non-adjacent days",
    "open drawer",
    "save meal choices",
    "auto-fill selected days without adjacent generated protein repeat",
    "export broad checklist",
    "reload and verify persistence",
  ],
};
