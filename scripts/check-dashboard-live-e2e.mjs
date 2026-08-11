#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fleetPath = path.join(root, "docs/fleet/fleet-registry.json");
const outputPath = path.join(root, "docs/design/dashboard-live-e2e-registry.json");
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

async function fetchCheck(url, { auth = false, expectJson = false } = {}) {
  if (!url) return { ok: false, status: null, ms: 0, error: "missing_url" };
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = {};
  if (auth && process.env.HERMES_DASHBOARD_PROOF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HERMES_DASHBOARD_PROOF_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
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
  const proof = await fetchCheck(project.production?.proofUrl, { auth: true });
  const snapshot = await fetchCheck(project.production?.snapshotUrl, { expectJson: true });
  const passed = health.ok && proof.ok && snapshot.ok;
  checkedEntries.push({
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    scenarioId: prior.scenarioId ?? `${project.id}.primary-operator-flow`,
    status: passed ? "current" : "declared",
    route: project.production?.url ?? null,
    proofUrl: project.production?.proofUrl ?? null,
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    requiredAssertions: prior.requiredAssertions ?? [
      "primary route loads",
      "readonly proof route loads",
      "snapshot or outcome feed returns data",
      "primary empty/error/stale state is visible when data is unavailable",
      "no blank primary region"
    ],
    latestRun: {
      status: passed ? "passed" : "failed",
      capturedAt: checkedAt,
      checks: { health, proof, snapshot }
    },
    recommendedFix: passed
      ? null
      : "Repair failing health/proof/snapshot checks, then rerun dashboard:live-e2e:check."
  });
}

const nextEntries = (fleet.projects ?? []).map((project) =>
  checkedEntries.find((entry) => entry.projectId === project.id) ??
  previousByProject.get(project.id) ?? {
    schemaVersion: 1,
    projectId: project.id,
    label: project.name,
    scenarioId: `${project.id}.primary-operator-flow`,
    status: "missing",
    route: project.production?.url ?? null,
    proofUrl: project.production?.proofUrl ?? null,
    healthUrl: project.production?.healthUrl ?? null,
    snapshotUrl: project.production?.snapshotUrl ?? null,
    requiredAssertions: [
      "primary route loads",
      "readonly proof route loads",
      "snapshot or outcome feed returns data",
      "primary empty/error/stale state is visible when data is unavailable",
      "no blank primary region"
    ],
    latestRun: null,
    recommendedFix: "Add a Playwright or API-backed live E2E run and persist latestRun status/capturedAt evidence."
  }
);

writeJson(outputPath, {
  schemaVersion: 1,
  generatedAt: checkedAt,
  purpose: "Live E2E evidence registry for primary production dashboard workflows.",
  statusMeaning: {
    current: "A recent live E2E run passed and latestRun evidence is present.",
    declared: "The route/proof/snapshot contract exists, but no recent live E2E run is recorded or the latest run failed.",
    missing: "The project lacks enough route/proof/snapshot contract evidence to run live E2E."
  },
  entries: nextEntries
});

const failures = checkedEntries.filter((entry) => entry.latestRun.status !== "passed");
console.log(`Checked ${checkedEntries.length} live E2E scenario(s): ${checkedEntries.length - failures.length} passed, ${failures.length} failed.`);
for (const entry of failures) {
  console.log(`fail ${entry.projectId}: health=${entry.latestRun.checks.health.status ?? entry.latestRun.checks.health.error} proof=${entry.latestRun.checks.proof.status ?? entry.latestRun.checks.proof.error} snapshot=${entry.latestRun.checks.snapshot.status ?? entry.latestRun.checks.snapshot.error}`);
}
