import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Cpu,
  Gauge,
  GitBranch,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import {
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSidebar,
  KpiCard,
  MetricGrid,
  ProgressMetric,
  StatusPill,
  type DashboardTone,
} from "@hermes/dashboard-kit";

type EntityTier = "enterprise" | "business-unit" | "capability" | "technical-control";
type AttentionSeverity = "critical" | "warning" | "info";
type ActionMode = "human" | "agent" | "codex" | "report";

interface PortfolioEntity {
  id: string;
  name: string;
  tier: EntityTier;
  status: DashboardTone;
  readiness: number;
  summary: string;
  revenueSignal: string;
  costSignal: string;
  blockers: number;
  humanActions: number;
  nextMove: string;
}

interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  entity: string;
  title: string;
  reason: string;
  risk: string;
  action: string;
  mode: ActionMode;
}

interface TriageItem {
  id: string;
  entity: string;
  stage: "detected" | "triaged" | "fixing" | "validating" | "awaiting-approval";
  title: string;
  result: string;
  confidence: number;
}

const tierLabels: Record<EntityTier, string> = {
  "enterprise": "Enterprise",
  "business-unit": "Business Unit",
  "capability": "Capability",
  "technical-control": "Technical Control",
};

const actionIcons: Record<ActionMode, LucideIcon> = {
  human: ShieldCheck,
  agent: Bot,
  codex: Wrench,
  report: Sparkles,
};

const portfolioEntities: PortfolioEntity[] = [
  {
    id: "tlc",
    name: "TLC Capital Group",
    tier: "enterprise",
    status: "warning",
    readiness: 88,
    summary: "Portfolio command is active; enterprise CoCEO feed needs final source authority wiring.",
    revenueSignal: "Portfolio rollup pending",
    costSignal: "Funding watch",
    blockers: 2,
    humanActions: 3,
    nextMove: "Approve enterprise authority feed contract",
  },
  {
    id: "media-business",
    name: "Media Business Operations",
    tier: "business-unit",
    status: "critical",
    readiness: 72,
    summary: "Cost insights are blocked by live provider billing connectors and admin credential gaps.",
    revenueSignal: "Revenue ops partial",
    costSignal: "Provider costs incomplete",
    blockers: 4,
    humanActions: 5,
    nextMove: "Finish OpenAI, Gemini, and Google Cloud billing access",
  },
  {
    id: "khashi-vc",
    name: "Khashi VC",
    tier: "business-unit",
    status: "warning",
    readiness: 81,
    summary: "Experiment engine is running, but capacity is clustering into the 2-7 day window.",
    revenueSignal: "Learning mode",
    costSignal: "Capacity constrained",
    blockers: 1,
    humanActions: 1,
    nextMove: "Reserve near-close experiment capacity",
  },
  {
    id: "rinseables",
    name: "Rinseables OS",
    tier: "business-unit",
    status: "warning",
    readiness: 84,
    summary: "Product OS is near-ready; production deployment and performance automation need closure.",
    revenueSignal: "Storefront readiness",
    costSignal: "Search/perf watch",
    blockers: 2,
    humanActions: 2,
    nextMove: "Connect performance remediation loop",
  },
  {
    id: "media-engine",
    name: "Media Engine",
    tier: "capability",
    status: "info",
    readiness: 86,
    summary: "Reusable content production capability; consumed by business units but not itself a business unit.",
    revenueSignal: "Usage-based capability",
    costSignal: "Generation spend watch",
    blockers: 1,
    humanActions: 1,
    nextMove: "Expose publishing pipeline feed",
  },
  {
    id: "business-mapper",
    name: "Business Mapper",
    tier: "capability",
    status: "neutral",
    readiness: 77,
    summary: "Consumable mapping capability; needs registry metadata before automatic dashboard placement.",
    revenueSignal: "Internal enablement",
    costSignal: "No live feed",
    blockers: 1,
    humanActions: 0,
    nextMove: "Define capability registry type",
  },
  {
    id: "hermes-technical",
    name: "Hermes Technical Control",
    tier: "technical-control",
    status: "success",
    readiness: 93,
    summary: "Build, validation, deployment, and evidence rails are ready to serve downstream OS work.",
    revenueSignal: "N/A",
    costSignal: "Validation healthy",
    blockers: 0,
    humanActions: 1,
    nextMove: "Route approved tasks to source repos",
  },
];

const attentionItems: AttentionItem[] = [
  {
    id: "openai-admin-key",
    severity: "critical",
    entity: "Media Business Operations",
    title: "OpenAI actual-cost feed cannot start",
    reason: "Admin billing credentials are not available to the connector.",
    risk: "Provider cost insight remains estimated instead of actual.",
    action: "Open credential checklist",
    mode: "human",
  },
  {
    id: "dns-production",
    severity: "warning",
    entity: "TLC Capital Group",
    title: "Production domain change requires external DNS action",
    reason: "The system can validate records but cannot create registrar-side DNS by itself.",
    risk: "Production route remains blocked until the record exists.",
    action: "Accept risk / mark done",
    mode: "human",
  },
  {
    id: "rinseables-pagespeed",
    severity: "warning",
    entity: "Rinseables OS",
    title: "Search Console performance degradation should auto-triage",
    reason: "The issue is technical and likely fixable through a known performance remediation path.",
    risk: "Slow pages may reduce conversion and search quality.",
    action: "Launch Codex fix",
    mode: "codex",
  },
  {
    id: "khashi-capacity",
    severity: "info",
    entity: "Khashi VC",
    title: "Experiment capacity is over-concentrated",
    reason: "All 30 active experiments are in the 2-7 day bucket.",
    risk: "Near-close learning may be under-sampled.",
    action: "Generate capacity rebalance plan",
    mode: "agent",
  },
];

const triageItems: TriageItem[] = [
  {
    id: "pagespeed-loop",
    entity: "Rinseables OS",
    stage: "triaged",
    title: "Slow page signal mapped to performance-remediation loop",
    result: "Ready to create Codex task with validation and deploy gate.",
    confidence: 82,
  },
  {
    id: "billing-connectors",
    entity: "Media Business Operations",
    stage: "detected",
    title: "Provider cost connectors missing admin billing access",
    result: "Human credential acquisition required before automation can proceed.",
    confidence: 96,
  },
  {
    id: "coceo-summary",
    entity: "TLC Capital Group",
    stage: "validating",
    title: "Federated CoCEO summaries need enterprise rollup contract",
    result: "Hermes contract is ready; TLC feed implementation remains downstream.",
    confidence: 88,
  },
  {
    id: "experiment-window",
    entity: "Khashi VC",
    stage: "fixing",
    title: "Experiment window distribution requires reserved near-close slots",
    result: "Recommendation available; source OS needs scheduler adjustment.",
    confidence: 74,
  },
];

const workspaceSignals = [
  { label: "Command", value: "7", detail: "attention items", tone: "warning" as DashboardTone, icon: AlertTriangle },
  { label: "Operations", value: "4", detail: "auto-triage loops", tone: "info" as DashboardTone, icon: Bot },
  { label: "Intelligence", value: "12", detail: "new findings", tone: "success" as DashboardTone, icon: Sparkles },
  { label: "Capacity", value: "3", detail: "cost/limit risks", tone: "warning" as DashboardTone, icon: Gauge },
];

const mobbinReferences = [
  {
    label: "Jobber work dashboard",
    url: "https://mobbin.com/screens/38ed9be2-e237-4f8b-8321-52619cb21d26",
    pattern: "operations summary with active work and next actions",
  },
  {
    label: "HoneyBook activity dashboard",
    url: "https://mobbin.com/screens/b8699c59-1cc9-4fc2-9dd6-a548b3c3a6b0",
    pattern: "business activity feed and task-forward layout",
  },
  {
    label: "Bonsai workflow dashboard",
    url: "https://mobbin.com/screens/3a7eb302-da2b-4dfd-a8ad-6a2c93e8326b",
    pattern: "service-business work queue and financial context",
  },
  {
    label: "Wrike project command view",
    url: "https://mobbin.com/screens/6db227fd-0b92-42d5-817c-02d8d5bd59e2",
    pattern: "project portfolio status and collaboration queue",
  },
];

function toneForSeverity(severity: AttentionSeverity): DashboardTone {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "info";
}

function toneForReadiness(value: number): DashboardTone {
  if (value >= 90) return "success";
  if (value >= 80) return "warning";
  return "critical";
}

function stageTone(stage: TriageItem["stage"]): DashboardTone {
  if (stage === "awaiting-approval") return "warning";
  if (stage === "detected") return "critical";
  if (stage === "validating") return "info";
  return "success";
}

function EntityTierIcon({ tier, className }: { tier: EntityTier; className?: string }) {
  const Icon = tier === "enterprise"
    ? Building2
    : tier === "business-unit"
      ? BriefcaseBusiness
      : tier === "capability"
        ? Cpu
        : GitBranch;
  return <Icon className={className} aria-hidden="true" />;
}

export default function MainHermesAgentDashboardPrototypePage() {
  const criticalItems = attentionItems.filter((item) => item.severity === "critical").length;
  const humanItems = attentionItems.filter((item) => item.mode === "human").length;
  const businessUnits = portfolioEntities.filter((entity) => entity.tier === "business-unit");
  const capabilities = portfolioEntities.filter((entity) => entity.tier === "capability");

  return (
    <DashboardShell
      sidebar={(
        <DashboardSidebar
          title="Hermes Command"
          description="Prototype V1"
          items={[
            { id: "briefing", label: "Morning Briefing", href: "#briefing", active: true, icon: Building2 },
            { id: "attention", label: "Attention Queue", href: "#attention", icon: AlertTriangle },
            { id: "portfolio", label: "Portfolio Map", href: "#portfolio", icon: BriefcaseBusiness },
            { id: "triage", label: "Auto Triage", href: "#triage", icon: Bot },
            { id: "controls", label: "Controls", href: "#controls", icon: Play },
            { id: "references", label: "References", href: "#references", icon: Sparkles },
          ]}
          footer={(
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Prototype boundary</div>
              <div>Fixture-backed screen for review before production promotion.</div>
            </div>
          )}
        />
      )}
      header={(
        <DashboardHeader
          title="Hermes Morning Command"
          eyebrow="Prototype Lab / Main Dashboard V1"
          description="Portfolio-level daily briefing for TLC, business units, capabilities, human approvals, auto-triage loops, and source-project actions."
          meta={(
            <>
              <StatusPill tone="warning">{attentionItems.length} attention items</StatusPill>
              <StatusPill tone="critical">{criticalItems} critical</StatusPill>
              <StatusPill tone="info">{businessUnits.length} business units</StatusPill>
              <StatusPill tone="neutral">{capabilities.length} shared capabilities</StatusPill>
            </>
          )}
          actions={(
            <>
              <Button outlined size="sm" prefix={<RefreshCw aria-hidden="true" />}>
                Refresh
              </Button>
              <Button size="sm" prefix={<Sparkles aria-hidden="true" />}>
                Generate Briefing
              </Button>
            </>
          )}
        />
      )}
    >
      <section id="briefing" className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)]">
        <DashboardSection
          title="What Happened Since Last Check-In"
          description="Highest-signal summary across enterprise, business units, capabilities, and technical control."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Enterprise posture
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                TLC remains the enterprise authority layer. The main missing link is production-grade rollup data from unit CoCEO summaries and provider billing feeds.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Human attention
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {humanItems} items require external authority, credential access, DNS/account work, production approval, or risk acceptance.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Funding and usage
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Capacity monitoring is live conceptually, but actual provider costs depend on OpenAI admin, Gemini billing, and Google Cloud billing connectors.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Autonomous operations
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Technical issues should move through detected, triaged, fixing, validating, and approval states before human escalation.
              </p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Capacity Watch" description="Funding, API, and throughput risks that should alert without being asked.">
          <div className="space-y-4">
            <ProgressMetric label="Provider billing coverage" value={42} tone="warning" detail="OpenAI, Gemini, and GCP actual-cost feeds are required." />
            <ProgressMetric label="API limit visibility" value={64} tone="warning" detail="Usage limits visible in some systems; not yet normalized." />
            <ProgressMetric label="Auto-remediation readiness" value={76} tone="info" detail="Known technical loops can be launched after source OS routing." />
          </div>
        </DashboardSection>
      </section>

      <MetricGrid columns={4}>
        {workspaceSignals.map((signal) => (
          <KpiCard
            key={signal.label}
            label={signal.label}
            value={signal.value}
            detail={signal.detail}
            tone={signal.tone}
            icon={signal.icon}
          />
        ))}
      </MetricGrid>

      <DashboardSection id="attention" title="Attention Queue" description="Human-required, risk-bearing, or high-confidence agent-launch items.">
        <div className="grid gap-3">
          {attentionItems.map((item) => {
            const ActionIcon = actionIcons[item.mode];
            return (
              <article key={item.id} className="grid gap-3 rounded-lg border border-border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={toneForSeverity(item.severity)}>{item.severity}</StatusPill>
                    <StatusPill tone="neutral">{item.entity}</StatusPill>
                    <StatusPill tone={item.mode === "human" ? "warning" : "info"}>{item.mode}</StatusPill>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                  <p className="mt-2 text-sm text-foreground">Risk: {item.risk}</p>
                </div>
                <div className="flex items-end justify-start lg:justify-end">
                  <Button outlined={item.severity !== "critical"} size="sm" prefix={<ActionIcon aria-hidden="true" />}>
                    {item.action}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </DashboardSection>

      <DashboardSection id="portfolio" title="Portfolio Map" description="TLC sits above business units; capabilities and technical controls are separate tiers.">
        <div className="grid gap-3">
          {portfolioEntities.map((entity) => (
            <article key={entity.id} className="grid gap-4 rounded-lg border border-border bg-background p-4 xl:grid-cols-[minmax(14rem,0.45fr)_minmax(0,1fr)_12rem]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-card p-1.5">
                    <EntityTierIcon tier={entity.tier} className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">{tierLabels[entity.tier]}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatusPill tone={entity.status}>{entity.status}</StatusPill>
                  <StatusPill tone={entity.humanActions ? "warning" : "success"}>Human {entity.humanActions}</StatusPill>
                  <StatusPill tone={entity.blockers ? "critical" : "success"}>Blockers {entity.blockers}</StatusPill>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{entity.summary}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                  <div>Revenue: <span className="text-foreground">{entity.revenueSignal}</span></div>
                  <div>Cost: <span className="text-foreground">{entity.costSignal}</span></div>
                  <div>Next: <span className="text-foreground">{entity.nextMove}</span></div>
                </div>
              </div>
              <ProgressMetric label="Readiness" value={entity.readiness} tone={toneForReadiness(entity.readiness)} />
            </article>
          ))}
        </div>
      </DashboardSection>

      <section id="triage" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
        <DashboardSection title="Autonomous Operations Feed" description="Every issue should show whether it was detected, triaged, fixed, validated, or escalated.">
          <div className="space-y-3">
            {triageItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={stageTone(item.stage)}>{item.stage}</StatusPill>
                      <StatusPill tone="neutral">{item.entity}</StatusPill>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.result}</p>
                  </div>
                  <div className="w-full shrink-0 md:w-48">
                    <ProgressMetric label="Confidence" value={item.confidence} tone={item.confidence >= 85 ? "success" : "warning"} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection id="controls" title="Launch Controls" description="Prototype actions for agent, Codex, report, refresh, and risk-acceptance workflows.">
          <div className="grid gap-2">
            {[
              ["Run morning briefing", Sparkles],
              ["Refresh all source feeds", RefreshCw],
              ["Launch Codex on selected issue", Wrench],
              ["Generate TLC portfolio report", Building2],
              ["Open human approval queue", ShieldCheck],
              ["Create source-OS task bundle", Bot],
            ].map(([label, Icon]) => {
              const ControlIcon = Icon as LucideIcon;
              return (
                <Button
                  key={label as string}
                  outlined
                  className="justify-between"
                  prefix={<ControlIcon aria-hidden="true" />}
                  suffix={<ArrowRight aria-hidden="true" />}
                >
                  <span className="truncate">{label as string}</span>
                </Button>
              );
            })}
          </div>
        </DashboardSection>
      </section>

      <DashboardSection id="references" title="Prototype References" description="Mobbin inputs used as pattern references for review, not runtime dependencies.">
        <div className="grid gap-3 md:grid-cols-2">
          {mobbinReferences.map((reference) => (
            <a
              key={reference.url}
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-background p-4 transition hover:bg-muted"
            >
              <div className="text-sm font-medium text-foreground">{reference.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{reference.pattern}</div>
            </a>
          ))}
        </div>
      </DashboardSection>
    </DashboardShell>
  );
}
