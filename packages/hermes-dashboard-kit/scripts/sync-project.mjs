#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const args = process.argv.slice(2);
const projectId = valueAfter("--project");
const all = args.includes("--all");

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (!projectId && !all) {
  console.error("Usage: node packages/hermes-dashboard-kit/scripts/sync-project.mjs --project <id> | --all");
  process.exit(1);
}

const registry = readJson(registryPath);
const sourcePath = path.resolve(root, registry.source.cssPath);
if (!fs.existsSync(sourcePath)) {
  console.error(`Missing canonical CSS: ${registry.source.cssPath}`);
  process.exit(1);
}

const sourceHash = hash(sourcePath);
const projects = (registry.projects ?? []).filter((project) => all || project.id === projectId);
if (!projects.length) {
  console.error(`No matching project found for ${projectId}`);
  process.exit(1);
}

for (const project of projects) {
  const projectRoot = path.resolve(root, project.path);
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(projectRoot)) {
    console.log(`Skipping ${project.id}: project path missing (${project.path})`);
    continue;
  }
  if (!fs.existsSync(manifestPath)) {
    console.log(`Skipping ${project.id}: manifest missing (${project.manifest})`);
    continue;
  }

  const manifest = readJson(manifestPath);
  const adapterPath = manifest.dashboardKit?.staticAdapterPath
    ? path.resolve(projectRoot, manifest.dashboardKit.staticAdapterPath)
    : project.adapterTarget
      ? path.resolve(root, project.adapterTarget)
      : null;

  if (adapterPath && manifest.dashboardKit?.adoptionMode !== "package-native" && manifest.dashboardKit?.adoptionMode !== "planned") {
    fs.mkdirSync(path.dirname(adapterPath), { recursive: true });
    fs.copyFileSync(sourcePath, adapterPath);
    console.log(`Synced ${project.id}: ${path.relative(root, adapterPath)}`);
  }

  manifest.dashboardKit = {
    ...manifest.dashboardKit,
    requiredVersion: registry.source.minimumRequiredVersion,
    canonicalCssHash: sourceHash,
    lastSyncedAt: new Date().toISOString()
  };
  writeJson(manifestPath, manifest);
  console.log(`Updated ${project.id} manifest: ${path.relative(root, manifestPath)}`);
}
