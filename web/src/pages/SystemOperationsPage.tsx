import {
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  KeyRound,
  RotateCw,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  liveSignalIntegrations,
  operatingLoops,
  operatingSystemStages,
  permissionPolicies,
  type OperatingLoop,
  type OperatingSystemStage,
  type PermissionPolicy,
} from "./operating-system-data";

type SystemMode = "warehouse" | "freshness" | "workers" | "deployments" | "credentials";
type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const modeCopy: Record<SystemMode, { eyebrow: string; title: string; description: string }> = {
  warehouse: {
    eyebrow: "Data warehouse",
    title: "Data warehouse",
    description:
      "Catalog source ownership, freshness expectations, retention rules, and lineage blockers across Hermes, Khashi, and the wider dashboard fleet.",
  },
  freshness: {
    eyebrow: "Freshness and verification",
    title: "Freshness",
    description:
      "Track production verification, snapshot freshness, live sweep readiness, and the evidence needed before a dashboard is considered current.",
  },
  workers: {
    eyebrow: "Worker loops",
    title: "Workers",
    description:
      "Show the operating loops and runtime workers that can produce briefs, reviews, cost watches, and health evidence.",
  },
  deployments: {
    eyebrow: "Promotion rail",
    title: "Deployments",
    description:
      "One view for deploy gates, promotion runners, rollback evidence, and the explicit approvals required before live production changes.",
  },
  credentials: {
    eyebrow: "Access posture",
    title: "Credentials",
    description:
      "Presence-only credential posture for dashboard auth, deploy keys, app environment variables, webhook secrets, and rotation blockers.",
  },
};

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  critical: "border-red-500/35 bg-red-500/10 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function SystemWarehousePage() {
  return <SystemOperationsPage mode="warehouse" />;
}

export function SystemFreshnessPage() {
  return <SystemOperationsPage mode="freshness" />;
}

export function SystemWorkersPage() {
  return <SystemOperationsPage mode="workers" />;
}

export function SystemDeploymentsPage() {
  return <SystemOperationsPage mode="deployments" />;
}

export function SystemCredentialsPage() {
  return <SystemOperationsPage mode="credentials" />;
}

function SystemOperationsPage({ mode }: { mode: SystemMode }) {
  const copy = modeCopy[mode];
  const stages = stagesForMode(mode);
  const gated = stages.filter((stage) => stage.status === "gated" || stage.risk === "high").length;

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id={`hermes.system.${mode}`}>
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ModeIcon mode={mode} className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <div className="grid min-w-[220px] gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2">
            <MiniStat label="Tracked stages" value={stages.length} />
            <MiniStat label="Gated" value={gated} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label={`${copy.title} summary`}>
        {summaryCards(mode, stages).map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
        <Panel title={`${copy.title} control points`} count={stages.length}>
          <div className="grid gap-2 p-3">
            {stages.map((stage) => (
              <StageRow key={stage.version} stage={stage} />
            ))}
          </div>
        </Panel>
        {mode === "workers" ? (
          <WorkerPanel />
        ) : mode === "credentials" ? (
          <CredentialPanel />
        ) : mode === "warehouse" ? (
          <WarehousePanel />
        ) : mode === "freshness" ? (
          <FreshnessPanel stages={stages} />
        ) : (
          <DeploymentPanel stages={stages} />
        )}
      </section>
    </main>
  );
}

function stagesForMode(mode: SystemMode) {
  const routesByMode: Record<SystemMode, string[]> = {
    warehouse: ["/data-source-catalog", "/telemetry-fabric", "/telemetry-adapters", "/project-adapter-rollout"],
    freshness: ["/production-verification", "/production-sweep", "/project-snapshots", "/telemetry-fabric"],
    workers: ["/loop-runner", "/operating-loops", "/learning-ingestion", "/outcome-learning-feeds"],
    deployments: ["/deployment-promotion", "/promotion-runner", "/hetzner-promotion-execution", "/release-train-orchestrator"],
    credentials: ["/secrets-posture", "/secret-scanner", "/live-secret-scan", "/secret-provider-adapter"],
  };
  const wanted = new Set(routesByMode[mode]);
  return operatingSystemStages.filter((stage) => wanted.has(stage.route));
}

function summaryCards(mode: SystemMode, stages: OperatingSystemStage[]) {
  if (mode === "warehouse") {
    return [
      { label: "Sources", value: liveSignalIntegrations.length, detail: "registered producers", tone: "info" as Tone },
      { label: "Adapters", value: stages.filter((stage) => stage.title.includes("Adapter")).length, detail: "lineage/freshness layers", tone: "warning" as Tone },
      { label: "Ready", value: stages.filter((stage) => stage.status === "ready").length, detail: "fully trusted stages", tone: "success" as Tone },
      { label: "Gated", value: stages.filter((stage) => stage.status === "gated").length, detail: "needs project adoption", tone: "warning" as Tone },
    ];
  }
  if (mode === "freshness") {
    return [
      { label: "Checks", value: "DNS/TLS/API", detail: "verification classes", tone: "info" as Tone },
      { label: "Live sweep", value: "gated", detail: "operator-triggered only", tone: "warning" as Tone },
      { label: "Evidence", value: "required", detail: "health and screenshots", tone: "success" as Tone },
      { label: "Risk", value: "high", detail: "production network checks", tone: "critical" as Tone },
    ];
  }
  if (mode === "workers") {
    return [
      { label: "Loops", value: operatingLoops.length, detail: "registered worker loops", tone: "info" as Tone },
      { label: "Ready", value: operatingLoops.filter((loop) => loop.status === "ready").length, detail: "manual-safe definitions", tone: "success" as Tone },
      { label: "Draft", value: operatingLoops.filter((loop) => loop.status === "draft").length, detail: "needs gates/evidence", tone: "warning" as Tone },
      { label: "Autonomy", value: "locked", detail: "requires audit and breakers", tone: "critical" as Tone },
    ];
  }
  if (mode === "deployments") {
    return [
      { label: "Promotion gates", value: 7, detail: "validate through rollback", tone: "success" as Tone },
      { label: "Live deploy", value: "explicit", detail: "approval required", tone: "critical" as Tone },
      { label: "Rollback", value: "required", detail: "record before closeout", tone: "warning" as Tone },
      { label: "Evidence", value: "health + screenshot", detail: "post-deploy proof", tone: "info" as Tone },
    ];
  }
  return [
    { label: "Secret classes", value: 6, detail: "auth, env, API, deploy", tone: "info" as Tone },
    { label: "Raw values", value: "never", detail: "presence-only display", tone: "success" as Tone },
    { label: "Rotation", value: "manual", detail: "vault not selected", tone: "warning" as Tone },
    { label: "Admin scans", value: "gated", detail: "approval required", tone: "critical" as Tone },
  ];
}

function WarehousePanel() {
  return (
    <Panel title="Source catalog" count={liveSignalIntegrations.length}>
      <div className="grid gap-2 p-3">
        {liveSignalIntegrations.map((source) => (
          <article key={source.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{source.project}</h2>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{source.endpoint}</p>
              </div>
              <ToneBadge tone={source.status === "ready" ? "success" : source.status === "partial" ? "warning" : "critical"}>{source.status}</ToneBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{source.nextStep}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {source.signals.map((signal) => (
                <span key={signal} className="rounded border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {signal}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function FreshnessPanel({ stages }: { stages: OperatingSystemStage[] }) {
  return (
    <Panel title="Freshness rules">
      <div className="grid gap-3 p-3">
        <PolicyCallout title="No silent trust" detail="A dashboard is current only when route health, snapshot shape, and visual proof are fresh enough for the decision being made." tone="warning" />
        <PolicyCallout title="Screenshots are evidence" detail="Visual verification should be recorded after deploys and production sweeps, not treated as optional polish." tone="info" />
        <PolicyCallout title="Live network checks stay gated" detail={`${stages.filter((stage) => stage.risk === "high").length} high-risk verification stages require operator approval before live execution.`} tone="critical" />
      </div>
    </Panel>
  );
}

function WorkerPanel() {
  return (
    <Panel title="Loop registry" count={operatingLoops.length}>
      <div className="grid gap-2 p-3">
        {operatingLoops.map((loop) => (
          <LoopRow key={loop.id} loop={loop} />
        ))}
      </div>
    </Panel>
  );
}

function DeploymentPanel({ stages }: { stages: OperatingSystemStage[] }) {
  return (
    <Panel title="Deploy rules">
      <div className="grid gap-3 p-3">
        <PolicyCallout title="Validate before deploy" detail="Build, tests, migration awareness, health checks, screenshots, and rollback notes should be captured before marking a release current." tone="info" />
        <PolicyCallout title="Explicit approval" detail="Live deploy, rollback, and remote command execution remain admin-level explicit approval actions." tone="critical" />
        <PolicyCallout title="Promotion rail coverage" detail={`${stages.length} deployment stages define the shared path from local validation to production evidence.`} tone="success" />
      </div>
    </Panel>
  );
}

function CredentialPanel() {
  const credentialPolicies = permissionPolicies.filter((policy) => policy.action.toLowerCase().includes("secret") || policy.level === "admin");
  return (
    <Panel title="Credential policy" count={credentialPolicies.length}>
      <div className="grid gap-2 p-3">
        {credentialPolicies.map((policy) => (
          <PermissionRow key={policy.id} policy={policy} />
        ))}
      </div>
    </Panel>
  );
}

function StageRow({ stage }: { stage: OperatingSystemStage }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.version}</div>
          <h2 className="mt-1 text-sm font-semibold text-foreground">{stage.title}</h2>
        </div>
        <ToneBadge tone={stage.status === "ready" ? "success" : stage.status === "gated" ? "warning" : "info"}>{stage.status}</ToneBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.description}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniFact label="Owner" value={stage.owner} />
        <MiniFact label="Metric" value={stage.primaryMetric} />
      </div>
    </article>
  );
}

function LoopRow({ loop }: { loop: OperatingLoop }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{loop.name}</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{loop.cadence}</p>
        </div>
        <ToneBadge tone={loop.status === "ready" ? "success" : loop.status === "paused" ? "warning" : "neutral"}>{loop.status}</ToneBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{loop.output}</p>
      <div className="mt-3">
        <MiniFact label="Owner" value={loop.owner} />
      </div>
    </article>
  );
}

function PermissionRow({ policy }: { policy: PermissionPolicy }) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{policy.action}</h2>
        <ToneBadge tone={policy.approval === "explicit" ? "critical" : policy.approval === "confirm" ? "warning" : "info"}>{policy.approval}</ToneBadge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniFact label="Level" value={policy.level} />
        <MiniFact label="Audit" value={policy.audit ? "required" : "not required"} />
      </div>
    </article>
  );
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

function MetricCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: Tone }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded border p-1.5 ${toneClasses[tone]}`}>
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 tabular-nums text-3xl font-semibold text-foreground">{value}</div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}

function PolicyCallout({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
  return (
    <article className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{detail}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium leading-5 text-foreground">{value}</div>
    </div>
  );
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function ModeIcon({ mode, className }: { mode: SystemMode; className?: string }) {
  if (mode === "warehouse") return <Database className={className} aria-hidden />;
  if (mode === "freshness") return <Clock className={className} aria-hidden />;
  if (mode === "workers") return <RotateCw className={className} aria-hidden />;
  if (mode === "deployments") return <GitBranch className={className} aria-hidden />;
  return <KeyRound className={className} aria-hidden />;
}
