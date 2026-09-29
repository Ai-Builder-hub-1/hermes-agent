import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, RefreshCw, SearchCheck } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, isoTimeAgo } from "@/lib/utils";
import {
  fetchResearchTasks,
  generateResearchTasks,
  type ResearchTask,
} from "@/lib/second-brain";

type Tone = "ready" | "watch" | "blocked" | "unknown";

const TONE_CLASS: Record<Tone, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  watch: "border-warning/45 bg-warning/10 text-warning",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

function toneFor(task: ResearchTask): Tone {
  if (task.status === "completed") return "ready";
  if (task.status === "blocked" || task.priority === "critical") return "blocked";
  if (task.status === "queued" || task.status === "running" || task.priority === "high") return "watch";
  return "unknown";
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", TONE_CLASS[tone])}>
      {tone === "ready" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {children}
    </span>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
        <span>{title}</span>
        <span className="ml-auto">{aside}</span>
      </h2>
      <div className="min-h-0 overflow-auto p-2.5">{children}</div>
    </section>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-[140px] place-items-center rounded-md border border-dashed border-border bg-background p-4 text-center">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 max-w-md text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function TaskRow({ task, active, onSelect }: { task: ResearchTask; active: boolean; onSelect: () => void }) {
  const tone = toneFor(task);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full rounded-md border bg-background p-2 text-left transition hover:border-primary/60", active ? "border-primary/70" : "border-border")}
    >
      <div className="flex items-start gap-2">
        <FlaskConical className={cn("mt-0.5 size-4", tone === "blocked" ? "text-destructive" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{task.summary}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {task.adapter} / {task.reason} / {isoTimeAgo(task.updatedAt)}
          </div>
        </div>
        <Pill tone={tone}>{task.status}</Pill>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill tone={task.priority === "critical" ? "blocked" : task.priority === "high" ? "watch" : "unknown"}>{task.priority}</Pill>
        <Pill tone={task.candidateId ? "ready" : "unknown"}>{task.candidateId ? "candidate" : "no candidate"}</Pill>
      </div>
    </button>
  );
}

export default function ResearchQueuePage() {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAfterTitle, setEnd } = usePageHeader();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await fetchResearchTasks();
      setTasks(result.tasks);
      setSelectedId((current) => current ?? result.tasks[0]?.id ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => tasks.find((task) => task.id === selectedId) ?? null, [tasks, selectedId]);
  const queued = tasks.filter((task) => task.status === "queued").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const completed = tasks.filter((task) => task.status === "completed").length;

  useLayoutEffect(() => {
    setAfterTitle(
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={queued ? "watch" : "ready"}>{queued} queued</Pill>
        <Pill tone={blocked ? "blocked" : "ready"}>{blocked} blocked</Pill>
        <Pill tone="ready">{completed} completed</Pill>
      </div>,
    );
    setEnd(
      <div className="flex gap-1.5">
        <Button
          size="sm"
          ghost
          onClick={() => {
            setActionBusy(true);
            generateResearchTasks().then(() => load()).finally(() => setActionBusy(false));
          }}
          disabled={busy || actionBusy}
        >
          <SearchCheck className="mr-1 size-3.5" />
          Generate
        </Button>
        <Button size="sm" ghost onClick={() => void load()} disabled={busy}>
          <RefreshCw className="mr-1 size-3.5" />
          Refresh
        </Button>
      </div>,
    );
    return () => {
      setAfterTitle(null);
      setEnd(null);
    };
  }, [actionBusy, blocked, busy, completed, load, queued, setAfterTitle, setEnd]);

  if (busy && !tasks.length) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (error && !tasks.length) {
    return (
      <div className="p-4">
        <Panel title="Research queue unavailable">
          <div className="text-sm text-destructive">{error}</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
      <Panel title="Research Tasks" aside={tasks.length}>
        <div className="space-y-2">
          {tasks.length ? tasks.map((task) => (
            <TaskRow key={task.id} task={task} active={task.id === selectedId} onSelect={() => setSelectedId(task.id)} />
          )) : (
            <Empty title="No research tasks" detail="Generate tasks from stale memory, contradictions, or decision-critical records." />
          )}
        </div>
      </Panel>

      <Panel title="Task Detail" aside={selected?.adapter}>
        {selected ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-background p-2">
              <div className="text-sm font-semibold">{selected.summary}</div>
              <div className="mt-1 text-xs text-muted-foreground">{selected.sourceSystem} / {selected.reason}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border bg-background p-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Memory</div>
                <div className="mt-1 truncate">{selected.linkedMemoryId ?? "none"}</div>
              </div>
              <div className="rounded-md border border-border bg-background p-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Decision</div>
                <div className="mt-1 truncate">{selected.linkedDecisionId ?? "none"}</div>
              </div>
              <div className="rounded-md border border-border bg-background p-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Contradiction</div>
                <div className="mt-1 truncate">{selected.linkedContradictionId ?? "none"}</div>
              </div>
              <div className="rounded-md border border-border bg-background p-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Candidate</div>
                <div className="mt-1 truncate">{selected.candidateId ?? "not created"}</div>
              </div>
            </div>
            {selected.blocker ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{selected.blocker}</div>
            ) : null}
          </div>
        ) : (
          <Empty title="Select a task" detail="Choose a task to inspect linked records and output candidate state." />
        )}
      </Panel>

      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="Required Evidence" aside={selected?.requiredEvidence.length ?? 0}>
          <div className="space-y-2">
            {(selected?.requiredEvidence ?? []).map((item) => (
              <div key={item} className="rounded-md border border-border bg-background p-2 text-xs">{item}</div>
            ))}
            {selected && !selected.requiredEvidence.length ? <Empty title="No evidence contract" detail="This task is missing required evidence rules." /> : null}
          </div>
        </Panel>

        <Panel title="Evidence Refs" aside={selected?.evidenceRefs.length ?? 0}>
          <div className="space-y-2">
            {(selected?.evidenceRefs ?? []).map((ref) => (
              <div key={`${ref.sourceSystem}:${ref.sourceType}:${ref.sourceIdentifier}`} className="rounded-md border border-border bg-background p-2 text-xs">
                <div className="font-semibold">{ref.sourceSystem}</div>
                <div className="mt-1 text-muted-foreground">{ref.sourceType} / {ref.sourceIdentifier}</div>
              </div>
            ))}
            {selected && !selected.evidenceRefs.length ? <Empty title="No evidence refs yet" detail="Completed research should attach citations before candidate review." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
