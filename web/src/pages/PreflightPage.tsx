import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, SearchCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  fetchDecisionIntelligenceMetrics,
  fetchDecisionIntelligenceAuditPacket,
  fetchPreflightChecks,
  runPreflightCheck,
  type DecisionIntelligenceMetricsReport,
  type FrontierAuditPacket,
  type PreflightCheck,
  type PreflightRequest,
} from "@/lib/second-brain";

type Tone = "ready" | "watch" | "blocked" | "unknown";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const DEFAULT_REQUEST: PreflightRequest = {
  task: "Review a production dashboard change",
  project: "nous-hermes-agent",
  workflow: "dashboard-maturity",
  riskClass: "high",
  entities: ["dashboard", "second-brain"],
};

function policyTone(policy: string): Tone {
  if (policy === "pass") return "ready";
  if (policy === "warn" || policy === "acknowledge") return "watch";
  if (policy === "block") return "blocked";
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
    <div className="grid min-h-[120px] place-items-center rounded-md border border-dashed border-border bg-background p-4 text-center">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 max-w-md text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function ListPanel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Panel title={title} aside={items.length}>
      <div className="space-y-1.5">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-md border border-border bg-background p-2 text-xs">
            {item}
          </div>
        )) : <Empty title="None" detail={empty} />}
      </div>
    </Panel>
  );
}

export default function PreflightPage() {
  const [checks, setChecks] = useState<PreflightCheck[]>([]);
  const [current, setCurrent] = useState<PreflightCheck | null>(null);
  const [metrics, setMetrics] = useState<DecisionIntelligenceMetricsReport | null>(null);
  const [request, setRequest] = useState<PreflightRequest>(DEFAULT_REQUEST);
  const [entitiesText, setEntitiesText] = useState(DEFAULT_REQUEST.entities?.join(", ") ?? "");
  const [auditPacket, setAuditPacket] = useState<FrontierAuditPacket | null>(null);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [result, metricsResult] = await Promise.all([
        fetchPreflightChecks(),
        fetchDecisionIntelligenceMetrics(),
      ]);
      setChecks(result.checks);
      setCurrent((existing) => existing ?? result.checks[0] ?? null);
      setMetrics(metricsResult);
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

  const summary = useMemo(() => ({
    blocked: checks.filter((check) => check.policy === "block").length,
    acknowledgement: checks.filter((check) => check.policy === "acknowledge").length,
    stale: checks.reduce((sum, check) => sum + check.staleMemories.length, 0),
  }), [checks]);

  useLayoutEffect(() => {
    setAfterTitle(
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={checks.length ? "ready" : "watch"}>{checks.length} checks</Pill>
        <Pill tone={summary.blocked ? "blocked" : "ready"}>{summary.blocked} blocked</Pill>
        <Pill tone={summary.acknowledgement ? "watch" : "ready"}>{summary.acknowledgement} acknowledge</Pill>
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
  }, [busy, checks.length, load, setAfterTitle, setEnd, summary.acknowledgement, summary.blocked]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    try {
      const result = await runPreflightCheck({
        ...request,
        entities: entitiesText.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setCurrent(result.check);
      setAuditPacket(null);
      setAuditError(null);
      setChecks((existing) => [result.check, ...existing.filter((check) => check.id !== result.check.id)]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function exportAuditPacket() {
    if (!current) return;
    setAuditBusy(true);
    try {
      const packet = await fetchDecisionIntelligenceAuditPacket({
        recordType: "preflight",
        recordId: current.id,
      });
      setAuditPacket(packet);
      setAuditError(null);

      const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${packet.id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuditBusy(false);
    }
  }

  if (busy && !checks.length) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[0.8fr_1fr_1fr]">
      <Panel title="Task Preflight" aside={running ? "running" : "ready"}>
        <form className="space-y-2.5" onSubmit={(event) => void submit(event)}>
          <label className="block text-xs font-semibold">
            Task
            <textarea
              className="mt-1 min-h-[86px] w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={request.task}
              onChange={(event) => setRequest({ ...request, task: event.target.value })}
            />
          </label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="block text-xs font-semibold">
              Project
              <input className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={request.project ?? ""} onChange={(event) => setRequest({ ...request, project: event.target.value })} />
            </label>
            <label className="block text-xs font-semibold">
              Workflow
              <input className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={request.workflow ?? ""} onChange={(event) => setRequest({ ...request, workflow: event.target.value })} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="block text-xs font-semibold">
              Risk
              <select className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={request.riskClass} onChange={(event) => setRequest({ ...request, riskClass: event.target.value as PreflightRequest["riskClass"] })}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">
              Ticker / Strategy
              <input className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={request.ticker ?? request.strategy ?? ""} onChange={(event) => setRequest({ ...request, ticker: event.target.value, strategy: event.target.value })} />
            </label>
          </div>
          <label className="block text-xs font-semibold">
            Entities
            <input className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" value={entitiesText} onChange={(event) => setEntitiesText(event.target.value)} />
          </label>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>
          ) : null}
          <Button type="submit" size="sm" disabled={running || !request.task.trim()}>
            <SearchCheck className="mr-1 size-3.5" />
            Run Preflight
          </Button>
        </form>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Policy Result" aside={current ? <Pill tone={policyTone(current.policy)}>{current.policy}</Pill> : null}>
          {current ? (
            <div className="space-y-2">
              <article className="rounded-md border border-border bg-background p-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className={cn("mt-0.5 size-4", current.policy === "block" ? "text-destructive" : "text-muted-foreground")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{current.request.task}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge>{current.request.project ?? "unknown project"}</Badge>
                      <Badge>{current.request.workflow ?? "unknown workflow"}</Badge>
                      <Pill tone={current.request.riskClass === "high" || current.request.riskClass === "critical" ? "blocked" : "watch"}>{current.request.riskClass}</Pill>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{isoTimeAgo(current.createdAt)}</div>
                  </div>
                </div>
              </article>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Memories" value={current.relevantMemories.length} />
                <Metric label="Decisions" value={current.relevantDecisions.length} />
                <Metric label="Contradictions" value={current.contradictions.length} tone={current.contradictions.length ? "blocked" : "ready"} />
                <Metric label="Stale" value={current.staleMemories.length} tone={current.staleMemories.length ? "watch" : "ready"} />
              </div>
              <Button type="button" size="sm" ghost onClick={() => void exportAuditPacket()} disabled={auditBusy}>
                <Download className="mr-1 size-3.5" />
                Export Audit Packet
              </Button>
              {auditError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{auditError}</div>
              ) : null}
              {auditPacket ? (
                <div className="rounded-md border border-border bg-background p-2 text-xs">
                  <div className="font-semibold">Latest audit packet</div>
                  <div className="mt-1 break-all text-muted-foreground">Packet hash: {auditPacket.packetHash}</div>
                  <div className="mt-1 break-all text-muted-foreground">Warehouse manifest: {auditPacket.warehouse.manifestHash ?? "not synced"}</div>
                  <div className="mt-1 text-muted-foreground">{auditPacket.findings.length} findings / {auditPacket.sourceRefs.length} source refs</div>
                </div>
              ) : null}
            </div>
          ) : (
            <Empty title="No preflight selected" detail="Run a preflight or select a stored check to inspect injected memory and policy warnings." />
          )}
        </Panel>
        <ListPanel title="Block Reasons" items={current?.blockReasons ?? []} empty="No hard block reasons were returned." />
        <ListPanel title="Required Acknowledgements" items={current?.requiredAcknowledgements ?? []} empty="No acknowledgement is required." />
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Operating Metrics" aside={metrics ? <Pill tone={metrics.status === "ready" ? "ready" : metrics.status === "critical" ? "blocked" : "watch"}>{metrics.status}</Pill> : null}>
          {metrics ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Lineage" value={metrics.lineageCoverage.percent} tone={metrics.lineageCoverage.percent >= 80 ? "ready" : "watch"} suffix="%" />
                <Metric label="Blocking" value={metrics.counts.contradictionsBlocking} tone={metrics.counts.contradictionsBlocking ? "blocked" : "ready"} />
                <Metric label="Research" value={metrics.counts.researchTasksOpen} tone={metrics.counts.staleResearchTasks ? "watch" : "unknown"} />
                <Metric label="Preflights" value={metrics.counts.preflightChecks} tone={metrics.counts.preflightChecks ? "ready" : "watch"} />
              </div>
              {metrics.slo.breaches.length ? (
                <div className="space-y-1">
                  {metrics.slo.breaches.map((breach) => (
                    <div key={breach} className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                      {breach}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-success/30 bg-success/10 p-2 text-xs text-success">
                  Decision intelligence SLOs are clear.
                </div>
              )}
            </div>
          ) : (
            <Empty title="Metrics unavailable" detail="Decision-intelligence metrics will appear after Hermes Brain returns the protected metrics report." />
          )}
        </Panel>
        <Panel title="Stored Checks" aside={checks.length}>
          <div className="space-y-2">
            {checks.length ? checks.map((check) => (
              <button
                key={check.id}
                type="button"
                onClick={() => {
                  setCurrent(check);
                  setAuditPacket(null);
                  setAuditError(null);
                }}
                className={cn("w-full rounded-md border bg-background p-2 text-left hover:border-primary/60", current?.id === check.id ? "border-primary/70" : "border-border")}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{check.request.task}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{check.request.project ?? "unknown"} / {isoTimeAgo(check.createdAt)}</div>
                  </div>
                  <Pill tone={policyTone(check.policy)}>{check.policy}</Pill>
                </div>
              </button>
            )) : <Empty title="No stored checks" detail="No preflight audit records have been returned from Hermes Brain yet." />}
          </div>
        </Panel>
        <ListPanel title="Warnings" items={current?.warnings ?? []} empty="No warning-level memory issues were returned." />
        <ListPanel title="Citations" items={current?.citations ?? []} empty="No citations were attached to this check." />
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "unknown", suffix = "" }: { label: string; value: number; tone?: Tone; suffix?: string }) {
  return (
    <div className={cn("rounded-md border bg-background p-2", tone === "blocked" && "border-destructive/40 bg-destructive/10", tone === "watch" && "border-warning/40 bg-warning/10", tone === "ready" && "border-success/40 bg-success/10")}>
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}{suffix}</div>
    </div>
  );
}
