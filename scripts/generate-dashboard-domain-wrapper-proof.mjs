#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { designDir, markdownTable, root, writeJson, writeMarkdown } from "./dashboard-report-utils.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");
const registryPath = path.join(designDir, "dashboard-domain-library-registry.json");
const sourceDir = path.join(root, "packages/hermes-dashboard-kit/src");
const jsonPath = path.join(designDir, "dashboard-domain-wrapper-proof-report.json");
const mdPath = path.join(designDir, "dashboard-domain-wrapper-proof-report.md");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

if (!fs.existsSync(registryPath)) {
  console.error(`Missing registry: ${path.relative(root, registryPath)}`);
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Missing wrapper source directory: ${path.relative(root, sourceDir)}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const source = walk(sourceDir)
  .filter((file) => /\.(ts|tsx|js)$/.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const wrapperReports = [];
for (const domain of registry.domains ?? []) {
  for (const wrapper of domain.approvedWrappers ?? []) {
    const hasExport = new RegExp(`export function ${wrapper}\\b`).test(source);
    const hasComponentMarker = source.includes(`component="${wrapper}"`) || source.includes(`component = "${wrapper}"`) || source.includes(`component: "${wrapper}"`);
    const hasDomainMarker = source.includes(`domain="${domain.id}"`) || source.includes(`"${domain.id}"`);
    const hasLibraryMarker = source.includes(`library="${domain.defaultLibrary}"`) || source.includes(`"${domain.defaultLibrary}"`);
    const hasProofSignals = includesAll(source, domain.requiredProof ?? []);
    const missing = [
      !hasExport ? "export" : null,
      !hasComponentMarker ? "component-marker" : null,
      !hasDomainMarker ? "domain-marker" : null,
      !hasLibraryMarker ? "library-marker" : null,
      !hasProofSignals ? "proof-signals" : null
    ].filter(Boolean);
    wrapperReports.push({
      domain: domain.id,
      wrapper,
      library: domain.defaultLibrary,
      status: missing.length ? "incomplete" : "proof-ready",
      hasExport,
      hasComponentMarker,
      hasDomainMarker,
      hasLibraryMarker,
      hasProofSignals,
      missing
    });
  }
}

const proofReadyCount = wrapperReports.filter((item) => item.status === "proof-ready").length;
const incompleteCount = wrapperReports.length - proofReadyCount;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Validates that every approved domain wrapper has an exported component, component marker, domain marker, library marker, and proof-signal contract.",
  wrapperCount: wrapperReports.length,
  proofReadyCount,
  incompleteCount,
  proofReadinessPercent: Math.round((proofReadyCount / Math.max(wrapperReports.length, 1)) * 100),
  wrappers: wrapperReports
};

if (write) {
  writeJson(jsonPath, report);
  writeMarkdown(mdPath, `# Dashboard Domain Wrapper Proof Report

Generated: ${report.generatedAt}

Proof readiness: ${report.proofReadinessPercent}%

${markdownTable(
  ["Domain", "Wrapper", "Library", "Status", "Missing"],
  wrapperReports.map((item) => [item.domain, item.wrapper, item.library, item.status, item.missing.join(", ") || "none"])
)}
`);
}

console.log(`Dashboard domain wrapper proof: ${proofReadyCount} proof-ready, ${incompleteCount} incomplete, ${report.proofReadinessPercent}% readiness.`);
if (write) console.log(`Wrote ${path.relative(root, jsonPath)} and ${path.relative(root, mdPath)}`);
if (strict && incompleteCount > 0) process.exit(1);
