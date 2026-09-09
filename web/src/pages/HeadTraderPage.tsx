/**
 * Head Trader — conversation-first decision controller.
 *
 * Three columns: the incident queue, the conversation about the selected
 * incident, and the action/risk rail that turns a conversation into a routed
 * control. Backend contract: `hermes_cli/head_trader.py`.
 *
 * The rules that shape this page, in order of importance:
 *  - Free-form text never executes. A reply produces an *interpreted intent*
 *    and at most a decision that still needs an explicit confirm.
 *  - The interpretation and the risk decision are both on screen before the
 *    confirm button is reachable. An intent the operator cannot read is an
 *    intent they cannot refuse.
 *  - `hard_gate` and `forbidden` render, disabled, with the reason. Hiding
 *    them would leave the operator not knowing the action exists.
 *  - Live order actions are always shown as forbidden. There is no path.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nous-research/ui/ui/components/dialog";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  MIN_CONFIRM_REASON,
  POLL_SUMMARY_MS,
  SUMMARY_STALE_SECONDS,
  canConfirm,
  channelBlocker,
  confidenceLabel,
  confirmDecision,
  createDecision,
  decisionStatusTone,
  describeIntent,
  deskLabel,
  deskShort,
  fetchActionCatalog,
  fetchAudit,
  fetchChannels,
  fetchHeadTraderSummary,
  fetchIncidents,
  ignoreIncident,
  incidentStatusTone,
  isExecutable,
  isOpen,
  isStale,
  permissionLabel,
  permissionTone,
  refreshHeadTrader,
  rejectDecision,
  replyToIncident,
  resolveIncident,
  riskTone,
  severityTone,
  sortIncidents,
  type AuditEntry,
  type ChannelStatus,
  type ConversationMessage,
  type HeadTraderAction,
  type HeadTraderDecision,
  type HeadTraderIncident,
  type HeadTraderSummary,
  type ReplyIntent,
  type Tone,
} from "@/lib/head-trader";

// ---------------------------------------------------------------------------
// Tone chrome
// ---------------------------------------------------------------------------

const TONE_BADGE: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unavailable: "border-destructive/50 bg-destructive/15 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const TONE_RAIL: Record<Tone, string> = {
  ready: "bg-success",
  watch: "bg-warning",
  blocked: "bg-destructive",
  unavailable: "bg-destructive",
  unknown: "bg-border",
};

function ToneIcon({ tone }: { tone: Tone }) {
  const cls = "size-3 shrink-0";
  if (tone === "ready") return <CheckCircle2 className={cls} aria-hidden />;
  if (tone === "watch") return <AlertTriangle className={cls} aria-hidden />;
  if (tone === "blocked") return <Ban className={cls} aria-hidden />;
  if (tone === "unavailable") return <ShieldAlert className={cls} aria-hidden />;
  return <CircleHelp className={cls} aria-hidden />;
}

/** Icon + word + tone. Status is never carried by colour alone. */
function Pill({
  tone,
  label,
  title,
  className,
}: {
  tone: Tone;
  label: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TONE_BADGE[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      <span>{label}</span>
    </span>
  );
}

function LockPill({ locked }: { locked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        locked ? "border-border bg-muted text-muted-foreground" : TONE_BADGE.blocked,
      )}
    >
      <Lock className="size-3 shrink-0" aria-hidden />
      <span>{locked ? "Live trading locked" : "Live trading UNLOCKED"}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Loaded {
  summary: HeadTraderSummary;
  incidents: HeadTraderIncident[];
  actions: HeadTraderAction[];
  audit: AuditEntry[];
  channels: ChannelStatus[];
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function useHeadTrader() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [summary, incidents, catalog, audit, channels] = await Promise.all([
        fetchHeadTraderSummary(),
        fetchIncidents(),
        fetchActionCatalog(),
        fetchAudit(60),
        fetchChannels(),
      ]);
      setData({
        summary,
        incidents: incidents.incidents ?? [],
        actions: catalog.actions ?? [],
        audit: audit.audit ?? [],
        channels: channels.channels ?? [],
      });
      setError(null);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }, []);

  // One lifecycle owner: initial load, polling, and pause-while-hidden. A
  // dashboard nobody is looking at should not keep probing two trading systems.
  useEffect(() => {
    let timer: number | undefined;
    const start = () => {
      timer = window.setInterval(() => void load(), POLL_SUMMARY_MS);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      stop();
      if (!document.hidden) {
        void load();
        start();
      }
    };
    void load();
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  return { data, error, busy, reload: load };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HeadTraderPage() {
  const { data, error, busy, reload } = useHeadTrader();
  const { setAfterTitle, setEnd } = usePageHeader();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [intent, setIntent] = useState<ReplyIntent | null>(null);
  const [decision, setDecision] = useState<HeadTraderDecision | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const summary = data?.summary;

  useLayoutEffect(() => {
    setAfterTitle(
      summary ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={summary.status === "ready" ? "ready" : summary.status === "watch" ? "watch" : "blocked"} label={summary.status} />
          <LockPill locked={summary.liveTradingLocked} />
        </div>
      ) : null,
    );
    setEnd(
      <div className="flex items-center gap-2">
        {summary ? (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              isStale(summary.generatedAt, SUMMARY_STALE_SECONDS) ? "font-bold text-warning" : "text-muted-foreground",
            )}
            title={summary.generatedAt}
          >
            {isoTimeAgo(summary.generatedAt)}
            {isStale(summary.generatedAt, SUMMARY_STALE_SECONDS) ? " · STALE" : ""}
          </span>
        ) : null}
        <Button
          type="button"
          ghost
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          disabled={busy}
          aria-label="Refresh Head Trader"
          onClick={() => {
            void refreshHeadTrader().then(reload).catch((e) => setActionError(errText(e)));
          }}
        >
          {busy ? <Spinner /> : <RefreshCw />}
        </Button>
      </div>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [summary, busy, reload, setAfterTitle, setEnd]);

  const visible = useMemo(() => {
    const all = data?.incidents ?? [];
    return sortIncidents(showHistory ? all : all.filter(isOpen));
  }, [data?.incidents, showHistory]);

  const selected = useMemo(
    () => visible.find((i) => i.id === selectedId) ?? data?.incidents.find((i) => i.id === selectedId) ?? null,
    [visible, data?.incidents, selectedId],
  );

  // Selecting a different incident abandons the conversation state — a reply
  // interpreted against one incident must never be confirmable under another.
  const selectIncident = (id: string) => {
    setSelectedId(id);
    setThread([]);
    setIntent(null);
    setDecision(null);
    setActionError(null);
  };

  const actionsById = useMemo(
    () => new Map((data?.actions ?? []).map((a) => [a.id, a])),
    [data?.actions],
  );

  if (error && !data) return <ErrorShell message={error} onRetry={() => void reload()} />;
  if (!data || !summary) return <LoadingShell />;

  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-3 sm:px-4"
      data-review-id="hermes.head-trader"
    >
      <SafetyBanner />
      {error ? <PartialBanner detail={error} onRetry={() => void reload()} /> : null}
      {actionError ? <PartialBanner detail={actionError} onRetry={() => setActionError(null)} label="Last action failed" /> : null}

      <DeskCards summary={summary} incidents={data.incidents} />
      <KpiRibbon summary={summary} />

      <div className="grid min-h-0 gap-3 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
        {/* ---- incident queue ---- */}
        <Panel
          title="Incident queue"
          count={visible.length}
          tone={summary.kpis.criticalIncidents > 0 ? "blocked" : undefined}
          action={
            <label className="flex cursor-pointer items-center gap-1 text-[10px] font-semibold normal-case tracking-normal">
              <input
                type="checkbox"
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
                className="size-3 accent-current"
              />
              History
            </label>
          }
        >
          {visible.length ? (
            <div className="max-h-[58vh] overflow-y-auto">
              {visible.map((i) => (
                <IncidentRow key={i.id} incident={i} selected={i.id === selectedId} onSelect={() => selectIncident(i.id)} />
              ))}
            </div>
          ) : (
            <EmptyNote>
              {showHistory ? "No incidents recorded yet." : "No open incidents. Head Trader has nothing waiting on you."}
            </EmptyNote>
          )}
        </Panel>

        {/* ---- conversation ---- */}
        <ConversationPanel
          incident={selected}
          thread={thread}
          intent={intent}
          decision={decision}
          actionsById={actionsById}
          onSent={(res) => {
            setThread((prev) => [...prev, ...(res.messages ?? [])]);
            setIntent(res.intent ?? null);
            setDecision(res.decision ?? null);
          }}
          onError={setActionError}
          onIncidentChanged={() => void reload()}
        />

        {/* ---- action / risk / audit / channels ---- */}
        <div className="flex min-w-0 flex-col gap-3">
          <ActionRailPanel
            incident={selected}
            decision={decision}
            actionsById={actionsById}
            onDecision={setDecision}
            onError={setActionError}
            onConfirmRequested={() => setConfirming(true)}
            onRejected={() => void reload()}
          />
          <ChannelPanel channels={data.channels} />
          <Panel title="Audit" count={data.audit.length}>
            {data.audit.length ? (
              <div className="max-h-64 overflow-y-auto">
                {data.audit.slice(0, 40).map((entry, i) => (
                  <AuditRow key={`${entry.createdAt}-${i}`} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyNote>No Head Trader activity recorded yet.</EmptyNote>
            )}
          </Panel>
        </div>
      </div>

      {confirming && decision ? (
        <ConfirmDialog
          decision={decision}
          action={actionsById.get(decision.actionId)}
          incident={selected}
          intent={intent}
          onClose={() => setConfirming(false)}
          onDone={(updated) => {
            setDecision(updated);
            setConfirming(false);
            void reload();
          }}
          onError={setActionError}
        />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function SafetyBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Lock className="size-3.5 shrink-0" aria-hidden />
      <span>
        Head Trader proposes and routes approved project-owned controls. It cannot submit a live broker order, and no
        message — from this page, Discord or Telegram — executes anything without an explicit confirmation.
      </span>
    </div>
  );
}

function Panel({
  title,
  count,
  tone,
  action,
  children,
}: {
  title: string;
  count?: number;
  tone?: Tone;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <span>{title}</span>
        {action}
        {count !== undefined ? (
          <span className={cn("ml-auto tabular-nums", tone === "blocked" ? "text-destructive" : "text-foreground")}>
            {count}
          </span>
        ) : null}
      </h2>
      <div className="min-h-0">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-2.5 rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function DeskCards({ summary, incidents }: { summary: HeadTraderSummary; incidents: HeadTraderIncident[] }) {
  const desks = summary.desks?.length
    ? summary.desks
    : [{ id: "oanda" }, { id: "khashi" }, { id: "cross_system" }];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {desks.map((desk) => {
        const id = String(desk.id);
        const mine = incidents.filter((i) => String(i.desk) === id && isOpen(i));
        const worst = mine.some((i) => i.severity === "critical")
          ? "blocked"
          : mine.length
            ? "watch"
            : "ready";
        const status = String(desk.status ?? (mine.length ? "watch" : "ready"));
        return (
          <section key={id} className="flex items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-card px-3 py-2.5">
            <span className={cn("w-[3px] self-stretch rounded-sm", TONE_RAIL[worst as Tone])} aria-hidden />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold">{deskLabel(id)}</div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                {mine.length} open · {mine.filter((i) => i.status === "waiting_for_human").length} waiting on you
              </div>
            </div>
            <span className="ml-auto flex shrink-0 flex-wrap justify-end gap-1">
              <Pill tone={worst as Tone} label={status} />
            </span>
          </section>
        );
      })}
    </div>
  );
}

function KpiRibbon({ summary }: { summary: HeadTraderSummary }) {
  const k = summary.kpis;
  const cards = [
    { label: "Open incidents", value: k.openIncidents, tone: k.openIncidents ? ("watch" as Tone) : ("ready" as Tone) },
    { label: "Waiting on you", value: k.waitingForHuman, tone: k.waitingForHuman ? ("watch" as Tone) : ("ready" as Tone) },
    { label: "Critical", value: k.criticalIncidents, tone: k.criticalIncidents ? ("blocked" as Tone) : ("ready" as Tone) },
    { label: "Actions in catalog", value: k.actionsAvailable },
    {
      label: "Source projects",
      value:
        typeof k.sourceProjectsAvailable === "number" && typeof k.sourceProjectsTotal === "number"
          ? `${k.sourceProjectsAvailable}/${k.sourceProjectsTotal}`
          : "No data",
      tone:
        k.sourceProjectsAvailable !== null && k.sourceProjectsAvailable === k.sourceProjectsTotal
          ? ("ready" as Tone)
          : ("blocked" as Tone),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn("bg-card px-3 py-2", c.tone === "blocked" && "bg-destructive/10")}
        >
          <div className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{c.label}</div>
          <div
            className={cn(
              "mt-0.5 font-bold tabular-nums",
              typeof c.value === "string" && c.value === "No data"
                ? "text-[12px] text-muted-foreground"
                : "text-[20px]",
              c.tone === "blocked" && "text-destructive",
            )}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function IncidentRow({
  incident,
  selected,
  onSelect,
}: {
  incident: HeadTraderIncident;
  selected: boolean;
  onSelect: () => void;
}) {
  const sev = severityTone(incident.severity);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "grid w-full grid-cols-[3px_minmax(0,1fr)] gap-2 border-b border-border px-2.5 py-2 text-left last:border-b-0 hover:bg-muted/60",
        selected && "bg-muted",
      )}
    >
      <span className={cn("rounded-sm", TONE_RAIL[sev])} aria-hidden />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Badge tone="outline" className="text-[9px]">
            {deskShort(incident.desk)}
          </Badge>
          <Pill tone={sev} label={String(incident.severity)} />
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {isoTimeAgo(incident.updatedAt)}
          </span>
        </div>
        <div className="mt-1 text-[12px] font-semibold leading-tight">{incident.title}</div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{incident.summary}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Pill tone={incidentStatusTone(incident.status)} label={String(incident.status).replace(/_/g, " ")} />
          <Badge tone="secondary" className="font-mono text-[9px]">
            {incident.type}
          </Badge>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

function ConversationPanel({
  incident,
  thread,
  intent,
  decision,
  actionsById,
  onSent,
  onError,
  onIncidentChanged,
}: {
  incident: HeadTraderIncident | null;
  thread: ConversationMessage[];
  intent: ReplyIntent | null;
  decision: HeadTraderDecision | null;
  actionsById: Map<string, HeadTraderAction>;
  onSent: (res: Awaited<ReturnType<typeof replyToIncident>>) => void;
  onError: (message: string) => void;
  onIncidentChanged: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  if (!incident) {
    return (
      <Panel title="Conversation">
        <EmptyNote>
          <MessageSquare className="mx-auto mb-2 size-5 opacity-50" aria-hidden />
          Select an incident to see its evidence, ask Head Trader about it, and decide what to do.
        </EmptyNote>
      </Panel>
    );
  }

  const send = async () => {
    const message = draft.trim();
    if (!message) return;
    setSending(true);
    try {
      const res = await replyToIncident(incident.id, message);
      if (res.error) {
        onError(res.error);
      } else {
        onSent(res);
        setDraft("");
      }
    } catch (e) {
      onError(errText(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel title={`Conversation · ${deskLabel(incident.desk)}`}>
      <div className="flex max-h-[58vh] flex-col">
        <div className="border-b border-border p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={severityTone(incident.severity)} label={String(incident.severity)} />
            <Pill tone={incidentStatusTone(incident.status)} label={String(incident.status).replace(/_/g, " ")} />
            <Badge tone="secondary" className="font-mono text-[9px]">
              {incident.sourceProject}
            </Badge>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{incident.id}</span>
          </div>
          <h3 className="mt-1.5 text-sm font-bold">{incident.title}</h3>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{incident.summary}</p>
          <div className="mt-2 rounded border border-border bg-muted/50 p-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Head Trader recommends
            </div>
            <p className="mt-0.5 text-xs">{incident.recommendation}</p>
          </div>
          <Evidence incident={incident} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
          {thread.length ? (
            <div className="flex flex-col gap-2">
              {thread.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-[11px] text-muted-foreground">
              No messages yet in this session. Ask for evidence, ask for status, or name an action this desk owns.
            </p>
          )}

          {intent ? <IntentCard intent={intent} actionsById={actionsById} decision={decision} /> : null}
        </div>

        <div className="border-t border-border p-2.5">
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void send();
              }}
              placeholder="Ask Head Trader — “explain the evidence”, “what’s the status”, “pause it”…"
              className="min-w-0 flex-1 resize-y rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground/50"
            />
            <Button type="button" disabled={sending || !draft.trim()} onClick={() => void send()} className="self-end">
              {sending ? <Spinner /> : <Send className="size-3.5" aria-hidden />}
              Send
            </Button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              Replies are interpreted, never executed. ⌘↵ to send.
            </span>
            <span className="ml-auto flex gap-1.5">
              <Button
                type="button"
                size="sm"
                outlined
                onClick={() =>
                  void ignoreIncident(incident.id, "Ignored from the dashboard.")
                    .then(onIncidentChanged)
                    .catch((e) => onError(errText(e)))
                }
              >
                Ignore
              </Button>
              <Button
                type="button"
                size="sm"
                outlined
                onClick={() =>
                  void resolveIncident(incident.id, "Resolved from the dashboard.")
                    .then(onIncidentChanged)
                    .catch((e) => onError(errText(e)))
                }
              >
                Resolve
              </Button>
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Evidence({ incident }: { incident: HeadTraderIncident }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden />
        Source evidence
      </button>
      {open ? (
        <pre className="mt-1.5 max-h-56 overflow-auto rounded border border-border bg-muted p-2 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
          {JSON.stringify(incident.evidence, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const human = message.role === "human";
  return (
    <div className={cn("flex", human ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg border px-2.5 py-1.5 text-xs leading-snug",
          human ? "border-border bg-muted" : "border-border bg-card",
        )}
      >
        <div className="mb-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {human ? (message.actorId ?? "you") : "Head Trader"}
          <span className="ml-1.5 font-normal normal-case tracking-normal">{isoTimeAgo(message.createdAt)}</span>
        </div>
        {message.text}
      </div>
    </div>
  );
}

/** The interpretation, always visible before anything can be confirmed. */
function IntentCard({
  intent,
  actionsById,
  decision,
}: {
  intent: ReplyIntent;
  actionsById: Map<string, HeadTraderAction>;
  decision: HeadTraderDecision | null;
}) {
  const action = intent.actionId ? actionsById.get(intent.actionId) : undefined;
  const proposed = intent.intent === "action" && !!intent.actionId;
  return (
    <div className={cn("mt-2.5 rounded border p-2.5", proposed ? "border-warning/45 bg-warning/10" : "border-border bg-muted/50")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Interpreted as</span>
        <Pill tone={proposed ? "watch" : "unknown"} label={String(intent.intent).replace(/_/g, " ")} />
        <span className="text-[10px] text-muted-foreground">
          confidence {confidenceLabel(intent.confidence)} ({intent.confidence.toFixed(2)})
        </span>
      </div>
      <p className="mt-1 text-xs">{describeIntent(intent, action?.label)}</p>
      {action ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Pill tone={permissionTone(action.permissionLevel)} label={permissionLabel(action.permissionLevel)} />
          <Pill tone={riskTone(action.riskLevel)} label={`${action.riskLevel} risk`} />
          <span className="font-mono text-[10px] text-muted-foreground">{action.id}</span>
        </div>
      ) : null}
      {proposed && !decision ? (
        <p className="mt-1.5 text-[10.5px] text-muted-foreground">
          No decision was created — check the action rail.
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action / risk rail
// ---------------------------------------------------------------------------

function ActionRailPanel({
  incident,
  decision,
  actionsById,
  onDecision,
  onError,
  onConfirmRequested,
  onRejected,
}: {
  incident: HeadTraderIncident | null;
  decision: HeadTraderDecision | null;
  actionsById: Map<string, HeadTraderAction>;
  onDecision: (d: HeadTraderDecision) => void;
  onError: (m: string) => void;
  onConfirmRequested: () => void;
  onRejected: () => void;
}) {
  const [drafting, setDrafting] = useState<string | null>(null);

  const options = incident?.options ?? [];

  const draft = async (actionId: string) => {
    if (!incident) return;
    setDrafting(actionId);
    try {
      const res = await createDecision({
        actionId,
        incidentId: incident.id,
        reason: `Selected from the Head Trader incident queue for ${incident.id}.`,
      });
      onDecision(res.decision);
    } catch (e) {
      onError(errText(e));
    } finally {
      setDrafting(null);
    }
  };

  return (
    <Panel title="Action & risk">
      {!incident ? (
        <EmptyNote>Select an incident to see the actions its desk owns.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-2.5 p-2.5">
          {options.length ? (
            <div className="flex flex-col gap-1.5">
              {options.map((option) => {
                const action = option.actionId ? actionsById.get(option.actionId) : undefined;
                const level = action?.permissionLevel ?? "inform";
                const executable = !option.actionId || isExecutable(level);
                return (
                  <div key={option.id} className="rounded border border-border p-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold">{option.label}</span>
                      {action ? (
                        <>
                          <Pill tone={permissionTone(level)} label={permissionLabel(level)} />
                          <Pill tone={riskTone(action.riskLevel)} label={`${action.riskLevel} risk`} />
                        </>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{option.expectedEffect}</p>
                    {option.actionId ? (
                      <Button
                        type="button"
                        size="sm"
                        outlined
                        className="mt-1.5"
                        disabled={!executable || drafting === option.actionId}
                        title={
                          executable
                            ? undefined
                            : level === "forbidden"
                              ? "Forbidden by policy — Head Trader never routes this."
                              : "Requires a hard human gate outside this conversation."
                        }
                        onClick={() => void draft(option.actionId as string)}
                      >
                        {drafting === option.actionId ? <Spinner /> : null}
                        {executable ? "Draft decision" : level === "forbidden" ? "Forbidden" : "Hard gate required"}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyNote>This incident has no actions attached.</EmptyNote>
          )}

          {decision ? (
            <DecisionCard
              decision={decision}
              action={actionsById.get(decision.actionId)}
              onConfirmRequested={onConfirmRequested}
              onError={onError}
              onDecision={onDecision}
              onRejected={onRejected}
            />
          ) : null}
        </div>
      )}
    </Panel>
  );
}

function DecisionCard({
  decision,
  action,
  onConfirmRequested,
  onError,
  onDecision,
  onRejected,
}: {
  decision: HeadTraderDecision;
  action: HeadTraderAction | undefined;
  onConfirmRequested: () => void;
  onError: (m: string) => void;
  onDecision: (d: HeadTraderDecision) => void;
  onRejected: () => void;
}) {
  const risk = decision.risk;
  const confirmable = canConfirm(decision);
  const hardGate = risk?.permissionLevel === "hard_gate";
  const forbidden = risk?.permissionLevel === "forbidden";

  return (
    <div className="rounded border border-border bg-muted/40 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Decision</span>
        <Pill tone={decisionStatusTone(decision.status)} label={String(decision.status).replace(/_/g, " ")} />
        {risk ? <Pill tone={riskTone(risk.level)} label={`${risk.level} risk`} /> : null}
        {risk ? <Pill tone={permissionTone(risk.permissionLevel)} label={permissionLabel(risk.permissionLevel)} /> : null}
      </div>
      <div className="mt-1 text-xs font-semibold">{action?.label ?? decision.actionId}</div>
      <span className="font-mono text-[10px] text-muted-foreground">{decision.backendControlId ?? "no backend control"}</span>

      {risk ? (
        <div
          className={cn(
            "mt-2 rounded border p-2 text-[11px] leading-snug",
            risk.allowed ? "border-border bg-card" : "border-destructive/40 bg-destructive/10",
          )}
        >
          <div className="font-semibold">{risk.explanation}</div>
          {risk.blockers.length ? (
            <ul className="mt-1 list-none space-y-0.5 p-0">
              {risk.blockers.map((b) => (
                <li key={b} className="flex gap-1.5 text-destructive">
                  <Ban className="mt-0.5 size-3 shrink-0" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {forbidden || hardGate ? (
        <div
          className={cn(
            "mt-2 rounded border px-2 py-1.5 text-[11px] font-semibold",
            "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {forbidden
            ? "Forbidden — Head Trader will never route this action."
            : "Hard gate required — approve this outside the conversation, on the source system."}
        </div>
      ) : null}

      {decision.result ? (
        <div className="mt-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Backend result</div>
          <pre className="mt-1 max-h-48 overflow-auto rounded border border-border bg-muted p-2 font-mono text-[10.5px] text-muted-foreground">
            {JSON.stringify(decision.result, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          destructive
          disabled={!confirmable}
          title={confirmable ? undefined : "This decision cannot be confirmed in its current state."}
          onClick={onConfirmRequested}
        >
          Confirm…
        </Button>
        <Button
          type="button"
          size="sm"
          outlined
          disabled={!["waiting_for_confirmation", "approved"].includes(String(decision.status))}
          onClick={() =>
            void rejectDecision(decision.id, "Rejected from the dashboard.")
              .then((res) => {
                onDecision(res.decision);
                onRejected();
              })
              .catch((e) => onError(errText(e)))
          }
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  decision,
  action,
  incident,
  intent,
  onClose,
  onDone,
  onError,
}: {
  decision: HeadTraderDecision;
  action: HeadTraderAction | undefined;
  incident: HeadTraderIncident | null;
  intent: ReplyIntent | null;
  onClose: () => void;
  onDone: (d: HeadTraderDecision) => void;
  onError: (m: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const tooShort = reason.trim().length < MIN_CONFIRM_REASON;

  const run = async () => {
    setPending(true);
    try {
      const res = await confirmDecision(decision.id, reason);
      if (res.error) onError(res.error);
      onDone(res.decision ?? decision);
    } catch (e) {
      onError(errText(e));
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={riskTone(decision.risk?.level ?? "medium")} label={`${decision.risk?.level ?? "medium"} risk`} />
            <Pill tone={permissionTone(decision.risk?.permissionLevel ?? "approval_required")} label={permissionLabel(decision.risk?.permissionLevel ?? "approval_required")} />
            <LockPill locked={decision.risk?.liveTradingLocked !== false} />
          </div>
          <DialogTitle className="mt-1.5 text-base">{action?.label ?? decision.actionId}</DialogTitle>
          <DialogDescription className="font-mono text-[11px]">
            {decision.backendControlId ?? "no backend control"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          {incident ? (
            <div className="rounded border border-border bg-muted/50 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Incident</div>
              <div className="mt-0.5 font-semibold">{incident.title}</div>
              <p className="mt-0.5 text-muted-foreground">{incident.summary}</p>
            </div>
          ) : null}

          {/* The interpretation is repeated here on purpose: the operator
              approves what was understood, not what they think they typed. */}
          {intent ? (
            <div className="rounded border border-warning/45 bg-warning/10 p-2">
              <div className="text-[10px] font-bold uppercase tracking-wide">You are approving this interpretation</div>
              <p className="mt-0.5">{describeIntent(intent, action?.label)}</p>
              <p className="mt-0.5 text-[10.5px] opacity-80">confidence {confidenceLabel(intent.confidence)}</p>
            </div>
          ) : null}

          {decision.risk ? (
            <div className="rounded border border-border p-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Risk decision</div>
              <p className="mt-0.5">{decision.risk.explanation}</p>
              {decision.risk.blockers.length ? (
                <ul className="mt-1 list-none space-y-0.5 p-0 text-destructive">
                  {decision.risk.blockers.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="ht-confirm-reason"
              className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
            >
              Reason (recorded on the audit trail)
            </label>
            <textarea
              id="ht-confirm-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this the right call right now?"
              className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground/50"
            />
          </div>
        </div>

        <DialogFooter className="items-center">
          <span className="mr-auto text-[11px] text-muted-foreground">
            Routes {decision.backendControlId ?? "nothing"} with execute:true.
          </span>
          <Button type="button" outlined onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            destructive
            disabled={pending || tooShort}
            title={tooShort ? `A reason of at least ${MIN_CONFIRM_REASON} characters is required` : undefined}
            onClick={() => void run()}
          >
            {pending ? <Spinner /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Channels + audit
// ---------------------------------------------------------------------------

function ChannelPanel({ channels }: { channels: ChannelStatus[] }) {
  return (
    <Panel title="Channels">
      {channels.length ? (
        <div>
          {channels.map((c) => {
            const blocker = channelBlocker(c);
            return (
              <div key={String(c.id)} className="flex items-center gap-2 border-b border-border px-2.5 py-2 last:border-b-0">
                <div className="min-w-0">
                  <div className="text-xs font-semibold capitalize">{String(c.id)}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {blocker ? `Inbound off — ${blocker}` : "Inbound ready"}
                    {c.verification ? ` · ${c.verification.replace(/_/g, " ")}` : ""}
                  </div>
                </div>
                <span className="ml-auto shrink-0">
                  <Pill tone={c.inboundReady ? "ready" : "unknown"} label={c.inboundReady ? "ready" : "off"} />
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyNote>No channel adapters reported.</EmptyNote>
      )}
    </Panel>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const bad = /refused|rejected|failed/.test(entry.type);
  return (
    <div className="grid grid-cols-[3px_minmax(0,1fr)] gap-2 border-b border-border px-2.5 py-1.5 last:border-b-0">
      <span className={cn("rounded-sm", bad ? TONE_RAIL.blocked : TONE_RAIL.unknown)} aria-hidden />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10.5px] font-semibold">{entry.type}</span>
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {isoTimeAgo(entry.createdAt)}
          </span>
        </div>
        {entry.actorId ? <div className="text-[10px] text-muted-foreground">{entry.actorId}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shells
// ---------------------------------------------------------------------------

function PartialBanner({ detail, onRetry, label }: { detail: string; onRetry: () => void; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/45 bg-warning/10 px-3 py-1.5 text-xs text-warning">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span className="font-semibold">{label ?? "Refresh failed — showing the last good payload."}</span>
      <span className="font-mono text-[10.5px] opacity-80">{detail}</span>
      <Button type="button" size="sm" outlined className="ml-auto" onClick={onRetry}>
        Dismiss
      </Button>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} aria-hidden />;
}

function LoadingShell() {
  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-3 sm:px-4"
      data-review-id="hermes.head-trader"
      aria-busy="true"
    >
      <span className="sr-only">Loading Head Trader…</span>
      <Skeleton className="h-8" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-14" />
      <div className="grid gap-3 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
        <Skeleton className="h-[28rem]" />
        <Skeleton className="h-[28rem]" />
        <Skeleton className="h-[28rem]" />
      </div>
    </main>
  );
}

function ErrorShell({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main
      className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-3 py-8 sm:px-4"
      data-review-id="hermes.head-trader"
    >
      <SafetyBanner />
      <section className="mx-auto w-full max-w-lg rounded-lg border border-border bg-card p-7 text-center">
        <div className="mb-2 flex justify-center">
          <Pill tone="blocked" label="head trader unavailable" />
        </div>
        <h2 className="m-0 text-base font-semibold">Head Trader is unavailable.</h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          The desk cannot be reached, so no incident, decision or control can be trusted right now.
        </p>
        <p className="mt-3 break-words font-mono text-[11px] text-destructive">{message}</p>
        <Button type="button" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </section>
    </main>
  );
}
