import { fetchJSON } from "@/lib/api";
import type { WarehouseWindow } from "@/lib/system-warehouse";

export type SystemHealth = "ready" | "warning" | "critical" | "partial" | "blocked" | string;

export interface StorageSummary {
  contractVersion: string;
  generatedAt: string;
  health: SystemHealth;
  summary: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
    measuredBytes: number;
    cleanupCandidates: number;
    forecastDaysUntilFull: number | null;
  };
  volumes: Array<{
    label: string;
    path: string;
    exists: boolean;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
    retentionClass: string;
    measuredBytes: number;
    measuredFiles: number;
    truncated: boolean;
  }>;
  cleanupCandidates: Array<{
    id: string;
    label: string;
    path: string;
    reclaimableBytes: number;
    safeAction: string;
    retentionClass: string;
  }>;
  slo: { breaches: string[] };
}

export interface FreshnessSummary {
  contractVersion: string;
  generatedAt: string;
  health: SystemHealth;
  summary: {
    sources: number;
    staleSources: number;
    readySources: number;
    maxLagMinutes: number;
  };
  sources: Array<{
    id: string;
    source: string;
    system: string;
    status: SystemHealth;
    lastSeenAt: string;
    lagMinutes: number | null;
    expectedCadenceMinutes: number;
    owner: string;
    detail: string;
  }>;
  breaches: Array<{ id: string; source: string; detail: string; lagMinutes: number | null }>;
}

export interface WorkersSummary {
  contractVersion: string;
  generatedAt: string;
  health: SystemHealth;
  summary: {
    workers: number;
    ready: number;
    watch: number;
    failed: number;
    failures24h: number;
  };
  workers: Array<{
    id: string;
    name: string;
    owner: string;
    status: SystemHealth;
    lastRunAt: string;
    nextRunAt: string;
    durationSeconds: number;
    failures24h: number;
    detail: string;
  }>;
  actions: Array<{ id: string; label: string; approval: string; description: string }>;
}

export interface SystemSeries {
  generatedAt: string;
  window: WarehouseWindow;
  historyStatus: string;
  points: Array<Record<string, number | string>>;
}

export interface StorageSnapshot {
  summary: StorageSummary;
  series: SystemSeries;
}

export interface FreshnessSnapshot {
  summary: FreshnessSummary;
  series: SystemSeries;
}

export interface WorkersSnapshot {
  summary: WorkersSummary;
  series: SystemSeries;
}

export async function fetchStorageSnapshot(window: WarehouseWindow = "24h"): Promise<StorageSnapshot> {
  const [summary, series] = await Promise.all([
    fetchJSON<StorageSummary>("/api/system/storage/summary"),
    fetchJSON<SystemSeries>(`/api/system/storage/series?window=${encodeURIComponent(window)}`),
  ]);
  return { summary, series };
}

export async function fetchFreshnessSnapshot(window: WarehouseWindow = "24h"): Promise<FreshnessSnapshot> {
  const [summary, series] = await Promise.all([
    fetchJSON<FreshnessSummary>("/api/system/freshness/summary"),
    fetchJSON<SystemSeries>(`/api/system/freshness/series?window=${encodeURIComponent(window)}`),
  ]);
  return { summary, series };
}

export async function fetchWorkersSnapshot(window: WarehouseWindow = "24h"): Promise<WorkersSnapshot> {
  const [summary, series] = await Promise.all([
    fetchJSON<WorkersSummary>("/api/system/workers/summary"),
    fetchJSON<SystemSeries>(`/api/system/workers/series?window=${encodeURIComponent(window)}`),
  ]);
  return { summary, series };
}

export function runStorageScan(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/system/storage/scan", { method: "POST" });
}

export function runFreshnessCheck(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/system/freshness/check", { method: "POST" });
}

export function runWorkerDryRun(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>("/api/system/workers/dry-run", { method: "POST" });
}

export function systemHealthTone(health: string): "success" | "warning" | "critical" | "info" {
  if (health === "ready") return "success";
  if (health === "critical" || health === "blocked" || health === "failed") return "critical";
  if (health === "warning" || health === "partial" || health === "watch") return "warning";
  return "info";
}
