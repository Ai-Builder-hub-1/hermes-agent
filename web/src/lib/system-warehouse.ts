import { fetchJSON } from "@/lib/api";

const BASE = "/api/system/warehouse";

export type WarehouseHealth = "ready" | "partial" | "blocked" | string;
export type WarehouseWindow = "1h" | "24h" | "7d" | "30d";

export interface WarehouseVolume {
  path: string;
  exists: boolean;
  configured: boolean;
  scope?: string;
  host?: string;
  mountProof?: {
    verifiedAt: string;
    pathExists: boolean;
    probePath: string;
    totalBytes?: number;
    freeBytes?: number;
    error?: string;
  };
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  percentUsed: number;
  measuredBytes: number;
  measuredFiles: number;
  measurementTruncated: boolean;
  lastMirrorAt?: string | null;
}

export interface WarehouseSummary {
  contractVersion: string;
  generatedAt: string;
  health: WarehouseHealth;
  warehouse: WarehouseVolume;
  mirror: WarehouseVolume;
  ingest: {
    bytes24h: number;
    records24h: number;
    sources: number;
    staleSources: number;
  };
  retention: {
    policy: string;
    lastPruneAt: string | null;
    pruneDryRunAvailable: boolean;
  };
  restoreProof: {
    ok: boolean;
    lastRestoreProofAt: string | null;
    manifestHash: string | null;
    manifest?: {
      objectCount: number;
      missingObjects: number;
      corruptObjects: number;
      bundleUri: string;
      verifiedAt: string | null;
      source: string;
    };
  };
  forecast: {
    daysUntilFull: number | null;
    dailyGrowthBytes: number;
    confidence: string;
  };
  slo: {
    freshnessMinutes: number;
    mirrorLagHours: number;
    restoreProofDays: number;
    breaches: string[];
  };
  backbone: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      categories: number;
      ready: number;
      partial: number;
      missing: number;
      warehouseEnough: boolean;
      posture: string;
    };
    requiredTables: string[];
    items: Array<{
      id: string;
      label: string;
      status: string;
      warehouseEnough: boolean;
      evidence: string[];
      missing: string[];
      nextAction: string;
    }>;
    recommendations: string[];
  };
  databaseBackup: {
    contractVersion: string;
    generatedAt: string;
    status: string;
    sourceOfTruth: {
      type: string;
      path: string;
      exists: boolean;
      sizeBytes: number;
      modifiedAt: string | null;
      role: string;
    };
    warehouseRole: string;
    latestBackup: {
      ok: boolean;
      backupRef: string;
      createdAt: string | null;
      ageMinutes: number | null;
      maxAgeMinutes: number;
      sizeBytes: number;
      contentHash: string;
      restoreMode: string;
    };
    requirements: string[];
    nextAction: string;
  };
  providerReadiness: {
    contractVersion: string;
    generatedAt: string;
    summary: {
      categories: number;
      ready: number;
      partial: number;
      missing: number;
      providerReady: boolean;
      posture: string;
    };
    items: Array<{
      id: string;
      category: string;
      label: string;
      status: string;
      provider: string;
      requiredEnv: string[];
      proofTable: string;
      proofCount: number;
      nextAction: string;
    }>;
    connectionChecklist: Array<{
      id: string;
      label: string;
      status: string;
      needed: string;
      acceptedInputs: string;
      safeTest: string;
      whyUserProvided: string;
      currentProvider: string;
      proofTable: string;
      proofCount: number;
      nextAction: string;
    }>;
    recommendations: string[];
  };
}

export interface WarehouseSource {
  id: string;
  project: string;
  owner: string;
  status: "ready" | "partial" | "blocked" | string;
  expectedCadenceMinutes: number;
  lastIngestAt: string;
  lagMinutes: number | null;
  bytes24h: number;
  records24h: number;
  errorCount24h: number;
  lastError: string | null;
  detail: string;
  sourceScope?: string;
  proofId?: string;
}

export interface WarehouseSeriesPoint {
  timestamp: string;
  storageUsedBytes: number;
  measuredWarehouseBytes: number;
  bytesIngested: number;
  recordsIngested: number;
  mirrorBytes: number;
  prunedBytes: number;
  failedRuns: number;
}

export interface WarehouseSeries {
  generatedAt: string;
  window: WarehouseWindow;
  historyStatus: string;
  points: WarehouseSeriesPoint[];
}

export interface WarehouseJob {
  id: string;
  kind: string;
  status: string;
  title: string;
  owner: string;
  startedAt: string | null;
  finishedAt: string | null;
  bytes: number;
  records: number;
  detail: string;
  proofId?: string;
  artifactUri?: string;
  manifestHash?: string;
}

export interface WarehouseSnapshot {
  summary: WarehouseSummary;
  sources: WarehouseSource[];
  series: WarehouseSeries;
  jobs: WarehouseJob[];
}

export async function fetchWarehouseSnapshot(window: WarehouseWindow = "24h"): Promise<WarehouseSnapshot> {
  const [summary, sources, series, jobs] = await Promise.all([
    fetchJSON<WarehouseSummary>(`${BASE}/summary`),
    fetchJSON<{ sources: WarehouseSource[] }>(`${BASE}/sources`),
    fetchJSON<WarehouseSeries>(`${BASE}/series?window=${encodeURIComponent(window)}`),
    fetchJSON<{ jobs: WarehouseJob[] }>(`${BASE}/jobs`),
  ]);
  return { summary, sources: sources.sources, series, jobs: jobs.jobs };
}

export function runWarehouseSync(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/sync`, { method: "POST" });
}

export function runWarehouseRestoreProof(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/restore-proof`, { method: "POST" });
}

export function runWarehousePruneDryRun(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/prune-dry-run`, { method: "POST" });
}

export function runWarehouseDatabaseBackup(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/database-backup`, { method: "POST" });
}

export function runWarehouseProviderReadiness(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${BASE}/provider-readiness`, { method: "POST" });
}

export function formatBytes(value: number | null | undefined): string {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / 1024 ** index;
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

export function warehouseHealthTone(health: string): "success" | "warning" | "critical" | "info" {
  if (health === "ready") return "success";
  if (health === "blocked" || health === "failed") return "critical";
  if (health === "partial" || health === "warning" || health === "gated") return "warning";
  return "info";
}
