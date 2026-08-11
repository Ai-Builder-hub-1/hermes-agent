import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Filter,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { fleetMaturityReviewData } from "./fleet-maturity-review-data";

type EvidenceEntry = (typeof fleetMaturityReviewData.entries)[number];
type EvidenceStatus = "all" | "current" | "missing" | "needs-review" | "stale" | "blocked" | "not-applicable";

const statusLabels: Record<EvidenceStatus, string> = {
  all: "All",
  current: "Current",
  missing: "Missing",
  "needs-review": "Needs Review",
  stale: "Stale",
  blocked: "Blocked",
  "not-applicable": "Not Applicable",
};

const statusTone: Record<EvidenceStatus, string> = {
  all: "border-slate-300 bg-white text-slate-700",
  current: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  missing: "border-rose-500/30 bg-rose-500/10 text-rose-700",
  "needs-review": "border-amber-500/30 bg-amber-500/10 text-amber-700",
  stale: "border-orange-500/30 bg-orange-500/10 text-orange-700",
  blocked: "border-red-500/30 bg-red-500/10 text-red-700",
  "not-applicable": "border-slate-300 bg-slate-100 text-slate-600",
};

const severityTone: Record<string, string> = {
  none: "text-emerald-700",
  maturity: "text-blue-700",
  blocking: "text-red-700",
};

const statusOrder: EvidenceStatus[] = ["needs-review", "blocked", "missing", "stale", "current", "not-applicable", "all"];

export default function FleetMaturityReviewPage() {
  const data = fleetMaturityReviewData;
  const [activeStatus, setActiveStatus] = useState<EvidenceStatus>("needs-review");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const statusCounts = useMemo(() => ({
    all: data.entries.length,
    current: data.summary.current ?? 0,
    missing: data.summary.missing ?? 0,
    "needs-review": data.summary.needsReview ?? 0,
    stale: data.summary.stale ?? 0,
    blocked: data.summary.blocked ?? 0,
    "not-applicable": data.summary.notApplicable ?? 0,
  }), [data]);

  const filteredEntries = useMemo(() => {
    const entries = activeStatus === "all"
      ? [...data.entries]
      : data.entries.filter((entry) => entry.status === activeStatus);
    return entries.sort((left, right) => {
      const severityRank = severityScore(right.severity) - severityScore(left.severity);
      if (severityRank) return severityRank;
      return left.projectName.localeCompare(right.projectName) || left.kind.localeCompare(right.kind);
    });
  }, [activeStatus, data.entries]);

  const activeEntry = useMemo(() => {
    if (activeEntryId) {
      const match = data.entries.find((entry) => entry.id === activeEntryId);
      if (match) return match;
    }
    return filteredEntries[0] ?? null;
  }, [activeEntryId, data.entries, filteredEntries]);

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id="hermes.fleet-maturity-review">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fleet Governance</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Fleet Maturity Review</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review the exact evidence behind current, needs-review, blocked, stale, missing, and not-applicable maturity states across all dashboard projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1">Generated {formatDate(data.generatedAt)}</span>
            <span className="rounded-full border border-border bg-background px-3 py-1">{data.entries.length} evidence checks</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Fleet maturity summary">
        {statusOrder.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setActiveStatus(status);
              setActiveEntryId(null);
            }}
            className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeStatus === status ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            data-review-id={`hermes.fleet-maturity-review.status.${status}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{statusLabels[status]}</span>
              <StatusIcon status={status} />
            </div>
            <div className="mt-3 text-3xl font-semibold text-foreground">{statusCounts[status]}</div>
            <div className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>
              {status === activeStatus ? "selected" : "filter"}
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(420px,0.42fr)]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.fleet-maturity-review.queue">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Review Queue
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{statusLabels[activeStatus]} evidence</h2>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              {filteredEntries.length} items
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveEntryId(entry.id)}
                className={`grid gap-3 rounded-xl border p-3 text-left transition hover:border-primary/60 hover:bg-primary/5 ${activeEntry?.id === entry.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{entry.projectName}</div>
                    <div className="mt-1 text-xs font-medium text-muted-foreground">{entry.kind.replaceAll("-", " ")}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone[entry.status]}`}>{statusLabels[entry.status]}</span>
                    <span className={`rounded-full border border-border bg-card px-2 py-0.5 text-xs font-semibold ${severityTone[entry.severity] ?? "text-muted-foreground"}`}>{entry.severity}</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{entry.recommendedFix ?? "No follow-up required for this evidence item."}</p>
              </button>
            ))}
            {!filteredEntries.length ? (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                No evidence items match this status.
              </div>
            ) : null}
          </div>
        </article>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.fleet-maturity-review.detail">
          {activeEntry ? <EvidenceDetail entry={activeEntry} /> : (
            <div className="text-sm text-muted-foreground">Select an evidence item to review the action path.</div>
          )}
        </aside>
      </section>
    </main>
  );
}

function EvidenceDetail({ entry }: { entry: EvidenceEntry }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Evidence</div>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{entry.projectName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{entry.kind.replaceAll("-", " ")}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[entry.status]}`}>{statusLabels[entry.status]}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <MiniFact label="Severity" value={entry.severity} />
        <MiniFact label="Owner" value={entry.ownerSystem ?? "Unassigned"} />
        <MiniFact label="Role" value={entry.maturityRole ?? "Not declared"} />
        <MiniFact label="Checked" value={formatDate(entry.lastCheckedAt)} />
      </div>

      <section className="rounded-xl border border-border bg-background p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended action</div>
        <p className="mt-2 text-sm leading-6 text-foreground">{entry.recommendedFix ?? "No action required."}</p>
      </section>

      {entry.findings.length ? (
        <section className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Findings</div>
          <div className="mt-3 grid gap-2">
            {entry.findings.map((finding, index) => (
              <div key={`${finding.surfacePath}-${index}`} className="rounded-lg border border-border bg-card p-2">
                <div className="text-sm font-semibold text-foreground">{finding.code}</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{finding.message}</p>
                <div className="mt-2 rounded-md bg-background px-2 py-1 text-xs font-medium text-muted-foreground">{finding.surfacePath}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-background p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence links</div>
        <div className="mt-3 grid gap-2">
          <EvidenceLink label="Production" href={entry.productionUrl} />
          <EvidenceLink label="Proof" href={entry.proofUrl} />
          <EvidenceLink label="Snapshot" href={entry.snapshotUrl} />
          <MiniFact label="Source" value={String(entry.source ?? "Not declared")} />
        </div>
      </section>

      {entry.suggestion ? (
        <section className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action packet</div>
          <div className="mt-2 text-sm font-semibold text-foreground">{entry.suggestion.title}</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.suggestion.nextAction}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">{entry.suggestion.priority}</span>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">{entry.suggestion.status}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function EvidenceLink({ label, href }: { label: string; href: string | null }) {
  if (!href) return <MiniFact label={label} value="Not declared" />;
  return (
    <a className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm font-semibold text-foreground hover:border-primary/60 hover:bg-primary/5" href={href} target="_blank" rel="noreferrer">
      <span>{label}</span>
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function StatusIcon({ status }: { status: EvidenceStatus }) {
  const className = "h-5 w-5 text-muted-foreground";
  if (status === "current") return <CheckCircle2 className={className} aria-hidden="true" />;
  if (status === "blocked") return <ShieldAlert className={className} aria-hidden="true" />;
  if (status === "needs-review") return <AlertTriangle className={className} aria-hidden="true" />;
  if (status === "all") return <ListChecks className={className} aria-hidden="true" />;
  if (status === "not-applicable") return <CircleDot className={className} aria-hidden="true" />;
  return <ArrowUpRight className={className} aria-hidden="true" />;
}

function severityScore(severity: string) {
  if (severity === "blocking") return 3;
  if (severity === "maturity") return 2;
  if (severity === "none") return 0;
  return 1;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not captured";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
