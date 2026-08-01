import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  GalleryVerticalEnd,
  GitBranch,
  Layers3,
  ListChecks,
  MonitorSmartphone,
  ShieldCheck,
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
  type ComponentOwnershipRule,
  type PatternRegistryEntry,
  type ValidationCommand,
} from "./design-intelligence-data";

type ViewMode = "versions" | "patterns" | "ownership" | "validation";

const statusTone = {
  ready: "success",
  "in-progress": "warning",
  planned: "info",
} as const;

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
          description="V1-V6 execution system for page classification, component ownership, data contracts, visual proof, high-density patterns, and package-native rollout."
          meta={(
            <>
              <StatusPill tone="success">6 build versions</StatusPill>
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
        <KpiCard label="Proof" value="V4" detail="Responsive and accessibility gates" icon={MonitorSmartphone} tone="info" />
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
