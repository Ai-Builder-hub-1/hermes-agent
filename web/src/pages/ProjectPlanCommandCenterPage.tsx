import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import {
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSidebar,
  DataTable,
  KpiCard,
  MetricGrid,
  ProgressMetric,
  StatusPill,
  type DataTableColumn,
} from "@hermes/dashboard-kit";
import { fetchJSON } from "@/lib/api";

type RemainingCategory = "build" | "integration" | "production" | "decision" | "human" | "backlog";
type DocumentKind = "actual" | "reference" | "template" | "ignored";

interface PlanItem {
  id: string;
  project?: string;
  projectPath?: string;
  planPath?: string;
  text: string;
  state: "open" | "partial" | "blocked" | "done";
  categories: RemainingCategory[];
  blocked: boolean;
  humanRequired: boolean;
  sourcePath: string;
  line: number;
  section: string;
  planTitle: string;
}

interface ProjectPlan {
  title: string;
  relativePath: string;
  documentKind: DocumentKind;
  documentReason: string;
  completed: number;
  partial: number;
  blocked: number;
  open: number;
  total: number;
  completionPercent: number;
  explicitCompletion: number | null;
  ratioCompletion: number | null;
}

interface ProjectSummary {
  name: string;
  path: string;
  dashboardId: string;
  url: string;
  healthUrl: string;
  documents: ProjectPlan[];
  documentCounts: Record<DocumentKind, number>;
  plans: ProjectPlan[];
  planWork: PlanWork[];
  workItems: PlanItem[];
  completionPercent: number;
  openItems: number;
  blockedItems: number;
  humanItems: number;
  rawOpenItems: number;
  remainingCounts: Record<RemainingCategory, number>;
  remaining: Record<RemainingCategory, PlanItem[]>;
  nextActions: PlanItem[];
}

interface PlanIndex {
  generatedAt: string;
  projectsRoot: string;
  registryPath: string;
  totals: {
    projects: number;
    plans: number;
    rawDocuments: number;
    referenceDocuments: number;
    templateDocuments: number;
    ignoredDocuments: number;
    openItems: number;
    rawOpenItems: number;
    buildItems: number;
    integrationItems: number;
    productionItems: number;
    decisionItems: number;
    humanItems: number;
    backlogItems: number;
    blockedItems: number;
  };
  projects: ProjectSummary[];
  globalRemaining: Record<RemainingCategory, PlanItem[]>;
  workQueue: PlanItem[];
}

interface PlanWork {
  title: string;
  relativePath: string;
  completionPercent: number;
  openItems: number;
  blockedItems: number;
  humanItems: number;
  remainingCounts: Record<RemainingCategory, number>;
  items: PlanItem[];
}

const categoryLabels: Record<RemainingCategory, string> = {
  build: "Build",
  integration: "Integrate",
  production: "Production",
  decision: "Decide",
  human: "Human",
  backlog: "Backlog",
};

const projectColumns: DataTableColumn<ProjectSummary>[] = [
  {
    id: "project",
    header: "Project",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.dashboardId || row.path}</div>
      </div>
    ),
    sortValue: (row) => row.name,
  },
  { id: "plans", header: "Actual Plans", accessor: (row) => row.plans.length, sortValue: (row) => row.plans.length },
  {
    id: "raw",
    header: "Raw Docs",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <StatusPill tone="success">Actual {row.documentCounts.actual}</StatusPill>
        <StatusPill tone="info">Ref {row.documentCounts.reference}</StatusPill>
        <StatusPill tone="neutral">Template {row.documentCounts.template}</StatusPill>
        <StatusPill tone="neutral">Ignored {row.documentCounts.ignored}</StatusPill>
      </div>
    ),
    sortValue: (row) => row.documents.length,
  },
  { id: "open", header: "Open", accessor: (row) => row.openItems, sortValue: (row) => row.openItems },
  {
    id: "gates",
    header: "Gates",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <StatusPill tone={row.blockedItems ? "critical" : "success"}>Blocked {row.blockedItems}</StatusPill>
        <StatusPill tone={row.humanItems ? "warning" : "success"}>Human {row.humanItems}</StatusPill>
      </div>
    ),
    sortValue: (row) => row.blockedItems + row.humanItems,
  },
  {
    id: "remaining",
    header: "Remaining Work",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(categoryLabels) as RemainingCategory[]).map((category) => (
          <StatusPill key={category} tone={toneForCategory(category)}>
            {categoryLabels[category]} {row.remainingCounts[category] ?? 0}
          </StatusPill>
        ))}
      </div>
    ),
  },
  {
    id: "completion",
    header: "Completion",
    accessor: (row) => <ProgressMetric label={row.name} value={row.completionPercent} tone={row.completionPercent >= 90 ? "success" : "warning"} />,
    sortValue: (row) => row.completionPercent,
  },
];

const planColumns: DataTableColumn<ProjectPlan & { project: string }>[] = [
  {
    id: "plan",
    header: "Plan",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.title}</div>
        <div className="text-xs text-muted-foreground">{row.project} / {row.relativePath}</div>
      </div>
    ),
    sortValue: (row) => `${row.project}/${row.relativePath}`,
  },
  { id: "total", header: "Items", accessor: (row) => row.total, sortValue: (row) => row.total },
  { id: "done", header: "Done", accessor: (row) => row.completed, sortValue: (row) => row.completed },
  { id: "open", header: "Open", accessor: (row) => row.open + row.partial + row.blocked, sortValue: (row) => row.open + row.partial + row.blocked },
  {
    id: "completion",
    header: "Completion",
    accessor: (row) => <ProgressMetric label={row.title} value={row.completionPercent} tone={row.completionPercent >= 90 ? "success" : "warning"} />,
    sortValue: (row) => row.completionPercent,
  },
];

const documentColumns: DataTableColumn<ProjectPlan & { project: string }>[] = [
  {
    id: "document",
    header: "Document",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.title}</div>
        <div className="text-xs text-muted-foreground">{row.project} / {row.relativePath}</div>
      </div>
    ),
    sortValue: (row) => `${row.project}/${row.relativePath}`,
  },
  {
    id: "kind",
    header: "Type",
    accessor: (row) => <StatusPill tone={toneForDocument(row.documentKind)}>{row.documentKind}</StatusPill>,
    sortValue: (row) => row.documentKind,
  },
  { id: "reason", header: "Reason", accessor: (row) => row.documentReason, sortValue: (row) => row.documentReason },
  { id: "items", header: "Items", accessor: (row) => row.total, sortValue: (row) => row.total },
  { id: "open", header: "Open", accessor: (row) => row.open + row.partial + row.blocked, sortValue: (row) => row.open + row.partial + row.blocked },
];

const planWorkColumns: DataTableColumn<PlanWork & { project: string }>[] = [
  {
    id: "plan",
    header: "Plan",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.title}</div>
        <div className="text-xs text-muted-foreground">{row.project} / {row.relativePath}</div>
      </div>
    ),
    sortValue: (row) => `${row.project}/${row.relativePath}`,
  },
  { id: "open", header: "Open Items", accessor: (row) => row.openItems, sortValue: (row) => row.openItems },
  {
    id: "gates",
    header: "Gates",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <StatusPill tone={row.blockedItems ? "critical" : "success"}>Blocked {row.blockedItems}</StatusPill>
        <StatusPill tone={row.humanItems ? "warning" : "success"}>Human {row.humanItems}</StatusPill>
      </div>
    ),
    sortValue: (row) => row.blockedItems + row.humanItems,
  },
  {
    id: "categories",
    header: "Category Read",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(categoryLabels) as RemainingCategory[]).map((category) => (
          <StatusPill key={category} tone={toneForCategory(category)}>
            {categoryLabels[category]} {row.remainingCounts[category] ?? 0}
          </StatusPill>
        ))}
      </div>
    ),
  },
  {
    id: "completion",
    header: "Completion",
    accessor: (row) => <ProgressMetric label={row.title} value={row.completionPercent} tone={row.completionPercent >= 90 ? "success" : "warning"} />,
    sortValue: (row) => row.completionPercent,
  },
];

const itemColumns: DataTableColumn<PlanItem>[] = [
  {
    id: "item",
    header: "Remaining Item",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.text}</div>
        <div className="text-xs text-muted-foreground">
          {row.project ? `${row.project} / ` : ""}{row.planPath ?? row.sourcePath}:{row.line}
        </div>
      </div>
    ),
    sortValue: (row) => row.text,
  },
  {
    id: "state",
    header: "State",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <StatusPill tone={toneForState(row.state)}>{row.state}</StatusPill>
        {row.blocked ? <StatusPill tone="critical">blocked</StatusPill> : null}
        {row.humanRequired ? <StatusPill tone="warning">human</StatusPill> : null}
      </div>
    ),
    sortValue: (row) => row.state,
  },
  {
    id: "category",
    header: "Category",
    accessor: (row) => (
      <div className="flex flex-wrap gap-1.5">
        {row.categories.map((category) => (
          <StatusPill key={category} tone={toneForCategory(category)}>{categoryLabels[category]}</StatusPill>
        ))}
      </div>
    ),
  },
  { id: "plan", header: "Plan", accessor: (row) => row.planTitle, sortValue: (row) => row.planTitle },
  { id: "id", header: "Task ID", accessor: (row) => <code className="text-xs">{row.id}</code>, sortValue: (row) => row.id },
];

export default function ProjectPlanCommandCenterPage() {
  const [index, setIndex] = useState<PlanIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const next = await fetchJSON<PlanIndex>("/api/project-plan-index");
      setIndex(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan index unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const plans = useMemo(() => {
    return (index?.projects ?? []).flatMap((project) => project.plans.map((plan) => ({ ...plan, project: project.name })));
  }, [index]);

  const documents = useMemo(() => {
    return (index?.projects ?? []).flatMap((project) => project.documents.map((document) => ({ ...document, project: project.name })));
  }, [index]);

  const planWork = useMemo(() => {
    return (index?.projects ?? []).flatMap((project) => project.planWork.map((plan) => ({ ...plan, project: project.name })));
  }, [index]);

  const globalItems = useMemo(() => {
    return index?.workQueue ?? [];
  }, [index]);

  return (
    <DashboardShell
      sidebar={(
        <DashboardSidebar
          title="Plan Command"
          description="Cross-project plan intelligence."
          items={[
            { id: "projects", label: "Projects", href: "#projects", active: true, icon: FileText },
            { id: "plans", label: "Plans", href: "#plans" },
            { id: "plan-work", label: "Plan Work", href: "#plan-work" },
            { id: "documents", label: "Document Audit", href: "#documents" },
            { id: "remaining", label: "Work Queue", href: "#remaining" },
          ]}
        />
      )}
      header={(
        <DashboardHeader
          title="Project Plan Command Center"
          eyebrow="Nous Hermes Agent"
          description="Read-only index of actionable plan documents across projects, with raw document matches separated into actual, reference, template, and ignored buckets."
          actions={<Button onClick={refresh} disabled={loading}><RefreshCw className="h-4 w-4" />{loading ? "Refreshing..." : "Refresh"}</Button>}
          meta={<StatusPill tone={error ? "critical" : "info"}>{error ? "index error" : "live scan"}</StatusPill>}
        />
      )}
    >
      <MetricGrid columns={4}>
        <KpiCard label="Projects" value={index?.totals.projects ?? 0} detail="discovered from registry and workspace" tone="info" />
        <KpiCard label="Actual Plans" value={index?.totals.plans ?? 0} detail={`${index?.totals.rawDocuments ?? 0} raw document matches`} tone="success" />
        <KpiCard label="Excluded Docs" value={(index?.totals.referenceDocuments ?? 0) + (index?.totals.templateDocuments ?? 0) + (index?.totals.ignoredDocuments ?? 0)} detail="reference, templates, and ignored docs" tone="neutral" />
        <KpiCard label="Open Items" value={index?.totals.openItems ?? 0} detail={`${index?.totals.rawOpenItems ?? 0} raw open items before filtering`} tone={(index?.totals.openItems ?? 0) ? "warning" : "success"} />
      </MetricGrid>

      <MetricGrid columns={4}>
        <KpiCard label="Build" value={index?.totals.buildItems ?? 0} detail="implementation and test work" tone="info" />
        <KpiCard label="Integration" value={index?.totals.integrationItems ?? 0} detail="connectors and data flows" tone="warning" />
        <KpiCard label="Production" value={index?.totals.productionItems ?? 0} detail="deployment readiness" tone="warning" />
        <KpiCard label="Decision" value={index?.totals.decisionItems ?? 0} detail="operator choices needed" tone="info" />
      </MetricGrid>

      <MetricGrid columns={3}>
        <KpiCard label="Human Required" value={index?.totals.humanItems ?? 0} detail="approval, credentials, ownership, manual input" tone={(index?.totals.humanItems ?? 0) ? "warning" : "success"} />
        <KpiCard label="Known Backlog" value={index?.totals.backlogItems ?? 0} detail="backlog, remaining, todo, known gaps" tone="info" />
        <KpiCard label="Blocked" value={index?.totals.blockedItems ?? 0} detail="blocked, waiting, dependency, missing input" tone={(index?.totals.blockedItems ?? 0) ? "critical" : "success"} />
      </MetricGrid>

      <DashboardSection id="projects" title="Projects" description={index ? `Root: ${index.projectsRoot}` : "Loading project root."}>
        <DataTable
          columns={projectColumns}
          rows={index?.projects ?? []}
          getRowKey={(row) => row.path}
          loading={loading}
          error={error}
          emptyTitle="No plans found"
          emptyDescription="Add plan or task Markdown files under project docs, plans, or tasks directories."
        />
      </DashboardSection>

      <DashboardSection id="plans" title="Plan Status" description="Completion is derived from checkbox items, explicit percentages, or readiness ratios.">
        <DataTable
          columns={planColumns}
          rows={plans}
          getRowKey={(row) => `${row.project}/${row.relativePath}`}
          loading={loading}
          error={error}
        />
      </DashboardSection>

      <DashboardSection id="plan-work" title="Plan Work Breakdown" description="Open actionable work grouped by project and plan, with category counts that can feed future build-batch commands.">
        <DataTable
          columns={planWorkColumns}
          rows={planWork}
          getRowKey={(row) => `${row.project}/${row.relativePath}`}
          loading={loading}
          error={error}
        />
      </DashboardSection>

      <DashboardSection id="documents" title="Document Audit" description="Every raw scanner match, including why it is counted as an actual plan or separated from the actionable plan set.">
        <DataTable
          columns={documentColumns}
          rows={documents}
          getRowKey={(row) => `${row.project}/${row.relativePath}`}
          loading={loading}
          error={error}
        />
      </DashboardSection>

      <DashboardSection id="remaining" title="Actionable Work Queue" description="Unique unchecked, partial, or blocked plan items with stable task IDs, source documents, categories, and line numbers.">
        <DataTable
          columns={itemColumns}
          rows={globalItems}
          getRowKey={(row) => `${row.project ?? "project"}-${row.id}`}
          loading={loading}
          error={error}
        />
      </DashboardSection>
    </DashboardShell>
  );
}

function toneForState(state: PlanItem["state"]) {
  if (state === "done") return "success";
  if (state === "blocked") return "critical";
  if (state === "partial") return "warning";
  return "info";
}

function toneForCategory(category: RemainingCategory) {
  if (category === "production") return "warning";
  if (category === "integration") return "info";
  if (category === "human") return "warning";
  if (category === "decision") return "neutral";
  if (category === "backlog") return "info";
  return "success";
}

function toneForDocument(kind: DocumentKind) {
  if (kind === "actual") return "success";
  if (kind === "reference") return "info";
  return "neutral";
}
