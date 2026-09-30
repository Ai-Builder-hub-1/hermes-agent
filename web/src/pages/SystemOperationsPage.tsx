import {
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  KeyRound,
  RotateCw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  auditOperationalContract,
  contractForRoute,
  type OperationalPageAudit,
} from "@/lib/operational-page-contracts";
import { ActionResultHistory } from "@/components/ActionResultHistory";
import {
  fetchCredentialsSnapshot,
  fetchDeploymentsSnapshot,
  fetchFreshnessSnapshot,
  fetchStorageSnapshot,
  fetchWorkersSnapshot,
  runCredentialsScan,
  runDeploymentCheck,
  runFreshnessCheck,
  runStorageScan,
  runWorkerDryRun,
  systemHealthTone,
  type CredentialsSummary,
  type CredentialsSnapshot,
  type DeploymentsSummary,
  type DeploymentsSnapshot,
  type FreshnessSnapshot,
  type StorageSnapshot,
  type SystemSeries,
  type WorkersSnapshot,
} from "@/lib/system-operations";
import {
  fetchWarehouseSnapshot,
  formatBytes,
  runWarehouseDatabaseBackup,
  runWarehousePruneDryRun,
  runWarehouseProviderReadiness,
  runWarehouseRestoreProof,
  runWarehouseSync,
  warehouseHealthTone,
  type WarehouseJob,
  type WarehouseSeriesPoint,
  type WarehouseSnapshot,
  type WarehouseSource,
  type WarehouseWindow,
} from "@/lib/system-warehouse";
import {
  liveSignalIntegrations,
  operatingLoops,
  operatingSystemStages,
  type OperatingSystemStage,
} from "./operating-system-data";

type SystemMode = "warehouse" | "storage" | "freshness" | "workers" | "deployments" | "credentials";
type Tone = "success" | "info" | "warning" | "critical" | "neutral";
type WarehouseEvidenceItem =
  | { type: "source"; source: WarehouseSource }
  | { type: "job"; job: WarehouseJob }
  | { type: "root"; label: string; volume: WarehouseSnapshot["summary"]["warehouse"] };
type DeploymentRecord = DeploymentsSummary["deployments"][number];
type CredentialRecord =
  | { type: "variable"; variable: CredentialsSummary["runtimeVariables"][number] }
  | { type: "project"; project: CredentialsSummary["projects"][number] };

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
  storage: {
    eyebrow: "Storage operations",
    title: "Storage",
    description:
      "Track host capacity, artifact growth, cleanup candidates, retention classes, and safe storage scans across the dashboard runtime.",
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

export function SystemStoragePage() {
  return <SystemOperationsPage mode="storage" />;
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
  const route = routeForMode(mode);
  const contract = contractForRoute(route);
  const audit = contract ? auditOperationalContract(contract) : null;

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
            <MiniStat label={audit ? "Page maturity" : "Gated"} value={audit ? `${audit.score}%` : gated} />
          </div>
        </div>
      </section>

      {audit ? <PageContractStrip audit={audit} /> : null}
      <ActionResultHistory route={route} compact />

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
        {mode === "storage" ? (
          <StoragePanel />
        ) : mode === "workers" ? (
          <WorkersPanel />
        ) : mode === "credentials" ? (
          <CredentialsPanel />
        ) : mode === "warehouse" ? (
          <WarehousePanel />
        ) : mode === "freshness" ? (
          <FreshnessPanel />
        ) : (
          <DeploymentsPanel stages={stages} />
        )}
      </section>
    </main>
  );
}

function routeForMode(mode: SystemMode) {
  const routes: Record<SystemMode, string> = {
    warehouse: "/system/warehouse",
    storage: "/system/storage",
    freshness: "/system/freshness",
    workers: "/system/workers",
    deployments: "/system/deployments",
    credentials: "/system/credentials",
  };
  return routes[mode];
}

function stagesForMode(mode: SystemMode) {
  const routesByMode: Record<SystemMode, string[]> = {
    warehouse: ["/data-source-catalog", "/telemetry-fabric", "/telemetry-adapters", "/project-adapter-rollout"],
    storage: ["/durable-artifact-backend", "/data-source-catalog", "/telemetry-fabric"],
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
  if (mode === "storage") {
    return [
      { label: "Volumes", value: "live", detail: "host and artifact roots", tone: "info" as Tone },
      { label: "Cleanup", value: "dry-run", detail: "non-destructive scan", tone: "success" as Tone },
      { label: "Retention", value: "classified", detail: "runtime, warehouse, logs", tone: "warning" as Tone },
      { label: "Forecast", value: "inferred", detail: "growth estimate", tone: "info" as Tone },
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
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<WarehouseSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [evidenceItem, setEvidenceItem] = useState<WarehouseEvidenceItem | null>(null);

  const load = async (nextWindow = window) => {
    setLoading(true);
    try {
      setSnapshot(await fetchWarehouseSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const runAction = async (label: string, action: () => Promise<Record<string, unknown>>) => {
    setActionStatus(`${label} running`);
    try {
      await action();
      setActionStatus(`${label} recorded`);
      await load(window);
    } catch (exc) {
      setActionStatus(`${label} failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  if (loading && !snapshot) {
    return (
      <Panel title="Warehouse telemetry">
        <div className="grid min-h-[320px] place-items-center p-4 text-sm text-muted-foreground" data-data-state="loading">
          Loading warehouse telemetry
        </div>
      </Panel>
    );
  }

  if (error && !snapshot) {
    return (
      <Panel title="Warehouse telemetry">
        <div className="grid gap-3 p-3" data-data-state="error">
          <PolicyCallout title="Warehouse telemetry unavailable" detail={error} tone="critical" />
          <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground" onClick={() => void load(window)}>
            Retry
          </button>
        </div>
      </Panel>
    );
  }

  if (!snapshot) return null;

  const { summary, sources, series, jobs } = snapshot;
  const stale = sources.filter((source) => source.status !== "ready");
  const healthTone = warehouseHealthTone(summary.health);
  const freshness = new Date(summary.generatedAt).toLocaleString();

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.warehouse.telemetry">
      <Panel title="Warehouse live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last warehouse snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{freshness}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <ToneBadge tone={healthTone}>{summary.health}</ToneBadge>
              <ToneBadge tone={summary.slo.breaches.length ? "warning" : "success"}>
                {summary.slo.breaches.length ? `${summary.slo.breaches.length} SLO breach` : "SLO clear"}
              </ToneBadge>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <WarehouseRootCard label="Warehouse root" volume={summary.warehouse} onOpen={() => setEvidenceItem({ type: "root", label: "Warehouse root", volume: summary.warehouse })} />
            <WarehouseRootCard label="Mirror root" volume={summary.mirror} onOpen={() => setEvidenceItem({ type: "root", label: "Mirror root", volume: summary.mirror })} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runAction("Warehouse sync", runWarehouseSync)}>
              Run sync check
            </button>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runAction("Database backup", runWarehouseDatabaseBackup)}>
              DB backup proof
            </button>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runAction("Restore proof", runWarehouseRestoreProof)}>
              Restore proof
            </button>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runAction("Prune dry-run", runWarehousePruneDryRun)}>
              Prune dry-run
            </button>
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runAction("Provider readiness", runWarehouseProviderReadiness)}>
              Provider readiness
            </button>
          </div>
          {actionStatus ? <p className="text-xs font-medium text-muted-foreground">{actionStatus}</p> : null}
        </div>
      </Panel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Free storage" value={formatBytes(summary.warehouse.freeBytes)} detail={`${summary.warehouse.percentUsed}% used on warehouse volume`} tone={summary.warehouse.percentUsed > 85 ? "critical" : summary.warehouse.percentUsed > 70 ? "warning" : "success"} />
        <MetricCard label="24h ingest" value={formatBytes(summary.ingest.bytes24h)} detail={`${summary.ingest.records24h} records across ${summary.ingest.sources} sources`} tone="info" />
        <MetricCard label="Days until full" value={summary.forecast.daysUntilFull ?? "unknown"} detail={summary.forecast.confidence.replaceAll("_", " ")} tone={summary.forecast.daysUntilFull !== null && summary.forecast.daysUntilFull < 14 ? "critical" : "warning"} />
        <MetricCard label="Mirror" value={summary.mirror.configured ? "mounted" : "missing"} detail={summary.mirror.lastMirrorAt ? `last mirror ${summary.mirror.lastMirrorAt}` : "no mirror proof yet"} tone={summary.mirror.configured ? "success" : "critical"} />
        <MetricCard label="Live DB backup" value={summary.databaseBackup.latestBackup.ok ? "current" : summary.databaseBackup.status} detail={summary.databaseBackup.latestBackup.createdAt ?? summary.databaseBackup.sourceOfTruth.path} tone={summary.databaseBackup.latestBackup.ok ? "success" : summary.databaseBackup.sourceOfTruth.exists ? "warning" : "critical"} />
        <MetricCard label="Restore proof" value={summary.restoreProof.ok ? "current" : "missing"} detail={summary.restoreProof.lastRestoreProofAt ?? "no restore proof evidence found"} tone={summary.restoreProof.ok ? "success" : "warning"} />
        <MetricCard label="Stale sources" value={summary.ingest.staleSources} detail={`${stale.length} partial or blocked rows in source table`} tone={summary.ingest.staleSources ? "critical" : "success"} />
        <MetricCard label="Backbone" value={`${summary.backbone.summary.ready}/${summary.backbone.summary.categories}`} detail={summary.backbone.summary.posture.replaceAll("_", " ")} tone={summary.backbone.summary.warehouseEnough ? "success" : summary.backbone.summary.ready || summary.backbone.summary.partial ? "warning" : "critical"} />
        <MetricCard label="Providers" value={`${summary.providerReadiness.summary.ready}/${summary.providerReadiness.summary.categories}`} detail={summary.providerReadiness.summary.posture.replaceAll("_", " ")} tone={summary.providerReadiness.summary.providerReady ? "success" : summary.providerReadiness.summary.ready || summary.providerReadiness.summary.partial ? "warning" : "critical"} />
      </section>

      <Panel title="Ingestion and capacity trend">
        <div className="grid gap-3 p-3">
          <div className="flex flex-wrap gap-1.5">
            {(["1h", "24h", "7d", "30d"] as WarehouseWindow[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded border px-2.5 py-1 text-xs font-semibold ${window === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                onClick={() => setWindow(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <WarehouseTrendChart points={series.points} />
          <p className="text-xs text-muted-foreground">{series.historyStatus.replaceAll("_", " ")}</p>
        </div>
      </Panel>

      <Panel title="Source freshness" count={sources.length}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[720px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Lag</th>
                <th className="py-2 pr-3">24h ingest</th>
                <th className="py-2 pr-3">Errors</th>
                <th className="py-2 pr-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-semibold text-foreground">{source.project}</div>
                    <div className="line-clamp-2 text-muted-foreground">{source.detail}</div>
                  </td>
                  <td className="py-2 pr-3"><ToneBadge tone={warehouseHealthTone(source.status)}>{source.status}</ToneBadge></td>
                  <td className="py-2 pr-3 tabular-nums">{source.lagMinutes === null ? "unknown" : `${source.lagMinutes}m`}</td>
                  <td className="py-2 pr-3">
                    <div className="tabular-nums text-foreground">{formatBytes(source.bytes24h)}</div>
                    <div className="text-muted-foreground">{source.records24h} records</div>
                  </td>
                  <td className="py-2 pr-3">{source.errorCount24h ? source.lastError ?? source.errorCount24h : "none"}</td>
                  <td className="py-2 pr-3">
                    <div>{source.owner}</div>
                    <button type="button" className="mt-1 text-xs font-semibold text-primary hover:underline" onClick={() => setEvidenceItem({ type: "source", source })}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Warehouse backbone audit" count={summary.backbone.summary.categories}>
          <div className="grid gap-2 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniFact label="Ready" value={summary.backbone.summary.ready} />
              <MiniFact label="Partial" value={summary.backbone.summary.partial} />
              <MiniFact label="Missing" value={summary.backbone.summary.missing} />
            </div>
            {summary.backbone.items.map((item) => (
              <PolicyCallout
                key={item.id}
                title={`${item.label}: ${item.status}`}
                detail={item.warehouseEnough ? `Evidence: ${item.evidence.slice(0, 2).join(", ") || "warehouse record"}` : `${item.missing[0] ?? item.nextAction}`}
                tone={item.status === "ready" ? "success" : item.status === "partial" ? "warning" : "critical"}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Provider readiness" count={summary.providerReadiness.summary.categories}>
          <div className="grid gap-2 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniFact label="Ready" value={summary.providerReadiness.summary.ready} />
              <MiniFact label="Partial" value={summary.providerReadiness.summary.partial} />
              <MiniFact label="Missing" value={summary.providerReadiness.summary.missing} />
            </div>
            {summary.providerReadiness.items.map((item) => (
              <PolicyCallout
                key={item.id}
                title={`${item.label}: ${item.status}`}
                detail={item.proofCount ? `${item.proofTable}: ${item.proofCount} proof row(s)` : `${item.requiredEnv.join(" or ")} / ${item.nextAction}`}
                tone={item.status === "ready" ? "success" : item.status === "partial" ? "warning" : "critical"}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Group 1 connection checklist" count={summary.providerReadiness.connectionChecklist.filter((item) => item.status !== "ready").length}>
          <div className="grid gap-2 p-3">
            {summary.providerReadiness.connectionChecklist.map((item) => (
              <PolicyCallout
                key={item.id}
                title={`${item.label}: ${item.status}`}
                detail={`${item.needed} Inputs: ${item.acceptedInputs}. Safe test: ${item.safeTest}`}
                tone={item.status === "ready" ? "success" : item.status === "partial" ? "warning" : "critical"}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Live database backup">
          <div className="grid gap-2 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniFact label="Source" value={summary.databaseBackup.sourceOfTruth.exists ? "present" : "missing"} />
              <MiniFact label="Backup" value={summary.databaseBackup.latestBackup.ok ? "current" : summary.databaseBackup.status} />
              <MiniFact label="Size" value={formatBytes(summary.databaseBackup.latestBackup.sizeBytes || summary.databaseBackup.sourceOfTruth.sizeBytes)} />
            </div>
            <PolicyCallout
              title="Database is live source of truth"
              detail={`${summary.databaseBackup.sourceOfTruth.path} / ${summary.databaseBackup.warehouseRole.replaceAll("-", " ")}`}
              tone={summary.databaseBackup.sourceOfTruth.exists ? "info" : "critical"}
            />
            <PolicyCallout
              title={summary.databaseBackup.latestBackup.ok ? "Backup proof current" : "Backup proof needed"}
              detail={summary.databaseBackup.latestBackup.backupRef || summary.databaseBackup.nextAction}
              tone={summary.databaseBackup.latestBackup.ok ? "success" : "warning"}
            />
          </div>
        </Panel>
        <Panel title="SLO and remediation">
          <div className="grid gap-2 p-3">
            {summary.slo.breaches.length ? summary.slo.breaches.map((breach) => (
              <PolicyCallout key={breach} title="Breach" detail={breach} tone="warning" />
            )) : <PolicyCallout title="SLO clear" detail={`Freshness ${summary.slo.freshnessMinutes}m, mirror lag ${summary.slo.mirrorLagHours}h, restore proof ${summary.slo.restoreProofDays}d.`} tone="success" />}
            <PolicyCallout title="Safe next actions" detail="Use sync check, restore proof, and prune dry-run for evidence. Collector execution, destructive prune, deploy, and remote mutation remain approval-gated." tone="info" />
          </div>
        </Panel>
        <Panel title="Warehouse jobs and evidence" count={jobs.length}>
          <div className="grid max-h-[420px] gap-2 overflow-auto p-3">
            {jobs.length ? jobs.slice(0, 8).map((job) => (
              <article key={job.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{job.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{job.kind} / {job.owner}</p>
                  </div>
                  <ToneBadge tone={warehouseHealthTone(job.status)}>{job.status}</ToneBadge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <MiniFact label="Bytes" value={formatBytes(job.bytes)} />
                  <MiniFact label="Records" value={job.records} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.detail}</p>
                <button type="button" className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted" onClick={() => setEvidenceItem({ type: "job", job })}>
                  Inspect evidence
                </button>
              </article>
            )) : <PolicyCallout title="No warehouse jobs yet" detail="Collector, mirror, prune, and restore evidence will appear after runtime records are written." tone="warning" />}
          </div>
        </Panel>
      </section>
      <WarehouseEvidenceDrawer item={evidenceItem} onClose={() => setEvidenceItem(null)} />
    </div>
  );
}

function WarehouseTrendChart({ points }: { points: WarehouseSeriesPoint[] }) {
  const path = useMemo(() => buildLine(points, "bytesIngested"), [points]);
  const area = useMemo(() => buildLine(points, "storageUsedBytes"), [points]);
  if (points.length < 2) {
    return <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-border bg-background text-sm text-muted-foreground">Not enough chart data yet</div>;
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3" data-hdk-component="LineChart" data-chart-type="line" data-x-axis="timestamp" data-y-axis="bytes">
      <svg viewBox="0 0 720 220" className="h-56 w-full" role="img" aria-label="Warehouse ingestion and capacity trend">
        <line x1="42" x2="700" y1="188" y2="188" className="stroke-border" />
        <line x1="42" x2="42" y1="18" y2="188" className="stroke-border" />
        <path d={area} fill="none" className="stroke-emerald-500" strokeWidth="3" />
        <path d={path} fill="none" className="stroke-sky-500" strokeWidth="3" />
        <text x="42" y="210" className="fill-muted-foreground text-[10px]">{new Date(points[0].timestamp).toLocaleDateString()}</text>
        <text x="700" y="210" textAnchor="end" className="fill-muted-foreground text-[10px]">{new Date(points[points.length - 1].timestamp).toLocaleDateString()}</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> storage used</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> bytes ingested</span>
      </div>
    </div>
  );
}

function WarehouseRootCard({
  label,
  volume,
  onOpen,
}: {
  label: string;
  volume: WarehouseSnapshot["summary"]["warehouse"];
  onOpen: () => void;
}) {
  const classification = classifyWarehouseRoot(volume);
  return (
    <article className="rounded-md border border-border bg-card px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-1 truncate text-sm font-medium leading-5 text-foreground">{volume.path}</div>
        </div>
        <ToneBadge tone={classification.tone}>{classification.label}</ToneBadge>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatBytes(volume.measuredBytes)} measured</span>
        <button type="button" className="font-semibold text-primary hover:underline" onClick={onOpen}>
          Inspect
        </button>
      </div>
    </article>
  );
}

function WarehouseEvidenceDrawer({ item, onClose }: { item: WarehouseEvidenceItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const title = item.type === "source" ? item.source.project : item.type === "job" ? item.job.title : item.label;
  const tone = item.type === "source" ? warehouseHealthTone(item.source.status) : item.type === "job" ? warehouseHealthTone(item.job.status) : classifyWarehouseRoot(item.volume).tone;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-3 sm:p-4" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-evidence-title"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-muted p-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warehouse drilldown</div>
            <h2 id="warehouse-evidence-title" className="mt-1 text-lg font-semibold leading-6 text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close warehouse drilldown"
            className="rounded border border-border bg-card p-2 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ToneBadge tone={tone}>{item.type}</ToneBadge>
          {item.type === "source" ? <WarehouseSourceDrilldown source={item.source} /> : null}
          {item.type === "job" ? <WarehouseJobDrilldown job={item.job} /> : null}
          {item.type === "root" ? <WarehouseRootDrilldown label={item.label} volume={item.volume} /> : null}
        </div>
        <div className="flex justify-end border-t border-border bg-muted p-4">
          <button type="button" className="rounded border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-background" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function WarehouseSourceDrilldown({ source }: { source: WarehouseSource }) {
  const freshness = source.lagMinutes === null ? "unknown" : source.lagMinutes > source.expectedCadenceMinutes * 2 ? "stale" : "within cadence";
  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm leading-6 text-muted-foreground">{source.detail}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniFact label="Owner" value={source.owner} />
        <MiniFact label="Status" value={source.status} />
        <MiniFact label="Scope" value={source.sourceScope ?? "runtime-evidence"} />
        <MiniFact label="Proof" value={source.proofId || "not reported"} />
        <MiniFact label="Freshness" value={freshness} />
        <MiniFact label="Lag" value={source.lagMinutes === null ? "unknown" : `${source.lagMinutes}m`} />
        <MiniFact label="Expected cadence" value={`${source.expectedCadenceMinutes}m`} />
        <MiniFact label="Last ingest" value={new Date(source.lastIngestAt).toLocaleString()} />
        <MiniFact label="24h bytes" value={formatBytes(source.bytes24h)} />
        <MiniFact label="24h records" value={source.records24h} />
      </div>
      <PolicyCallout
        title={source.errorCount24h ? "Source has errors" : "Closeout proof"}
        detail={source.errorCount24h ? source.lastError ?? `${source.errorCount24h} errors were reported.` : "A source is trusted when its latest ingest is inside cadence and downstream evidence is available."}
        tone={source.errorCount24h ? "critical" : "info"}
      />
    </div>
  );
}

function WarehouseJobDrilldown({ job }: { job: WarehouseJob }) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm leading-6 text-muted-foreground">{job.detail || "Runtime evidence job record."}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniFact label="Kind" value={job.kind} />
        <MiniFact label="Owner" value={job.owner} />
        <MiniFact label="Status" value={job.status} />
        <MiniFact label="Bytes" value={formatBytes(job.bytes)} />
        <MiniFact label="Records" value={job.records} />
        <MiniFact label="Proof" value={job.proofId || "not reported"} />
        <MiniFact label="Artifact" value={job.artifactUri || "not reported"} />
        <MiniFact label="Manifest" value={job.manifestHash || "not reported"} />
        <MiniFact label="Started" value={job.startedAt ? new Date(job.startedAt).toLocaleString() : "not reported"} />
        <MiniFact label="Finished" value={job.finishedAt ? new Date(job.finishedAt).toLocaleString() : "not reported"} />
      </div>
      <PolicyCallout
        title="Evidence use"
        detail="Use this record as proof for warehouse sync, mirror, prune, restore, deployment, or collector activity. Dangerous mutations still need explicit approval."
        tone="info"
      />
    </div>
  );
}

function WarehouseRootDrilldown({ label, volume }: { label: string; volume: WarehouseSnapshot["summary"]["warehouse"] }) {
  const classification = classifyWarehouseRoot(volume);
  return (
    <div className="mt-4 grid gap-3">
      <PolicyCallout title={classification.label} detail={classification.detail} tone={classification.tone} />
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniFact label="Path" value={volume.path} />
        <MiniFact label="Scope" value={volume.scope ?? "unknown"} />
        <MiniFact label="Host" value={volume.host ?? "unknown"} />
        <MiniFact label="Mount verified" value={volume.mountProof?.verifiedAt ? new Date(volume.mountProof.verifiedAt).toLocaleString() : "not reported"} />
        <MiniFact label="Exists" value={volume.exists ? "yes" : "no"} />
        <MiniFact label="Configured" value={volume.configured ? "yes" : "no"} />
        <MiniFact label="Measured" value={formatBytes(volume.measuredBytes)} />
        <MiniFact label="Files" value={volume.measuredFiles} />
        <MiniFact label="Volume used" value={`${volume.percentUsed}%`} />
        <MiniFact label="Free" value={formatBytes(volume.freeBytes)} />
        <MiniFact label="Truncated" value={volume.measurementTruncated ? "yes" : "no"} />
      </div>
      <PolicyCallout
        title="Operator note"
        detail={`${label} is trustworthy for production decisions only when the path exists, measurement is not unexpectedly empty, mirror/restore proof is current, and the source is labeled with its deployment scope.`}
        tone="warning"
      />
    </div>
  );
}

function classifyWarehouseRoot(volume: WarehouseSnapshot["summary"]["warehouse"]): { label: string; tone: Tone; detail: string } {
  const path = volume.path.toLowerCase();
  if (!volume.exists) return { label: "missing", tone: "critical", detail: "The configured path does not exist on this host." };
  if (path.includes("/root/apps") || path.includes("/var/") || path.includes("production")) {
    return { label: "production-like", tone: "success", detail: "The path looks like a deployed or host-level runtime location." };
  }
  if (path.includes("/users/") || path.includes("/tmp") || path.includes("workspace")) {
    return { label: "local", tone: "warning", detail: "The path looks local or development-scoped; confirm production mount state before treating it as production truth." };
  }
  return { label: "configured", tone: "info", detail: "The path exists, but deployment scope is inferred from the path only." };
}

function buildLine(points: WarehouseSeriesPoint[], key: "bytesIngested" | "storageUsedBytes") {
  const values = points.map((point) => point[key]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 658;
  const height = 170;
  return points.map((point, index) => {
    const x = 42 + (points.length === 1 ? 0 : (index / (points.length - 1)) * width);
    const ratio = (point[key] - min) / Math.max(1, max - min);
    const y = 188 - ratio * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function StoragePanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchStorageSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Storage telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Storage telemetry unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const scan = async () => {
    setActionStatus("Storage scan running");
    try {
      await runStorageScan();
      setActionStatus("Storage scan recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Storage scan failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.storage.telemetry">
      <Panel title="Storage live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last storage snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={systemHealthTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Free storage" value={formatBytes(summary.summary.freeBytes)} detail={`${summary.summary.percentUsed}% used on primary volume`} tone={summary.summary.percentUsed > 85 ? "critical" : summary.summary.percentUsed > 70 ? "warning" : "success"} />
            <MetricCard label="Measured data" value={formatBytes(summary.summary.measuredBytes)} detail={`${summary.volumes.length} tracked roots`} tone="info" />
            <MetricCard label="Cleanup candidates" value={summary.summary.cleanupCandidates} detail="non-destructive review list" tone={summary.summary.cleanupCandidates ? "warning" : "success"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void scan()}>
              Run storage scan
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Storage growth trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <SystemTrendChart series={series} primaryKey="usedBytes" secondaryKey="cleanupBytes" />
        </div>
      </Panel>
      <Panel title="Volumes and retention" count={summary.volumes.length}>
        <div className="grid gap-2 p-3">
          {summary.volumes.map((volume) => (
            <article key={volume.path} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{volume.label}</h2>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{volume.path}</p>
                </div>
                <ToneBadge tone={volume.percentUsed > 85 ? "critical" : volume.percentUsed > 70 ? "warning" : "success"}>{volume.retentionClass}</ToneBadge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniFact label="Measured" value={formatBytes(volume.measuredBytes)} />
                <MiniFact label="Files" value={volume.measuredFiles} />
                <MiniFact label="Used" value={`${volume.percentUsed}%`} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Cleanup candidates" count={summary.cleanupCandidates.length}>
        <div className="grid gap-2 p-3">
          {summary.cleanupCandidates.length ? summary.cleanupCandidates.slice(0, 8).map((candidate) => (
            <article key={candidate.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{candidate.label}</h2>
                <ToneBadge tone="warning">{formatBytes(candidate.reclaimableBytes)}</ToneBadge>
              </div>
              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{candidate.path}</p>
              <MiniFact label="Safe action" value={candidate.safeAction} />
            </article>
          )) : <PolicyCallout title="No cleanup candidates" detail="Storage scan did not identify reviewable cleanup candidates." tone="success" />}
        </div>
      </Panel>
      <Panel title="Storage providers" count={summary.providers?.length ?? 0}>
        <div className="grid gap-2 p-3">
          {summary.providers?.length ? summary.providers.map((provider) => (
            <article key={provider.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{provider.label}</h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{provider.path || "not configured"}</p>
                </div>
                <ToneBadge tone={provider.status === "ready" ? "success" : "warning"}>{provider.status}</ToneBadge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniFact label="Scope" value={provider.scope} />
                <MiniFact label="Measured" value={formatBytes(provider.measuredBytes)} />
              </div>
            </article>
          )) : <PolicyCallout title="No storage providers" detail="No object-store or external artifact provider is configured in the current snapshot." tone="warning" />}
        </div>
      </Panel>
    </div>
  );
}

function FreshnessPanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<FreshnessSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchFreshnessSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Freshness telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Freshness telemetry unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const runCheck = async () => {
    setActionStatus("Freshness check running");
    try {
      await runFreshnessCheck();
      setActionStatus("Freshness check recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Freshness check failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.freshness.telemetry">
      <Panel title="Freshness live status">
        <div className="grid gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={systemHealthTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Sources" value={summary.summary.sources} detail={`${summary.summary.readySources} ready`} tone="info" />
            <MetricCard label="Stale" value={summary.summary.staleSources} detail="sources breaching cadence or state" tone={summary.summary.staleSources ? "critical" : "success"} />
            <MetricCard label="Max lag" value={`${summary.summary.maxLagMinutes}m`} detail="largest observed source lag" tone={summary.summary.maxLagMinutes > 240 ? "warning" : "success"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runCheck()}>
              Run freshness check
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Freshness trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <SystemTrendChart series={series} primaryKey="maxLagMinutes" secondaryKey="staleSources" />
        </div>
      </Panel>
      <Panel title="Source matrix" count={summary.sources.length}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[760px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">System</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Lag</th>
                <th className="py-2 pr-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {summary.sources.map((source) => (
                <tr key={source.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-semibold text-foreground">{source.source}</div>
                    <div className="line-clamp-2 text-muted-foreground">{source.detail}</div>
                  </td>
                  <td className="py-2 pr-3">{source.system}</td>
                  <td className="py-2 pr-3"><ToneBadge tone={systemHealthTone(source.status)}>{source.status}</ToneBadge></td>
                  <td className="py-2 pr-3 tabular-nums">{source.lagMinutes === null ? "unknown" : `${source.lagMinutes}m`}</td>
                  <td className="py-2 pr-3">{source.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Freshness breaches" count={summary.breaches.length}>
        <div className="grid gap-2 p-3">
          {summary.breaches.length ? summary.breaches.map((breach) => (
            <PolicyCallout key={breach.id} title={breach.source} detail={`${breach.detail} Lag: ${breach.lagMinutes ?? "unknown"}m.`} tone="warning" />
          )) : <PolicyCallout title="No freshness breaches" detail="All known sources are inside their current freshness tolerance." tone="success" />}
        </div>
      </Panel>
    </div>
  );
}

function WorkersPanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<WorkersSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchWorkersSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Worker telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Worker telemetry unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const dryRun = async () => {
    setActionStatus("Worker dry-run running");
    try {
      await runWorkerDryRun();
      setActionStatus("Worker dry-run recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Worker dry-run failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.workers.telemetry">
      <Panel title="Worker live status">
        <div className="grid gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={systemHealthTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label="Workers" value={summary.summary.workers} detail="tracked runtime rows" tone="info" />
            <MetricCard label="Ready" value={summary.summary.ready} detail="healthy worker rows" tone="success" />
            <MetricCard label="Watch" value={summary.summary.watch} detail="needs attention" tone={summary.summary.watch ? "warning" : "success"} />
            <MetricCard label="Failures" value={summary.summary.failures24h} detail="24h inferred failures" tone={summary.summary.failures24h ? "critical" : "success"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void dryRun()}>
              Run worker dry-run
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Worker run trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <SystemTrendChart series={series} primaryKey="runs" secondaryKey="failures" />
        </div>
      </Panel>
      <Panel title="Worker registry" count={summary.workers.length}>
        <div className="grid gap-2 p-3">
          {summary.workers.map((worker) => (
            <article key={worker.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{worker.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{worker.owner}</p>
                </div>
                <ToneBadge tone={systemHealthTone(worker.status)}>{worker.status}</ToneBadge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{worker.detail}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniFact label="Last run" value={new Date(worker.lastRunAt).toLocaleString()} />
                <MiniFact label="Next run" value={new Date(worker.nextRunAt).toLocaleString()} />
                <MiniFact label="Duration" value={`${worker.durationSeconds}s`} />
                <MiniFact label="Schedule source" value={worker.scheduleSource ?? "runtime-inferred"} />
                <MiniFact label="Log ref" value={worker.logRef || "not reported"} />
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function WindowButtons({ value, onChange }: { value: WarehouseWindow; onChange: (window: WarehouseWindow) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" data-hdk-component="TimeWindowSelector">
      {(["1h", "24h", "7d", "30d"] as WarehouseWindow[]).map((item) => (
        <button
          key={item}
          type="button"
          className={`rounded border px-2.5 py-1 text-xs font-semibold ${value === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SystemTrendChart({ series, primaryKey, secondaryKey }: { series: SystemSeries; primaryKey: string; secondaryKey: string }) {
  if (series.points.length < 2) {
    return <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-border bg-background text-sm text-muted-foreground">Not enough chart data yet</div>;
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3" data-hdk-component="LineChart" data-chart-type="line" data-x-axis="timestamp" data-y-axis={primaryKey}>
      <svg viewBox="0 0 720 220" className="h-56 w-full" role="img" aria-label={`${primaryKey} trend`}>
        <line x1="42" x2="700" y1="188" y2="188" className="stroke-border" />
        <line x1="42" x2="42" y1="18" y2="188" className="stroke-border" />
        <path d={buildSystemLine(series.points, primaryKey)} fill="none" className="stroke-emerald-500" strokeWidth="3" />
        <path d={buildSystemLine(series.points, secondaryKey)} fill="none" className="stroke-sky-500" strokeWidth="3" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> {primaryKey}</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> {secondaryKey}</span>
        <span>{series.historyStatus.replaceAll("_", " ")}</span>
      </div>
    </div>
  );
}

function buildSystemLine(points: Array<Record<string, number | string>>, key: string) {
  const values = points.map((point) => Number(point[key] ?? 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 658;
  const height = 170;
  return points.map((point, index) => {
    const x = 42 + (points.length === 1 ? 0 : (index / (points.length - 1)) * width);
    const value = Number(point[key] ?? 0);
    const ratio = (value - min) / Math.max(1, max - min);
    const y = 188 - ratio * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function LoadingPanel({ title }: { title: string }) {
  return (
    <Panel title={title}>
      <div className="grid min-h-[260px] place-items-center p-4 text-sm text-muted-foreground" data-data-state="loading">
        Loading {title.toLowerCase()}
      </div>
    </Panel>
  );
}

function ErrorPanel({ title, error, retry }: { title: string; error: string; retry: () => void }) {
  return (
    <Panel title={title}>
      <div className="grid gap-3 p-3" data-data-state="error">
        <PolicyCallout title={title} detail={error} tone="critical" />
        <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground" onClick={retry}>
          Retry
        </button>
      </div>
    </Panel>
  );
}

function DeploymentsPanel({ stages }: { stages: OperatingSystemStage[] }) {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<DeploymentsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentRecord | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchDeploymentsSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Deployment telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Deployment telemetry unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const runCheck = async () => {
    setActionStatus("Deployment check running");
    try {
      await runDeploymentCheck();
      setActionStatus("Deployment check recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Deployment check failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.deployments.telemetry">
      <Panel title="Deployment live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last deployment snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <ToneBadge tone={systemHealthTone(summary.health)}>{summary.health}</ToneBadge>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label="Deployments" value={summary.summary.deployments} detail={`${summary.summary.ready} ready records`} tone="info" />
            <MetricCard label="Gated" value={summary.summary.gated} detail="needs promotion proof" tone={summary.summary.gated ? "warning" : "success"} />
            <MetricCard label="Failed" value={summary.summary.failed} detail="failed deployment evidence" tone={summary.summary.failed ? "critical" : "success"} />
            <MetricCard label="Rollback proof" value={summary.summary.rollbackProofs} detail={`${stages.length} promotion stages tracked`} tone={summary.summary.rollbackProofs ? "success" : "warning"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runCheck()}>
              Run deployment check
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Deployment trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <SystemTrendChart series={series} primaryKey="deployments" secondaryKey="failed" />
        </div>
      </Panel>
      <Panel title="Release evidence" count={summary.deployments.length}>
        <div className="grid gap-2 p-3">
          {summary.deployments.map((deployment) => (
            <article key={deployment.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{deployment.title}</h2>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{deployment.project} / {deployment.environment} / {deployment.version}</p>
                </div>
                <ToneBadge tone={systemHealthTone(deployment.state)}>{deployment.status}</ToneBadge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{deployment.detail || "Deployment evidence record."}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniFact label="Migration" value={deployment.migrationRequired ? "required" : "not required"} />
                <MiniFact label="Rollback" value={deployment.rollback || "missing"} />
                <MiniFact label="Updated" value={new Date(deployment.updatedAt).toLocaleString()} />
              </div>
              <button type="button" className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted" onClick={() => setSelectedDeployment(deployment)}>
                Inspect release proof
              </button>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Promotion queue" count={summary.promotionQueue.length}>
        <div className="grid gap-2 p-3">
          {summary.slo.breaches.length ? summary.slo.breaches.map((breach) => (
            <PolicyCallout key={breach} title="Deployment breach" detail={breach} tone="critical" />
          )) : null}
          {summary.promotionQueue.map((item) => (
            <PolicyCallout key={item.id} title={item.label} detail={`${item.description} Approval: ${item.approval}.`} tone={item.approval === "explicit" ? "critical" : "info"} />
          ))}
        </div>
      </Panel>
      <DeploymentEvidenceDrawer deployment={selectedDeployment} onClose={() => setSelectedDeployment(null)} />
    </div>
  );
}

function PageContractStrip({ audit }: { audit: OperationalPageAudit }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm" data-review-id={`hermes.page-contract.${audit.route}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge tone={audit.status === "ready" ? "success" : audit.status === "blocked" ? "critical" : "warning"}>{audit.status}</ToneBadge>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{audit.maturity} surface</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next maturity action: <span className="font-medium text-foreground">{audit.nextAction}</span>
          </p>
        </div>
        <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
          <MiniStat label="Contract score" value={`${audit.score}%`} />
          <MiniStat label="Missing" value={audit.missing.length} />
        </div>
      </div>
      {audit.missing.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {audit.missing.slice(0, 6).map((item) => (
            <span key={item} className="rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DeploymentEvidenceDrawer({ deployment, onClose }: { deployment: DeploymentRecord | null; onClose: () => void }) {
  useEffect(() => {
    if (!deployment) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deployment, onClose]);

  if (!deployment) return null;
  return (
    <SystemDrawer title={deployment.title} eyebrow="Release proof" onClose={onClose}>
      <div className="grid gap-3">
        <ToneBadge tone={systemHealthTone(deployment.state)}>{deployment.status}</ToneBadge>
        <p className="text-sm leading-6 text-muted-foreground">{deployment.detail || "Deployment evidence record."}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <MiniFact label="Project" value={deployment.project} />
        <MiniFact label="Environment" value={deployment.environment} />
        <MiniFact label="Version" value={deployment.version} />
        <MiniFact label="Deployed SHA" value={deployment.deployedSha ?? "unknown"} />
        <MiniFact label="Promotion source" value={deployment.promotionSource ?? "runtime-evidence"} />
        <MiniFact label="Health" value={deployment.healthStatus ?? deployment.status} />
        <MiniFact label="Rollback SHA" value={deployment.rollbackSha || "missing"} />
        <MiniFact label="Migration" value={deployment.migrationRequired ? "required" : "not required"} />
          <MiniFact label="Rollback" value={deployment.rollback || "missing"} />
          <MiniFact label="Updated" value={new Date(deployment.updatedAt).toLocaleString()} />
        </div>
        <section className="rounded-lg border border-border bg-background p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence refs</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {deployment.evidence.length ? deployment.evidence.map((item) => (
              <span key={item} className="rounded border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">{item}</span>
            )) : <span className="text-sm text-muted-foreground">No evidence refs reported.</span>}
          </div>
        </section>
        <PolicyCallout
          title="Promotion rule"
          detail="Treat deploy, rollback, migration, and production mutation as approval-gated until the release has health proof, rollback evidence, and an explicit operator decision."
          tone="warning"
        />
      </div>
    </SystemDrawer>
  );
}

function CredentialEvidenceDrawer({ item, onClose }: { item: CredentialRecord | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;
  const title = item.type === "variable" ? item.variable.name : item.project.label;
  return (
    <SystemDrawer title={title} eyebrow="Credential proof" onClose={onClose}>
      {item.type === "variable" ? (
        <div className="grid gap-3">
          <ToneBadge tone={item.variable.configured ? "success" : "critical"}>{item.variable.configured ? "configured" : "missing"}</ToneBadge>
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniFact label="Variable" value={item.variable.name} />
            <MiniFact label="Source" value={item.variable.source} />
            <MiniFact label="Class" value={item.variable.secretClass ?? "variable"} />
            <MiniFact label="Rotation" value={item.variable.rotationStatus ?? "unknown"} />
            <MiniFact label="Rotation age" value={item.variable.rotationAgeDays === null || item.variable.rotationAgeDays === undefined ? "unknown" : `${item.variable.rotationAgeDays}d`} />
            <MiniFact label="Safe test" value={item.variable.safeTestStatus ?? "not-run"} />
            <MiniFact label="Value length" value={item.variable.configured ? item.variable.valueLength : 0} />
            <MiniFact label="Exposure" value="presence only" />
          </div>
          <PolicyCallout
            title="Secret safety"
            detail="The dashboard only reports presence and length metadata. Secret values should never render here, and rotation work remains approval-gated."
            tone="info"
          />
        </div>
      ) : (
        <div className="grid gap-3">
          <ToneBadge tone={systemHealthTone(item.project.status)}>{item.project.status}</ToneBadge>
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniFact label="Project" value={item.project.projectId} />
            <MiniFact label="Proof freshness" value={item.project.proofFreshness} />
            <MiniFact label="Rotation" value={item.project.rotationStatus ?? "unknown"} />
            <MiniFact label="Safe test" value={item.project.safeTestStatus ?? "not-run"} />
            <MiniFact label="Blockers" value={item.project.blockers.length} />
          </div>
          <section className="rounded-lg border border-border bg-background p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blockers</h3>
            <div className="mt-2 grid gap-2">
              {item.project.blockers.length ? item.project.blockers.map((blocker) => (
                <PolicyCallout key={blocker} title="Credential blocker" detail={blocker} tone="critical" />
              )) : <p className="text-sm text-muted-foreground">No project credential blockers reported.</p>}
            </div>
          </section>
        </div>
      )}
    </SystemDrawer>
  );
}

function SystemDrawer({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-3 sm:p-4" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-drawer-title"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-muted p-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</div>
            <h2 id="system-drawer-title" className="mt-1 text-lg font-semibold leading-6 text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close system drilldown"
            className="rounded border border-border bg-card p-2 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="flex justify-end border-t border-border bg-muted p-4">
          <button type="button" className="rounded border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-background" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function CredentialsPanel() {
  const [window, setWindow] = useState<WarehouseWindow>("24h");
  const [snapshot, setSnapshot] = useState<CredentialsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<CredentialRecord | null>(null);

  const load = async (nextWindow = window) => {
    try {
      setSnapshot(await fetchCredentialsSnapshot(nextWindow));
      setError(null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    }
  };

  useEffect(() => {
    void load(window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  if (!snapshot && !error) return <LoadingPanel title="Credential telemetry" />;
  if (!snapshot && error) return <ErrorPanel title="Credential telemetry unavailable" error={error} retry={() => void load(window)} />;
  if (!snapshot) return null;

  const { summary, series } = snapshot;
  const runScan = async () => {
    setActionStatus("Credential scan running");
    try {
      await runCredentialsScan();
      setActionStatus("Credential scan recorded");
      await load(window);
    } catch (exc) {
      setActionStatus(`Credential scan failed: ${exc instanceof Error ? exc.message : String(exc)}`);
    }
  };

  return (
    <div className="grid gap-4" data-data-state={error ? "partial" : "ready"} data-review-id="hermes.system.credentials.telemetry">
      <Panel title="Credential live status">
        <div className="grid gap-3 p-3">
          {error ? <PolicyCallout title="Showing last credential snapshot" detail={error} tone="warning" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{new Date(summary.generatedAt).toLocaleString()}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <ToneBadge tone={systemHealthTone(summary.health)}>{summary.health}</ToneBadge>
              <ToneBadge tone="success">{summary.secretExposurePolicy}</ToneBadge>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label="Variables" value={summary.summary.variables} detail={`${summary.summary.configured} configured`} tone="info" />
            <MetricCard label="Missing" value={summary.summary.missing} detail="runtime variables not present" tone={summary.summary.missing ? "critical" : "success"} />
            <MetricCard label="Projects" value={summary.summary.projects} detail="credential proof rows" tone="info" />
            <MetricCard label="Blockers" value={summary.summary.blockers} detail="credential blockers" tone={summary.summary.blockers ? "critical" : "success"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => void runScan()}>
              Run credential scan
            </button>
            {actionStatus ? <span className="self-center text-xs font-medium text-muted-foreground">{actionStatus}</span> : null}
          </div>
        </div>
      </Panel>
      <Panel title="Credential posture trend">
        <div className="grid gap-3 p-3">
          <WindowButtons value={window} onChange={setWindow} />
          <SystemTrendChart series={series} primaryKey="configured" secondaryKey="missing" />
        </div>
      </Panel>
      <Panel title="Runtime variables" count={summary.runtimeVariables.length}>
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[680px] text-left text-xs" data-hdk-component="DataTable" data-pagination="table-window">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Variable</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Length</th>
              </tr>
            </thead>
            <tbody>
              {summary.runtimeVariables.map((variable) => (
                <tr key={variable.name} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 font-semibold text-foreground">{variable.name}</td>
                  <td className="py-2 pr-3"><ToneBadge tone={variable.configured ? "success" : "critical"}>{variable.configured ? "configured" : "missing"}</ToneBadge></td>
                  <td className="py-2 pr-3">{variable.source}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    <div>{variable.configured ? variable.valueLength : 0}</div>
                    <button type="button" className="mt-1 text-xs font-semibold text-primary hover:underline" onClick={() => setSelectedCredential({ type: "variable", variable })}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Project credential proof" count={summary.projects.length}>
        <div className="grid gap-2 p-3">
          {summary.projects.length ? summary.projects.map((project) => (
            <article key={project.projectId} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{project.label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{project.projectId}</p>
                </div>
                <ToneBadge tone={systemHealthTone(project.status)}>{project.status}</ToneBadge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniFact label="Proof freshness" value={project.proofFreshness} />
                <MiniFact label="Blockers" value={project.blockers.length} />
              </div>
              <button type="button" className="mt-3 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted" onClick={() => setSelectedCredential({ type: "project", project })}>
                Inspect proof
              </button>
            </article>
          )) : <PolicyCallout title="No project credential proofs" detail="Credential status has not reported project-level proof rows yet." tone="warning" />}
        </div>
      </Panel>
      <Panel title="Blockers and recommendations" count={summary.blockers.length + summary.recommendations.length}>
        <div className="grid gap-2 p-3">
          {summary.blockers.length ? summary.blockers.map((blocker) => (
            <PolicyCallout key={blocker} title="Credential blocker" detail={blocker} tone="critical" />
          )) : <PolicyCallout title="No credential blockers" detail="The presence-only credential scan has no active blockers in the current snapshot." tone="success" />}
          {summary.recommendations.map((recommendation) => (
            <PolicyCallout key={recommendation} title="Recommendation" detail={recommendation} tone="info" />
          ))}
        </div>
      </Panel>
      <CredentialEvidenceDrawer item={selectedCredential} onClose={() => setSelectedCredential(null)} />
    </div>
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
  if (mode === "storage") return <Database className={className} aria-hidden />;
  if (mode === "freshness") return <Clock className={className} aria-hidden />;
  if (mode === "workers") return <RotateCw className={className} aria-hidden />;
  if (mode === "deployments") return <GitBranch className={className} aria-hidden />;
  return <KeyRound className={className} aria-hidden />;
}
