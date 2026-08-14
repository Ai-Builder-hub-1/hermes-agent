#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const projectFilter = valueAfter("--project");
const dryRun = args.includes("--dry-run");

const sourceFiles = [
  ["packages/hermes-dashboard-kit/src/index.js", "vendor/hermes-dashboard-kit/src/index.js"],
  ["packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css", "vendor/hermes-dashboard-kit/static/hermes-dashboard-kit.css"]
];

const servedCssTargets = new Map([
  ["media-engine", ["core/operations/hermes-dashboard-kit.css"]],
  ["media-business-os", ["public/dashboard/hermes-dashboard-kit.css"]],
  ["business-mapper", ["business_mapper/static/hermes-dashboard-kit.css"]],
  ["tlc-capital-group-os", ["public/dashboard/hermes-dashboard-kit.css"]],
  ["rinseables-os", ["public/dashboard/hermes-dashboard-kit.css"]],
  ["investing-system", ["public/roc/hermes-dashboard-kit.css"]]
]);

const registry = readJson(registryPath);
const projects = (registry.projects ?? []).filter((project) => !projectFilter || project.id === projectFilter);
const copied = [];
const skipped = [];

for (const project of projects) {
  const projectRoot = path.resolve(root, project.path);
  if (!fs.existsSync(projectRoot)) {
    skipped.push({ project: project.id, reason: "project path missing" });
    continue;
  }
  const vendorRoot = path.join(projectRoot, "vendor/hermes-dashboard-kit");
  if (!fs.existsSync(vendorRoot)) {
    skipped.push({ project: project.id, reason: "no vendor/hermes-dashboard-kit directory" });
    continue;
  }
  for (const [sourceRel, targetRel] of sourceFiles) {
    const source = path.join(root, sourceRel);
    const target = path.join(projectRoot, targetRel);
    if (!fs.existsSync(source)) {
      skipped.push({ project: project.id, reason: `source missing: ${sourceRel}` });
      continue;
    }
    if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
    const before = fs.existsSync(target) ? sha(target) : null;
    const after = sha(source);
    if (before === after) {
      skipped.push({ project: project.id, reason: `${targetRel} already current` });
      continue;
    }
    if (!dryRun) fs.copyFileSync(source, target);
    copied.push({ project: project.id, file: targetRel, hash: after.slice(0, 12) });
  }
  for (const targetRel of servedCssTargets.get(project.id) ?? []) {
    const source = path.join(root, "packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css");
    const target = path.join(projectRoot, targetRel);
    if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
    const before = fs.existsSync(target) ? sha(target) : null;
    const after = sha(source);
    if (before === after) {
      skipped.push({ project: project.id, reason: `${targetRel} already current` });
      continue;
    }
    if (!dryRun) fs.copyFileSync(source, target);
    copied.push({ project: project.id, file: targetRel, hash: after.slice(0, 12), served: true });
  }
}

console.log(JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  dryRun,
  copied,
  skipped
}, null, 2));

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
