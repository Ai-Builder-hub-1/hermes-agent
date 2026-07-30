#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const registry = readJson(registryPath);
const failures = [];
const reportPath = path.join(root, "docs/design/dashboard-bridge-coverage-report.json");
const items = [];

for (const project of registry.projects ?? []) {
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = readJson(manifestPath);
  const projectRoot = path.resolve(root, project.path);
  for (const surface of manifest.surfaces ?? []) {
    if (surface.status === "planned") continue;
    const surfacePath = path.resolve(projectRoot, surface.path);
    if (!fs.existsSync(surfacePath)) {
      failures.push(`${project.id}/${surface.id}: missing ${surface.path}`);
      items.push({
        project: project.id,
        surface: surface.id,
        path: surface.path,
        status: "fail",
        missing: ["surface-file"]
      });
      continue;
    }
    const content = fs.readFileSync(surfacePath, "utf8");
    const missing = [];
    if (!content.includes("visual-selection-bridge.js")) {
      failures.push(`${project.id}/${surface.id}: missing visual-selection-bridge.js`);
      missing.push("visual-selection-bridge.js");
    }
    if (!content.includes("data-review-id=")) {
      failures.push(`${project.id}/${surface.id}: missing data-review-id handles`);
      missing.push("data-review-id");
    }
    items.push({
      project: project.id,
      surface: surface.id,
      path: surface.path,
      status: missing.length ? "fail" : "pass",
      missing
    });
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checkedCount: items.length,
  missingCount: failures.length,
  items
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`Dashboard visual-selection bridge coverage failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Wrote report: ${path.relative(root, reportPath)}`);
  process.exit(1);
}

console.log("Dashboard visual-selection bridge coverage passed.");
console.log(`Wrote report: ${path.relative(root, reportPath)}`);
