import { fetchJSON } from "@/lib/api";

export interface FleetOperatorEndpointCheck {
  ok: boolean;
  status: number | null;
  ms: number;
  bytes?: number;
  error?: string;
}

export interface FleetOperatorPressureViolation {
  check: string;
  actual: number;
  budget: number;
  unit: "ms" | "bytes";
}

export interface FleetOperatorSnapshot {
  projectId: string;
  label: string;
  owner: string;
  status: "current" | "declared" | "missing";
  healthUrl: string | null;
  snapshotUrl: string | null;
  latestCheck: {
    status: "passed" | "failed";
    capturedAt: string;
    checks: {
      health: FleetOperatorEndpointCheck;
      snapshot: FleetOperatorEndpointCheck;
    };
    pressure: {
      status: "passed" | "failed";
      violations: FleetOperatorPressureViolation[];
    };
  } | null;
}

export interface FleetOperatorSnapshotResponse {
  schemaVersion: number;
  generatedAt: string | null;
  source: string;
  snapshots: FleetOperatorSnapshot[];
}

export interface FleetOperatorQueueItem {
  id: string;
  kind: "blocker" | "action" | "incident" | "approval" | "run" | "evidence";
  title: string;
  source: string;
  owner: string;
  severity: "critical" | "warning" | "info" | "ready";
  state: "blocked" | "gated" | "queued" | "assigned" | "ready" | "done" | "stale" | "review";
  whyItMatters: string;
  nextAction: string;
  clearingProof: string;
  evidence: string;
  safeAction: string | null;
  requiresApproval: boolean;
  updatedAt: string | null;
  route?: string;
}

export interface FleetOperatorQueueResponse {
  schemaVersion: number;
  generatedAt: string | null;
  source: string;
  summary: {
    attention: number;
    blocked: number;
    ready: number;
    executable: number;
  };
  items: FleetOperatorQueueItem[];
}

export const fallbackFleetOperatorSnapshots: FleetOperatorSnapshot[] = [
  failedSnapshot("tlc-capital-group-os", "TLC Capital Group OS", "tlc-enterprise", "https://tlc.tlccapitalgroup.com/health", "https://tlc.tlccapitalgroup.com/dashboard-snapshot"),
  failedSnapshot("nous-hermes-agent", "Nous Hermes Agent", "hermes-standards", "https://agent.tlccapitalgroup.com/api/status", "https://agent.tlccapitalgroup.com/api/dashboard-snapshot"),
  failedSnapshot("hermes-os", "Hermes OS", "hermes-runtime", "https://hermes.tlccapitalgroup.com/api/dashboard-summary", "https://hermes.tlccapitalgroup.com/api/dashboard-summary"),
  failedSnapshot("media-engine", "Media Engine", "media-engine", "https://media.tlccapitalgroup.com/health", "https://media.tlccapitalgroup.com/dashboard-snapshot"),
  failedSnapshot("media-business-operations", "Media Business Operations", "media-business-operations", "https://media-business-operations.tlccapitalgroup.com/health", "https://media-business-operations.tlccapitalgroup.com/api/dashboard-summary"),
  passedSnapshot("khashi-vc", "Khashi VC", "khashi-vc", "https://roc.tlccapitalgroup.com/readyz", "https://roc.tlccapitalgroup.com/api/dashboard-snapshot", {
    healthMs: 292,
    healthBytes: 125,
    snapshotMs: 1011,
    snapshotBytes: 1340,
  }),
  failedSnapshot("business-mapper", "Business Mapper / Consulting", "business-mapper", "https://business-mapper.tlccapitalgroup.com/health", "https://business-mapper.tlccapitalgroup.com/api/dashboard-snapshot"),
  failedSnapshot("meal-assistant", "Meal Assistant", "meal-assistant", "https://meal.tlccapitalgroup.com/health", "https://meal.tlccapitalgroup.com/api/dashboard-snapshot"),
  failedSnapshot("rinseables-os", "Rinseables OS", "rinseables-os", "https://rinseables.tlccapitalgroup.com/health", "https://rinseables.tlccapitalgroup.com/api/dashboard-snapshot"),
  passedSnapshot("investing-system", "Investing System", "investing-system", "https://investing.tlccapitalgroup.com/health", "https://investing.tlccapitalgroup.com/api/dashboard-snapshot", {
    healthMs: 230,
    healthBytes: 90,
    snapshotMs: 571,
    snapshotBytes: 1488,
  }),
];

export async function loadFleetOperatorSnapshots(): Promise<FleetOperatorSnapshot[]> {
  try {
    const response = await fetchJSON<FleetOperatorSnapshotResponse>("/api/fleet/operator-snapshots");
    return response.snapshots.length ? response.snapshots : fallbackFleetOperatorSnapshots;
  } catch {
    return fallbackFleetOperatorSnapshots;
  }
}

export async function loadFleetOperatorQueue(limit = 6): Promise<FleetOperatorQueueResponse | null> {
  try {
    return await fetchJSON<FleetOperatorQueueResponse>(`/api/fleet/operator-queue?limit=${limit}`);
  } catch {
    return null;
  }
}

function passedSnapshot(
  projectId: string,
  label: string,
  owner: string,
  healthUrl: string,
  snapshotUrl: string,
  metrics: { healthMs: number; healthBytes: number; snapshotMs: number; snapshotBytes: number },
): FleetOperatorSnapshot {
  return {
    projectId,
    label,
    owner,
    status: "current",
    healthUrl,
    snapshotUrl,
    latestCheck: {
      status: "passed",
      capturedAt: "2026-09-29T15:00:00.000Z",
      checks: {
        health: { ok: true, status: 200, ms: metrics.healthMs, bytes: metrics.healthBytes },
        snapshot: { ok: true, status: 200, ms: metrics.snapshotMs, bytes: metrics.snapshotBytes },
      },
      pressure: { status: "passed", violations: [] },
    },
  };
}

function failedSnapshot(
  projectId: string,
  label: string,
  owner: string,
  healthUrl: string,
  snapshotUrl: string,
): FleetOperatorSnapshot {
  return {
    projectId,
    label,
    owner,
    status: "declared",
    healthUrl,
    snapshotUrl,
    latestCheck: {
      status: "failed",
      capturedAt: "2026-09-29T15:00:00.000Z",
      checks: {
        health: { ok: false, status: null, ms: 1, error: "fetch failed" },
        snapshot: { ok: false, status: null, ms: 1, error: "fetch failed" },
      },
      pressure: { status: "passed", violations: [] },
    },
  };
}
