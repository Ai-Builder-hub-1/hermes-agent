#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const projectId = valueAfter("--project");
const surfaceId = valueAfter("--surface");

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!projectId || !surfaceId) {
  console.error("Usage: node packages/hermes-dashboard-kit/scripts/migrate-surface.mjs --project <id> --surface <surface-id>");
  process.exit(1);
}

const registry = readJson(registryPath);
const project = (registry.projects ?? []).find((candidate) => candidate.id === projectId);
if (!project) {
  console.error(`Unknown project: ${projectId}`);
  process.exit(1);
}

const projectRoot = path.resolve(root, project.path);
const manifestPath = path.resolve(root, project.manifest);
if (!fs.existsSync(manifestPath)) {
  console.error(`Missing manifest: ${project.manifest}`);
  process.exit(1);
}

const manifest = readJson(manifestPath);
const surface = (manifest.surfaces ?? []).find((candidate) => candidate.id === surfaceId);
if (!surface) {
  console.error(`Surface ${surfaceId} is not listed in ${project.manifest}`);
  process.exit(1);
}

const surfacePath = path.resolve(projectRoot, surface.path);
const content = fs.existsSync(surfacePath) ? fs.readFileSync(surfacePath, "utf8") : "";
const legacyHits = (registry.legacyPatterns ?? []).filter((pattern) => content.toLowerCase().includes(pattern.pattern.toLowerCase()));

const plan = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  project: project.id,
  surface: surface.id,
  file: path.relative(root, surfacePath),
  targetMode: "package-native or controlled static adapter",
  requiredComponents: surface.requiredComponents ?? [],
  requiredMarkers: surface.markers ?? [],
  legacyHits: legacyHits.map((hit) => ({ id: hit.id, severity: hit.severity, message: hit.message })),
  migrationSteps: [
    "Confirm the surface imports or serves hermes-dashboard-kit static CSS.",
    "Replace local shell/sidebar/card/table primitives with .hdk-shell, .hdk-sidebar, .hdk-card, .hdk-table, and related kit classes where the behavior is not project-specific.",
    "Replace one-off chart functions with kit-backed chart surfaces or package-native React components.",
    "Preserve project data fetching, auth, pagination, and domain-specific controls.",
    "Preserve data-review-id attributes and visual-selection-bridge loading.",
    "Run dashboard-kit adoption audit in strict mode.",
    "Run the downstream project's build/test command before deploy."
  ]
};

console.log(JSON.stringify(plan, null, 2));
