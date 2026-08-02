#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const scanAll = args.has("--all");
const strict = args.has("--strict");
const noSuppressions = args.has("--no-suppressions");
const registryPath = path.join(root, "docs/design/dashboard-token-enforcement.json");
const suppressionPath = path.join(root, "docs/design/dashboard-token-suppressions.json");
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".html"]);
const ignoreSegments = new Set(["node_modules", "dist", "web_dist", "test-results"]);
const issues = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreSegments.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (allowedExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function changedFiles() {
  const commands = [
    ["diff", "--name-only", "HEAD"],
    ["diff", "--name-only", "--cached"],
    ["ls-files", "--others", "--exclude-standard"]
  ];
  const names = new Set();
  for (const command of commands) {
    const result = spawnSync("git", command, { cwd: root, encoding: "utf8" });
    if (result.status !== 0) continue;
    for (const line of result.stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
      names.add(line);
    }
  }
  return [...names].map((file) => path.join(root, file)).filter((file) => fs.existsSync(file));
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function isTokenizedColorSample(text, index, sample) {
  const rest = text.slice(index, index + 32);
  return sample.startsWith("color-mix(") || rest.startsWith("hsl(var(") || rest.startsWith("rgb(var(");
}

function isCommentLine(text, index) {
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  return text.slice(lineStart, index).trimStart().startsWith("//");
}

function isHexColorFalsePositive(text, index, sample) {
  if (!sample.startsWith("#")) return false;
  const after = text[index + sample.length] ?? "";
  const before = text[index - 1] ?? "";
  return isCommentLine(text, index) || /[A-Za-z0-9_-]/.test(after) || before === "&";
}

function isTokenizedShadowSample(text, index, sample) {
  const rest = text.slice(index, index + 180);
  return (
    (sample.startsWith("boxShadow:") && rest.includes("var(--")) ||
    (sample.startsWith("shadow-[") && rest.includes("var(--"))
  );
}

if (!fs.existsSync(registryPath)) {
  console.error("Token enforcement registry is missing.");
  process.exit(1);
}

const registry = readJson(registryPath);
const suppressions = !noSuppressions && fs.existsSync(suppressionPath)
  ? readJson(suppressionPath).suppressions ?? []
  : [];
const suppressionCounts = new Map(suppressions.map((item) => [`${item.file}::${item.rule}`, Number(item.maxAllowed ?? 0)]));
const sourceArtifacts = new Set((registry.sourceArtifacts ?? []).filter((artifact) => allowedExtensions.has(path.extname(artifact))));
const scopedRoots = new Set((registry.forbiddenPatterns ?? []).flatMap((rule) => rule.scope ?? []));
const candidateFiles = scanAll
  ? [...scopedRoots].flatMap((scope) => walk(path.join(root, scope)))
  : changedFiles().filter((file) => [...scopedRoots].some((scope) => relative(file).startsWith(`${scope}/`)));

for (const file of candidateFiles) {
  const rel = relative(file);
  if (sourceArtifacts.has(rel)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const rule of registry.forbiddenPatterns ?? []) {
    if (!(rule.scope ?? []).some((scope) => rel.startsWith(`${scope}/`))) continue;
    const pattern = new RegExp(rule.pattern, "g");
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (rule.id === "hard-coded-color" && isTokenizedColorSample(text, match.index, match[0])) continue;
      if (rule.id === "hard-coded-color" && isHexColorFalsePositive(text, match.index, match[0])) continue;
      if (rule.id === "raw-shadow" && isTokenizedShadowSample(text, match.index, match[0])) continue;
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      issues.push({
        severity: strict ? "error" : "warning",
        rule: rule.id,
        file: rel,
        line,
        sample: match[0].slice(0, 80)
      });
    }
  }
}

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");
const grouped = new Map();
for (const issue of issues) {
  const key = `${issue.file}::${issue.rule}`;
  grouped.set(key, (grouped.get(key) ?? 0) + 1);
}
const newDebt = [...grouped.entries()].filter(([key, count]) => count > (suppressionCounts.get(key) ?? 0));
if (strict && newDebt.length) {
  for (const [key, count] of newDebt) {
    const [file, rule] = key.split("::");
    issues.push({
      severity: "error",
      rule,
      file,
      line: 0,
      sample: `count ${count} exceeds baseline ${suppressionCounts.get(key) ?? 0}`
    });
  }
}
const finalErrors = issues.filter((issue) => issue.severity === "error");
const finalWarnings = issues.filter((issue) => issue.severity === "warning");
console.log(`Dashboard token scan: ${finalErrors.length} error(s), ${finalWarnings.length} warning(s), ${candidateFiles.length} file(s) scanned.`);
for (const issue of issues.slice(0, 40)) {
  console.log(`- ${issue.severity.toUpperCase()} ${issue.rule} ${issue.file}:${issue.line} ${issue.sample}`);
}
if (issues.length > 40) console.log(`- INFO ${issues.length - 40} additional issue(s) omitted.`);
if (finalErrors.length) process.exit(1);
