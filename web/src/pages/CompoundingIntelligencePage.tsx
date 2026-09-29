import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  fetchCompoundingIntelligence,
  fetchMemoryRetrievalPack,
  fetchSecondBrainSummary,
  type CompoundingIntelligenceReport,
  type CompoundingPhaseStatus,
  type MemoryRetrievalPack,
  type SecondBrainSummary,
} from "@/lib/second-brain";

type Tone = "ready" | "partial" | "blocked" | "unknown";

const DEFAULT_RETRIEVAL_QUERY = "production second brain warehouse";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  partial: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const TONE_DOT: Record<Tone, string> = {
  ready: "bg-success",
  partial: "bg-warning",
  blocked: "bg-destructive",
  unknown: "bg-muted-foreground",
};

function toneFromStatus(status?: string): Tone {
  if (status === "ready" || status === "partial" || status === "blocked") return status;
  return "unknown";
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", TONE_CLASS[tone])}>
      {tone === "ready" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {children}
    </span>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <span>{title}</span>
        <span className="ml-auto">{aside}</span>
      </h2>
      <div className="min-h-0 overflow-auto p-2.5">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail, tone = "unknown" }: { label: string; value: string | number; detail?: string; tone?: Tone }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "ready" && "text-success", tone === "blocked" && "text-destructive")}>
        {value}
      </div>
      {detail ? <div className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid h-full min-h-0 place-items-center p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading compounding intelligence
      </div>
    </div>
  );
}

function PhaseTable({ phases }: { phases: CompoundingPhaseStatus[] }) {
  if (!phases.length) {
    return <EmptyState title="No phase data yet" detail="Hermes Brain has not returned the ten-phase maturity contract." />;
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-2">Phase</th>
            <th className="px-2 py-2">Readiness</th>
            <th className="px-2 py-2">Evidence</th>
            <th className="px-2 py-2">Next action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {phases.map((phase) => {
            const tone = toneFromStatus(phase.status);
            return (
              <tr key={phase.id} className="align-top">
                <td className="w-[28%] px-2 py-2">
                  <div className="font-semibold text-foreground">{phase.phase}. {phase.title}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{phase.goal}</div>
                </td>
                <td className="w-[14%] px-2 py-2">
                  <Pill tone={tone}>{phase.status}</Pill>
                  <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">{phase.score}%</div>
                </td>
                <td className="w-[29%] px-2 py-2 text-muted-foreground">
                  {(phase.evidence ?? []).slice(0, 2).map((item) => <div key={item}> {item}</div>)}
                </td>
                <td className="w-[29%] px-2 py-2">
                  <div className={cn("line-clamp-3", phase.gaps.length ? "text-foreground" : "text-muted-foreground")}>
                    {phase.nextActions[0] ?? phase.gaps[0] ?? "No immediate action recorded."}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-[120px] place-items-center rounded-md border border-dashed border-border bg-background p-4 text-center">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 max-w-md text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function FreshnessBanner({ report, summary }: { report: CompoundingIntelligenceReport | null; summary: SecondBrainSummary | null }) {
  const generatedAt = report?.generatedAt ?? summary?.generatedAt ?? null;
  const lastSync = report?.operatingCadence.lastWarehouseSyncAt ?? null;
  const stale = generatedAt ? Date.now() - new Date(generatedAt).getTime() > 10 * 60 * 1000 : false;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-2 text-xs", stale ? TONE_CLASS.partial : "border-border bg-background text-muted-foreground")}>
      <Database className="size-3.5" />
      <span>Report {generatedAt ? isoTimeAgo(generatedAt) : "not loaded"}</span>
      <span className="text-muted-foreground">/</span>
      <span>Warehouse sync {lastSync ? isoTimeAgo(lastSync) : "not yet recorded"}</span>
      {stale ? <Pill tone="partial">stale</Pill> : null}
    </div>
  );
}

export default function CompoundingIntelligencePage() {
  const [report, setReport] = useState<CompoundingIntelligenceReport | null>(null);
  const [summary, setSummary] = useState<SecondBrainSummary | null>(null);
  const [pack, setPack] = useState<MemoryRetrievalPack | null>(null);
  const [query, setQuery] = useState(DEFAULT_RETRIEVAL_QUERY);
  const [busy, setBusy] = useState(true);
  const [packBusy, setPackBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [nextReport, nextSummary, nextPack] = await Promise.all([
        fetchCompoundingIntelligence(),
        fetchSecondBrainSummary().catch(() => null),
        fetchMemoryRetrievalPack({ q: DEFAULT_RETRIEVAL_QUERY, project: "nous-hermes-agent", workflow: "compounding-intelligence-dashboard" }).catch(() => null),
      ]);
      setReport(nextReport);
      setSummary(nextSummary);
      setPack(nextPack);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const loadPack = useCallback(async () => {
    setPackBusy(true);
    try {
      setPack(await fetchMemoryRetrievalPack({ q: query, project: "nous-hermes-agent", workflow: "operator-preview" }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPackBusy(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    setAfterTitle(
      report ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={toneFromStatus(report.status)}>Maturity {report.maturityScore}%</Pill>
          <Pill tone={summary?.health.ok ? "ready" : "blocked"}>{summary?.health.ok ? "Brain online" : "Brain unavailable"}</Pill>
          <Pill tone={summary?.health.warehouse?.configured ? "ready" : "partial"}>Warehouse</Pill>
        </div>
      ) : null,
    );
    setEnd(
      <Button size="sm" ghost onClick={() => void load()} disabled={busy}>
        <RefreshCw className="mr-1 size-3.5" />
        Refresh
      </Button>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [busy, load, report, setAfterTitle, setEnd, summary]);

  const blockedPhases = useMemo(() => report?.phases.filter((phase) => phase.status === "blocked").length ?? 0, [report]);
  const partialPhases = useMemo(() => report?.phases.filter((phase) => phase.status === "partial").length ?? 0, [report]);
  const readySources = useMemo(() => report?.sourceCoverage.filter((source) => source.status === "ready").length ?? 0, [report]);
  const actionCount = pack?.actions.length ?? report?.operatingCadence.openActions ?? 0;

  if (busy && !report) return <Skeleton />;

  if (error && !report) {
    return (
      <div className="p-4">
        <Panel title="Compounding intelligence unavailable">
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <ShieldAlert className="mt-0.5 size-4" />
              <span>{error}</span>
            </div>
            <Button size="sm" onClick={() => void load()}>Retry</Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[1.1fr_1.15fr_0.9fr]">
      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Maturity Score" aside={report?.generatedAt ? isoTimeAgo(report.generatedAt) : null}>
          <div className="flex items-center gap-3">
            <div className={cn("grid size-24 shrink-0 place-items-center rounded-full border-4 bg-background", report?.status === "ready" ? "border-success" : report?.status === "blocked" ? "border-destructive" : "border-warning")}>
              <div className="text-center">
                <div className="text-3xl font-bold tabular-nums">{report?.maturityScore ?? 0}</div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">score</div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Pill tone={toneFromStatus(report?.status)}>{report?.status ?? "unknown"}</Pill>
                <Pill tone={blockedPhases ? "blocked" : partialPhases ? "partial" : "ready"}>{blockedPhases} blocked</Pill>
                <Pill tone={readySources >= 5 ? "ready" : "partial"}>{readySources}/5 sources</Pill>
              </div>
              <FreshnessBanner report={report} summary={summary} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Active Nodes" value={report?.retrievalReadiness.activeNodes ?? 0} tone={(report?.retrievalReadiness.activeNodes ?? 0) ? "ready" : "blocked"} />
            <Metric label="Cited Nodes" value={report?.retrievalReadiness.citedNodes ?? 0} tone={(report?.retrievalReadiness.citedNodes ?? 0) ? "ready" : "blocked"} />
            <Metric label="Graph Linked" value={report?.retrievalReadiness.graphLinkedNodes ?? 0} tone={(report?.retrievalReadiness.graphLinkedNodes ?? 0) ? "ready" : "partial"} />
            <Metric label="Actionable" value={report?.retrievalReadiness.actionableNodes ?? 0} tone={(report?.retrievalReadiness.actionableNodes ?? 0) ? "ready" : "partial"} />
          </div>
        </Panel>

        <Panel title="Operating Cadence">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Stale Nodes" value={report?.operatingCadence.staleNodes ?? 0} tone={(report?.operatingCadence.staleNodes ?? 0) ? "partial" : "ready"} />
            <Metric label="Pending" value={report?.operatingCadence.pendingCandidates ?? 0} tone={(report?.operatingCadence.pendingCandidates ?? 0) ? "partial" : "ready"} />
            <Metric label="Contradictions" value={report?.operatingCadence.contradictionEdges ?? 0} tone={(report?.operatingCadence.contradictionEdges ?? 0) ? "blocked" : "ready"} />
            <Metric label="Open Actions" value={report?.operatingCadence.openActions ?? 0} tone={(report?.operatingCadence.openActions ?? 0) ? "partial" : "ready"} />
          </div>
        </Panel>

        <Panel title="Warehouse Sync Status">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5">
              <span className="text-muted-foreground">Configured</span>
              <Pill tone={summary?.warehouse.configured ? "ready" : "blocked"}>{summary?.warehouse.configured ? "yes" : "no"}</Pill>
            </div>
            <div className="truncate rounded-md border border-border bg-background px-2 py-1.5 text-muted-foreground">
              {summary?.warehouse.warehouseRoot ?? "No warehouse root returned by Nous summary."}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5">
              <span className="text-muted-foreground">Sync events</span>
              <span className="font-semibold tabular-nums">{summary?.warehouse.events.length ?? 0}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Ten-Phase Readiness" aside={`${report?.phases.length ?? 0}/10`}>
          <PhaseTable phases={report?.phases ?? []} />
        </Panel>

        <Panel title="Source Coverage">
          <div className="space-y-1.5">
            {report?.sourceCoverage.length ? report.sourceCoverage.map((source) => (
              <div key={source.sourceSystem} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className={cn("size-2 rounded-full", TONE_DOT[toneFromStatus(source.status)])} />
                    <span className="truncate">{source.sourceSystem}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {source.approvedNodes} approved / {source.pendingCandidates} pending / {source.openActions} actions
                  </div>
                </div>
                <Pill tone={toneFromStatus(source.status)}>{source.status}</Pill>
              </div>
            )) : <EmptyState title="No source coverage" detail="Hermes Brain has not reported any project/source coverage yet." />}
          </div>
        </Panel>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Retrieval-Pack Preview" aside={pack?.generatedAt ? isoTimeAgo(pack.generatedAt) : null}>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadPack();
              }}
            />
            <Button size="sm" onClick={() => void loadPack()} disabled={packBusy}>
              <Search className="mr-1 size-3.5" />
              Search
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </div>
            ) : null}
            {pack?.warnings.length ? (
              <div className="rounded-md border border-warning/45 bg-warning/10 p-2 text-xs text-warning">
                {pack.warnings.join("; ")}
              </div>
            ) : null}
            {pack?.nodes.length ? pack.nodes.slice(0, 4).map((item) => (
              <article key={item.node.id} className="rounded-md border border-border bg-background p-2">
                <div className="flex items-start gap-2">
                  <BrainCircuit className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{item.node.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{item.reason}</div>
                  </div>
                  <Badge>{item.sources} src</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.node.summary}</p>
              </article>
            )) : (
              <EmptyState title="No retrieval pack yet" detail="Search for a workstream, ticker, system, or decision to preview cited memory context." />
            )}
          </div>
        </Panel>

        <Panel title="Open Memory Actions" aside={actionCount}>
          <div className="space-y-2">
            {pack?.actions.length ? pack.actions.slice(0, 6).map((action, index) => (
              <div key={`${String(action.id ?? index)}`} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="font-semibold">{String(action.title ?? action.type ?? "Memory action")}</div>
                <div className="mt-1 line-clamp-2 text-muted-foreground">{String(action.description ?? action.summary ?? "No action detail returned.")}</div>
              </div>
            )) : (
              <EmptyState title="No open memory actions" detail="When Hermes Brain creates review, contradiction, or follow-up actions they will appear here." />
            )}
          </div>
        </Panel>

        <Panel title="Findings" aside={report?.findings.length ?? 0}>
          <div className="space-y-1.5">
            {report?.findings.length ? report.findings.map((finding) => (
              <div key={finding} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex gap-2">
                  <Sparkles className="mt-0.5 size-3.5 text-muted-foreground" />
                  <span>{finding}</span>
                </div>
              </div>
            )) : <EmptyState title="No findings" detail="The compounding report did not return any active gaps." />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
