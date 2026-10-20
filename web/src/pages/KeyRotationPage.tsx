import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  KeyRound,
  Laptop,
  RefreshCw,
  RotateCw,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Input } from "@nous-research/ui/ui/components/input";
import { Label } from "@nous-research/ui/ui/components/label";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn, themedBody } from "@/lib/utils";
import {
  ageStatus,
  ageTone,
  canSubmitRotation,
  fetchRotationStatus,
  filterSecrets,
  initialRotateDialogState,
  macCommand,
  providerOptions,
  requiredValueNames,
  rotateDialogReducer,
  rotateSecret,
  rotationRequestFrom,
  serverCoverage,
  sortByRisk,
  verifyFailed,
  verifySecret,
  type AgeStatus,
  type RotationSecret,
  type RotationStatus,
  type RotationStep,
  type StatusFilter,
  type VerifyResult,
} from "@/lib/key-rotation";

type Tone = "success" | "info" | "warning" | "critical" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-600",
  critical: "border-red-500/35 bg-red-500/10 text-red-600",
  neutral: "border-border bg-muted text-muted-foreground",
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All secrets" },
  { value: "attention", label: "Needs attention" },
  { value: "overdue", label: "Overdue / never rotated" },
  { value: "due", label: "Due (over 90 days)" },
  { value: "verify-failed", label: "Verify failed" },
  { value: "ok", label: "Healthy" },
];

const ROTATOR_README = "deploy/secret-rotator/README.md";

export default function KeyRotationPage() {
  const [status, setStatus] = useState<RotationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [rotating, setRotating] = useState<RotationSecret | null>(null);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult | { error: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchRotationStatus());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connected = status?.connected ?? false;
  const sorted = useMemo(() => sortByRisk(status?.secrets ?? [], connected), [status, connected]);
  const visible = useMemo(
    () => filterSecrets(sorted, connected, { provider, status: statusFilter, query }),
    [sorted, connected, provider, statusFilter, query],
  );
  const providers = useMemo(() => providerOptions(sorted), [sorted]);
  const counts = useMemo(() => {
    const out = { overdue: 0, due: 0, ok: 0, verifyFailed: 0 };
    for (const secret of sorted) {
      const age = ageStatus(secret, connected);
      if (age === "overdue" || age === "never") out.overdue += 1;
      else if (age === "due") out.due += 1;
      else if (age === "ok") out.ok += 1;
      if (verifyFailed(secret)) out.verifyFailed += 1;
    }
    return out;
  }, [sorted, connected]);

  const runVerify = useCallback(async (name: string) => {
    setVerifying((prev) => ({ ...prev, [name]: true }));
    try {
      const result = await verifySecret(name);
      setVerifyResults((prev) => ({ ...prev, [name]: result }));
    } catch (err) {
      setVerifyResults((prev) => ({ ...prev, [name]: { error: err instanceof Error ? err.message : String(err) } }));
    } finally {
      setVerifying((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  return (
    <main
      className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
      data-review-id="hermes.key-rotation"
      data-data-state={!status ? (loadError ? "error" : "loading") : connected ? "ready" : "partial"}
    >
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <KeyRound className="h-4 w-4" aria-hidden />
              Secrets
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Key rotation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Rotate provider keys on this server: paste the new key, the rotator updates every server copy, restarts the
              services that use it, and verifies the provider accepts it. Values are sent once and never stored or shown.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
              <Link className="text-primary hover:underline" to="/env">Keys (local .env)</Link>
              <Link className="text-primary hover:underline" to="/system/credentials">Credential health</Link>
              <Link className="text-primary hover:underline" to="/server-secret-posture-scanner">Server secret posture</Link>
            </div>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
            <MiniStat label="Overdue / never" value={counts.overdue} tone={counts.overdue ? "critical" : "neutral"} />
            <MiniStat label="Due >90d" value={counts.due} tone={counts.due ? "warning" : "neutral"} />
            <MiniStat label="Healthy" value={counts.ok} tone="neutral" />
            <MiniStat label="Verify failed" value={counts.verifyFailed} tone={counts.verifyFailed ? "critical" : "neutral"} />
          </div>
        </div>
      </section>

      {status && !connected ? (
        <section
          role="status"
          data-hdk-component="PartialDataBanner"
          className={cn("flex flex-wrap items-start gap-3 rounded-lg border p-4", toneClasses.warning)}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-sm leading-6">
            <h2 className="font-semibold">Rotator not connected on this server</h2>
            <p>
              {status.reason ?? "The secret rotator socket is unavailable."} Rotation is disabled until the rotator runs and
              its socket is mounted into the dashboard container — see <span className="font-mono font-semibold">{ROTATOR_README}</span> in
              the hermes repo. Names and any rotation ages the dashboard has recorded are still shown.
            </p>
          </div>
        </section>
      ) : null}

      {loadError ? (
        <section role="alert" className={cn("rounded-lg border p-4 text-sm", toneClasses.critical)}>
          <h2 className="font-semibold">Could not load rotation status</h2>
          <p className="mt-1 break-words">{loadError}</p>
          <Button type="button" outlined size="sm" className="mt-3" onClick={() => void load()}>
            Retry
          </Button>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="rotation-table-title">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-muted px-3 py-2">
          <h2 id="rotation-table-title" className="self-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Secrets by risk <span className="tabular-nums text-foreground">{visible.length}</span>
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <FilterField label="Search" htmlFor="rotation-search">
              <Input
                id="rotation-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name"
                className="h-8 w-40 text-xs"
              />
            </FilterField>
            <FilterField label="Provider" htmlFor="rotation-provider">
              <select
                id="rotation-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
              >
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Status" htmlFor="rotation-status">
              <select
                id="rotation-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </FilterField>
            <Button type="button" outlined size="sm" onClick={() => void load()} disabled={loading} aria-label="Refresh rotation status">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
            </Button>
          </div>
        </div>

        {!status && !loadError ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground" data-hdk-component="DashboardLoadingShell">
            <Spinner /> Loading rotation status
          </div>
        ) : visible.length === 0 && status ? (
          <p className="p-6 text-sm text-muted-foreground" data-hdk-component="StatePanel">
            {sorted.length === 0 ? "No secrets are known yet." : "No secrets match these filters."}
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-xs" data-hdk-component="DataTable">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th scope="col" className="px-3 py-2">Secret</th>
                    <th scope="col" className="px-3 py-2">Provider / kind</th>
                    <th scope="col" className="px-3 py-2">Age</th>
                    <th scope="col" className="px-3 py-2">Last verify</th>
                    <th scope="col" className="px-3 py-2">Server copies</th>
                    <th scope="col" className="px-3 py-2">Services</th>
                    <th scope="col" className="px-3 py-2">Mac copies</th>
                    <th scope="col" className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((secret) => (
                    <tr key={secret.name} className="border-b border-border/60 align-top">
                      <td className="px-3 py-2">
                        <div className="font-mono font-semibold text-foreground">{secret.name}</div>
                        {secret.pairWith.length ? (
                          <div className="mt-0.5 text-muted-foreground">pair: {secret.pairWith.join(", ")}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-foreground">{secret.provider ?? "unknown"}</div>
                        <div className="text-muted-foreground">{secret.kind}</div>
                      </td>
                      <td className="px-3 py-2"><AgeBadge secret={secret} connected={connected} /></td>
                      <td className="px-3 py-2">
                        <VerifyCell secret={secret} result={verifyResults[secret.name]} />
                      </td>
                      <td className="px-3 py-2"><CoverageCell secret={secret} /></td>
                      <td className="px-3 py-2 text-muted-foreground">{secret.services.length ? secret.services.join(", ") : "—"}</td>
                      <td className="px-3 py-2"><MacHint name={secret.name} /></td>
                      <td className="px-3 py-2">
                        <RowActions
                          secret={secret}
                          connected={connected}
                          verifying={Boolean(verifying[secret.name])}
                          onVerify={() => void runVerify(secret.name)}
                          onRotate={() => setRotating(secret)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-2 p-3 md:hidden" aria-label="Secrets by risk">
              {visible.map((secret) => (
                <li key={secret.name} className="rounded-lg border border-border bg-background p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="break-all font-mono text-sm font-semibold text-foreground">{secret.name}</div>
                      <div className="mt-0.5 text-muted-foreground">
                        {secret.provider ?? "unknown"} · {secret.kind}
                        {secret.pairWith.length ? ` · pair: ${secret.pairWith.join(", ")}` : ""}
                      </div>
                    </div>
                    <AgeBadge secret={secret} connected={connected} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <MobileFact label="Last verify"><VerifyCell secret={secret} result={verifyResults[secret.name]} /></MobileFact>
                    <MobileFact label="Server copies"><CoverageCell secret={secret} /></MobileFact>
                    <MobileFact label="Services">{secret.services.length ? secret.services.join(", ") : "—"}</MobileFact>
                    <MobileFact label="Mac copies"><MacHint name={secret.name} /></MobileFact>
                  </dl>
                  <div className="mt-3">
                    <RowActions
                      secret={secret}
                      connected={connected}
                      verifying={Boolean(verifying[secret.name])}
                      onVerify={() => void runVerify(secret.name)}
                      onRotate={() => setRotating(secret)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <RotateDialog
        secret={rotating}
        onClose={() => setRotating(null)}
        onRotated={() => void load()}
        onVerify={runVerify}
        verifying={rotating ? Boolean(verifying[rotating.name]) : false}
        verifyResult={rotating ? verifyResults[rotating.name] : undefined}
      />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Rotate dialog                                                      */
/* ------------------------------------------------------------------ */

function RotateDialog({
  secret,
  onClose,
  onRotated,
  onVerify,
  verifying,
  verifyResult,
}: {
  secret: RotationSecret | null;
  onClose: () => void;
  onRotated: () => void;
  onVerify: (name: string) => Promise<void>;
  verifying: boolean;
  verifyResult: VerifyResult | { error: string } | undefined;
}) {
  const [state, dispatch] = useReducer(rotateDialogReducer, initialRotateDialogState);
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = secret !== null;

  const close = useCallback(() => {
    dispatch({ type: "close" });
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLInputElement>("input[type=password]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.phase !== "submitting") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [open, close, state.phase]);

  if (!secret) return null;

  const names = requiredValueNames(secret);
  const ready = canSubmitRotation(state, secret);
  const confirmMismatch = state.confirm.length > 0 && state.confirm !== secret.name;

  const submit = async () => {
    if (!canSubmitRotation(state, secret)) return;
    const request = rotationRequestFrom(state, secret);
    dispatch({ type: "submit" }); // wipes values from state before the request is in flight
    try {
      const result = await rotateSecret(secret.name, request);
      dispatch({ type: "success", result });
      if (!result.dryRun) onRotated();
    } catch (err) {
      dispatch({ type: "failure", error: err instanceof Error ? err.message : String(err) });
    } finally {
      request.values = {};
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && state.phase !== "submitting") close();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 p-4"
    >
      <div
        ref={dialogRef}
        data-hdk-component="Drawer"
        className={cn(themedBody, "relative flex max-h-[92vh] w-full max-w-xl flex-col border border-border bg-card shadow-2xl")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 id="rotate-dialog-title" className="text-base font-semibold text-foreground">
              Rotate <span className="break-all font-mono">{secret.name}</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {secret.provider ?? "unknown provider"} · {secret.server.length} server location(s) · {secret.services.length} service(s)
            </p>
          </div>
          <Button type="button" ghost size="icon" onClick={close} disabled={state.phase === "submitting"} aria-label="Close rotate dialog">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 text-sm">
          <Step n={1} title="Generate a new key">
            {secret.rotateUrl ? (
              <a
                href={secret.rotateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                Generate a new key at {secret.provider ?? new URL(secret.rotateUrl).hostname}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : (
              <p className="text-muted-foreground">Generate a new key in the {secret.provider ?? "provider"} console.</p>
            )}
            {secret.pairWith.length ? (
              <p className="mt-1 text-xs text-muted-foreground">This key is paired — both halves must be replaced together.</p>
            ) : null}
          </Step>

          {state.phase === "editing" ? (
            <form
              className="grid gap-4"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Step n={2} title={names.length > 1 ? "Paste both new values" : "Paste the new value"}>
                <div className="grid gap-3">
                  {names.map((n) => (
                    <div key={n} className="grid gap-1">
                      <Label htmlFor={`rotate-value-${n}`} className="font-mono text-xs">New value for {n}</Label>
                      <Input
                        id={`rotate-value-${n}`}
                        type="password"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-1p-ignore="true"
                        data-lpignore="true"
                        value={state.values[n] ?? ""}
                        onChange={(e) => dispatch({ type: "setValue", name: n, value: e.target.value })}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Kept in memory only and cleared on submit or close.</p>
                </div>
              </Step>

              <Step n={3} title="Confirm">
                <Label htmlFor="rotate-confirm" className="text-xs">
                  Type <span className="font-mono font-semibold">{secret.name}</span> to confirm
                </Label>
                <Input
                  id="rotate-confirm"
                  autoComplete="off"
                  spellCheck={false}
                  value={state.confirm}
                  onChange={(e) => dispatch({ type: "setConfirm", value: e.target.value })}
                  aria-invalid={confirmMismatch}
                  aria-describedby="rotate-confirm-hint"
                  className="mt-1 font-mono"
                />
                <p id="rotate-confirm-hint" className={cn("mt-1 text-xs", confirmMismatch ? "text-red-600" : "text-muted-foreground")}>
                  {confirmMismatch ? "Does not match the secret name." : "Must match exactly."}
                </p>
                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={state.dryRun}
                    onChange={(e) => dispatch({ type: "setDryRun", value: e.target.checked })}
                    className="h-4 w-4 accent-current"
                  />
                  Dry run first (show what would change; nothing is written)
                </label>
              </Step>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" outlined onClick={close}>Cancel</Button>
                <Button type="submit" destructive={!state.dryRun} disabled={!ready}>
                  <RotateCw className="mr-1.5 h-4 w-4" aria-hidden />
                  {state.dryRun ? "Run dry run" : "Rotate now"}
                </Button>
              </div>
            </form>
          ) : null}

          {state.phase === "submitting" ? (
            <div className="flex items-center gap-2 text-muted-foreground" role="status">
              <Spinner /> {state.dryRun ? "Running dry run" : "Rotating"} on the server…
            </div>
          ) : null}

          {state.phase === "done" ? (
            <Step n={4} title={state.result?.dryRun ? "Dry-run results" : "Results"}>
              {state.error ? (
                <p role="alert" className={cn("rounded border p-2 text-xs", toneClasses.critical)}>{state.error}</p>
              ) : null}
              {state.result ? (
                <div className="grid gap-2">
                  <ResultBanner result={state.result.result} dryRun={state.result.dryRun} error={state.result.error} />
                  <ul className="grid gap-1.5" aria-label="Rotation steps">
                    {state.result.steps.map((step, i) => (
                      <StepResult key={`${step.kind}-${step.target}-${i}`} step={step} />
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button type="button" outlined size="sm" onClick={() => void onVerify(secret.name)} disabled={verifying}>
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {verifying ? "Verifying…" : "Verify now"}
                </Button>
                {state.result?.dryRun && state.result.result === "dry-run" ? (
                  <Button type="button" size="sm" onClick={() => dispatch({ type: "again" })}>
                    Continue to real rotation
                  </Button>
                ) : null}
                {state.error || state.result?.result === "failed" ? (
                  <Button type="button" size="sm" outlined onClick={() => dispatch({ type: "again" })}>
                    Try again
                  </Button>
                ) : null}
                <Button type="button" size="sm" outlined onClick={close}>Done</Button>
              </div>
              {verifyResult ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Verify: {"error" in verifyResult ? verifyResult.error : `${verifyResult.status}${verifyResult.message ? ` — ${verifyResult.message}` : ""}`}
                </p>
              ) : null}
            </Step>
          ) : null}

          <Step n={state.phase === "done" ? 5 : 4} title="Then rotate the Mac copies">
            <p className="text-xs text-muted-foreground">
              The server rotator does not touch the owner's Mac. Run this on the Mac after the server rotation succeeds:
            </p>
            <CommandLine command={macCommand(secret.name)} />
          </Step>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3">
      <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-foreground">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="mb-1.5 text-sm font-semibold text-foreground">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h3>
        {children}
      </div>
    </section>
  );
}

function ResultBanner({ result, dryRun, error }: { result: string; dryRun: boolean; error: string | null }) {
  const tone: Tone = result === "ok" ? "success" : result === "dry-run" ? "info" : "critical";
  const label =
    result === "ok"
      ? "Rotated on the server. Remember the Mac copies below."
      : result === "dry-run"
        ? "Dry run complete — nothing was written."
        : result === "rotator-unavailable"
          ? "Rotator unavailable — nothing was changed."
          : dryRun
            ? "Dry run reported a problem."
            : "Rotation reported a failed step.";
  return (
    <div role="status" className={cn("rounded border p-2 text-xs font-semibold", toneClasses[tone])}>
      {label}
      {error ? <div className="mt-1 font-normal">{error}</div> : null}
    </div>
  );
}

function StepResult({ step }: { step: RotationStep }) {
  const status = step.status.toLowerCase();
  const tone: Tone = ["failed", "fail", "error", "errored"].includes(status)
    ? "critical"
    : ["ok", "success", "done", "passed"].includes(status)
      ? "success"
      : "neutral";
  const Icon = step.kind === "file" ? FileText : step.kind === "service" ? Server : ShieldCheck;
  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-2 rounded border border-border bg-background p-2 text-xs">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <div className="break-all font-mono text-foreground">
          <span className="sr-only">{step.kind}: </span>
          {step.target}
        </div>
        {step.message ? <div className="mt-0.5 break-words text-muted-foreground">{step.message}</div> : null}
      </div>
      <Pill tone={tone}>{step.status}</Pill>
    </li>
  );
}

function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
      <span className="min-w-0 flex-1 select-all break-words font-mono text-xs text-foreground">{command}</span>
      <Button
        type="button"
        ghost
        size="icon"
        aria-label="Copy Mac command"
        onClick={async () => {
          setCopied(await copyTextToClipboard(command));
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      </Button>
    </div>
  );
}

const AGE_LABEL: Record<AgeStatus, string> = {
  ok: "",
  due: "due",
  overdue: "overdue",
  never: "never rotated",
  unknown: "unknown",
};

function AgeBadge({ secret, connected }: { secret: RotationSecret; connected: boolean }) {
  const status = ageStatus(secret, connected);
  const tone = ageTone(status);
  const text = secret.ageDays != null ? `${secret.ageDays}d${AGE_LABEL[status] ? ` · ${AGE_LABEL[status]}` : ""}` : AGE_LABEL[status];
  return (
    <Pill tone={tone} title={secret.lastRotatedAt ? `Last rotated ${new Date(secret.lastRotatedAt).toLocaleString()}` : undefined}>
      {text}
    </Pill>
  );
}

function VerifyCell({ secret, result }: { secret: RotationSecret; result: VerifyResult | { error: string } | undefined }) {
  if (result) {
    if ("error" in result) return <span className="text-red-600">{result.error}</span>;
    const ok = ["ok", "passed", "success", "valid"].includes(result.status.toLowerCase());
    return (
      <span>
        <Pill tone={ok ? "success" : "critical"}>{result.status}</Pill>
        <span className="ml-1 text-muted-foreground">just now</span>
      </span>
    );
  }
  if (!secret.lastVerify) return <span className="text-muted-foreground">never</span>;
  return (
    <span>
      <Pill tone={verifyFailed(secret) ? "critical" : "success"}>{secret.lastVerify.status}</Pill>
      {secret.lastVerify.checkedAt ? (
        <span className="ml-1 text-muted-foreground">{new Date(secret.lastVerify.checkedAt).toLocaleDateString()}</span>
      ) : null}
    </span>
  );
}

function CoverageCell({ secret }: { secret: RotationSecret }) {
  const { present, total } = serverCoverage(secret);
  if (total === 0) return <span className="text-muted-foreground">—</span>;
  const missing = secret.server.filter((loc) => !loc.present).map((loc) => loc.path);
  return (
    <span title={secret.server.map((loc) => `${loc.present ? "present" : "missing"}: ${loc.path}`).join("\n")}>
      <Pill tone={present < total ? "warning" : "success"}>{present}/{total}</Pill>
      {missing.length ? <span className="ml-1 text-muted-foreground">{missing.length} missing</span> : null}
    </span>
  );
}

function MacHint({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title={macCommand(name)}>
      <Laptop className="h-3.5 w-3.5" aria-hidden />
      Separate (Mac)
    </span>
  );
}

function RowActions({
  secret,
  connected,
  verifying,
  onVerify,
  onRotate,
}: {
  secret: RotationSecret;
  connected: boolean;
  verifying: boolean;
  onVerify: () => void;
  onRotate: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={onVerify}
        disabled={!connected || verifying}
        aria-label={`Verify ${secret.name} now`}
        className="rounded border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {verifying ? "Verifying…" : "Verify now"}
      </button>
      <button
        type="button"
        onClick={onRotate}
        disabled={!connected}
        aria-label={`Rotate ${secret.name}`}
        title={connected ? undefined : "Rotator not connected on this server"}
        className="inline-flex items-center gap-1 rounded border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden />
        Rotate
      </button>
    </div>
  );
}

function Pill({ tone, title, children }: { tone: Tone; title?: string; children: ReactNode }) {
  return (
    <span title={title} className={cn("inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold", toneClasses[tone])}>
      {children}
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", tone === "neutral" ? "border-border bg-background" : toneClasses[tone])}>
      <div className="text-[11px] uppercase tracking-wide">{label}</div>
      <div className="mt-1 tabular-nums text-lg font-semibold">{value}</div>
    </div>
  );
}

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MobileFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}
