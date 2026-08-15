#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registry = readJsonIfExists("hermes.dashboards.json");
const platform = readJsonIfExists(".hermes-dashboard-platform.json");
const dashboard = registry?.dashboards?.[0] ?? {};
const url =
  process.env.DASHBOARD_PROOF_URL ||
  dashboard.url ||
  platform?.productionUrl;

if (!url) {
  console.error("No dashboard URL available for proof capture.");
  process.exit(1);
}

const startedAt = Date.now();
const response = await fetch(url, {
  signal:
    AbortSignal.timeout(15000)
});
const text =
  await response.text();
const contentType =
  response.headers.get("content-type") || "";
const markers = [
  "data-component=\"DashboardShell\"",
  "data-hdk-component",
  "hdk-",
  "dashboard",
  "Dashboard"
];
const matchedMarkers =
  markers.filter((marker) => text.includes(marker));
const proof = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectId: platform?.projectId || "unknown",
  dashboardId: platform?.dashboardId || dashboard.id || "unknown",
  url,
  status: response.status,
  ok: response.ok,
  contentType,
  bytes: Buffer.byteLength(text),
  elapsedMs: Date.now() - startedAt,
  matchedMarkers,
  proofStates: platform?.proofStates || [],
  result:
    response.ok && matchedMarkers.length > 0 ? "passed" : "failed"
};

fs.mkdirSync(path.join(root, "docs/design"), {
  recursive:
    true
});
fs.writeFileSync(
  path.join(root, "docs/design/dashboard-platform-proof.json"),
  `${JSON.stringify(proof, null, 2)}\n`
);
console.log(JSON.stringify(proof, null, 2));
if (proof.result !== "passed") process.exitCode = 1;

function readJsonIfExists(relativePath) {
  const file =
    path.join(root, relativePath);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
