#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const live = process.argv.includes("--live");
const registryPath = path.join(root, "hermes.dashboards.json");
const outputPath = path.join(root, live ? "docs/design/dashboard-live-health-report.json" : "docs/design/dashboard-health-report.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(registryPath)) {
  console.error("Missing hermes.dashboards.json.");
  process.exit(1);
}

const registry = readJson(registryPath);
const items = [];

for (const dashboard of registry.dashboards ?? []) {
  const hasHealth = Boolean(dashboard.healthUrl);
  const item = {
    id: dashboard.id,
    label: dashboard.label,
    healthUrl: dashboard.healthUrl,
    status: hasHealth ? "declared" : "missing-health-url"
  };
  if (live && hasHealth) {
    try {
      const response = await fetch(dashboard.healthUrl, { method: "GET" });
      item.httpStatus = response.status;
      item.status = response.ok ? "ok" : "http-error";
    } catch (error) {
      item.status = "unreachable";
      item.error = error instanceof Error ? error.message : String(error);
    }
  }
  items.push(item);
}

const failed = items.filter((item) => live ? item.status !== "ok" : item.status !== "declared");
fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: live ? "live" : "declared",
  checkedCount: items.length,
  failedCount: failed.length,
  items
}, null, 2)}\n`);

if (failed.length) {
  console.error(`Dashboard health validation failed (${failed.length})`);
  for (const item of failed) console.error(`- ${item.id}: ${item.status}`);
  process.exit(1);
}

console.log(`Dashboard health validation passed (${items.length}).`);
