import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  fetchSecondBrainCandidates,
  fetchSecondBrainRestoreProof,
  fetchSecondBrainSummary,
  scanSecondBrainStaleness,
  searchSecondBrain,
  syncSecondBrainWarehouse,
  type BrainCandidate,
  type BrainNode,
  type RestoreProof,
  type SecondBrainSummary,
} from "@/lib/second-brain";

type Tone = "ready" | "watch" | "blocked" | "unknown";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

function toneForCount(count: number): Tone {
  if (count === 0) return "ready";
  if (count < 5) return "watch";
  return "blocked";
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

function Stat({ label, value, tone = "unknown" }: { label: string; value: string | number; tone?: Tone }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "blocked" && "text-destructive", tone === "ready" && "text-success")}>
        {value}
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: BrainCandidate }) {
  const blockers = candidate.policy?.blockers ?? [];
  return (
    <article className="rounded-md border border-border bg-background p-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{candidate.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {candidate.sourceSystem} / {candidate.sourceType} / {candidate.suggestedType}
          </div>
        </div>
        <Pill tone={blockers.length ? "blocked" : "ready"}>{candidate.policy?.approvalLevel ?? candidate.status}</Pill>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{candidate.whyItMatters}</p>
      {blockers.length ? <p className="mt-2 text-xs text-destructive">{blockers.join("; ")}</p> : null}
    </article>
  );
}

function NodeRow({ node }: { node: BrainNode }) {
  return (
    <article className="rounded-md border border-border bg-background p-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{node.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {node.source ?? "unknown"} / {node.type} / {node.status}
          </div>
        </div>
        <Badge>{node.confidence ?? "n/a"}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{node.summary}</p>
      {node.sourcePath ? <p className="mt-2 truncate text-[11px] text-muted-foreground">{node.sourcePath}</p> : null}
    </article>
  );
}

export default function SecondBrainPage() {
  const [summary, setSummary] = useState<SecondBrainSummary | null>(null);
  const [candidates, setCandidates] = useState<BrainCandidate[]>([]);
  const [results, setResults] = useState<BrainNode[]>([]);
  const [proof, setProof] = useState<RestoreProof | null>(null);
  const [query, setQuery] = useState("valuation");
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [nextSummary, queue, restore] = await Promise.all([
        fetchSecondBrainSummary(),
        fetchSecondBrainCandidates(),
        fetchSecondBrainRestoreProof().catch(() => null),
      ]);
      setSummary(nextSummary);
      setCandidates(queue.candidates);
      if (restore) setProof(restore);
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

  useLayoutEffect(() => {
    setAfterTitle(
      summary ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={summary.health.ok ? "ready" : "blocked"}>{summary.health.ok ? "Brain online" : "Brain down"}</Pill>
          <Pill tone={summary.health.obsidian?.configured ? "ready" : "watch"}>Obsidian</Pill>
          <Pill tone={summary.health.warehouse?.configured ? "ready" : "watch"}>Warehouse</Pill>
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
  }, [busy, load, setAfterTitle, setEnd, summary]);

  const counts = summary?.audit.counts ?? {};
  const findings = summary?.audit.findings ?? [];
  const coverage = useMemo(() => Object.entries(summary?.audit.coverage ?? {}), [summary]);

  async function runAction(name: string, fn: () => Promise<unknown>) {
    setActionBusy(name);
    try {
      await fn();
      await load();
    } finally {
      setActionBusy(null);
    }
  }

  async function runSearch() {
    setActionBusy("search");
    try {
      const res = await searchSecondBrain(query, true);
      setResults(res.nodes);
    } finally {
      setActionBusy(null);
    }
  }

  if (busy && !summary) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (error && !summary) {
    return (
      <div className="p-4">
        <Panel title="Second Brain unavailable">
          <div className="text-sm text-destructive">{error}</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[1.05fr_1.1fr_0.85fr]">
      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Maturity Snapshot" aside={summary?.generatedAt ? isoTimeAgo(summary.generatedAt) : null}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Nodes" value={counts.nodes ?? 0} tone="ready" />
            <Stat label="Candidates" value={counts.candidates ?? 0} tone={toneForCount(counts.candidatesNeedingReview ?? candidates.length)} />
            <Stat label="Stale" value={counts.staleNodes ?? 0} tone={toneForCount(counts.staleNodes ?? 0)} />
            <Stat label="Contradictions" value={counts.contradictions ?? 0} tone={toneForCount(counts.contradictions ?? 0)} />
          </div>
          <div className="mt-3 space-y-1.5">
            {findings.length ? findings.map((finding) => <div key={finding} className="rounded border border-border bg-muted p-2 text-xs">{finding}</div>) : (
              <div className="rounded border border-border bg-muted p-2 text-xs text-muted-foreground">No active findings.</div>
            )}
          </div>
        </Panel>

        <Panel title="Warehouse And Vault">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><Database className="size-3.5" /> {summary?.warehouse.warehouseRoot ?? "Warehouse not configured"}</div>
            <div className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> Restore proof: {proof?.ok ? "passing" : "not proven"}</div>
            <div className="truncate text-muted-foreground">{summary?.health.obsidian?.vaultRoot ?? "Obsidian vault not configured"}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void runAction("sync", syncSecondBrainWarehouse)} disabled={Boolean(actionBusy)}>
              Sync Warehouse
            </Button>
            <Button size="sm" ghost onClick={() => void runAction("scan", scanSecondBrainStaleness)} disabled={Boolean(actionBusy)}>
              Scan Stale
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="Candidate Review Queue" aside={candidates.length}>
        <div className="space-y-2">
          {candidates.length ? candidates.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} />) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No candidates waiting for review.</div>
          )}
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Memory Search">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button size="sm" onClick={() => void runSearch()} disabled={actionBusy === "search"}>
              <Search className="mr-1 size-3.5" />
              Search
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {results.map((node) => <NodeRow key={node.id} node={node} />)}
            {!results.length ? <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Search approved memory with citations and status.</div> : null}
          </div>
        </Panel>

        <Panel title="Coverage">
          <div className="space-y-1.5">
            {coverage.length ? coverage.map(([source, count]) => (
              <div key={source} className="flex items-center justify-between rounded border border-border bg-background px-2 py-1.5 text-xs">
                <span>{source}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </div>
            )) : <div className="text-xs text-muted-foreground">No source coverage yet.</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
