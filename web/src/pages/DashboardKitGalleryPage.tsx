import {
  BarChart3,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Eye,
  Layers3,
  LineChart,
  PanelRightOpen,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import "../../../packages/hermes-dashboard-kit/src/dashboard-kit.css";
import { dashboardKitGalleryReport } from "./dashboard-kit-gallery-data";

const statusTone = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  draft: "border-slate-300 bg-slate-100 text-slate-600",
  "needs-redesign": "border-rose-500/30 bg-rose-500/10 text-rose-700",
  deprecated: "border-slate-300 bg-slate-100 text-slate-500",
} as const;

const familyIcons = [
  Layers3,
  ClipboardCheck,
  BarChart3,
  SearchCheck,
  PanelRightOpen,
  Eye,
  Sparkles,
  CircleDot,
];

export default function DashboardKitGalleryPage() {
  const report = dashboardKitGalleryReport;
  const statusSummary = report.statusSummary;
  const statusCards = [
    { label: "Component families", value: report.componentFamilies, detail: "Grouped by dashboard job-to-be-done" },
    { label: "Named components", value: report.namedComponents, detail: "Reusable kit primitives" },
    { label: "Approved", value: statusSummary.approved ?? 0, detail: "Safe for Tier 3 migration" },
    { label: "Review score", value: `${report.reviewSummary.averageScore ?? 0}%`, detail: "Average family maturity" },
    { label: "Visual captures", value: report.visualBaselines.requiredCaptureCount, detail: "Required approval screenshots" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8" data-review-id="hermes.dashboard-kit-gallery">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Design System Review</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Hermes Dashboard Kit Gallery</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              A visible intake board for Mobbin-informed references, component approval status, and the patterns that projects must adopt before they claim Tier 3.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted" href="#review-queue">
              Review queue
            </a>
            <a className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted" href="#showroom">
              Showroom
            </a>
            <a className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90" href="#component-families">
              Component families
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard kit summary">
        {statusCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{card.value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article id="review-queue" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Human Alignment</div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Review queue</h2>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
              {report.requiredHumanReview.length} pending
            </span>
          </div>
          <div className="mt-4 divide-y divide-border">
            {report.requiredHumanReview.map((item) => (
              <div key={item.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.family}</h3>
                  <StatusBadge status={item.status} />
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">{item.targetTier}</span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.userRole}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobbin-informed Intake</div>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Reference families</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {report.references.map((family) => (
              <div key={family.id} className="rounded-xl border border-border bg-background p-3">
                <div className="text-sm font-semibold text-foreground">{family.label}</div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{family.references.join(" · ")}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{family.extraction}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.dashboard-kit-gallery.visual-baselines">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visual Proof</div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Baseline approval matrix</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Component families cannot become production-approved until these states have screenshot evidence across the required route, viewport, and theme contracts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.visualBaselines.viewports.map((viewport) => (
              <span key={viewport.id} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                {viewport.id} {viewport.width}x{viewport.height}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {report.visualBaselines.families.map((family) => (
              <div key={family.id} className="rounded-xl border border-border bg-background p-3">
                <div className="text-sm font-semibold text-foreground">{family.id.replaceAll("-", " ")}</div>
                <div className="mt-2 text-xs font-semibold text-muted-foreground">{family.requiredCaptures.length} required captures</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {family.requiredCaptures.map((capture) => (
                    <span key={capture} className="rounded-full border border-border bg-card px-2 py-1 text-[0.7rem] font-medium text-muted-foreground">{capture}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside className="rounded-xl border border-border bg-background p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval rules</div>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {report.visualBaselines.approvalRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section id="showroom" className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-review-id="hermes.dashboard-kit-gallery.showroom">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Component Showroom</div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Rendered review examples</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              These previews are the taste-alignment layer: variants, stress states, project usage, and visual examples before we roll a component family into a project dashboard.
            </p>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
            {report.showroom.length} families
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {report.showroom.map((item) => (
            <ShowroomFamily key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section id="component-families" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reusable Primitives</div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Component families</h2>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {report.inventory.map((family, index) => {
            const Icon = familyIcons[index % familyIcons.length];
            return (
              <article key={family.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-background p-4">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{family.family}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{family.targetTier}</p>
                    </div>
                  </div>
                  <StatusBadge status={family.status} />
                </header>
                <p className="text-sm leading-6 text-muted-foreground">{family.good}</p>
                <div className="flex flex-wrap gap-1.5" aria-label={`${family.family} components`}>
                  {family.components.map((component) => (
                    <span key={component} className="max-w-full truncate rounded-full border border-border bg-card px-2 py-1 text-[0.7rem] font-medium text-muted-foreground">
                      {component}
                    </span>
                  ))}
                </div>
                <div className="mt-auto rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Your role
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{family.userRole}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: keyof typeof statusTone }) {
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>
      {status.replace("-", " ")}
    </span>
  );
}

type ShowroomItem = (typeof dashboardKitGalleryReport.showroom)[number];

function ShowroomFamily({ item }: { item: ShowroomItem }) {
  const [activeVariant, setActiveVariant] = useState<string>(item.variants[0] || "default");

  return (
    <article className="grid gap-4 rounded-2xl border border-border bg-background p-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(360px,1fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{item.family}</h3>
              <StatusBadge status={item.status} />
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">{item.targetTier}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review score {item.reviewScore ?? "n/a"}{item.reviewer ? ` · ${item.reviewer}` : ""}{item.reviewedAt ? ` · ${new Date(item.reviewedAt).toLocaleDateString()}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            {item.projectReadiness.length} project links
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variants</div>
            <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label={`${item.family} variants`}>
              {item.variants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setActiveVariant(variant)}
                  className={`rounded-full border px-2 py-1 text-xs font-semibold transition ${activeVariant === variant ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>
          <LabeledList label="Acceptance" values={item.acceptance} ordered />
          <LabeledList label="Blocked patterns" values={item.blockedVariants} />
          <ReviewNotes title="Review notes" values={item.notes} />
          <ReviewNotes title="Next actions" values={item.nextActions} />
        </div>
      </div>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Preview</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{activeVariant}</div>
          </div>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            local review
          </span>
        </div>
        <ShowroomPreview kind={item.previewKind} family={item.family} variant={activeVariant} />
        {item.demoHtml ? (
          <div className="mt-4 rounded-2xl border border-border bg-background p-3" data-review-id={`hermes.dashboard-kit-gallery.actual-demo.${item.id}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actual Kit Output</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Rendered from exported package functions</div>
              </div>
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                package demo
              </span>
            </div>
            <div className="max-h-[520px] overflow-auto rounded-xl border border-border bg-card p-3">
              <div className="hdk-gallery-actual-demo" dangerouslySetInnerHTML={{ __html: item.demoHtml }} />
            </div>
          </div>
        ) : null}
        <div className="mt-3 rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project readiness</div>
          <div className="mt-2 grid gap-2">
            {item.projectReadiness.map((project) => (
              <div key={`${project.project}-${project.status}`} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-card p-2">
                <div>
                  <div className="text-sm font-semibold text-foreground">{project.project}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{project.note}</div>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">{project.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ReviewNotes({ title, values }: { title: string; values: readonly string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-2 grid gap-1.5">
        {values.map((value) => (
          <div key={value} className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}

function LabeledList({ label, values, ordered = false }: { label: string; values: readonly string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "div";
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <List className={ordered ? "mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground" : "mt-2 flex flex-wrap gap-1.5"}>
        {values.map((value) => (
          ordered ? (
            <li key={value}>{value}</li>
          ) : (
            <span key={value} className="rounded-full border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">{value}</span>
          )
        ))}
      </List>
    </div>
  );
}

function ShowroomPreview({ kind, family, variant }: { kind: string; family: string; variant: string }) {
  if (variant === "loading") return <VariantStatePreview title={family} label="Loading state" detail="Skeletons reserve space and avoid layout jump." />;
  if (variant === "empty") return <VariantStatePreview title={family} label="Empty state" detail="No fake data. The state explains what is missing and what to do next." />;
  if (variant === "error") return <VariantStatePreview title={family} label="Error state" detail="The route is still usable and shows retry/proof context." tone="error" />;
  if (variant === "stale") return <VariantStatePreview title={family} label="Stale data" detail="Freshness is visible without hiding the last known useful state." tone="warn" />;
  if (kind === "shell") return <ShellPreview variant={variant} />;
  if (kind === "metrics") return <MetricPreview variant={variant} />;
  if (kind === "charts") return <ChartPreview variant={variant} />;
  if (kind === "table") return <TablePreview variant={variant} />;
  if (kind === "drawer") return <DrawerPreview variant={variant} />;
  if (kind === "market") return <MarketPreview variant={variant} />;
  if (kind === "media") return <MediaPreview variant={variant} />;
  if (kind === "calendar") return <CalendarPreview variant={variant} />;
  if (kind === "governance") return <GovernancePreview variant={variant} />;
  return <StatePreview title={family} />;
}

function ShellPreview({ variant }: { variant: string }) {
  const collapsed = variant.includes("collapsed");
  return (
    <div className={`grid h-[320px] overflow-hidden rounded-xl border border-border bg-background ${collapsed ? "md:grid-cols-[64px_1fr]" : "md:grid-cols-[116px_1fr]"}`}>
      <aside className="hidden border-r border-border bg-card p-2 md:block">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">H</span>
          {!collapsed && <span className="text-xs font-semibold text-foreground">Hermes</span>}
        </div>
        {["Command", "Ops", "Intel", "Capacity"].map((item, index) => (
          <div key={item} className={`mb-1 rounded-md px-2 py-2 text-xs font-medium ${index === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {collapsed ? item.slice(0, 1) : item}
          </div>
        ))}
      </aside>
      <main className="min-w-0 p-3">
        <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
          <div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">Command</div>
            <div className="mt-1 text-lg font-semibold text-foreground">Find what needs attention now</div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">fresh</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {["Proof ready", "12 actions", "3 stale"].map((item) => (
            <div key={item} className="rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground">{item}</div>
          ))}
        </div>
      </main>
    </div>
  );
}

function MetricPreview({ variant }: { variant: string }) {
  const overflow = variant.includes("overflow");
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[
        [overflow ? "Extremely long posting success metric label" : "Posting success", "94%", "7D rolling"],
        ["Storage", "18.4 GB", "Converted from bytes"],
        ["Issues", "12", "Down 18%"],
        ["Freshness", "2m", "Live data"]
      ].map(([label, value, detail]) => (
        <div key={label} className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        </div>
      ))}
    </div>
  );
}

function ChartPreview({ variant = "line" }: { variant?: string }) {
  const isDonut = variant === "donut";
  const isBar = variant === "bar";
  const isHeatmap = variant === "heatmap";
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">Approval and issue trend</div>
          <div className="text-xs text-muted-foreground">X axis: day · Y axis: count</div>
        </div>
        <div className="flex gap-1">
          {["1D", "7D", "14D", "30D"].map((window, index) => (
            <span key={window} className={`rounded-md border px-2 py-1 text-xs font-semibold ${index === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{window}</span>
          ))}
        </div>
      </div>
      <svg className="h-56 w-full rounded-xl border border-border bg-background" role="img" aria-label="Example line and bar chart" viewBox="0 0 640 260">
        <g stroke="currentColor" className="text-border">
          {[44, 88, 132, 176, 220].map((y) => <line key={y} x1="54" x2="610" y1={y} y2={y} />)}
          <line x1="54" x2="54" y1="28" y2="220" />
          <line x1="54" x2="610" y1="220" y2="220" />
        </g>
        <g className="text-muted-foreground" fill="currentColor" fontSize="12">
          <text x="18" y="48">100</text><text x="26" y="224">0</text>
          <text x="56" y="244">Mon</text><text x="188" y="244">Wed</text><text x="328" y="244">Fri</text><text x="482" y="244">Sun</text>
        </g>
        {isDonut && <g transform="translate(330 124)"><circle r="62" fill="none" stroke="hsl(var(--muted))" strokeWidth="28" /><path d="M 0 -62 A 62 62 0 1 1 -58 22" fill="none" stroke="hsl(var(--primary))" strokeWidth="28" strokeLinecap="round" /><text y="6" textAnchor="middle" fill="currentColor" className="text-foreground" fontSize="24" fontWeight="700">72%</text></g>}
        {isHeatmap && Array.from({ length: 42 }).map((_, index) => <rect key={index} x={74 + (index % 14) * 36} y={52 + Math.floor(index / 14) * 48} width="28" height="28" rx="6" fill="hsl(var(--primary))" opacity={0.18 + (index % 7) * 0.1} />)}
        {!isDonut && !isHeatmap && !isBar && <path d="M 58 180 C 120 144, 166 152, 210 118 S 310 64, 366 96 S 470 178, 596 72" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />}
        {!isDonut && !isHeatmap && [90, 122, 74, 138, 96, 54, 112].map((height, index) => (
          <rect key={index} x={82 + index * 72} y={220 - height} width={isBar ? "32" : "18"} height={height} rx="5" fill="currentColor" className={isBar ? "text-primary" : "text-muted-foreground/30"} />
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> approvals</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> issues</span>
      </div>
    </div>
  );
}

function TablePreview({ variant }: { variant: string }) {
  const comparison = variant.includes("comparison");
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div className="text-sm font-semibold text-foreground">{comparison ? "Brand comparison" : "Approval queue"}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">42 rows</span>
          <label className="text-xs text-muted-foreground">Sort by <select className="rounded-md border border-border bg-card px-2 py-1 text-foreground"><option>Priority</option></select></label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Item</th><th>Status</th><th>Owner</th><th>Age</th></tr></thead>
          <tbody className="divide-y divide-border">
            {["Finance for Thought carousel", "Unimportant News video", "Kashi market report"].map((item, index) => (
              <tr key={item}><td className="p-3 font-medium text-foreground">{item}</td><td><StatusBadge status={index === 0 ? "approved" : "reviewing"} /></td><td className="text-muted-foreground">Ops</td><td className="text-muted-foreground">{index + 1}h</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-border p-3 text-xs text-muted-foreground"><span>Showing 1-10 of 42</span><span>10 / 25 / 50</span></footer>
    </div>
  );
}

function DrawerPreview({ variant }: { variant: string }) {
  const mobile = variant.includes("mobile");
  return (
    <div className={`grid h-[320px] overflow-hidden rounded-xl border border-border bg-background ${mobile ? "grid-rows-[1fr_170px]" : "md:grid-cols-[1fr_260px]"}`}>
      <div className="p-3">
        <div className="mb-2 h-12 rounded-lg border border-border bg-card" />
        <div className="grid gap-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 rounded-lg border border-border bg-card" />)}
        </div>
      </div>
      <aside className={`${mobile ? "border-t" : "border-l"} border-border bg-card p-4`}>
        <div className="text-xs font-semibold uppercase text-muted-foreground">Selected detail</div>
        <h4 className="mt-2 text-base font-semibold text-foreground">Market / approval detail</h4>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["facts", "chart", "evidence", "actions"].map((item) => <div key={item} className="rounded-lg border border-border bg-background p-2 text-xs text-muted-foreground">{item}</div>)}
        </div>
      </aside>
    </div>
  );
}

function MarketPreview({ variant }: { variant: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-[150px_1fr]">
      <aside className="rounded-xl border border-border bg-background p-3">
        {["All live", "Sports", "Politics", "Financials", "Movies"].map((item, index) => (
          <div key={item} className={`mb-1 rounded-lg px-2 py-2 text-xs font-semibold ${index === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{item}</div>
        ))}
      </aside>
      <div className="grid gap-3">
        <ChartPreview variant={variant.includes("tape") ? "line" : "area"} />
        <div className="grid gap-2 md:grid-cols-3">
          {["Mid 54c", "Spread 3c", "Snapshots 28"].map((item) => <div key={item} className="rounded-lg border border-border bg-background p-3 text-sm font-semibold text-foreground">{item}</div>)}
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ variant }: { variant: string }) {
  const proof = variant.includes("proof");
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><div className="text-sm font-semibold text-foreground">Content package</div><div className="text-xs text-muted-foreground">Finance for Thought · carousel</div></div>
          <StatusBadge status={proof ? "approved" : "reviewing"} />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {["Thumbnail ready", "Copy ready", "Channels: Facebook, Instagram"].map((item) => <div key={item} className="rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">{item}</div>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Approve</button><button className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">Decline with reason</button><button className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">Request revision</button></div>
    </div>
  );
}

function CalendarPreview({ variant }: { variant: string }) {
  const selected = variant.includes("multi") ? [9, 10, 11, 16] : [9, 10, 11];
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_260px]">
      <div className="grid grid-cols-7 gap-1 rounded-xl border border-border bg-background p-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className={`aspect-square rounded-lg border border-border p-1 text-xs ${selected.includes(index) ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{index + 1}</div>
        ))}
      </div>
      <aside className="rounded-xl border border-border bg-background p-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Planning drawer</div>
        <div className="mt-3 space-y-2">
          {["Protein", "Side", "Notes", "Generate remaining"].map((item) => <div key={item} className="rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">{item}</div>)}
        </div>
      </aside>
    </div>
  );
}

function GovernancePreview({ variant }: { variant: string }) {
  const proof = variant.includes("proof");
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        ["Media Engine", "Tier 2.7", proof ? "proof captured" : "chart family reviewing"],
        ["Kashi VC", "Tier 2.4", "market browser migration"],
        ["Meal Assistant", "Tier 1.8", "calendar family draft"]
      ].map(([project, tier, next]) => (
        <div key={project} className="rounded-xl border border-border bg-background p-3">
          <div className="text-sm font-semibold text-foreground">{project}</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{tier}</div>
          <div className="mt-2 text-xs text-muted-foreground">{next}</div>
        </div>
      ))}
    </div>
  );
}

function VariantStatePreview({ title, label, detail, tone = "default" }: { title: string; label: string; detail: string; tone?: "default" | "warn" | "error" }) {
  const toneClass =
    tone === "error"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : "border-border bg-background text-muted-foreground";

  return (
    <div className={`rounded-xl border p-6 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-3 text-lg font-semibold text-foreground">{title}</div>
      <p className="mt-2 max-w-lg text-sm leading-6">{detail}</p>
      <div className="mt-5 grid gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-10 rounded-lg border border-border bg-card/70" />
        ))}
      </div>
    </div>
  );
}

function StatePreview({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
      <LineChart className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">Showroom preview pending.</p>
    </div>
  );
}
