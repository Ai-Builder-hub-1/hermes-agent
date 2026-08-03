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

function linkedCssContent(content, file, projectRoot, manifest) {
  const chunks = [];
  const linkPattern = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi;
  for (const match of content.matchAll(linkPattern)) {
    const href = match[1].split("?")[0];
    const relativeHref = href.startsWith("/") ? href.slice(1) : href;
    const candidates = [
      path.resolve(path.dirname(file), relativeHref),
      path.resolve(projectRoot, relativeHref),
      path.resolve(projectRoot, relativeHref.replace(/^static\//, "business_mapper/static/")),
      path.resolve(projectRoot, relativeHref.replace(/^dashboard\//, "public/dashboard/")),
      path.resolve(projectRoot, relativeHref.replace(/^dashboard\//, "public/roc/")),
    ];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (found) chunks.push(fs.readFileSync(found, "utf8"));
  }
  if (manifest.dashboardKit?.staticAdapterPath) {
    const adapter = path.resolve(projectRoot, manifest.dashboardKit.staticAdapterPath);
    if (fs.existsSync(adapter)) chunks.push(fs.readFileSync(adapter, "utf8"));
  }
  return chunks.join("\n");
}

function stripBenignPlaceholderAttributes(content) {
  return content.replace(/\splaceholder=(["']).*?\1/gi, "");
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
    const scoredContent = `${content}\n${linkedCssContent(content, file, projectRoot, manifest)}`;
    const fillerContent = stripBenignPlaceholderAttributes(scoredContent);
    const checks = [
      { id: "review-handles", passed: scoredContent.includes("data-review-id=") },
      { id: "selection-bridge", passed: scoredContent.includes("visual-selection-bridge.js") },
      { id: "states", passed: hasAny(scoredContent, ["empty", "loading", "error", "stale", "readiness"]) },
      { id: "responsive", passed: hasAny(scoredContent, ["@media", "minmax(", "clamp("]) },
      { id: "chart-language", passed: hasAny(scoredContent, ["chart", "spark", "heatmap", "drawer", "tape", "graph", "map", "roadmap", "table", "queue"]) },
      { id: "not-placeholder", passed: !hasAny(fillerContent, ["lorem ipsum", "prototype preview", "placeholder copy"]) }
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
