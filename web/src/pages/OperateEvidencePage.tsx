import { Database, FileCheck2, History, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loadOperatingRuntimeState,
  loadOperatingRuntimeStateFromServer,
  recordOperatingEvidenceReview,
  type OperatingRuntimeState,
  type RuntimeEvidenceRecord,
} from "./operating-runtime";

type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

const healthyStates = new Set(["ready", "stored", "allowed"]);
const gatedStates = new Set(["blocked", "gated", "warning", "failed"]);

export default function OperateEvidencePage() {
  const [runtime, setRuntime] = useState<OperatingRuntimeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("all");
  const [state, setState] = useState("all");
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      setRuntime(await loadOperatingRuntimeStateFromServer());
      setError(null);
    } catch (exc) {
      setRuntime(loadOperatingRuntimeState());
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const rows = runtime?.evidence ?? [];
    return rows.filter((row) => (kind === "all" || row.kind === kind) && (state === "all" || row.state === state));
  }, [kind, runtime?.evidence, state]);

  const summary = useMemo(() => summarize(runtime?.evidence ?? []), [runtime?.evidence]);
  const kinds = useMemo(() => ["all", ...Array.from(new Set((runtime?.evidence ?? []).map((row) => row.kind))).sort()], [runtime?.evidence]);
  const states = useMemo(() => ["all", ...Array.from(new Set((runtime?.evidence ?? []).map((row) => row.state))).sort()], [runtime?.evidence]);

  const review = async () => {
    if (!runtime) return;
    setActionStatus("Evidence review running");
    try {
      const next = await recordOperatingEvidenceReview(runtime);
      setRuntime(next);
      setActionStatus("Evidence review recorded");
    } catch (exc) {
      setActionStatus(`Evidence review failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id="hermes.operate.evidence">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Database className="h-4 w-4" aria-hidden />
              Runtime proof
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Operate Evidence</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review operating evidence, audit decisions, closeout proof, stale blockers, and the records that support Operate actions, runs, incidents, approvals, and data sources.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2">
            <MiniStat label="Evidence" value={runtime?.evidence.length ?? "..."} />
            <MiniStat label="Audit rows" value={runtime?.audit.length ?? "..."} />
          </div>
        </div>
      </section>

      {!runtime ? <LoadingPanel /> : (
        <div className="grid gap-4" data-data-state={error ? "partial" : "ready"}>
          {error ? <PolicyCallout title="Showing cached/seeded evidence" detail={error} tone="warning" /> : null}

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Evidence rows" value={summary.total} detail="runtime evidence records" tone="info" icon={Database} />
            <MetricCard label="Healthy proof" value={summary.healthy} detail="ready, stored, or allowed" tone="success" icon={ShieldCheck} />
            <MetricCard label="Needs review" value={summary.gated} detail="blocked, gated, warning, or failed" tone={summary.gated ? "warning" : "success"} icon={FileCheck2} />
            <MetricCard label="Kinds" value={summary.kinds} detail="evidence categories" tone="info" icon={Database} />
            <MetricCard label="Audit rows" value={runtime.audit.length} detail="permission and action history" tone="info" icon={History} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.66fr)_minmax(340px,0.34fr)]">
            <Panel title="Evidence ledger" count={filtered.length}>
              <div className="grid gap-3 p-3">
                <div className="flex flex-wrap gap-2">
                  <SelectPill label="Kind" value={kind} values={kinds} onChange={setKind} />
                  <SelectPill label="State" value={state} values={states} onChange={setState} />
                  <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void load()}>
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-2 pr-3">Subject</th>
                        <th className="py-2 pr-3">Kind</th>
                        <th className="py-2 pr-3">State</th>
                        <th className="py-2 pr-3">Owner</th>
                        <th className="py-2 pr-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((record) => <EvidenceRow key={record.id} record={record} />)}
                    </tbody>
                  </table>
                </div>
                {!filtered.length ? <PolicyCallout title="No evidence matches filters" detail="Change the kind or state filters to inspect more runtime records." tone="info" /> : null}
              </div>
            </Panel>

            <div className="grid gap-4">
              <Panel title="Closeout controls">
                <div className="grid gap-3 p-3">
                  <PolicyCallout title="Evidence closes work" detail="A blocker, incident, action, run, or approval should only be considered closed when a fresh evidence row explains the outcome." tone="info" />
                  <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void review()}>
                    Record evidence review
                  </button>
                  {actionStatus ? <p className="text-xs font-medium text-muted-foreground">{actionStatus}</p> : null}
                </div>
              </Panel>
              <Panel title="Audit timeline" count={runtime.audit.length}>
                <div className="grid max-h-[520px] gap-2 overflow-auto p-3">
                  {runtime.audit.slice(0, 12).map((audit) => (
                    <article key={audit.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="text-sm font-semibold text-foreground">{audit.action}</h2>
                        <ToneBadge tone={audit.allowed ? "success" : "warning"}>{audit.approval}</ToneBadge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{audit.reason}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MiniFact label="Actor" value={audit.actor} />
                        <MiniFact label="Created" value={new Date(audit.createdAt).toLocaleString()} />
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function summarize(rows: RuntimeEvidenceRecord[]) {
  return {
    total: rows.length,
    healthy: rows.filter((row) => healthyStates.has(row.state)).length,
    gated: rows.filter((row) => gatedStates.has(row.state)).length,
    kinds: new Set(rows.map((row) => row.kind)).size,
  };
}

function EvidenceRow({ record }: { record: RuntimeEvidenceRecord }) {
  return (
    <tr className="border-b border-border/60 align-top">
      <td className="py-2 pr-3">
        <div className="font-semibold text-foreground">{record.subject}</div>
        <div className="line-clamp-2 text-muted-foreground">{record.detail}</div>
      </td>
      <td className="py-2 pr-3">{record.kind}</td>
      <td className="py-2 pr-3"><ToneBadge tone={toneForState(record.state)}>{record.state}</ToneBadge></td>
      <td className="py-2 pr-3">{record.owner}</td>
      <td className="py-2 pr-3">{new Date(record.updatedAt).toLocaleString()}</td>
    </tr>
  );
}

function SelectPill({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
      {label}
      <select className="bg-transparent text-foreground outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function LoadingPanel() {
  return <Panel title="Operate evidence"><div className="grid min-h-[260px] place-items-center p-4 text-sm text-muted-foreground">Loading operating evidence</div></Panel>;
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {count !== undefined ? <span className="tabular-nums text-xs font-semibold text-foreground">{count}</span> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string | number; detail: string; tone: Tone; icon: typeof Database }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded border p-1.5 ${toneClasses[tone]}`}><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <div className="mt-3 tabular-nums text-3xl font-semibold text-foreground">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}

function PolicyCallout({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return <article className={`rounded-lg border p-3 ${toneClasses[tone]}`}><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6">{detail}</p></article>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-border bg-background px-3 py-2"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 tabular-nums text-lg font-semibold text-foreground">{value}</div></div>;
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border border-border bg-card px-2.5 py-2"><div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-medium leading-5 text-foreground">{value}</div></div>;
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>{children}</span>;
}

function toneForState(state: string): Tone {
  if (healthyStates.has(state)) return "success";
  if (state === "failed" || state === "blocked") return "critical";
  if (state === "gated" || state === "warning") return "warning";
  return "info";
}
