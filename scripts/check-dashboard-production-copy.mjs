#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const forbidden = ["prototype preview", "mock data", "sample data", "placeholder data", "placeholder chart", "lorem ipsum"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const registry = readJson(registryPath);
const failures = [];

for (const project of registry.projects ?? []) {
  const manifestPath = path.resolve(root, project.manifest);
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = readJson(manifestPath);
  const projectRoot = path.resolve(root, project.path);
  for (const surface of manifest.surfaces ?? []) {
    if (surface.status === "prototype" || surface.status === "planned") continue;
    const surfacePath = path.resolve(projectRoot, surface.path);
    if (!fs.existsSync(surfacePath)) continue;
    const content = fs.readFileSync(surfacePath, "utf8").toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase)) {
        failures.push(`${project.id}/${surface.id}: contains "${phrase}" in ${surface.path}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Production dashboard copy check failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production dashboard copy check passed.");
