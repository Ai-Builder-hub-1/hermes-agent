import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, SearchCheck, ShieldAlert } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  detectContradictions,
  fetchContradictions,
  resolveContradiction,
  type ContradictionRecord,
} from "@/lib/second-brain";

type Tone = "ready" | "watch" | "blocked" | "unknown";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

function toneFor(record: ContradictionRecord): Tone {
  if (record.status === "resolved" || record.status === "false_positive") return "ready";
  if (record.blocksHighImpactUse || record.severity === "critical" || record.severity === "high") return "blocked";
  if (record.severity === "medium" || record.status === "acknowledged") return "watch";
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

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-[140px] place-items-center rounded-md border border-dashed border-border bg-background p-4 text-center">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 max-w-md text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function ContradictionRow({ record, active, onSelect }: { record: ContradictionRecord; active: boolean; onSelect: () => void }) {
  const tone = toneFor(record);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full rounded-md border bg-background p-2 text-left transition hover:border-primary/60", active ? "border-primary/70" : "border-border")}
    >
      <div className="flex items-start gap-2">
        <ShieldAlert className={cn("mt-0.5 size-4", tone === "blocked" ? "text-destructive" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{record.summary}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {record.type} / risk {record.businessRisk} / {isoTimeAgo(record.updatedAt)}
          </div>
        </div>
        <Pill tone={tone}>{record.status}</Pill>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill tone={tone}>{record.severity}</Pill>
        <Pill tone={record.blocksHighImpactUse ? "blocked" : "ready"}>
          {record.blocksHighImpactUse ? "blocks high impact" : "non-blocking"}
        </Pill>
      </div>
    </button>
  );
}

export default function ContradictionDashboardPage() {
  const [records, setRecords] = useState<ContradictionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await fetchContradictions();
      setRecords(result.contradictions);
      setSelectedId((current) => current ?? result.contradictions[0]?.id ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const open = records.filter((record) => record.status === "open").length;
  const blocking = records.filter((record) => record.blocksHighImpactUse && record.status === "open").length;
  const resolved = records.filter((record) => ["resolved", "false_positive"].includes(record.status)).length;
  const canResolveSelected = selected ? !["resolved", "false_positive"].includes(selected.status) : false;

  const resolveSelected = useCallback(async (status: "resolved" | "false_positive") => {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    try {
      const result = await resolveContradiction(selected.id, {
        status,
        actor: "nous-hermes-dashboard",
        reason: status === "resolved"
          ? "Operator marked this contradiction resolved from the Nous contradiction dashboard."
          : "Operator marked this contradiction as a false positive from the Nous contradiction dashboard.",
        metadata: {
          route: "/contradictions",
          source: "nous-hermes-dashboard",
        },
      });
      setRecords((current) => current.map((record) => record.id === selected.id ? result.contradiction : record));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, selected]);

  useLayoutEffect(() => {
    setAfterTitle(
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={open ? "watch" : "ready"}>{open} open</Pill>
        <Pill tone={blocking ? "blocked" : "ready"}>{blocking} blocking</Pill>
        <Pill tone="ready">{resolved} resolved</Pill>
      </div>,
    );
    setEnd(
      <div className="flex gap-1.5">
        <Button
          size="sm"
          ghost
          onClick={() => {
            setActionBusy(true);
            detectContradictions().then(() => load()).finally(() => setActionBusy(false));
          }}
          disabled={busy || actionBusy}
        >
          <SearchCheck className="mr-1 size-3.5" />
          Detect
        </Button>
        <Button size="sm" ghost onClick={() => void load()} disabled={busy}>
          <RefreshCw className="mr-1 size-3.5" />
          Refresh
        </Button>
      </div>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [actionBusy, blocking, busy, load, open, resolved, setAfterTitle, setEnd]);

  if (busy && !records.length) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (error && !records.length) {
    return (
      <div className="p-4">
        <Panel title="Contradictions unavailable">
          <div className="text-sm text-destructive">{error}</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
      <Panel title="Contradiction Queue" aside={records.length}>
        <div className="space-y-2">
          {records.length ? records.map((record) => (
            <ContradictionRow
              key={record.id}
              record={record}
              active={record.id === selectedId}
              onSelect={() => setSelectedId(record.id)}
            />
          )) : (
            <Empty title="No contradictions" detail="Hermes Brain has not detected conflicting memories, decisions, or source states." />
          )}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Risk And Resolution" aside={selected ? `risk ${selected.businessRisk}` : null}>
          {selected ? (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-background p-2">
                <div className="text-sm font-semibold">{selected.summary}</div>
                <p className="mt-2 text-xs text-muted-foreground">{selected.recommendedResolution}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-border bg-background p-2">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Confidence</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{Math.round(selected.confidence * 100)}%</div>
                </div>
                <div className="rounded-md border border-border bg-background p-2">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Business Risk</div>
                  <div className={cn("mt-1 text-xl font-semibold tabular-nums", selected.businessRisk >= 70 && "text-destructive")}>{selected.businessRisk}</div>
                </div>
              </div>
              {selected.resolutionReason ? (
                <div className="rounded-md border border-success/35 bg-success/10 p-2 text-xs text-success">
                  {selected.resolutionReason}
                </div>
              ) : null}
              {canResolveSelected ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button size="sm" onClick={() => void resolveSelected("resolved")} disabled={actionBusy}>
                    <CheckCircle2 className="mr-1 size-3.5" />
                    Resolve
                  </Button>
                  <Button size="sm" ghost onClick={() => void resolveSelected("false_positive")} disabled={actionBusy}>
                    <ShieldAlert className="mr-1 size-3.5" />
                    False positive
                  </Button>
                </div>
              ) : null}
              {error ? <div className="text-xs text-destructive">{error}</div> : null}
            </div>
          ) : (
            <Empty title="Select a contradiction" detail="Pick an item from the queue to inspect its risk score and resolution path." />
          )}
        </Panel>

        <Panel title="Affected Work" aside={(selected?.affectedProjects.length ?? 0) + (selected?.affectedDecisions.length ?? 0)}>
          <div className="space-y-2 text-xs">
            {(selected?.affectedProjects ?? []).map((project) => (
              <div key={project} className="rounded-md border border-border bg-background p-2">{project}</div>
            ))}
            {(selected?.affectedDecisions ?? []).map((decision) => (
              <div key={decision} className="rounded-md border border-border bg-background p-2 text-muted-foreground">decision: {decision}</div>
            ))}
            {selected && !selected.affectedProjects.length && !selected.affectedDecisions.length ? (
              <Empty title="No affected work linked" detail="This contradiction should be connected to a project or decision before it can gate work." />
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Evidence" aside={selected?.evidenceRefs.length ?? 0}>
          <div className="space-y-2">
            {(selected?.evidenceRefs ?? []).map((ref) => (
              <div key={`${ref.sourceSystem}:${ref.sourceType}:${ref.sourceIdentifier}`} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="font-semibold">{ref.sourceSystem}</div>
                <div className="mt-1 text-muted-foreground">{ref.sourceType} / {ref.sourceIdentifier}</div>
              </div>
            ))}
            {selected && !selected.evidenceRefs.length ? <Empty title="No evidence refs" detail="This contradiction should be source-backed before blocking high-impact work." /> : null}
          </div>
        </Panel>

        <Panel title="Audit Trail" aside={selected?.auditTrail.length ?? 0}>
          <div className="space-y-2">
            {(selected?.auditTrail ?? []).map((event) => (
              <div key={`${event.action}:${event.at}`} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{event.action}</span>
                  <span className="text-muted-foreground">{isoTimeAgo(event.at)}</span>
                </div>
                <div className="mt-1 text-muted-foreground">{event.actor}{event.reason ? ` / ${event.reason}` : ""}</div>
              </div>
            ))}
            {selected && !selected.auditTrail.length ? <Empty title="No audit events" detail="Resolution actions will appear here." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
