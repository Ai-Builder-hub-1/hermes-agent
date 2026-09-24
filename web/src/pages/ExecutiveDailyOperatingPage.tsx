import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Eye,
  GitBranch,
  History,
  Radio,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { dashboardExecutiveDailyOperatingView } from "./dashboard-executive-daily-operating-data";

type DashboardEntry = (typeof dashboardExecutiveDailyOperatingView.dashboards)[number];
type SignalEntry = DashboardEntry["signals"][number];

const statusTone: Record<string, string> = {
  clear: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  operational: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  "visual-gate-passed": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  stable: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  passing: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  "inside-policy": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  "low-risk": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  "recovery-ready": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  "needs-attention": "border-amber-500/30 bg-amber-500/10 text-amber-700",
  attention: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  "policy-attention": "border-amber-500/30 bg-amber-500/10 text-amber-700",
  "risk-watch": "border-amber-500/30 bg-amber-500/10 text-amber-700",
  "recovery-attention": "border-amber-500/30 bg-amber-500/10 text-amber-700",
};

const metricCards = [
  {
    label: "Dashboards",
    value: dashboardExecutiveDailyOperatingView.summary.dashboardCount,
    detail: `${dashboardExecutiveDailyOperatingView.summary.attentionCount} attention item(s)`,
    icon: Activity,
  },
  {
    label: "Maturity Score",
    value: `${dashboardExecutiveDailyOperatingView.summary.fullyOperationalScore}%`,
    detail: dashboardExecutiveDailyOperatingView.summary.driftStatus,
    icon: ShieldCheck,
  },
  {
    label: "Live E2E",
    value: dashboardExecutiveDailyOperatingView.summary.liveE2eCurrent,
    detail: `${dashboardExecutiveDailyOperatingView.summary.monitoringCurrent} monitoring current`,
    icon: Radio,
  },
  {
    label: "Ship Posture",
    value: dashboardExecutiveDailyOperatingView.summary.safeToDeploy ? "Ready" : "Blocked",
    detail: dashboardExecutiveDailyOperatingView.summary.safeToCommit ? "safe to commit" : "commit blocked",
    icon: GitBranch,
  },
];

export default function ExecutiveDailyOperatingPage() {
  const data = dashboardExecutiveDailyOperatingView;
  const hasAttention = data.status !== "clear";

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id="hermes.executive-daily-operating">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Operating View</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Executive Dashboard Posture</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              One place to see whether the dashboard fleet is healthy, visually proven, monitored, live-tested, command-safe, and ready to ship.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`rounded-full border px-3 py-1 ${statusTone[data.status] ?? "border-border bg-background text-muted-foreground"}`}>
              {hasAttention ? "needs attention" : "clear"}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">
              Generated {formatDate(data.generatedAt)}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Daily posture metrics">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="mt-3 break-words text-3xl font-semibold text-foreground">{card.value}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(360px,0.38fr)]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.executive-daily-operating.dashboards">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operational Proof</div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Dashboard fleet</h2>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              {data.dashboards.length} dashboards
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {data.dashboards.map((dashboard) => (
              <DashboardRow key={dashboard.projectId} dashboard={dashboard} />
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.executive-daily-operating.priorities">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {hasAttention ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              Priorities
            </div>
            <div className="mt-4 grid gap-3">
              {data.topPriorities.map((priority) => (
                <div key={priority} className="rounded-xl border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">
                  {priority}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.executive-daily-operating.maturity-layers">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Brain className="h-4 w-4" aria-hidden="true" />
              Maturity Layers
            </div>
            <div className="mt-4 grid gap-3">
              {data.maturityLayers.map((layer) => (
                <div key={layer.label} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <LayerIcon label={layer.label} />
                        {layer.label}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{layer.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone[layer.status] ?? "border-border bg-card text-muted-foreground"}`}>
                      {layer.status}
                    </span>
                  </div>
                  <div className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                    {layer.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.executive-daily-operating.actions">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action Safety</div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Command posture</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Actions" value={data.actionPosture.actionInstances} />
              <MiniMetric label="Controlled" value={data.actionPosture.controlledMutations} />
              <MiniMetric label="Approvals" value={data.actionPosture.approvalRequired} />
              <MiniMetric label="Unsafe" value={data.actionPosture.unsafeMutations} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.executive-daily-operating.evidence">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Evidence
            </div>
            <div className="mt-4 grid gap-2">
              {data.evidenceLinks.map((item) => (
                <div key={item.path} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="mt-1 break-all text-xs text-muted-foreground">{item.path}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone[String(item.status)] ?? "border-border bg-card text-muted-foreground"}`}>
                      {String(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function DashboardRow({ dashboard }: { dashboard: DashboardEntry }) {
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-foreground">{dashboard.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{dashboard.projectId}</div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[dashboard.status] ?? "border-border bg-card text-muted-foreground"}`}>
          {dashboard.status.replaceAll("-", " ")}
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-5">
        {dashboard.signals.map((signal) => (
          <SignalBadge key={signal.id} signal={signal} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-muted-foreground">{dashboard.nextAction}</p>
        {dashboard.route ? (
          <a
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary/60 hover:text-primary"
            href={dashboard.route}
            rel="noreferrer"
            target="_blank"
          >
            Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function SignalBadge({ signal }: { signal: SignalEntry }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${statusTone[signal.status] ?? "border-border bg-card text-muted-foreground"}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">{signal.id.replaceAll("-", " ")}</div>
      <div className="mt-1 text-xs opacity-80">{signal.status}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 break-words text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function LayerIcon({ label }: { label: string }) {
  if (label.includes("History")) return <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
  if (label.includes("Recovery")) return <RotateCw className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
  return <Brain className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
