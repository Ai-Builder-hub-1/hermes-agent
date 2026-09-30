import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/api";

type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

interface ActionResult {
  id: string;
  kind: "intent" | "closeout" | string;
  title: string;
  itemId: string;
  action: string;
  result: string;
  state: string;
  approval: string;
  risk: string;
  liveEffect: boolean;
  auditId: string;
  proof: string;
  rollback: string;
  route: string;
  updatedAt: string;
}

interface ActionResultsResponse {
  contractVersion: string;
  generatedAt: string;
  summary: {
    records: number;
    intents: number;
    closeouts: number;
    liveEffect: number;
    explicit: number;
  };
  records: ActionResult[];
}

export function ActionResultHistory({ route, compact = false }: { route: string; compact?: boolean }) {
  const [data, setData] = useState<ActionResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJSON<ActionResultsResponse>(`/api/operate/action-results?route=${encodeURIComponent(route)}&limit=8`)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((exc) => {
        if (!cancelled) setError(exc instanceof Error ? exc.message : String(exc));
      });
    return () => {
      cancelled = true;
    };
  }, [route]);

  if (error) {
    return <StatePanel title="Action history unavailable" detail={error} tone="warning" />;
  }
  if (!data) {
    return <StatePanel title="Loading action history" detail="Checking durable audit and closeout records." tone="neutral" />;
  }
  if (!data.records.length) {
    return <StatePanel title="No action results yet" detail="This route has no recorded operator intents or closeouts yet." tone="info" />;
  }

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm" data-review-id={`hermes.action-results.${route}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action result history</h2>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span>{data.summary.records} records</span>
          <span>{data.summary.closeouts} closeouts</span>
          <span>{data.summary.explicit} explicit</span>
        </div>
      </div>
      <div className={`grid gap-2 p-3 ${compact ? "" : "lg:grid-cols-2"}`}>
        {data.records.slice(0, compact ? 3 : 6).map((record) => (
          <article key={record.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{record.title}</h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">{record.action || record.itemId}</p>
              </div>
              <ToneBadge tone={toneForRecord(record)}>{record.result || record.kind}</ToneBadge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <MiniFact label="Approval" value={record.approval} />
              <MiniFact label="Risk" value={record.risk} />
              <MiniFact label="Live effect" value={record.liveEffect ? "yes" : "no"} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{record.proof || record.auditId}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatePanel({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return (
    <section className={`rounded-lg border p-3 shadow-sm ${toneClasses[tone]}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6">{detail}</p>
    </section>
  );
}

function ToneBadge({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>{children}</span>;
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium leading-5 text-foreground">{value}</div>
    </div>
  );
}

function toneForRecord(record: ActionResult): Tone {
  if (record.liveEffect || record.approval === "explicit") return "critical";
  if (record.kind === "intent") return "warning";
  if (record.state === "failed" || record.result === "failed") return "critical";
  if (record.state === "ready" || record.result === "no-op" || record.result === "completed") return "success";
  return "info";
}
