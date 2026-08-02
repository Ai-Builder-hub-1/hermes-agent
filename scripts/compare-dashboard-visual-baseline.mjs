#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const baselineDir = path.resolve(process.cwd(), args.baseline || "proof/dashboard-baseline/approved");
const currentDir = path.resolve(process.cwd(), args.current || "proof/dashboard-baseline/current");
const out = path.resolve(process.cwd(), args.out || "proof/dashboard-baseline/visual-regression-report.json");

const baselineManifest = readManifest(baselineDir);
const currentManifest = readManifest(currentDir);
const findings = [];

for (const baselineShot of baselineManifest.screenshots ?? []) {
  const currentShot = (currentManifest.screenshots ?? []).find((shot) => shot.viewport === baselineShot.viewport && shot.theme === baselineShot.theme);
  if (!currentShot) {
    findings.push(finding("error", "visual.currentMissing", `Missing current screenshot for ${baselineShot.viewport}/${baselineShot.theme}`));
    continue;
  }
  const baselineFile = path.join(baselineDir, baselineShot.file);
  const currentFile = path.join(currentDir, currentShot.file);
  if (!fs.existsSync(baselineFile)) {
    findings.push(finding("error", "visual.baselineFileMissing", `Missing baseline file ${baselineShot.file}`));
    continue;
  }
  if (!fs.existsSync(currentFile)) {
    findings.push(finding("error", "visual.currentFileMissing", `Missing current file ${currentShot.file}`));
    continue;
  }
  const baselineHash = hash(baselineFile);
  const currentHash = hash(currentFile);
  const baselineSize = fs.statSync(baselineFile).size;
  const currentSize = fs.statSync(currentFile).size;
  const sizeDelta = baselineSize === 0 ? 100 : Math.round(Math.abs(currentSize - baselineSize) / baselineSize * 100);
  const overflow = Number(currentShot.horizontalOverflow ?? 0);
  if (overflow > 2) findings.push(finding("error", "visual.overflow", `${currentShot.viewport}/${currentShot.theme} has ${overflow}px horizontal overflow`));
  if (baselineHash !== currentHash && sizeDelta > Number(args.sizeDeltaThreshold || 8)) {
    findings.push(finding("warning", "visual.changed", `${currentShot.viewport}/${currentShot.theme} changed ${sizeDelta}% by file size; review screenshot before approving`, {
      baseline: baselineShot.file,
      current: currentShot.file,
      baselineHash,
      currentHash,
      sizeDelta
    }));
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: findings.some((item) => item.severity === "error") ? "fail" : findings.length ? "needs-review" : "pass",
  baselineDir,
  currentDir,
  findings
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Visual regression compare: ${report.status}`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
if (args.strict === "true" && report.status !== "pass") process.exit(1);

function readManifest(dir) {
  const file = path.join(dir, "manifest.json");
  if (!fs.existsSync(file)) throw new Error(`Missing visual baseline manifest: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function finding(severity, code, message, data) {
  return { severity, code, message, data };
}

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
