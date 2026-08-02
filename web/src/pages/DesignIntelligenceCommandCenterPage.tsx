import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  GalleryVerticalEnd,
  GitBranch,
  Layers3,
  ListChecks,
  MonitorSmartphone,
  Network,
  Rows3,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import {
  ChartPanel,
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSidebar,
  DataTable,
  FilterBar,
  KpiCard,
  MetricGrid,
  ProgressMetric,
  SearchInput,
  SegmentedControl,
  StatusPill,
  type DataTableColumn,
  type DashboardNavItem,
} from "@hermes/dashboard-kit";
import {
  buildVersions,
  componentOwnershipRules,
  patternRegistry,
  validationCommands,
  type BuildVersion,
  type CentralMaturityGap,
  type ComponentOwnershipRule,
  type GovernanceException,
  type PatternRegistryEntry,
  type ValidationCommand,
  centralMaturityGaps,
  governanceExceptions,
} from "./design-intelligence-data";
import {
  projectTierAssessments,
  type ProjectTierExternalWorkItem,
  type ProjectTierAssessment,
} from "./project-tier-assessment-data";
import {
  componentCertification,
  componentEvidenceBacklog,
  promotionReadiness,
  tokenDebtBacklog,
  visualCoverage,
  visualEvidenceTasks,
} from "./dashboard-maturity-data";

type ViewMode = "versions" | "projects" | "readiness" | "visual" | "tokens" | "components" | "external" | "gaps" | "exceptions" | "patterns" | "ownership" | "validation";

type ExternalWorkRow = ProjectTierExternalWorkItem & {
  project: string;
  projectName: string;
  currentBand: string;
  targetBand: string;
};
type ReadinessRow = {
  project: string;
  name: string;
  currentBand: string;
  targetBand: string;
  score: number;
  status: string;
  blockers: { project: readonly string[]; central: readonly string[]; external: readonly string[] };
};
type VisualCoverageRow = {
  dashboardId: string;
  label: string;
  status: string;
  screenshotAgeDays: number | null;
  visualQualityScore: number | null;
  visualQualityStatus: string;
  hasProofUrl: boolean;
};
type TokenDebtRow = {
  file: string;
  rule: string;
  count: number;
  priority: string;
  action: string;
};
type ComponentEvidenceRow = {
  component: string;
  evidence: string;
  priority: string;
  requiredForTier: string;
};

const statusTone = {
  ready: "success",
  "in-progress": "warning",
  planned: "info",
} as const;

function visualTone(status: string) {
  if (status === "covered") return "success";
  if (status === "stale-evidence") return "warning";
  return "critical";
}

function readinessTone(status: string) {
  if (status === "blocked") return "critical";
  if (status === "near-ready" || status === "needs-work") return "warning";
  return "success";
}

const versionColumns: DataTableColumn<BuildVersion>[] = [
  {
    id: "version",
    header: "Version",
    accessor: (row) => <span className="font-mono-ui text-xs font-semibold">{row.id}</span>,
    sortValue: (row) => row.id,
  },
  {
    id: "title",
    header: "Build",
    accessor: (row) => (
      <div className="min-w-0">
        <div className="font-medium text-foreground">{row.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{row.goal}</div>
      </div>
    ),
    sortValue: (row) => row.title,
  },
  {
    id: "priority",
    header: "Priority",
    accessor: (row) => <StatusPill tone={row.priority === "P0" ? "critical" : row.priority === "P1" ? "warning" : "info"}>{row.priority}</StatusPill>,
    sortValue: (row) => row.priority,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <StatusPill tone={statusTone[row.status]}>{row.status}</StatusPill>,
    sortValue: (row) => row.status,
  },
  {
    id: "artifacts",
    header: "Artifacts",
    accessor: (row) => row.artifacts.length,
    sortValue: (row) => row.artifacts.length,
  },
];

const patternColumns: DataTableColumn<PatternRegistryEntry>[] = [
  {
    id: "pattern",
    header: "Pattern",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{row.classification}</div>
      </div>
    ),
    sortValue: (row) => row.title,
  },
  {
    id: "purpose",
    header: "Purpose",
    accessor: (row) => row.purpose,
    sortValue: (row) => row.purpose,
  },
  {
    id: "states",
    header: "States",
    accessor: (row) => row.requiredStates.length,
    sortValue: (row) => row.requiredStates.length,
  },
  {
    id: "contracts",
    header: "Contracts",
    accessor: (row) => row.dataContracts.length,
    sortValue: (row) => row.dataContracts.length,
  },
];

const ownershipColumns: DataTableColumn<ComponentOwnershipRule>[] = [
  { id: "layer", header: "Layer", accessor: (row) => <span className="font-medium">{row.layer}</span>, sortValue: (row) => row.layer },
  { id: "owner", header: "Owner", accessor: (row) => <span className="font-mono-ui text-xs">{row.owner}</span>, sortValue: (row) => row.owner },
  { id: "use", header: "Use For", accessor: (row) => row.useFor, sortValue: (row) => row.useFor },
  { id: "avoid", header: "Avoid For", accessor: (row) => row.avoidFor, sortValue: (row) => row.avoidFor },
];

const validationColumns: DataTableColumn<ValidationCommand>[] = [
  { id: "id", header: "Check", accessor: (row) => <span className="font-medium">{row.id}</span>, sortValue: (row) => row.id },
  { id: "version", header: "Version", accessor: (row) => <StatusPill tone="info">{row.version}</StatusPill>, sortValue: (row) => row.version },
  { id: "command", header: "Command", accessor: (row) => <span className="font-mono-ui text-xs">{row.command}</span>, sortValue: (row) => row.command },
  { id: "signal", header: "Expected Signal", accessor: (row) => row.expectedSignal, sortValue: (row) => row.expectedSignal },
];

const gapColumns: DataTableColumn<CentralMaturityGap>[] = [
  {
    id: "area",
    header: "Area",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.area}</div>
        <div className="mt-1 font-mono-ui text-xs text-muted-foreground">{row.version} · {row.id}</div>
      </div>
    ),
    sortValue: (row) => row.area,
  },
  {
    id: "gap",
    header: "Gap",
    accessor: (row) => row.gap,
    sortValue: (row) => row.gap,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <StatusPill tone={row.status === "built" ? "success" : row.status === "external" ? "warning" : "info"}>{row.status}</StatusPill>,
    sortValue: (row) => row.status,
  },
  {
    id: "validation",
    header: "Validation",
    accessor: (row) => <span className="font-mono-ui text-xs">{row.validation}</span>,
    sortValue: (row) => row.validation,
  },
];

const exceptionColumns: DataTableColumn<GovernanceException>[] = [
  { id: "id", header: "Exception", accessor: (row) => <span className="font-medium">{row.id}</span>, sortValue: (row) => row.id },
  { id: "gate", header: "Blocked Gate", accessor: (row) => row.blockedGate, sortValue: (row) => row.blockedGate },
  { id: "owner", header: "Owner", accessor: (row) => row.owner, sortValue: (row) => row.owner },
  { id: "reviewer", header: "Reviewer", accessor: (row) => row.reviewer, sortValue: (row) => row.reviewer },
  { id: "expires", header: "Expires", accessor: (row) => row.expiresAt, sortValue: (row) => row.expiresAt },
];

const projectColumns: DataTableColumn<ProjectTierAssessment>[] = [
  {
    id: "project",
    header: "Project",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.name}</div>
        <div className="mt-1 font-mono-ui text-xs text-muted-foreground">{row.project}</div>
      </div>
    ),
    sortValue: (row) => row.name,
  },
  {
    id: "status",
    header: "Audit",
    accessor: (row) => <StatusPill tone={row.auditStatus === "current" ? "success" : "warning"}>{row.auditStatus}</StatusPill>,
    sortValue: (row) => row.auditStatus,
  },
  {
    id: "coarse",
    header: "Coarse",
    accessor: (row) => <span className="font-mono-ui text-xs">{row.coarseTier.current ?? "unset"}-&gt;{row.coarseTier.target ?? "unset"}</span>,
    sortValue: (row) => `${row.coarseTier.current ?? "unset"}->${row.coarseTier.target ?? "unset"}`,
  },
  {
    id: "band",
    header: "Band",
    accessor: (row) => <StatusPill tone={row.currentBand.startsWith("T3") ? row.currentBand === "T3A" ? "warning" : "success" : "info"}>{row.currentBand}</StatusPill>,
    sortValue: (row) => row.currentBand,
  },
  {
    id: "target",
    header: "Target",
    accessor: (row) => row.targetBand,
    sortValue: (row) => row.targetBand,
  },
  {
    id: "warnings",
    header: "Warnings",
    accessor: (row) => row.warnings.length,
    sortValue: (row) => row.warnings.length,
  },
];

const readinessColumns: DataTableColumn<ReadinessRow>[] = [
  {
    id: "project",
    header: "Project",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.name}</div>
        <div className="mt-1 font-mono-ui text-xs text-muted-foreground">{row.currentBand} {"->"} {row.targetBand}</div>
      </div>
    ),
    sortValue: (row) => row.name,
  },
  { id: "score", header: "Score", accessor: (row) => <span className="font-mono-ui text-xs">{row.score}/100</span>, sortValue: (row) => row.score },
  { id: "status", header: "Status", accessor: (row) => <StatusPill tone={readinessTone(row.status)}>{row.status}</StatusPill>, sortValue: (row) => row.status },
  { id: "projectBlockers", header: "Project", accessor: (row) => row.blockers.project.join(", ") || "clear", sortValue: (row) => row.blockers.project.length },
  { id: "centralBlockers", header: "Central", accessor: (row) => row.blockers.central.join(", ") || "clear", sortValue: (row) => row.blockers.central.length },
  { id: "externalBlockers", header: "External", accessor: (row) => row.blockers.external.join(", ") || "clear", sortValue: (row) => row.blockers.external.length },
];

const visualColumns: DataTableColumn<VisualCoverageRow>[] = [
  { id: "dashboard", header: "Dashboard", accessor: (row) => <span className="font-medium">{row.label}</span>, sortValue: (row) => row.label },
  { id: "status", header: "Status", accessor: (row) => <StatusPill tone={visualTone(row.status)}>{row.status}</StatusPill>, sortValue: (row) => row.status },
  { id: "age", header: "Age", accessor: (row) => row.screenshotAgeDays === null ? "missing" : `${row.screenshotAgeDays}d`, sortValue: (row) => row.screenshotAgeDays ?? 9999 },
  { id: "quality", header: "Quality", accessor: (row) => row.visualQualityScore === null ? row.visualQualityStatus : `${row.visualQualityScore} ${row.visualQualityStatus}`, sortValue: (row) => row.visualQualityScore ?? 0 },
  { id: "proof", header: "Proof", accessor: (row) => row.hasProofUrl ? "yes" : "no", sortValue: (row) => row.hasProofUrl ? 1 : 0 },
];

const tokenDebtColumns: DataTableColumn<TokenDebtRow>[] = [
  { id: "file", header: "File", accessor: (row) => <span className="font-mono-ui text-xs">{row.file}</span>, sortValue: (row) => row.file },
  { id: "rule", header: "Rule", accessor: (row) => <StatusPill tone={row.priority === "P0" ? "critical" : "warning"}>{row.rule}</StatusPill>, sortValue: (row) => row.rule },
  { id: "count", header: "Count", accessor: (row) => row.count, sortValue: (row) => row.count },
  { id: "action", header: "Action", accessor: (row) => row.action, sortValue: (row) => row.action },
];

const componentEvidenceColumns: DataTableColumn<ComponentEvidenceRow>[] = [
  { id: "component", header: "Component", accessor: (row) => <span className="font-medium">{row.component}</span>, sortValue: (row) => row.component },
  { id: "evidence", header: "Evidence", accessor: (row) => row.evidence, sortValue: (row) => row.evidence },
  { id: "priority", header: "Priority", accessor: (row) => <StatusPill tone={row.priority === "P0" ? "critical" : "warning"}>{row.priority}</StatusPill>, sortValue: (row) => row.priority },
  { id: "tier", header: "Tier", accessor: (row) => row.requiredForTier, sortValue: (row) => row.requiredForTier },
];

const externalWorkColumns: DataTableColumn<ExternalWorkRow>[] = [
  {
    id: "project",
    header: "Project",
    accessor: (row) => (
      <div>
        <div className="font-medium text-foreground">{row.projectName}</div>
        <div className="mt-1 font-mono-ui text-xs text-muted-foreground">{row.project}</div>
      </div>
    ),
    sortValue: (row) => row.projectName,
  },
  {
    id: "priority",
    header: "Priority",
    accessor: (row) => <StatusPill tone={row.priority === "P0" ? "critical" : row.priority === "P1" ? "warning" : "info"}>{row.priority}</StatusPill>,
    sortValue: (row) => row.priority,
  },
  {
    id: "band",
    header: "Band",
    accessor: (row) => <span className="font-mono-ui text-xs">{row.currentBand} {"->"} {row.targetBand || "unset"}</span>,
    sortValue: (row) => `${row.currentBand}->${row.targetBand}`,
  },
  {
    id: "action",
    header: "Action",
    accessor: (row) => row.action,
    sortValue: (row) => row.action,
  },
];

function listBlock(title: string, items: string[]) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function DesignIntelligenceCommandCenterPage() {
  const [view, setView] = useState<ViewMode>("versions");
  const [query, setQuery] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<BuildVersion["id"]>("V1");
  const [selectedPatternId, setSelectedPatternId] = useState(patternRegistry[0]?.id ?? "");

  const selectedVersion = buildVersions.find((version) => version.id === selectedVersionId) ?? buildVersions[0];
  const selectedPattern = patternRegistry.find((pattern) => pattern.id === selectedPatternId) ?? patternRegistry[0];
  const externalWorkRows = useMemo<ExternalWorkRow[]>(() => projectTierAssessments.flatMap((project) =>
    project.externalWorkItems.map((item) => ({
      ...item,
      project: project.project,
      projectName: project.name,
      currentBand: project.currentBand,
      targetBand: project.targetBand,
    }))
  ), []);

  const filteredVersions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return buildVersions;
    return buildVersions.filter((version) => [
      version.id,
      version.title,
      version.goal,
      ...version.gaps,
      ...version.artifacts,
      ...version.validation,
    ].join(" ").toLowerCase().includes(needle));
  }, [query]);

  const navItems: DashboardNavItem[] = [
    { id: "versions", label: "Build Versions", active: view === "versions", icon: GitBranch, onClick: () => setView("versions") },
    { id: "projects", label: "Project Tiers", active: view === "projects", icon: Network, onClick: () => setView("projects") },
    { id: "readiness", label: "Readiness", active: view === "readiness", icon: SlidersHorizontal, onClick: () => setView("readiness") },
    { id: "visual", label: "Visual Coverage", active: view === "visual", icon: MonitorSmartphone, onClick: () => setView("visual") },
    { id: "tokens", label: "Token Debt", active: view === "tokens", icon: Database, onClick: () => setView("tokens") },
    { id: "components", label: "Component Evidence", active: view === "components", icon: GalleryVerticalEnd, onClick: () => setView("components") },
    { id: "external", label: "External Work", active: view === "external", icon: Rows3, onClick: () => setView("external") },
    { id: "gaps", label: "Maturity Gaps", active: view === "gaps", icon: AlertTriangle, onClick: () => setView("gaps") },
    { id: "exceptions", label: "Exceptions", active: view === "exceptions", icon: ShieldCheck, onClick: () => setView("exceptions") },
    { id: "patterns", label: "Pattern Registry", active: view === "patterns", icon: Layers3, onClick: () => setView("patterns") },
    { id: "ownership", label: "Ownership Rules", active: view === "ownership", icon: ShieldCheck, onClick: () => setView("ownership") },
    { id: "validation", label: "Validation Gates", active: view === "validation", icon: ListChecks, onClick: () => setView("validation") },
  ];

  return (
    <DashboardShell
      sidebar={(
        <DashboardSidebar
          title="Design Intelligence"
          description="Agent-ready standards for Hermes UI work."
          items={navItems}
          footer={(
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Source of truth</div>
              <div>Dashboard patterns use `@hermes/dashboard-kit`; product primitives use `@nous-research/ui`.</div>
            </div>
          )}
        />
      )}
      header={(
        <DashboardHeader
          title="Hermes Design Intelligence Command Center"
          eyebrow="Standards modernization"
          description="V1-V12 execution system for page classification, component ownership, data contracts, visual proof, component maturity, token enforcement, Mobbin evidence, and CI governance."
          meta={(
            <>
              <StatusPill tone="success">{buildVersions.length} build versions</StatusPill>
              <StatusPill tone="info">{patternRegistry.length} patterns</StatusPill>
              <StatusPill tone="warning">{validationCommands.length} gates</StatusPill>
            </>
          )}
        />
      )}
    >
      <MetricGrid columns={5}>
        <KpiCard label="Standards Gate" value="V1" detail="Proposal checklist and validators" icon={ShieldCheck} tone="success" />
        <KpiCard label="Patterns" value={patternRegistry.length} detail="Agent-readable registry entries" icon={Layers3} tone="info" />
        <KpiCard label="Ownership" value={componentOwnershipRules.length} detail="Component layer rules" icon={Workflow} />
        <KpiCard label="Validation" value={validationCommands.length} detail="Commands mapped to versions" icon={ListChecks} tone="warning" />
        <KpiCard label="Proof" value="V7" detail="Visual evidence and viewport matrix" icon={MonitorSmartphone} tone="info" />
      </MetricGrid>

      <DashboardSection
        title="Execution View"
        description="Use this page before building or promoting Hermes UI work."
        action={(
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "versions", label: "Versions" },
              { value: "projects", label: "Projects" },
              { value: "readiness", label: "Readiness" },
              { value: "visual", label: "Visual" },
              { value: "tokens", label: "Tokens" },
              { value: "components", label: "Components" },
              { value: "external", label: "External" },
              { value: "gaps", label: "Gaps" },
              { value: "exceptions", label: "Exceptions" },
              { value: "patterns", label: "Patterns" },
              { value: "ownership", label: "Ownership" },
              { value: "validation", label: "Validation" },
            ]}
          />
        )}
      >
        {view === "versions" ? (
          <div className="space-y-4">
            <FilterBar>
              <SearchInput value={query} onChange={setQuery} placeholder="Search versions, gaps, artifacts" />
            </FilterBar>
            <DataTable
              rows={filteredVersions}
              columns={versionColumns}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedVersionId(row.id)}
              emptyTitle="No build versions found"
              emptyDescription="Adjust the search query."
            />
          </div>
        ) : null}

        {view === "patterns" ? (
          <DataTable
            rows={patternRegistry}
            columns={patternColumns}
            getRowKey={(row) => row.id}
            onRowClick={(row) => setSelectedPatternId(row.id)}
          />
        ) : null}

        {view === "projects" ? (
          <DataTable
            rows={projectTierAssessments}
            columns={projectColumns}
            getRowKey={(row) => row.project}
            emptyTitle="No project tier assessments"
            emptyDescription="Run the adoption report and update the project tier assessment registry."
          />
        ) : null}

        {view === "external" ? (
          <DataTable
            rows={externalWorkRows}
            columns={externalWorkColumns}
            getRowKey={(row, index) => `${row.project}-${row.priority}-${index}`}
            emptyTitle="No external work"
            emptyDescription="Every registered dashboard is current at its target band."
          />
        ) : null}

        {view === "readiness" ? (
          <DataTable
            rows={[...promotionReadiness.items] as ReadinessRow[]}
            columns={readinessColumns}
            getRowKey={(row) => row.project}
            emptyTitle="No readiness scores"
            emptyDescription="Generate dashboard promotion readiness."
          />
        ) : null}

        {view === "visual" ? (
          <div className="space-y-4">
            <MetricGrid columns={3}>
              <KpiCard label="Covered" value={`${visualCoverage.coveredCount}/${visualCoverage.dashboardCount}`} detail={`${visualEvidenceTasks.itemCount} evidence task(s)`} icon={MonitorSmartphone} tone="info" />
              <KpiCard label="Freshness SLA" value={`${visualCoverage.freshnessSlaDays}d`} detail="Screenshot evidence age limit" icon={ShieldCheck} tone="success" />
              <KpiCard label="Stale" value={visualCoverage.staleCount} detail="Screenshots beyond SLA" icon={AlertTriangle} tone={visualCoverage.staleCount ? "warning" : "success"} />
            </MetricGrid>
            <DataTable rows={[...visualCoverage.items] as VisualCoverageRow[]} columns={visualColumns} getRowKey={(row) => row.dashboardId} />
          </div>
        ) : null}

        {view === "tokens" ? (
          <DataTable
            rows={[...tokenDebtBacklog.items] as TokenDebtRow[]}
            columns={tokenDebtColumns}
            getRowKey={(row) => `${row.file}-${row.rule}`}
            emptyTitle="No token debt"
            emptyDescription="Full token scan found no legacy baseline groups."
          />
        ) : null}

        {view === "components" ? (
          <div className="space-y-4">
            <MetricGrid columns={3}>
              <KpiCard label="Evidence Items" value={componentEvidenceBacklog.itemCount} detail="Open component evidence tasks" icon={GalleryVerticalEnd} tone="warning" />
              <KpiCard label="Certified" value={`${componentCertification.certifiedCount}/${componentCertification.itemCount}`} detail="Component certification status" icon={ShieldCheck} tone="info" />
              <KpiCard label="Required Evidence" value={componentCertification.items[0]?.requiredEvidence.length ?? 0} detail="Checks per component" icon={ListChecks} tone="info" />
            </MetricGrid>
            <DataTable rows={[...componentEvidenceBacklog.items] as ComponentEvidenceRow[]} columns={componentEvidenceColumns} getRowKey={(row) => `${row.component}-${row.evidence}`} />
          </div>
        ) : null}

        {view === "gaps" ? (
          <DataTable
            rows={centralMaturityGaps}
            columns={gapColumns}
            getRowKey={(row) => row.id}
            emptyTitle="No maturity gaps"
            emptyDescription="All central standards are built, certified, and fully adopted."
          />
        ) : null}

        {view === "exceptions" ? (
          <DataTable
            rows={governanceExceptions}
            columns={exceptionColumns}
            getRowKey={(row) => row.id}
            emptyTitle="No active governance exceptions"
            emptyDescription="Promotion gates are clean; expired or incomplete exceptions block the standards summary."
          />
        ) : null}

        {view === "ownership" ? (
          <DataTable rows={componentOwnershipRules} columns={ownershipColumns} getRowKey={(row) => row.layer} />
        ) : null}

        {view === "validation" ? (
          <DataTable rows={validationCommands} columns={validationColumns} getRowKey={(row) => row.id} />
        ) : null}
      </DashboardSection>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <DashboardSection title="Selected Build Version" description={`${selectedVersion.id}: ${selectedVersion.title}`}>
          <div className="grid gap-4 md:grid-cols-2">
            {listBlock("Gaps Addressed", selectedVersion.gaps)}
            {listBlock("Artifacts", selectedVersion.artifacts)}
            {listBlock("Validation", selectedVersion.validation)}
            {listBlock("Exit Criteria", selectedVersion.exitCriteria)}
          </div>
        </DashboardSection>

        <ChartPanel title="Readiness Profile" description="Build maturity across standards, data, visual proof, and rollout.">
          <div className="space-y-4">
            <ProgressMetric label="Governance coverage" value={100} tone="success" detail="V1 gates mapped" />
            <ProgressMetric label="Pattern registry" value={75} tone="info" detail="Core patterns in v1 registry" />
            <ProgressMetric label="Data contract clarity" value={65} tone="warning" detail="Template present, enforcement next" />
            <ProgressMetric label="Rollout maturity" value={55} tone="warning" detail="Package-native adoption still expanding" />
          </div>
        </ChartPanel>
      </div>

      <DashboardSection title="Pattern Detail" description={selectedPattern.title}>
        <div className="mb-4 flex flex-wrap gap-2">
          {patternRegistry.map((pattern) => (
            <button
              key={pattern.id}
              className={`rounded-md border px-3 py-1.5 text-sm ${pattern.id === selectedPattern.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              onClick={() => setSelectedPatternId(pattern.id)}
              type="button"
            >
              {pattern.title}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {listBlock("Required Components", selectedPattern.requiredComponents)}
          {listBlock("Required States", selectedPattern.requiredStates)}
          {listBlock("Data Contracts", selectedPattern.dataContracts)}
          {listBlock("Responsive Rules", selectedPattern.responsiveRules)}
          {listBlock("Accessibility", selectedPattern.accessibility)}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mobbin References</div>
            <ul className="mt-2 space-y-1 text-sm">
              {selectedPattern.mobbinReferences.map((url) => (
                <li key={url}>
                  <a className="text-primary underline-offset-4 hover:underline" href={url} rel="noreferrer" target="_blank">{url}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title="Project Tier Actions" description="Current refined tier bands and next moves from the latest adoption assessment.">
        <div className="grid gap-3 lg:grid-cols-2">
          {projectTierAssessments.map((project) => (
            <div key={project.project} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-foreground">{project.name}</div>
                  <div className="font-mono-ui text-xs text-muted-foreground">{project.project}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={project.auditStatus === "current" ? "success" : "warning"}>{project.auditStatus}</StatusPill>
                  <StatusPill tone={project.currentBand.startsWith("T3") ? project.currentBand === "T3A" ? "warning" : "success" : "info"}>{project.currentBand}</StatusPill>
                </div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{project.nextMove}</div>
              {project.warnings.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.warnings.map((warning) => <StatusPill key={warning} tone="warning">{warning}</StatusPill>)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Codex Handoff Requirements" description="Minimum proposal contract before code starts.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Classification", "Page type, user task, data density, and selected pattern."],
            ["Component Map", "Existing components first; new components only with reuse case."],
            ["State Map", "Loading, empty, zero-results, partial, stale, error, permission, mobile."],
            ["Data Contract", "API type, UI model, runtime schema, freshness, transform owner."],
            ["Mobbin Extraction", "Pattern-specific references with adapt and do-not-copy notes."],
            ["Responsive Proof", "Desktop, collapsed, tablet, mobile, and embedded pane behavior."],
            ["Accessibility", "Keyboard path, labels, focus, contrast, chart alternatives."],
            ["Validation", "Required commands and human approval points."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {title}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{detail}</div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="System Artifacts" description="Where the standards live.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Modernization Handoff", detail: "docs/design/nous-hermes-agent-ui-standards-modernization-assessment.md" },
            { icon: Database, title: "Registry Data", detail: "web/src/pages/design-intelligence-data.ts" },
            { icon: GalleryVerticalEnd, title: "Route", detail: "/design-intelligence" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-border bg-muted/30 p-3">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <div className="mt-2 font-medium text-foreground">{item.title}</div>
                <div className="mt-1 break-words font-mono-ui text-xs text-muted-foreground">{item.detail}</div>
              </div>
            );
          })}
        </div>
      </DashboardSection>
    </DashboardShell>
  );
}
