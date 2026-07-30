#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const outputPath = path.join(root, "docs/design/dashboard-visual-quality-report.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hasAny(content, terms) {
  const lower = content.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

const registry = readJson(registryPath);
const items = [];

for (const project of registry.projects ?? []) {
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = readJson(manifestPath);
  const projectRoot = path.resolve(root, project.path);
  for (const surface of manifest.surfaces ?? []) {
    const file = path.resolve(projectRoot, surface.path);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    const checks = [
      { id: "review-handles", passed: content.includes("data-review-id=") },
      { id: "selection-bridge", passed: content.includes("visual-selection-bridge.js") },
      { id: "states", passed: hasAny(content, ["empty", "loading", "error", "stale", "readiness"]) },
      { id: "responsive", passed: hasAny(content, ["@media", "minmax(", "clamp("]) },
      { id: "chart-language", passed: hasAny(content, ["chart", "spark", "heatmap", "drawer", "tape"]) },
      { id: "not-placeholder", passed: !hasAny(content, ["lorem ipsum", "placeholder"]) }
    ];
    const score = Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
    items.push({
      project: project.id,
      surface: surface.id,
      path: surface.path,
      score,
      status: score >= 85 ? "pass" : "needs-review",
      checks
    });
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  note: "This is a heuristic quality gate. Human/Mobbin review is still required for premium visual taste.",
  items
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)}`);
