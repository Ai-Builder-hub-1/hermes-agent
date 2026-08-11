#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fleetPath = path.join(root, "docs/fleet/fleet-registry.json");
const outputPath = path.join(root, "docs/design/dashboard-monitoring-registry.json");
const args = process.argv.slice(2);
const projectFilter = valueAfter("--project") ?? valueAfter("--id") ?? null;
const timeoutMs = Number(valueAfter("--timeout-ms") ?? 8000);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function fetchCheck(url, { expectJson = false } = {}) {
  if (!url) return { ok: false, status: null, ms: 0, error: "missing_url" };
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") ?? "";
    let parsed = false;
    if (expectJson && contentType.includes("json")) {
      await response.clone().json();
      parsed = true;
    }
    return {
      ok: response.ok && (!expectJson || parsed || !contentType.includes("json")),
      status: response.status,
      ms: Date.now() - started,
      contentType
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

const fleet = readJson(fleetPath, { projects: [] });
const previous = readJson(outputPath, { entries: [] });
const previousByProject = new Map((previous.entries ?? []).map((entry) => [entry.projectId, entry]));
const projects = (fleet.projects ?? []).filter((project) => !projectFilter || project.id === projectFilter);
const checkedAt = new Date().toISOString();

const checkedEntries = [];
for (const project of projects) {
  const prior = previousByProject.get(project.id) ?? {};
  const health = await fetchCheck(project.production?.healthUrl, { expectJson: true });
  const snapshot = await fetchCheck(project.production?.snapshotUrl, { expectJson: true });
  const passed = health.ok && snapshot.ok;
  checkedEntries.push({
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    status: passed ? "current" : "declared",
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    alertOwner: prior.alertOwner ?? project.ownerSystem ?? null,
    requiredSignals: prior.requiredSignals ?? [
      "health endpoint status",
      "snapshot freshness",
      "primary dashboard proof freshness",
      "deployment promotion status",
      "error rate or failure count"
    ],
    latestCheck: {
      status: passed ? "passed" : "failed",
      capturedAt: checkedAt,
      checks: { health, snapshot }
    },
    recommendedFix: passed
      ? null
      : "Repair failing health/snapshot checks, then rerun dashboard:monitoring:check."
  });
}

const nextEntries = (fleet.projects ?? []).map((project) =>
  checkedEntries.find((entry) => entry.projectId === project.id) ??
  previousByProject.get(project.id) ?? {
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    status: "missing",
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    alertOwner: project.ownerSystem ?? null,
    requiredSignals: [
      "health endpoint status",
      "snapshot freshness",
      "primary dashboard proof freshness",
      "deployment promotion status",
      "error rate or failure count"
    ],
    latestCheck: null,
    recommendedFix: "Connect dashboard health/snapshot signals to a monitoring job and persist latestCheck evidence."
  }
);

writeJson(outputPath, {
  schemaVersion: 1,
  generatedAt: checkedAt,
  purpose: "Dashboard monitoring evidence registry for production health, freshness, and alert ownership.",
  statusMeaning: {
    current: "Monitoring is connected and latestCheck evidence is present.",
    declared: "Health/snapshot contracts exist, but no monitoring check evidence is recorded or the latest check failed.",
    missing: "The project lacks enough health/snapshot contract evidence for monitoring."
  },
  entries: nextEntries
});

const failures = checkedEntries.filter((entry) => entry.latestCheck.status !== "passed");
console.log(`Checked ${checkedEntries.length} monitoring target(s): ${checkedEntries.length - failures.length} passed, ${failures.length} failed.`);
for (const entry of failures) {
  console.log(`fail ${entry.projectId}: health=${entry.latestCheck.checks.health.status ?? entry.latestCheck.checks.health.error} snapshot=${entry.latestCheck.checks.snapshot.status ?? entry.latestCheck.checks.snapshot.error}`);
}
