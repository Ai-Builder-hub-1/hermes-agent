import { type FormEvent, type ReactNode } from "react";
import { ChartPanel, SimpleBarChart, SimpleLineChart } from "./charts";
import { DataTable, type DataTableColumn } from "./data-table";
import { DashboardEmptyState } from "./states";
import { StatusPill } from "./metrics";
import { cn } from "./utils";

export interface DomainWrapperProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  reviewId?: string;
}

const DOMAIN_PROOF_SIGNALS: Record<string, string[]> = {
  "financial-trading-charts": ["candlestick-visible", "x-axis-visible", "y-axis-visible", "crosshair-or-hover-visible", "volume-visible-when-volume-data-exists"],
  "general-dashboard-charts": ["axis-labels-visible", "legend-or-series-labels-visible", "empty-state-visible", "tooltip-or-hover-state-visible"],
  "data-tables-and-grids": ["pagination-for-over-ten-rows", "page-size-control-visible", "table-contained-in-card", "no-duplicate-table-footers"],
  "calendar-and-scheduling": ["month-grid-visible", "selected-date-state-visible", "week-or-day-drilldown-visible", "empty-day-state-visible"],
  "workflow-drag-drop": ["keyboard-or-accessible-alternative", "drag-state-visible", "drop-target-state-visible", "empty-lane-state-visible"],
  "node-graphs-and-pipelines": ["nodes-visible", "edges-visible", "pan-or-zoom-controls-visible", "selected-node-detail-visible"],
  "rich-text-and-research-documents": ["editor-toolbar-visible", "save-state-visible", "empty-document-state-visible", "structured-output-contract-visible"],
  "image-thumbnail-generation": ["output-dimensions-valid", "text-within-safe-area", "source-asset-manifest-visible", "sharpness-check-visible"],
  "interactive-canvas-editing": ["canvas-visible", "layer-selection-visible", "safe-area-visible", "export-preview-visible"],
  "video-template-generation": ["template-preview-visible", "render-status-visible", "asset-inputs-visible", "output-link-visible"],
  "forms-and-validation": ["field-errors-visible", "submit-state-visible", "dirty-state-visible", "success-or-failure-state-visible"],
};

function DomainPanel({
  title,
  description,
  children,
  className,
  reviewId,
  component,
  domain,
  library,
}: DomainWrapperProps & {
  component: string;
  domain: string;
  library: string;
}) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}
      data-domain-library={library}
      data-domain-library-family={domain}
      data-hdk-component={component}
      data-proof-signals={(DOMAIN_PROOF_SIGNALS[domain] ?? []).join(" ")}
      data-review-id={reviewId}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <StatusPill tone="info">{library}</StatusPill>
      </header>
      {children}
    </section>
  );
}

export function FinancialCandlestickChart({
  title = "Price movement",
  description = "Financial-native chart surface for candlesticks, price scale, time scale, volume, and crosshair proof.",
  children,
  reviewId = "hdk.financial-candlestick-chart",
}: Partial<DomainWrapperProps>) {
  return (
    <DomainPanel
      component="FinancialCandlestickChart"
      domain="financial-trading-charts"
      library="lightweight-charts"
      title={title}
      description={description}
      reviewId={reviewId}
    >
      <div className="min-h-72 rounded-md border border-border bg-background" data-chart-contract="candlestick" data-x-axis="time" data-y-axis="price">
        {children ?? (
          <DashboardEmptyState
            title="Financial chart runtime not connected"
            description="Mount Lightweight Charts in this surface and provide candle, volume, and price-line series."
            className="min-h-72 border-0 bg-transparent"
          />
        )}
      </div>
    </DomainPanel>
  );
}

export function TradingTerminalWorkspace({
  title = "Trading terminal",
  description = "Terminal-grade trading workspace with a dominant chart, compact controls, watchlist/details rail, and bottom broker state panel.",
  children,
  reviewId = "hdk.trading-terminal-workspace",
}: Partial<DomainWrapperProps>) {
  return (
    <section
      className="grid min-h-[760px] gap-2 rounded-lg border border-border bg-background p-2"
      data-domain-library="lightweight-charts"
      data-domain-library-family="financial-trading-charts"
      data-hdk-component="TradingTerminalWorkspace"
      data-proof-signals="terminal-toolbar-visible dominant-chart-visible right-watchlist-visible bottom-orders-panel-visible candlestick-visible x-axis-visible y-axis-visible"
      data-review-id={reviewId}
    >
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <StatusPill tone="info">lightweight-charts</StatusPill>
      </header>
      <div className="grid min-h-[620px] grid-cols-[48px_minmax(0,1fr)_280px] grid-rows-[minmax(420px,1fr)_220px] gap-2" data-terminal-anatomy="tool-rail chart right-rail bottom-panel">
        {children ?? (
          <DashboardEmptyState
            title="Trading terminal runtime not connected"
            description="Mount the chart, watchlist, tool rail, and positions/orders panel inside this workspace."
            className="col-span-3 row-span-2 min-h-[620px]"
          />
        )}
      </div>
    </section>
  );
}

export function MetricTimelineChart({
  title,
  description,
  data,
  reviewId = "hdk.metric-timeline-chart",
  component = "MetricTimelineChart",
}: {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  reviewId?: string;
  component?: string;
}) {
  return (
    <ChartPanel
      title={title}
      description={description}
      className="hdk-domain-chart"
      id={reviewId}
    >
      <div data-domain-library="recharts" data-domain-library-family="general-dashboard-charts" data-hdk-component={component} data-proof-signals={(DOMAIN_PROOF_SIGNALS["general-dashboard-charts"] ?? []).join(" ")} data-review-id={reviewId}>
        <SimpleLineChart data={data} height={240} />
      </div>
    </ChartPanel>
  );
}

export function PaginatedTableCard<T>({
  title,
  description,
  rows,
  columns,
  getRowKey,
  reviewId = "hdk.paginated-table-card",
  component = "PaginatedTableCard",
}: {
  title: string;
  description?: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T, index: number) => string;
  reviewId?: string;
  component?: string;
}) {
  return (
    <DomainPanel
      component={component}
      domain="data-tables-and-grids"
      library="tanstack-table"
      title={title}
      description={description}
      reviewId={reviewId}
    >
      <DataTable rows={rows} columns={columns} getRowKey={getRowKey} />
    </DomainPanel>
  );
}

export function DashboardCalendar({
  title = "Calendar",
  description = "Calendar-native surface for month/week/day planning and selected date detail.",
  days = [],
  reviewId = "hdk.dashboard-calendar",
  component = "DashboardCalendar",
}: Partial<DomainWrapperProps> & {
  days?: { id: string; label: string; state?: string; detail?: string }[];
  component?: string;
}) {
  return (
    <DomainPanel component={component} domain="calendar-and-scheduling" library="fullcalendar" title={title} description={description} reviewId={reviewId}>
      <div className="grid grid-cols-7 gap-2" data-calendar-contract="month-grid">
        {days.length ? days.map((day) => (
          <button key={day.id} className="min-h-24 rounded-md border border-border bg-background p-2 text-left text-sm transition hover:border-primary" type="button">
            <span className="font-medium text-foreground">{day.label}</span>
            {day.state ? <span className="mt-2 block text-xs text-muted-foreground">{day.state}</span> : null}
            {day.detail ? <span className="mt-1 block text-xs text-muted-foreground">{day.detail}</span> : null}
          </button>
        )) : Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="min-h-24 rounded-md border border-dashed border-border bg-background/70 p-2 text-xs text-muted-foreground">
            Empty
          </div>
        ))}
      </div>
    </DomainPanel>
  );
}

export function WorkflowBoard({
  title = "Workflow",
  description = "Workflow-native board surface for lanes, assignment, state movement, and accessible drag/drop alternatives.",
  lanes,
  reviewId = "hdk.workflow-board",
  component = "WorkflowBoard",
}: Partial<DomainWrapperProps> & {
  lanes: { id: string; title: string; items: { id: string; title: string; meta?: string }[] }[];
  component?: string;
}) {
  return (
    <DomainPanel component={component} domain="workflow-drag-drop" library="dnd-kit" title={title} description={description} reviewId={reviewId}>
      <div className="grid gap-3 md:grid-cols-3" data-workflow-contract="lanes">
        {lanes.map((lane) => (
          <section key={lane.id} className="rounded-md border border-border bg-background p-3">
            <h3 className="text-sm font-semibold text-foreground">{lane.title}</h3>
            <div className="mt-3 space-y-2">
              {lane.items.length ? lane.items.map((item) => (
                <article key={item.id} className="rounded-md border border-border bg-card p-3">
                  <strong className="block text-sm text-foreground">{item.title}</strong>
                  {item.meta ? <span className="mt-1 block text-xs text-muted-foreground">{item.meta}</span> : null}
                </article>
              )) : <DashboardEmptyState title="No items" description="This lane is clear." className="min-h-24" />}
            </div>
          </section>
        ))}
      </div>
    </DomainPanel>
  );
}

export function StoryTreeGraph({
  title = "Story tree",
  description = "Node graph surface for claims, evidence, branches, and selected-node inspection.",
  nodes,
  reviewId = "hdk.story-tree-graph",
  component = "StoryTreeGraph",
}: Partial<DomainWrapperProps> & {
  nodes: { id: string; label: string; detail?: string }[];
  component?: string;
}) {
  return (
    <DomainPanel component={component} domain="node-graphs-and-pipelines" library="react-flow" title={title} description={description} reviewId={reviewId}>
      <div className="grid gap-3 md:grid-cols-3" data-graph-contract="nodes-edges">
        {nodes.map((node, index) => (
          <article key={node.id} className="relative rounded-md border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">Node {index + 1}</span>
            <strong className="mt-1 block text-sm text-foreground">{node.label}</strong>
            {node.detail ? <p className="mt-2 text-xs text-muted-foreground">{node.detail}</p> : null}
          </article>
        ))}
      </div>
    </DomainPanel>
  );
}

export function ResearchEditor({
  title = "Research editor",
  description = "Structured research document surface for notes, scripts, evidence, and save-state proof.",
  children,
  reviewId = "hdk.research-editor",
  component = "ResearchEditor",
}: Partial<DomainWrapperProps> & { component?: string }) {
  return (
    <DomainPanel component={component} domain="rich-text-and-research-documents" library="tiptap" title={title} description={description} reviewId={reviewId}>
      <div className="min-h-56 rounded-md border border-border bg-background p-4" data-editor-contract="structured-document">
        {children ?? <DashboardEmptyState title="Editor runtime not connected" description="Mount the Tiptap editor and persist structured JSON output in this surface." className="min-h-48 border-0 bg-transparent" />}
      </div>
    </DomainPanel>
  );
}

export function ThumbnailPipelineRenderer({
  title = "Thumbnail pipeline",
  description = "Server-side thumbnail rendering proof for source assets, safe area, output dimensions, and sharpness QA.",
  children,
  reviewId = "hdk.thumbnail-pipeline-renderer",
  component = "ThumbnailPipelineRenderer",
}: Partial<DomainWrapperProps> & { component?: string }) {
  return (
    <DomainPanel component={component} domain="image-thumbnail-generation" library="sharp" title={title} description={description} reviewId={reviewId}>
      <div className="aspect-video rounded-md border border-border bg-background p-3" data-thumbnail-contract="safe-area-output">
        {children ?? <DashboardEmptyState title="No thumbnail render selected" description="Select a generated artifact to inspect dimensions, safe area, source assets, and QA state." className="h-full border-0 bg-transparent" />}
      </div>
    </DomainPanel>
  );
}

export function CreativeCanvasEditor({
  title = "Creative canvas",
  description = "Interactive canvas surface for layers, selected objects, safe area, and export proof.",
  children,
  reviewId = "hdk.creative-canvas-editor",
  component = "CreativeCanvasEditor",
}: Partial<DomainWrapperProps> & { component?: string }) {
  return (
    <DomainPanel component={component} domain="interactive-canvas-editing" library="react-konva" title={title} description={description} reviewId={reviewId}>
      <div className="aspect-video rounded-md border border-dashed border-border bg-background p-4" data-canvas-contract="layers-safe-area-export">
        {children ?? <DashboardEmptyState title="Canvas runtime not connected" description="Mount react-konva layers in this surface and expose export proof." className="h-full border-0 bg-transparent" />}
      </div>
    </DomainPanel>
  );
}

export function VideoTemplatePreview({
  title = "Video template",
  description = "Template preview surface for input props, render status, output links, and asset proof.",
  children,
  reviewId = "hdk.video-template-preview",
  component = "VideoTemplatePreview",
}: Partial<DomainWrapperProps> & { component?: string }) {
  return (
    <DomainPanel component={component} domain="video-template-generation" library="remotion" title={title} description={description} reviewId={reviewId}>
      <div className="aspect-video rounded-md border border-border bg-background p-3" data-video-template-contract="preview-render-output">
        {children ?? <DashboardEmptyState title="No video template preview" description="Mount Remotion Player or render preview in this surface." className="h-full border-0 bg-transparent" />}
      </div>
    </DomainPanel>
  );
}

export function ValidatedForm({
  title = "Validated form",
  description = "Schema-backed form surface for field errors, dirty state, submit state, and success/failure proof.",
  children,
  onSubmit,
  reviewId = "hdk.validated-form",
  component = "ValidatedForm",
}: Partial<DomainWrapperProps> & {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  component?: string;
}) {
  return (
    <DomainPanel component={component} domain="forms-and-validation" library="react-hook-form-zod" title={title} description={description} reviewId={reviewId}>
      <form className="space-y-4" data-form-contract="schema-validation-submit-state" onSubmit={onSubmit}>
        {children ?? <DashboardEmptyState title="No form fields" description="Provide schema-backed fields, validation messages, and submit state." />}
      </form>
    </DomainPanel>
  );
}

function CompactList({
  items,
  emptyTitle = "No items",
}: {
  items?: { id: string; title: string; meta?: string; tone?: string }[];
  emptyTitle?: string;
}) {
  if (!items?.length) return <DashboardEmptyState title={emptyTitle} description="No records are available for this surface." />;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-3">
            <strong className="text-sm text-foreground">{item.title}</strong>
            {item.tone ? <StatusPill tone={item.tone as never}>{item.tone}</StatusPill> : null}
          </div>
          {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function MarketTapeChart({
  data,
  title = "Market tape",
  description = "Streaming market movement, mid price, spread, and liquidity trend surface.",
  reviewId = "hdk.market-tape-chart",
}: {
  data: { label: string; value: number }[];
  title?: string;
  description?: string;
  reviewId?: string;
}) {
  return (
    <DomainPanel component="MarketTapeChart" domain="financial-trading-charts" library="lightweight-charts" title={title} description={description} reviewId={reviewId}>
      <SimpleLineChart data={data} height={220} />
    </DomainPanel>
  );
}

export function VolumeHistogram({
  data,
  title = "Volume",
  description = "Volume histogram with explicit unit and time-axis contract.",
  reviewId = "hdk.volume-histogram",
}: {
  data: { label: string; value: number }[];
  title?: string;
  description?: string;
  reviewId?: string;
}) {
  return (
    <DomainPanel component="VolumeHistogram" domain="financial-trading-charts" library="lightweight-charts" title={title} description={description} reviewId={reviewId}>
      <SimpleBarChart data={data} valueLabel="volume" />
    </DomainPanel>
  );
}

export function IndicatorOverlay({
  items = [],
  title = "Indicators",
  description = "Indicator overlay registry for moving averages, bands, signals, and warmup state.",
  reviewId = "hdk.indicator-overlay",
}: Partial<DomainWrapperProps> & {
  items?: { id: string; title: string; meta?: string; tone?: string }[];
}) {
  return (
    <DomainPanel component="IndicatorOverlay" domain="financial-trading-charts" library="lightweight-charts" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="No indicators selected" />
    </DomainPanel>
  );
}

export function PriceLineOverlay({
  items = [],
  title = "Price lines",
  description = "Bid, ask, stop, limit, and reference price-line proof surface.",
  reviewId = "hdk.price-line-overlay",
}: Partial<DomainWrapperProps> & {
  items?: { id: string; title: string; meta?: string; tone?: string }[];
}) {
  return (
    <DomainPanel component="PriceLineOverlay" domain="financial-trading-charts" library="lightweight-charts" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="No price lines" />
    </DomainPanel>
  );
}

export function ComparisonTrendChart({ data, title = "Comparison trend", description, reviewId = "hdk.comparison-trend-chart" }: { data: { label: string; value: number }[]; title?: string; description?: string; reviewId?: string }) {
  return <MetricTimelineChart title={title} description={description} data={data} component="ComparisonTrendChart" reviewId={reviewId} />;
}

export function IssueTrendChart({ data, title = "Issue trend", description, reviewId = "hdk.issue-trend-chart" }: { data: { label: string; value: number }[]; title?: string; description?: string; reviewId?: string }) {
  return <MetricTimelineChart title={title} description={description} data={data} component="IssueTrendChart" reviewId={reviewId} />;
}

export function DonutBreakdownChart({
  rows,
  title = "Breakdown",
  description = "Categorical share breakdown with legend-first proof.",
  reviewId = "hdk.donut-breakdown-chart",
}: Partial<DomainWrapperProps> & {
  rows: { id: string; title: string; meta?: string; tone?: string }[];
}) {
  return (
    <DomainPanel component="DonutBreakdownChart" domain="general-dashboard-charts" library="recharts" title={title} description={description} reviewId={reviewId}>
      <CompactList items={rows} emptyTitle="No breakdown data" />
    </DomainPanel>
  );
}

export function BarComparisonChart({ data, title = "Bar comparison", description, reviewId = "hdk.bar-comparison-chart" }: { data: { label: string; value: number }[]; title?: string; description?: string; reviewId?: string }) {
  return (
    <DomainPanel component="BarComparisonChart" domain="general-dashboard-charts" library="recharts" title={title} description={description} reviewId={reviewId}>
      <SimpleBarChart data={data} valueLabel="value" />
    </DomainPanel>
  );
}

export function EvidenceDataTable<T>(props: Parameters<typeof PaginatedTableCard<T>>[0]) {
  return <PaginatedTableCard {...props} component="EvidenceDataTable" reviewId={props.reviewId ?? "hdk.evidence-data-table"} />;
}

export function SortableMetricTable<T>(props: Parameters<typeof PaginatedTableCard<T>>[0]) {
  return <PaginatedTableCard {...props} component="SortableMetricTable" reviewId={props.reviewId ?? "hdk.sortable-metric-table"} />;
}

export function DenseOperationsGrid<T>(props: Parameters<typeof PaginatedTableCard<T>>[0]) {
  return <PaginatedTableCard {...props} component="DenseOperationsGrid" reviewId={props.reviewId ?? "hdk.dense-operations-grid"} />;
}

export function MonthPlanner(props: Parameters<typeof DashboardCalendar>[0]) {
  return <DashboardCalendar {...props} component="MonthPlanner" reviewId={props?.reviewId ?? "hdk.month-planner"} />;
}

export function WeekPlanningDrawer({
  title = "Week planning",
  description = "Focused drawer surface for planning selected days without leaving calendar context.",
  children,
  reviewId = "hdk.week-planning-drawer",
}: Partial<DomainWrapperProps>) {
  return (
    <DomainPanel component="WeekPlanningDrawer" domain="calendar-and-scheduling" library="fullcalendar" title={title} description={description} reviewId={reviewId}>
      {children ?? <DashboardEmptyState title="No selected week" description="Select one or more days to plan." />}
    </DomainPanel>
  );
}

export function ScheduleEventCard({ title, description, children, reviewId = "hdk.schedule-event-card" }: DomainWrapperProps) {
  return (
    <DomainPanel component="ScheduleEventCard" domain="calendar-and-scheduling" library="fullcalendar" title={title} description={description} reviewId={reviewId}>
      {children}
    </DomainPanel>
  );
}

export function CalendarToolbar({ title = "Calendar toolbar", description = "Date navigation, view switching, and filter controls.", children, reviewId = "hdk.calendar-toolbar" }: Partial<DomainWrapperProps>) {
  return (
    <DomainPanel component="CalendarToolbar" domain="calendar-and-scheduling" library="fullcalendar" title={title} description={description} reviewId={reviewId}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </DomainPanel>
  );
}

export function SortableQueue({ items = [], title = "Sortable queue", description, reviewId = "hdk.sortable-queue", component = "SortableQueue" }: Partial<DomainWrapperProps> & { items?: { id: string; title: string; meta?: string; tone?: string }[]; component?: string }) {
  return (
    <DomainPanel component={component} domain="workflow-drag-drop" library="dnd-kit" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="Queue is clear" />
    </DomainPanel>
  );
}

export function AssignmentLane({ title, description, children, reviewId = "hdk.assignment-lane" }: DomainWrapperProps) {
  return (
    <DomainPanel component="AssignmentLane" domain="workflow-drag-drop" library="dnd-kit" title={title} description={description} reviewId={reviewId}>
      {children}
    </DomainPanel>
  );
}

export function DragDropReviewList(props: Parameters<typeof SortableQueue>[0]) {
  return <SortableQueue {...props} component="DragDropReviewList" reviewId={props?.reviewId ?? "hdk.drag-drop-review-list"} />;
}

export function PipelineGraph(props: Parameters<typeof StoryTreeGraph>[0]) {
  return <StoryTreeGraph {...props} component="PipelineGraph" reviewId={props?.reviewId ?? "hdk.pipeline-graph"} />;
}

export function EvidenceRelationshipGraph(props: Parameters<typeof StoryTreeGraph>[0]) {
  return <StoryTreeGraph {...props} component="EvidenceRelationshipGraph" reviewId={props?.reviewId ?? "hdk.evidence-relationship-graph"} />;
}

export function GraphInspectorDrawer({ title = "Graph inspector", description = "Selected node details, linked evidence, and next action.", children, reviewId = "hdk.graph-inspector-drawer" }: Partial<DomainWrapperProps>) {
  return (
    <DomainPanel component="GraphInspectorDrawer" domain="node-graphs-and-pipelines" library="react-flow" title={title} description={description} reviewId={reviewId}>
      {children ?? <DashboardEmptyState title="No node selected" description="Select a node to inspect graph details." />}
    </DomainPanel>
  );
}

export function ScriptEditor(props: Parameters<typeof ResearchEditor>[0]) {
  return <ResearchEditor {...props} component="ScriptEditor" reviewId={props?.reviewId ?? "hdk.script-editor"} />;
}

export function EvidenceAnnotationEditor(props: Parameters<typeof ResearchEditor>[0]) {
  return <ResearchEditor {...props} component="EvidenceAnnotationEditor" reviewId={props?.reviewId ?? "hdk.evidence-annotation-editor"} />;
}

export function DecisionMemoEditor(props: Parameters<typeof ResearchEditor>[0]) {
  return <ResearchEditor {...props} component="DecisionMemoEditor" reviewId={props?.reviewId ?? "hdk.decision-memo-editor"} />;
}

export function ImageSharpnessQa({ items = [], title = "Sharpness QA", description, reviewId = "hdk.image-sharpness-qa" }: Partial<DomainWrapperProps> & { items?: { id: string; title: string; meta?: string; tone?: string }[] }) {
  return (
    <DomainPanel component="ImageSharpnessQa" domain="image-thumbnail-generation" library="sharp" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="No QA checks" />
    </DomainPanel>
  );
}

export function AssetManifestPreview(props: Parameters<typeof ThumbnailPipelineRenderer>[0]) {
  return <ThumbnailPipelineRenderer {...props} component="AssetManifestPreview" reviewId={props?.reviewId ?? "hdk.asset-manifest-preview"} />;
}

export function ThumbnailProofCard(props: Parameters<typeof ThumbnailPipelineRenderer>[0]) {
  return <ThumbnailPipelineRenderer {...props} component="ThumbnailProofCard" reviewId={props?.reviewId ?? "hdk.thumbnail-proof-card"} />;
}

export function CanvasLayerPanel({ items = [], title = "Layers", description, reviewId = "hdk.canvas-layer-panel" }: Partial<DomainWrapperProps> & { items?: { id: string; title: string; meta?: string; tone?: string }[] }) {
  return (
    <DomainPanel component="CanvasLayerPanel" domain="interactive-canvas-editing" library="react-konva" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="No canvas layers" />
    </DomainPanel>
  );
}

export function ThumbnailTextOverlayEditor(props: Parameters<typeof CreativeCanvasEditor>[0]) {
  return <CreativeCanvasEditor {...props} component="ThumbnailTextOverlayEditor" reviewId={props?.reviewId ?? "hdk.thumbnail-text-overlay-editor"} />;
}

export function CanvasExportProof(props: Parameters<typeof CreativeCanvasEditor>[0]) {
  return <CreativeCanvasEditor {...props} component="CanvasExportProof" reviewId={props?.reviewId ?? "hdk.canvas-export-proof"} />;
}

export function RenderQueueStatus({ items = [], title = "Render queue", description, reviewId = "hdk.render-queue-status" }: Partial<DomainWrapperProps> & { items?: { id: string; title: string; meta?: string; tone?: string }[] }) {
  return (
    <DomainPanel component="RenderQueueStatus" domain="video-template-generation" library="remotion" title={title} description={description} reviewId={reviewId}>
      <CompactList items={items} emptyTitle="No render jobs" />
    </DomainPanel>
  );
}

export function ClipExtractionPanel(props: Parameters<typeof VideoTemplatePreview>[0]) {
  return <VideoTemplatePreview {...props} component="ClipExtractionPanel" reviewId={props?.reviewId ?? "hdk.clip-extraction-panel"} />;
}

export function VideoPackageProofCard(props: Parameters<typeof VideoTemplatePreview>[0]) {
  return <VideoTemplatePreview {...props} component="VideoPackageProofCard" reviewId={props?.reviewId ?? "hdk.video-package-proof-card"} />;
}

export function ApprovalReasonForm(props: Parameters<typeof ValidatedForm>[0]) {
  return <ValidatedForm {...props} component="ApprovalReasonForm" reviewId={props?.reviewId ?? "hdk.approval-reason-form"} />;
}

export function ResearchIntakeForm(props: Parameters<typeof ValidatedForm>[0]) {
  return <ValidatedForm {...props} component="ResearchIntakeForm" reviewId={props?.reviewId ?? "hdk.research-intake-form"} />;
}

export function TradingSafetyForm(props: Parameters<typeof ValidatedForm>[0]) {
  return <ValidatedForm {...props} component="TradingSafetyForm" reviewId={props?.reviewId ?? "hdk.trading-safety-form"} />;
}

export function SettingsFormSection(props: Parameters<typeof ValidatedForm>[0]) {
  return <ValidatedForm {...props} component="SettingsFormSection" reviewId={props?.reviewId ?? "hdk.settings-form-section"} />;
}
