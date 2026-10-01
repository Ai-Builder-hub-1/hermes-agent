#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "docs/plans/cross-project-storage-proof-registry.json");
const markdownPath = path.join(repoRoot, "docs/plans/cross-project-storage-proof-registry.md");

function fail(message) {
  console.error(`storage proof registry validation failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(registryPath)) fail(`missing ${registryPath}`);
if (!fs.existsSync(markdownPath)) fail(`missing ${markdownPath}`);

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const markdown = fs.readFileSync(markdownPath, "utf8");

if (registry.canonicalPlan !== "CP-04") fail("registry must map to CP-04");
if (!Array.isArray(registry.projects) || registry.projects.length < 2) fail("registry must include at least Investing and Khashi");
for (const id of ["investing-system", "khashi-vc"]) {
  const project = registry.projects.find((candidate) => candidate.id === id);
  if (!project) fail(`missing project ${id}`);
  if (!fs.existsSync(project.reportPath)) fail(`${id} report path missing: ${project.reportPath}`);
  if (!markdown.includes(project.label)) fail(`${id} missing from markdown`);
  if (!project.canonicalPlan || project.canonicalPlan !== "CP-04") fail(`${id} must map to CP-04`);
  if (!project.nextAction) fail(`${id} missing nextAction`);
}
if (!registry.nextActions?.length) fail("registry must include nextActions");

if (!process.exitCode) {
  console.log(`storage proof registry validation passed: ${registry.projects.length} projects, status ${registry.status}`);
}
