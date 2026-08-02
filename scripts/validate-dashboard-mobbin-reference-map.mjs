#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mapPath = path.join(root, "docs/design/dashboard-mobbin-reference-map.json");
const seedPath = path.join(root, "docs/design/mobbin-reference-automation-seed.json");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(mapPath)) issue("error", "Mobbin reference map is missing.");
if (!fs.existsSync(seedPath)) issue("error", "Mobbin seed references are missing.");

if (!issues.some((item) => item.severity === "error")) {
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const seedIds = new Set((seed.references ?? []).map((reference) => reference.id));
  if (map.version !== "V11") issue("error", "Mobbin reference map must declare version V11.");
  if (!map.refreshMetadata?.lastSearchedAt || !map.refreshMetadata?.nextRefreshAt) issue("error", "Mobbin reference map missing refresh metadata.");
  if ((map.references ?? []).length < 5) issue("error", "Mobbin reference map must cover the initial reference set.");
  for (const reference of map.references ?? []) {
    if (!seedIds.has(reference.id)) issue("error", "Mobbin reference map points at an unknown seed reference.", reference.id);
    if (!(reference.patterns ?? []).length) issue("error", "Mobbin reference missing patterns.", reference.id);
    if (!reference.lastSearchedAt || !reference.query) issue("error", "Mobbin reference missing refresh metadata.", reference.id);
    if ((reference.usefulFor ?? []).length < 2) issue("error", "Mobbin reference missing useful extraction notes.", reference.id);
    if ((reference.doNotCopy ?? []).length < 1) issue("error", "Mobbin reference missing do-not-copy notes.", reference.id);
    if (!reference.kaoshiAdaptation) issue("error", "Mobbin reference missing Kaoshi adaptation.", reference.id);
  }
  for (const rule of ["Search by pattern and task, not broad category.", "References are evidence, not source-of-truth design."]) {
    if (!(map.rules ?? []).includes(rule)) issue("error", "Mobbin reference map is missing a required rule.", rule);
  }
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard Mobbin reference map validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
