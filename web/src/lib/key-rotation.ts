import { fetchJSON } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  API contract (hermes_cli/secret_rotation.py)                       */
/* ------------------------------------------------------------------ */

export interface RotationHistoryEvent {
  at: string;
  actor: string;
  result: string;
  dryRun: boolean;
}

export interface RotationSecret {
  name: string;
  provider: string | null;
  kind: string;
  rotateUrl: string | null;
  pairWith: string[];
  server: Array<{ path: string; present: boolean }>;
  services: string[];
  lastRotatedAt: string | null;
  ageDays: number | null;
  lastVerify: { status: string; checkedAt: string | null } | null;
  history: RotationHistoryEvent[];
}

export interface RotationStatus {
  generatedAt?: string;
  connected: boolean;
  reason: string | null;
  socket?: string;
  readme?: string;
  secrets: RotationSecret[];
}

export interface RotationStep {
  kind: "file" | "service" | "verify" | string;
  target: string;
  status: string;
  message: string;
}

export interface RotateResult {
  name: string;
  dryRun: boolean;
  result: "ok" | "dry-run" | "failed" | "rotator-unavailable" | string;
  steps: RotationStep[];
  error: string | null;
  macCommand: string;
}

export interface VerifyResult {
  name: string;
  status: string;
  checkedAt?: string | null;
  message: string;
}

const BASE = "/api/secrets/rotation";

export function fetchRotationStatus(): Promise<RotationStatus> {
  return fetchJSON<RotationStatus>(BASE);
}

/** Parse fetchJSON's ``"<status>: <body>"`` error into a JSON body when possible. */
export function parseApiError(err: unknown): { status: number | null; body: unknown; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const match = /^(\d{3}): ([\s\S]*)$/.exec(message);
  if (!match) return { status: null, body: null, message };
  let body: unknown = null;
  try {
    body = JSON.parse(match[2]);
  } catch {
    body = null;
  }
  const detail =
    body && typeof body === "object" && "detail" in body && typeof (body as { detail: unknown }).detail === "string"
      ? (body as { detail: string }).detail
      : match[2];
  return { status: Number(match[1]), body, message: detail };
}

export async function rotateSecret(
  name: string,
  request: { values: Record<string, string>; confirm: string; dryRun: boolean },
): Promise<RotateResult> {
  try {
    return await fetchJSON<RotateResult>(`${BASE}/${encodeURIComponent(name)}/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (err) {
    const parsed = parseApiError(err);
    // 503/502 rotation failures still carry a structured RotateResult.
    if (parsed.body && typeof parsed.body === "object" && "steps" in parsed.body) {
      return parsed.body as RotateResult;
    }
    throw new Error(parsed.message);
  }
}

export async function verifySecret(name: string): Promise<VerifyResult> {
  try {
    return await fetchJSON<VerifyResult>(`${BASE}/${encodeURIComponent(name)}/verify`, { method: "POST" });
  } catch (err) {
    const parsed = parseApiError(err);
    if (parsed.body && typeof parsed.body === "object" && "status" in parsed.body) {
      return parsed.body as VerifyResult;
    }
    throw new Error(parsed.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Risk                                                              */
/* ------------------------------------------------------------------ */

export const AGE_AMBER_DAYS = 90;
export const AGE_RED_DAYS = 180;

export type AgeStatus = "ok" | "due" | "overdue" | "never" | "unknown";

export function ageStatus(secret: Pick<RotationSecret, "ageDays" | "lastRotatedAt">, connected: boolean): AgeStatus {
  if (secret.ageDays == null) {
    if (secret.lastRotatedAt) return "unknown";
    // Disconnected: the dashboard only knows names, not rotation dates.
    return connected ? "never" : "unknown";
  }
  if (secret.ageDays > AGE_RED_DAYS) return "overdue";
  if (secret.ageDays > AGE_AMBER_DAYS) return "due";
  return "ok";
}

export function ageTone(status: AgeStatus): "success" | "warning" | "critical" | "neutral" {
  if (status === "overdue" || status === "never") return "critical";
  if (status === "due") return "warning";
  if (status === "ok") return "success";
  return "neutral";
}

export function verifyFailed(secret: RotationSecret): boolean {
  const status = secret.lastVerify?.status?.toLowerCase();
  return Boolean(status && !["ok", "passed", "success", "valid"].includes(status));
}

export function serverCoverage(secret: RotationSecret): { present: number; total: number } {
  return { present: secret.server.filter((loc) => loc.present).length, total: secret.server.length };
}

export function riskScore(secret: RotationSecret, connected: boolean): number {
  const age = ageStatus(secret, connected);
  let score = { overdue: 300, never: 300, due: 200, unknown: 100, ok: 0 }[age];
  if (verifyFailed(secret)) score += 150;
  const { present, total } = serverCoverage(secret);
  if (total > 0 && present < total) score += 50;
  return score + Math.min(secret.ageDays ?? 0, 999) / 10;
}

export function sortByRisk(secrets: RotationSecret[], connected: boolean): RotationSecret[] {
  return [...secrets].sort(
    (a, b) => riskScore(b, connected) - riskScore(a, connected) || a.name.localeCompare(b.name),
  );
}

export type StatusFilter = "all" | "attention" | "overdue" | "due" | "ok" | "verify-failed";

export function filterSecrets(
  secrets: RotationSecret[],
  connected: boolean,
  filter: { provider: string; status: StatusFilter; query?: string },
): RotationSecret[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  return secrets.filter((secret) => {
    if (filter.provider !== "all" && (secret.provider ?? "unknown") !== filter.provider) return false;
    if (query && !secret.name.toLowerCase().includes(query)) return false;
    const age = ageStatus(secret, connected);
    switch (filter.status) {
      case "overdue":
        return age === "overdue" || age === "never";
      case "due":
        return age === "due";
      case "ok":
        return age === "ok" && !verifyFailed(secret);
      case "verify-failed":
        return verifyFailed(secret);
      case "attention":
        return age !== "ok" || verifyFailed(secret);
      default:
        return true;
    }
  });
}

export function providerOptions(secrets: RotationSecret[]): string[] {
  return [...new Set(secrets.map((s) => s.provider ?? "unknown"))].sort();
}

export function macCommand(name: string): string {
  return `hermes-keys rotate ${name} --mac-only`;
}

/* ------------------------------------------------------------------ */
/*  Rotate dialog state                                                */
/* ------------------------------------------------------------------ */

/** The names that need a new value: the secret plus its pair halves. */
export function requiredValueNames(secret: Pick<RotationSecret, "name" | "pairWith">): string[] {
  return [secret.name, ...secret.pairWith.filter((n) => n !== secret.name)];
}

export interface RotateDialogState {
  /** New secret values. In memory only; wiped on submit and on close. */
  values: Record<string, string>;
  confirm: string;
  dryRun: boolean;
  phase: "editing" | "submitting" | "done";
  result: RotateResult | null;
  error: string | null;
}

export const initialRotateDialogState: RotateDialogState = {
  values: {},
  confirm: "",
  dryRun: true,
  phase: "editing",
  result: null,
  error: null,
};

export type RotateDialogAction =
  | { type: "setValue"; name: string; value: string }
  | { type: "setConfirm"; value: string }
  | { type: "setDryRun"; value: boolean }
  | { type: "submit" }
  | { type: "success"; result: RotateResult }
  | { type: "failure"; error: string }
  | { type: "again" }
  | { type: "close" };

export function rotateDialogReducer(state: RotateDialogState, action: RotateDialogAction): RotateDialogState {
  switch (action.type) {
    case "setValue":
      return { ...state, values: { ...state.values, [action.name]: action.value } };
    case "setConfirm":
      return { ...state, confirm: action.value };
    case "setDryRun":
      return { ...state, dryRun: action.value };
    case "submit":
      // Values are captured by the caller before dispatching; drop them now.
      return { ...state, values: {}, phase: "submitting", error: null, result: null };
    case "success":
      return { ...state, values: {}, phase: "done", result: action.result };
    case "failure":
      return { ...state, values: {}, phase: "done", error: action.error };
    case "again":
      // After a dry run, go back to editing for the real rotation.
      return { ...state, values: {}, phase: "editing", result: null, error: null, dryRun: false };
    case "close":
      return initialRotateDialogState;
    default:
      return state;
  }
}

export function canSubmitRotation(
  state: RotateDialogState,
  secret: Pick<RotationSecret, "name" | "pairWith">,
): boolean {
  if (state.phase !== "editing") return false;
  if (state.confirm !== secret.name) return false;
  return requiredValueNames(secret).every((n) => (state.values[n] ?? "").trim().length > 0);
}

export function rotationRequestFrom(
  state: RotateDialogState,
  secret: Pick<RotationSecret, "name" | "pairWith">,
): { values: Record<string, string>; confirm: string; dryRun: boolean } {
  const values: Record<string, string> = {};
  for (const n of requiredValueNames(secret)) values[n] = state.values[n] ?? "";
  return { values, confirm: state.confirm, dryRun: state.dryRun };
}
