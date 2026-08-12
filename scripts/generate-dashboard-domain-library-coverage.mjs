#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");
const registryPath = path.join(designDir, "dashboard-domain-library-registry.json");
const kitSrc = path.join(root, "packages/hermes-dashboard-kit/src");
const jsonPath = path.join(designDir, "dashboard-domain-library-coverage-report.json");
const mdPath = path.join(designDir, "dashboard-domain-library-coverage-report.md");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function implementedSymbols() {
  const symbols = new Set();
  for (const file of walk(kitSrc)) {
    if (!/\.(js|ts|tsx)$/.test(file)) continue;
    const text = readText(file);
    for (const pattern of [
      /export function ([A-Z][A-Za-z0-9]+)/g,
      /export const ([A-Z][A-Za-z0-9]+)/g,
      /function ([A-Z][A-Za-z0-9]+)/g,
      /data-hdk-component="([A-Z][A-Za-z0-9]+)"/g,
      /data-component="([A-Z][A-Za-z0-9]+)"/g
    ]) {
      for (const match of text.matchAll(pattern)) symbols.add(match[1]);
    }
  }
  return symbols;
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing registry: ${path.relative(root, registryPath)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const symbols = implementedSymbols();
const domainReports = (registry.domains ?? []).map((domain) => {
  const wrappers = domain.approvedWrappers ?? [];
  const implementedWrappers = wrappers.filter((wrapper) => symbols.has(wrapper) || symbols.has(wrapper.replace(/^Financial/, "")));
  const missingWrappers = wrappers.filter((wrapper) => !implementedWrappers.includes(wrapper));
  const coveragePercent = wrappers.length ? Math.round((implementedWrappers.length / wrappers.length) * 100) : 0;
  return {
    id: domain.id,
    label: domain.label,
    defaultLibrary: domain.defaultLibrary,
    wrapperCount: wrappers.length,
    implementedCount: implementedWrappers.length,
    missingCount: missingWrappers.length,
    coveragePercent,
    implementedWrappers,
    missingWrappers,
    status: missingWrappers.length === 0 ? "covered" : implementedWrappers.length > 0 ? "partial" : "missing"
  };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Shows whether approved domain-library wrapper names exist in @hermes/dashboard-kit source. Registry approval is not the same as implementation.",
  domainCount: domainReports.length,
  coveredDomainCount: domainReports.filter((domain) => domain.status === "covered").length,
  partialDomainCount: domainReports.filter((domain) => domain.status === "partial").length,
  missingDomainCount: domainReports.filter((domain) => domain.status === "missing").length,
  averageCoveragePercent: Math.round(domainReports.reduce((sum, domain) => sum + domain.coveragePercent, 0) / Math.max(domainReports.length, 1)),
  domains: domainReports
};

if (write) {
  writeJson(jsonPath, report);
  writeMarkdown(mdPath, `# Dashboard Domain Library Coverage Report

Generated: ${report.generatedAt}

This report distinguishes registry approval from actual dashboard-kit implementation. A missing wrapper means projects still lack a package-native primitive for that domain.

${markdownTable(
  ["Domain", "Default", "Status", "Coverage", "Implemented", "Missing"],
  domainReports.map((domain) => [
    domain.label,
    domain.defaultLibrary,
    domain.status,
    `${domain.coveragePercent}%`,
    domain.implementedWrappers.join(", ") || "none",
    domain.missingWrappers.join(", ") || "none"
  ])
)}

## Required Next Work

- Implement missing wrappers inside \`packages/hermes-dashboard-kit/src\`.
- Add each wrapper to \`packages/hermes-dashboard-kit/src/index.ts\` or the static renderer export surface when applicable.
- Add visual proof for each domain before downstream projects claim T3C.
`);
}

console.log(`Dashboard domain library coverage: ${report.coveredDomainCount} covered, ${report.partialDomainCount} partial, ${report.missingDomainCount} missing, ${report.averageCoveragePercent}% average.`);
if (write) {
  console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
}
if (strict && report.missingDomainCount > 0) process.exit(1);
