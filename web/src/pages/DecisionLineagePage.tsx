import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Link2,
  RefreshCw,
  SearchCheck,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  fetchDecisionLineage,
  fetchDecisionRecords,
  type DecisionLineageReport,
  type DecisionRecord,
} from "@/lib/second-brain";

type Tone = "ready" | "watch" | "blocked" | "unknown";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

function riskTone(value: string): Tone {
  if (value === "critical" || value === "high") return "blocked";
  if (value === "medium") return "watch";
  if (value === "low") return "ready";
  return "unknown";
}

function reviewTone(value: string): Tone {
  if (value === "current" || value === "resolved") return "ready";
  if (value === "needs-review") return "watch";
  if (value === "contradicted") return "blocked";
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

function DecisionRow({ decision, active, onSelect }: { decision: DecisionRecord; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-md border bg-background p-2 text-left transition hover:border-primary/60",
        active ? "border-primary/70" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{decision.title}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {decision.project} / {decision.businessUnit} / {isoTimeAgo(decision.decidedAt)}
          </div>
        </div>
        <Pill tone={reviewTone(decision.reviewState)}>{decision.reviewState}</Pill>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{decision.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill tone={riskTone(decision.riskClass)}>risk {decision.riskClass}</Pill>
        <Pill tone={riskTone(decision.impactClass)}>impact {decision.impactClass}</Pill>
        <Badge>{decision.decisionType}</Badge>
      </div>
    </button>
  );
}

function LineageList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Panel title={title} aside={items.length}>
      <div className="space-y-1.5">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-md border border-border bg-background p-2 text-xs">
            {item}
          </div>
        )) : <Empty title="No entries" detail={empty} />}
      </div>
    </Panel>
  );
}

export default function DecisionLineagePage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineage, setLineage] = useState<DecisionLineageReport | null>(null);
  const [busy, setBusy] = useState(true);
  const [lineageBusy, setLineageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await fetchDecisionRecords();
      setDecisions(result.decisions);
      setSelectedId((current) => current ?? result.decisions[0]?.id ?? null);
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

  useEffect(() => {
    if (!selectedId) {
      setLineage(null);
      return;
    }
    setLineageBusy(true);
    fetchDecisionLineage(selectedId)
      .then((result) => {
        setLineage(result);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLineageBusy(false));
  }, [selectedId]);

  const summary = useMemo(() => {
    const highRisk = decisions.filter((decision) => ["high", "critical"].includes(decision.riskClass)).length;
    const blocked = decisions.filter((decision) => decision.reviewState === "contradicted").length;
    return { highRisk, blocked };
  }, [decisions]);

  useLayoutEffect(() => {
    setAfterTitle(
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={decisions.length ? "ready" : "watch"}>{decisions.length} decisions</Pill>
        <Pill tone={summary.highRisk ? "blocked" : "ready"}>{summary.highRisk} high risk</Pill>
        <Pill tone={summary.blocked ? "blocked" : "ready"}>{summary.blocked} contradicted</Pill>
      </div>,
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
  }, [busy, decisions.length, load, setAfterTitle, setEnd, summary.blocked, summary.highRisk]);

  if (busy && !decisions.length) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (error && !decisions.length) {
    return (
      <div className="p-4">
        <Panel title="Decision lineage unavailable">
          <div className="text-sm text-destructive">{error}</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[0.85fr_1.1fr_0.95fr]">
      <Panel title="Decision Records" aside={decisions.length}>
        <div className="space-y-2">
          {decisions.length ? decisions.map((decision) => (
            <DecisionRow
              key={decision.id}
              decision={decision}
              active={decision.id === selectedId}
              onSelect={() => setSelectedId(decision.id)}
            />
          )) : (
            <Empty title="No decision records" detail="Hermes Brain has not recorded a source-backed decision yet." />
          )}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Lineage Trail" aside={lineageBusy ? "loading" : lineage?.edges.length ?? 0}>
          {lineage ? (
            <div className="space-y-2">
              <article className="rounded-md border border-border bg-background p-2">
                <div className="flex items-start gap-2">
                  <GitBranch className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{lineage.decision.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{lineage.decision.expectedOutcome}</p>
                  </div>
                </div>
              </article>
              {lineage.edges.map((edge) => (
                <div key={edge.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-border bg-background p-2 text-xs">
                  <span className="truncate text-muted-foreground">{edge.fromType}: {edge.fromId}</span>
                  <Pill tone={edge.edgeType === "contradicts" ? "blocked" : "ready"}>{edge.edgeType}</Pill>
                  <span className="truncate text-right text-muted-foreground">{edge.toType}: {edge.toId}</span>
                </div>
              ))}
              {!lineage.edges.length ? <Empty title="No lineage edges" detail="This decision does not yet have source, memory, or outcome lineage edges." /> : null}
            </div>
          ) : (
            <Empty title="Select a decision" detail="Choose a decision record to inspect its source event, memory, decision, and outcome trail." />
          )}
        </Panel>

        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-2">
          <LineageList
            title="Why We Believed It"
            items={lineage?.whyBelieved ?? []}
            empty="No evidence, memory, or active assumption was returned for this decision."
          />
          <LineageList
            title="What Changed"
            items={lineage?.whatChanged ?? []}
            empty="No changed assumptions, outcomes, reversals, or supersession events are recorded."
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Evidence And Memory" aside={(lineage?.evidence.length ?? 0) + (lineage?.priorMemories.length ?? 0)}>
          <div className="space-y-2">
            {(lineage?.evidence ?? []).map((ref) => (
              <div key={`${ref.sourceSystem}:${ref.sourceType}:${ref.sourceIdentifier}`} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <SearchCheck className="size-3.5 text-muted-foreground" />
                  {ref.sourceSystem}
                </div>
                <div className="mt-1 text-muted-foreground">{ref.sourceType} / {ref.sourceIdentifier}</div>
              </div>
            ))}
            {(lineage?.priorMemories ?? []).map((node) => (
              <div key={node.id} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <Link2 className="size-3.5 text-muted-foreground" />
                  {node.title}
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{node.summary}</p>
              </div>
            ))}
            {lineage && !lineage.evidence.length && !lineage.priorMemories.length ? (
              <Empty title="No linked evidence" detail="This decision needs source evidence or prior memory references before it should guide high-impact work." />
            ) : null}
          </div>
        </Panel>

        <Panel title="Assumptions And Findings" aside={(lineage?.assumptions.length ?? 0) + (lineage?.findings.length ?? 0)}>
          <div className="space-y-2">
            {(lineage?.assumptions ?? []).map((assumption) => (
              <div key={assumption.id} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">{assumption.statement}</div>
                  <Pill tone={assumption.status === "active" ? "ready" : "watch"}>{assumption.status}</Pill>
                </div>
              </div>
            ))}
            {(lineage?.findings ?? []).map((finding) => (
              <div key={finding} className="rounded-md border border-warning/45 bg-warning/10 p-2 text-xs text-warning">
                {finding}
              </div>
            ))}
            {lineage && !lineage.assumptions.length && !lineage.findings.length ? (
              <Empty title="No assumptions or findings" detail="This decision has no explicit assumptions or lineage warnings." />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
