#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const json = args.includes("--json");
const writeReport = args.includes("--write-report");
const projectArg = valueAfter("--project");
const projectDirArg = valueAfter("--project-dir");
const manifestArg = valueAfter("--manifest");

const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const defaultReportPath = path.join(root, "docs/design/dashboard-local-visual-overrides-report.json");

const skippedDirs = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results"
]);

const allowedSharedCssPaths = [
  /(?:^|\/)vendor\/hermes-dashboard-kit\/(?:src\/dashboard-kit|static\/hermes-dashboard-kit)\.css$/,
  /(?:^|\/)packages\/hermes-dashboard-kit\/(?:src\/dashboard-kit|static\/hermes-dashboard-kit)\.css$/
];

const protectedSelectors = [
  ".hdk-",
  ".app-shell",
  ".dashboard-shell",
  ".shell",
  ".sidebar",
  ".sidebar-rail",
  ".topbar",
  ".global-header",
  ".command-header",
  ".banner",
  ".card",
  ".metric",
  ".kpi",
  ".table",
  ".data-table",
  ".chart",
  ".chart-panel",
  ".drawer",
  ".button",
  ".tabs",
  ".calendar",
  ".planner",
  ".proof-strip"
];

const protectedTokenGlobalPattern =
  /--(?:hdk-[\w-]+|surface-[\w-]+|text-[\w-]+|chart-[\w-]+|status-[\w-]+|bg|panel|panel-[\w-]+|sidebar|line|muted|accent|success|warning|error|info)\s*:/g;

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function rel(file) {
  return path.relative(root, file) || ".";
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split("\n").length;
}

function issue(severity, code, message, details = {}) {
  return { severity, code, message, ...details };
}

function projectEntries() {
  if (projectDirArg) {
    const projectRoot = path.resolve(root, projectDirArg);
    return [
      {
        id: path.basename(projectRoot),
        name: path.basename(projectRoot),
        path: projectRoot,
        manifest: manifestArg ? path.resolve(projectRoot, manifestArg) : path.join(projectRoot, ".hermes-dashboard.json")
      }
    ];
  }

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Missing adoption registry: ${rel(registryPath)}`);
  }

  const registry = readJson(registryPath);
  return (registry.projects ?? [])
    .filter((project) => !projectArg || project.id === projectArg)
    .map((project) => ({
      id: project.id,
      name: project.name,
      path: path.resolve(root, project.path),
      manifest: path.resolve(root, project.manifest),
      targetExperienceTier: project.targetExperienceTier,
      localVisualOverridePolicy: registry.newDashboardPolicy?.localVisualOverridePolicy,
      blockUnreviewedLocalDashboardCss: registry.newDashboardPolicy?.blocksUnreviewedLocalDashboardCss
    }));
}

function dashboardPolicy(manifest, project) {
  const policy =
    manifest.dashboardKit?.localVisualOverridePolicy ??
    project.localVisualOverridePolicy ??
    "declared-exceptions-only";
  const enabled =
    manifest.dashboardKit?.blockUnreviewedLocalDashboardCss ??
    project.blockUnreviewedLocalDashboardCss ??
    true;
  return { policy, enabled };
}

function targetTier(manifest, project) {
  return Number(manifest.dashboardKit?.targetExperienceTier ?? project.targetExperienceTier ?? 0);
}

function localOverrideExceptions(manifest) {
  return (manifest.exceptions ?? []).filter((entry) =>
    ["local-visual-override", "visual-override", "local-style-override"].includes(entry.type)
  );
}

function exceptionMatches(exception, finding) {
  const pathMatch =
    !exception.path ||
    finding.path.endsWith(exception.path) ||
    finding.path.includes(exception.path);
  const selectorMatch =
    !exception.selector ||
    finding.selector?.includes(exception.selector) ||
    exception.selector === "*";
  const tokenMatch =
    !exception.token ||
    finding.token === exception.token ||
    exception.token === "*";
  const kindMatch =
    !exception.kind ||
    exception.kind === finding.kind ||
    exception.kind === "*";

  return pathMatch && selectorMatch && tokenMatch && kindMatch;
}

function resolveCssHref(projectRoot, surfacePath, href) {
  const cleanHref = href.split("?")[0].split("#")[0];
  if (!cleanHref || /^https?:\/\//i.test(cleanHref)) return null;
  const absoluteFromPublic = path.join(projectRoot, "public", cleanHref.replace(/^\/+/, ""));
  if (cleanHref.startsWith("/") && fs.existsSync(absoluteFromPublic)) return absoluteFromPublic;
  if (cleanHref.startsWith("/")) return path.join(projectRoot, cleanHref.replace(/^\/+/, ""));
  return path.resolve(path.dirname(surfacePath), cleanHref);
}

function cssFilesFromSurfaces(projectRoot, manifest) {
  const files = new Set();

  for (const surface of manifest.surfaces ?? []) {
    const surfacePath = path.resolve(projectRoot, surface.path);
    if (!fs.existsSync(surfacePath)) continue;
    if (surfacePath.endsWith(".css")) {
      files.add(surfacePath);
      continue;
    }
    const content = fs.readFileSync(surfacePath, "utf8");
    const linkPattern = /<link[^>]+href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi;
    let match;
    while ((match = linkPattern.exec(content))) {
      const cssPath = resolveCssHref(projectRoot, surfacePath, match[1]);
      if (cssPath && fs.existsSync(cssPath)) files.add(cssPath);
    }
  }

  return [...files];
}

function walkCssFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skippedDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCssFiles(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
}

function fallbackCssFiles(projectRoot) {
  const files = [];
  for (const candidate of ["app", "src", "public"]) {
    walkCssFiles(path.join(projectRoot, candidate), files);
  }
  return files;
}

function isSharedCss(file, projectRoot = root) {
  const relativePath =
    path.relative(projectRoot, file).split(path.sep).join("/");
  const absolutePath =
    path.resolve(file).split(path.sep).join("/");
  return allowedSharedCssPaths.some((pattern) => pattern.test(relativePath) || pattern.test(absolutePath));
}

function scanCssFile({ project, file, manifest, projectRoot }) {
  if (isSharedCss(file, projectRoot)) return [];
  const findings = [];
  const content = fs.readFileSync(file, "utf8");
  const exceptions = localOverrideExceptions(manifest);
  const relativePath = path.relative(projectRoot, file);
  if (/hermes-dashboard-kit\.css$|dashboard-kit\.css$/.test(relativePath) && !isSharedCss(file, projectRoot)) {
    findings.push(issue(
      targetTier(manifest, project) >= 3 ? "error" : "warning",
      "localVisualOverride.copiedKitCss",
      "Project-local copied dashboard kit CSS is not allowed for Tier 3; consume the package CSS directly.",
      {
        project: project.id,
        path: relativePath,
        line: 1
      }
    ));
  }
  const selectorPattern =
    /(^|})\s*([.#][\w-]+(?:\s+[.#][\w-]+)?)(?=[\s,{])/g;

  let match;
  while ((match = selectorPattern.exec(content))) {
    const selector = match[2];
    const protectedMatch = protectedSelectors.find((protectedSelector) =>
      selectorMatchesProtectedSelector(selector, protectedSelector)
    );
    if (!protectedMatch) continue;
    const finding = {
      kind: "protected-selector",
      selector,
      path: relativePath,
      line: lineNumberFor(content, match.index)
    };
    if (exceptions.some((exception) => exceptionMatches(exception, finding))) continue;
    findings.push(issue(
      targetTier(manifest, project) >= 3 ? "error" : "warning",
      "localVisualOverride.protectedSelector",
      "Local dashboard CSS is overriding a kit-owned visual primitive without a declared exception.",
      {
        project: project.id,
        path: relativePath,
        line: finding.line,
        selector,
        protectedSelector: protectedMatch
      }
    ));
  }

  const tokenMatches = [...content.matchAll(protectedTokenGlobalPattern)];
  for (const tokenMatch of tokenMatches) {
    const token = tokenMatch[0].replace(/\s*:\s*$/, "");
    const finding = {
      kind: "protected-token",
      token,
      path: relativePath,
      line: lineNumberFor(content, tokenMatch.index ?? 0)
    };
    if (exceptions.some((exception) => exceptionMatches(exception, finding))) continue;
    findings.push(issue(
      targetTier(manifest, project) >= 3 ? "error" : "warning",
      "localVisualOverride.protectedToken",
      "Local dashboard CSS is redefining a protected theme or component token without a declared exception.",
      {
        project: project.id,
        path: relativePath,
        line: finding.line,
        token
      }
    ));
  }

  return findings;
}

function selectorMatchesProtectedSelector(selector, protectedSelector) {
  if (protectedSelector.endsWith("-")) return selector.startsWith(protectedSelector);
  return (
    selector === protectedSelector ||
    selector.startsWith(`${protectedSelector} `) ||
    selector.startsWith(`${protectedSelector}.`) ||
    selector.startsWith(`${protectedSelector}:`) ||
    selector.startsWith(`${protectedSelector}[`)
  );
}

function evaluateProject(project) {
  const issues = [];
  if (!fs.existsSync(project.path)) {
    return {
      project: project.id,
      status: "missing",
      issues: [issue("error", "project.missing", "Project path is missing.", { path: project.path })]
    };
  }
  if (!fs.existsSync(project.manifest)) {
    return {
      project: project.id,
      status: "unregistered",
      issues: [issue("error", "manifest.missing", "Project dashboard manifest is missing.", { manifest: project.manifest })]
    };
  }

  const manifest = readJson(project.manifest);
  const policy = dashboardPolicy(manifest, project);
  const cssFiles = [
    ...new Set([
      ...cssFilesFromSurfaces(project.path, manifest),
      ...fallbackCssFiles(project.path)
    ])
  ].filter((file) => !isSharedCss(file, project.path));

  if (policy.enabled && policy.policy !== "allow-local-overrides") {
    for (const file of cssFiles) {
      issues.push(...scanCssFile({ project, file, manifest, projectRoot: project.path }));
    }
  }

  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  return {
    project: project.id,
    name: project.name,
    status: errors ? "stale" : warnings ? "needs-review" : "current",
    policy,
    targetExperienceTier: targetTier(manifest, project),
    cssFilesScanned: cssFiles.map((file) => path.relative(project.path, file)),
    issues
  };
}

let entries;
try {
  entries = projectEntries();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const results = entries.map(evaluateProject);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  strict,
  rule: "no-local-visual-overrides-without-declared-exception",
  results
};
const failing = results.filter((result) => result.issues.some((item) => item.severity === "error"));

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Dashboard local visual override scan");
  console.table(results.map((result) => ({
    project: result.project,
    status: result.status,
    tier: result.targetExperienceTier,
    cssFiles: result.cssFilesScanned.length,
    errors: result.issues.filter((item) => item.severity === "error").length,
    warnings: result.issues.filter((item) => item.severity === "warning").length
  })));
  for (const result of results) {
    if (!result.issues.length) continue;
    console.log(`\n${result.name ?? result.project} (${result.project})`);
    for (const item of result.issues) {
      console.log(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}${item.path ? ` [${item.path}:${item.line ?? 1}]` : ""}`);
    }
  }
}

if (writeReport) {
  fs.mkdirSync(path.dirname(defaultReportPath), { recursive: true });
  fs.writeFileSync(defaultReportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!json) console.log(`\nWrote report: ${rel(defaultReportPath)}`);
}

if (strict && failing.length) process.exit(1);
