import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CircleDollarSign,
  FileText,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import {
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSidebar,
  ExecutiveActionQueue,
  InsightPanel,
  KpiCard,
  MetricGrid,
  ProgressMetric,
  StatusPill,
  type DashboardOperationalStatus,
  type DashboardTone,
  type ExecutiveActionItem,
  type ExecutiveDecisionRequest,
} from "@hermes/dashboard-kit";
import { buildExecutiveBriefingViewModel } from "./executive-briefing-data";

function toneForStatus(status: DashboardOperationalStatus): DashboardTone {
  if (status === "healthy") return "success";
  if (status === "watch") return "warning";
  if (status === "degraded" || status === "blocked") return "critical";
  return "unknown";
}

function toneForReadiness(readiness: number): DashboardTone {
  if (readiness >= 80) return "success";
  if (readiness >= 60) return "warning";
  return "critical";
}

function actionUrgency(decision: ExecutiveDecisionRequest): ExecutiveActionItem["urgency"] {
  if (decision.risk === "critical") return "critical";
  if (decision.risk === "high") return "high";
  if (decision.risk === "medium") return "normal";
  return "low";
}

function decisionToAction(decision: ExecutiveDecisionRequest): ExecutiveActionItem {
  return {
    id: decision.id,
    title: decision.title,
    owner: decision.owner,
    urgency: actionUrgency(decision),
    source: decision.requestedByRole.replaceAll("_", " "),
  };
}

export default function ExecutiveBriefingRoomPage() {
  const view = useMemo(() => buildExecutiveBriefingViewModel(), []);
  const {
    briefing,
    readinessCompletion,
    status,
    decisions,
    atRiskUnits,
    unknownUnits,
    officerReportCount,
    averageReadiness,
  } = view;
  const actionItems = decisions.map(decisionToAction);

  return (
    <DashboardShell
      sidebar={(
        <DashboardSidebar
          title="Briefing Room"
          description="TLC executive rollup."
          items={[
            { id: "brief", label: "Daily Brief", href: "#brief", active: true, icon: Building2 },
            { id: "completion", label: "Completion", href: "#completion", icon: ShieldCheck },
            { id: "units", label: "Business Units", href: "#units", icon: BarChart3 },
            { id: "officers", label: "Officer Reports", href: "#officers", icon: FileText },
            { id: "decisions", label: "Decision Queue", href: "#decisions", icon: ListChecks },
            { id: "evidence", label: "Evidence", href: "#evidence", icon: ShieldCheck },
          ]}
          footer={<div className="text-xs text-muted-foreground">Contract-backed executive reporting layer.</div>}
        />
      )}
      header={(
        <DashboardHeader
          title="Executive Briefing Room"
          eyebrow="TLC Capital Group"
          description="Co-CEO, officer, project, risk, cost, and decision rollup for managing the portfolio without opening every project dashboard."
          meta={(
            <>
              <StatusPill tone={toneForStatus(status)}>status {status}</StatusPill>
              <StatusPill tone={toneForReadiness(averageReadiness)}>readiness {averageReadiness}%</StatusPill>
              <StatusPill tone={decisions.length ? "warning" : "success"}>{decisions.length} decisions</StatusPill>
              <StatusPill tone="info">{briefing.period}</StatusPill>
            </>
          )}
        />
      )}
    >
      <MetricGrid columns={4}>
        <KpiCard
          label="Portfolio Readiness"
          value={`${averageReadiness}%`}
          detail={`${briefing.businessUnits.length} reporting units`}
          tone={toneForReadiness(averageReadiness)}
          icon={BarChart3}
        />
        <KpiCard
          label="Attention Needed"
          value={atRiskUnits.length}
          detail="watch, degraded, or blocked units"
          tone={atRiskUnits.length ? "warning" : "success"}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Officer Reports"
          value={officerReportCount}
          detail="co-CEO and functional reports"
          tone="info"
          icon={FileText}
        />
        <KpiCard
          label="Unknown Feeds"
          value={unknownUnits.length}
          detail="units without standardized reporting"
          tone={unknownUnits.length ? "unknown" : "success"}
          icon={ShieldCheck}
        />
      </MetricGrid>

      <DashboardSection
        id="completion"
        title="Completion Boundary"
        description="Separates local command-center completion from downstream and external integration work."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <InsightPanel title="Local Completion Read" tone="info">
            <p className="text-sm text-muted-foreground">{readinessCompletion.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ProgressMetric
                label="Overall Readiness"
                value={readinessCompletion.currentOverallPercent}
                tone={toneForReadiness(readinessCompletion.currentOverallPercent)}
                detail={`Previously ${readinessCompletion.previousOverallPercent}%`}
              />
              <ProgressMetric
                label="Local Surface"
                value={readinessCompletion.localSurfacePercent}
                tone={toneForReadiness(readinessCompletion.localSurfacePercent)}
                detail="Dashboard, contracts, plan intelligence, and briefing layer"
              />
              <ProgressMetric
                label="External Integration"
                value={readinessCompletion.externalIntegrationPercent}
                tone={toneForReadiness(readinessCompletion.externalIntegrationPercent)}
                detail="Credentials, production evidence, live feeds, workers"
              />
            </div>
          </InsightPanel>
          <div className="rounded-lg border border-border bg-background p-3">
            <h3 className="text-sm font-semibold text-foreground">Still Needed</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {readinessCompletion.externalBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {readinessCompletion.areas.map((area) => (
            <article key={area.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{area.ownerProjectId}</div>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{area.label}</h3>
                </div>
                <StatusPill tone={area.kind === "external-blocked" ? "critical" : area.kind === "local-complete" ? "success" : "warning"}>
                  {area.kind.replaceAll("-", " ")}
                </StatusPill>
              </div>
              <div className="mt-3">
                <ProgressMetric
                  label="Readiness"
                  value={area.currentPercent}
                  tone={toneForReadiness(area.currentPercent)}
                  detail={`${area.previousPercent}% to ${area.currentPercent}% of ${area.targetPercent}% target`}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {area.externalBlockers[0] ?? area.remainingLocalWork[0] ?? area.evidence[0]}
              </div>
            </article>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        id="brief"
        title="Daily Executive Brief"
        description={`Generated ${new Date(briefing.generatedAt).toLocaleString()}`}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <InsightPanel title="Co-CEO Read" tone={toneForStatus(status)}>
            <p className="text-sm text-muted-foreground">{briefing.summary}</p>
          </InsightPanel>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <h3 className="text-sm font-semibold text-foreground">Top Priorities</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {briefing.topPriorities.map((priority) => <li key={priority}>{priority}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <h3 className="text-sm font-semibold text-foreground">What Changed</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {briefing.whatChanged.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        id="units"
        title="Business Unit Rollup"
        description="One executive card per operating unit. These cards should eventually come from each project's own report feed."
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {briefing.businessUnits.map((unit) => (
            <article key={unit.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{unit.businessUnitId}</div>
                  <h3 className="mt-1 truncate text-base font-semibold text-foreground">{unit.businessUnitName}</h3>
                </div>
                <StatusPill tone={toneForStatus(unit.status)}>{unit.status}</StatusPill>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{unit.coceoRead}</p>
              {typeof unit.readinessPercent === "number" ? (
                <div className="mt-4">
                  <ProgressMetric
                    label="Readiness"
                    value={unit.readinessPercent}
                    tone={toneForReadiness(unit.readinessPercent)}
                    detail={unit.summary}
                  />
                </div>
              ) : null}
              <dl className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Cost</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{unit.costPosture}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Revenue</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{unit.revenuePosture}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reports</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{unit.officerReports.length}</dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Focus</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {unit.currentFocus.map((focus) => <li key={focus}>{focus}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blockers</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {unit.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </DashboardSection>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <DashboardSection
          id="officers"
          title="Officer Report Rollup"
          description="Functional summaries from co-CEOs, CMOs, operators, finance, research, and product leads."
        >
          <div className="space-y-3">
            {briefing.businessUnits.flatMap((unit) => (
              unit.officerReports.map((report) => (
                <article key={report.id} className="rounded-md border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{unit.businessUnitName}</div>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">{report.roleLabel}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={toneForStatus(report.status)}>{report.status}</StatusPill>
                      <StatusPill tone={report.confidence === "high" ? "success" : "warning"}>{report.confidence}</StatusPill>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{report.summary}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended Actions</h4>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {report.recommendedActions.map((action) => <li key={action}>{action}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metrics</h4>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {report.metrics.map((metric) => (
                          <div key={metric.id} className="rounded-md border border-border px-3 py-2">
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                              <span>{metric.value}{metric.unit ?? ""}</span>
                              {metric.status ? <StatusPill tone={toneForStatus(metric.status)}>{metric.status}</StatusPill> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ))}
          </div>
        </DashboardSection>

        <ExecutiveActionQueue id="decisions" title="Executive Decision Queue" items={actionItems} />
      </div>

      <DashboardSection
        id="evidence"
        title="Evidence And Deferred Human Items"
        description="Reports and artifacts supporting the executive read. Live credentials, production windows, and external account access stay human-owned."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {briefing.evidence.map((item) => (
            <article key={item.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{item.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.kind}</div>
                </div>
                <StatusPill tone={item.confidence === "high" ? "success" : item.confidence === "medium" ? "warning" : "unknown"}>
                  {item.confidence ?? "unknown"}
                </StatusPill>
              </div>
              {item.href ? <div className="mt-3 truncate text-xs text-muted-foreground">{item.href}</div> : null}
            </article>
          ))}
          <article className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <CircleDollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-foreground">Deferred Integrations</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Provider billing, production SSH drills, external social permissions, and paid model fallbacks are intentionally left for the human-owned setup pass.
                </p>
              </div>
            </div>
          </article>
        </div>
      </DashboardSection>
    </DashboardShell>
  );
}
