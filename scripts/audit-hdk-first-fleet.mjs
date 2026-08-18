#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const workspaceRoot = process.env.HERMES_PROJECTS_ROOT
  ? path.resolve(process.env.HERMES_PROJECTS_ROOT)
  : path.resolve(root, "..");
const fleetDir = path.join(root, "docs/fleet");
const jsonPath = path.join(fleetDir, "hdk-first-fleet-audit.json");
const mdPath = path.join(fleetDir, "hdk-first-fleet-audit.md");
const strict = process.argv.includes("--strict");
const noProduction = process.argv.includes("--no-production");

const skipDirs = new Set([
  ".git",
  ".next",
  ".turbo",
  ".venv",
  "coverage",
  "data",
  "dist",
  "docs",
  "build",
  "node_modules",
  "vendor",
  "tmp"
]);

const scanExtensions = new Set([".html", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".css"]);
const maxFileBytes = 900_000;

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function writeMarkdown(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`);
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function table(headers, rows) {
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`)
  ].join("\n");
}

function projectDirs() {
  return fs
    .readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(workspaceRoot, entry.name))
    .filter((projectRoot) => fs.existsSync(path.join(projectRoot, "package.json")))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!scanExtensions.has(ext)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.size > maxFileBytes) continue;
    files.push(fullPath);
  }
  return files;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function scanLocal(projectRoot) {
  const counts = {
    filesScanned: 0,
    hdkImports: 0,
    hdkComponentMarkers: 0,
    shellMarkers: 0,
    externalKitCssRefs: 0,
    localCssMarkers: 0,
    rawHtmlRoutes: 0,
    visualSelectorRefs: 0,
    oneOffSidebarMarkers: 0,
    hardcodedStyleMarkers: 0
  };
  for (const file of walkFiles(projectRoot)) {
    const text = fs.readFileSync(file, "utf8");
    counts.filesScanned += 1;
    counts.hdkImports += countMatches(text, /@hermes\/dashboard-kit/g);
    counts.hdkComponentMarkers += countMatches(text, /data-hdk-component|data-component="Dashboard|hdk-/g);
    counts.shellMarkers += countMatches(text, /DashboardShell|DashboardSidebar|hdk-shell|hdk-sidebar/g);
    counts.externalKitCssRefs += countMatches(text, /hermes-dashboard-kit\.css/g);
    counts.localCssMarkers += countMatches(text, /<style\b|style=|className=|class=|\.css["')]/g);
    counts.rawHtmlRoutes += countMatches(text, /<!doctype html|<html\b/gi);
    counts.visualSelectorRefs += countMatches(text, /visual-selection-bridge/g);
    counts.oneOffSidebarMarkers += countMatches(text, /sidebar|side-nav|nav-rail|rail-nav/gi);
    counts.hardcodedStyleMarkers += countMatches(text, /#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|background:\s|color:\s/g);
  }
  return counts;
}

function dependencyFor(pkg) {
  return pkg.dependencies?.["@hermes/dashboard-kit"] ?? pkg.devDependencies?.["@hermes/dashboard-kit"] ?? null;
}

function classify({ pkg, manifest, platform, scan, projectName }) {
  const dependency = dependencyFor(pkg);
  const adoptionMode = manifest?.dashboardKit?.adoptionMode ?? "missing";
  const implementationMode = manifest?.dashboardKit?.implementationMode ?? "missing";
  const surfaceStatuses = (manifest?.surfaces ?? []).map((surface) => surface.status).filter(Boolean);
  const targetTier = manifest?.dashboardKit?.targetExperienceTier ?? null;
  const currentTier = manifest?.dashboardKit?.currentExperienceTier ?? null;
  const baseline = manifest?.dashboardKit?.baseline ?? "missing";
  const baselineFields = {
    baseline: "hdk-first",
    package: "@hermes/dashboard-kit",
    shell: "hdk",
    sidebar: "hdk",
    header: "hdk",
    theme: "hdk",
    spacing: "hdk"
  };
  const baselineFieldFindings = Object.entries(baselineFields)
    .filter(([field, expected]) => manifest?.dashboardKit?.[field] !== expected)
    .map(([field, expected]) => `dashboardKit.${field} is not ${expected}`);
  const requiredScripts = ["hdk:check", "hdk:proof", "hdk:visual"];
  const missingScripts = requiredScripts.filter((script) => !pkg.scripts?.[script]);
  const surfaceComponents = new Set((manifest?.surfaces ?? []).flatMap((surface) => surface.requiredComponents ?? []));
  const missingBaselineComponents = ["DashboardShell", "DashboardSidebar", "DashboardHeader"]
    .filter((component) => !surfaceComponents.has(component));
  const findings = [];

  if (!dependency && projectName !== "nous-hermes-agent") {
    findings.push("missing @hermes/dashboard-kit dependency");
  }
  if (!manifest) findings.push("missing .hermes-dashboard.json");
  if (!platform) findings.push("missing .hermes-dashboard-platform.json");
  if (manifest) findings.push(...baselineFieldFindings);
  if (missingScripts.length && projectName !== "nous-hermes-agent") {
    findings.push(`missing HDK baseline script(s): ${missingScripts.join(", ")}`);
  }
  if (manifest && missingBaselineComponents.length) {
    findings.push(`missing baseline component declaration(s): ${missingBaselineComponents.join(", ")}`);
  }
  if (manifest?.referenceIntake?.required !== true || !manifest?.referenceIntake?.path) {
    findings.push("reference intake is not required");
  }
  if (manifest?.designReview?.required !== true || !manifest?.designReview?.path) {
    findings.push("design review checklist is not required");
  }
  if (!manifest?.proof?.playwrightConfig || !manifest?.proof?.captureScript) {
    findings.push("proof config is incomplete");
  }
  if (targetTier !== 3) findings.push("target tier is not Tier 3");
  if (adoptionMode !== "package-native" && projectName !== "nous-hermes-agent") {
    findings.push(`adoption mode is ${adoptionMode}`);
  }
  if (implementationMode.includes("runtime")) {
    findings.push("runtime bridge still present");
  }
  if (surfaceStatuses.some((status) => /bridge|compatibility|mount/i.test(status))) {
    findings.push("compatibility or mount surface remains");
  }
  if (scan.shellMarkers === 0 && projectName !== "nous-hermes-agent") {
    findings.push("no rendered HDK shell/sidebar markers found");
  }
  if (scan.rawHtmlRoutes > 0) {
    findings.push(`${scan.rawHtmlRoutes} raw HTML route marker(s) remain`);
  }
  if (scan.localCssMarkers > 500) {
    findings.push("high local CSS/HTML styling surface");
  }
  if (scan.hardcodedStyleMarkers > 500) {
    findings.push("high hardcoded color/style surface");
  }

  const packageNativeByManifest =
    adoptionMode === "package-native" &&
    !implementationMode.includes("runtime") &&
    !surfaceStatuses.some((status) => /bridge|compatibility|mount/i.test(status));
  const packageNativeByImplementation = packageNativeByManifest && scan.shellMarkers > 0 && scan.hdkComponentMarkers > 0;
  const hdkBaselineCompliant =
    baseline === "hdk-first" &&
    baselineFieldFindings.length === 0 &&
    missingScripts.length === 0 &&
    missingBaselineComponents.length === 0 &&
    manifest?.referenceIntake?.required === true &&
    Boolean(manifest?.referenceIntake?.path) &&
    manifest?.designReview?.required === true &&
    Boolean(manifest?.designReview?.path) &&
    Boolean(manifest?.proof?.playwrightConfig) &&
    Boolean(manifest?.proof?.captureScript);
  const status = findings.length === 0 ? "hdk-first-ready" : packageNativeByImplementation ? "hdk-first-with-debt" : "needs-migration";

  return {
    dependency,
    baseline,
    hdkBaselineCompliant,
    adoptionMode,
    implementationMode,
    currentTier,
    targetTier,
    surfaceCount: manifest?.surfaces?.length ?? 0,
    productionUrl: platform?.productionUrl ?? null,
    proofUrl: platform?.proofUrl ?? null,
    packageNativeByManifest,
    packageNativeByImplementation,
    status,
    findings
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Nous-Hermes-HDK-Fleet-Audit/1.0" }
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? "",
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: "fetch-error",
      finalUrl: url,
      contentType: "",
      text: "",
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function absoluteUrl(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractAssets(html) {
  const stylesheets = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi)].map((match) => match[1]);
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["'][^>]*>/gi)].map((match) => match[1]);
  return { stylesheets, scripts };
}

async function probeProduction(project) {
  if (!project.classification.productionUrl || noProduction) {
    return { status: noProduction ? "skipped" : "missing-url", findings: [] };
  }
  const route = await fetchWithTimeout(project.classification.productionUrl);
  const findings = [];
  if (!route.ok) findings.push(`route returned ${route.status}`);
  const assets = extractAssets(route.text);
  const htmlMarkers = {
    hdk: /data-hdk-component|hdk-|@hermes\/dashboard-kit|hermes-dashboard-kit/i.test(route.text),
    shell: /DashboardShell|hdk-shell|hdk-sidebar|data-component="Dashboard/i.test(route.text),
    auth: /login|password|session/i.test(route.text),
    visualSelector: /visual-selection-bridge/i.test(route.text)
  };

  const cssRefs = assets.stylesheets.filter((href) => /hermes-dashboard-kit|dashboard|style/i.test(href)).slice(0, 6);
  const css = [];
  for (const href of cssRefs) {
    const url = absoluteUrl(route.finalUrl, href);
    if (!url) continue;
    const result = await fetchWithTimeout(url, { timeoutMs: 6000 });
    const hasTokens = /--hdk-|hdk-shell|dashboard-kit/i.test(result.text);
    if (!result.ok && result.status !== 401) findings.push(`css ${href} returned ${result.status}`);
    css.push({ href, url, status: result.status, ok: result.ok, protected: result.status === 401, hasTokens });
  }

  if (!htmlMarkers.hdk && !css.some((asset) => asset.hasTokens)) {
    findings.push("production route did not expose HDK markers or token CSS");
  }
  if (htmlMarkers.visualSelector) findings.push("visual selector appears in production HTML");

  return {
    status: route.ok ? "reachable" : "unreachable",
    route: {
      status: route.status,
      finalUrl: route.finalUrl,
      contentType: route.contentType
    },
    htmlMarkers,
    assets: {
      stylesheetCount: assets.stylesheets.length,
      scriptCount: assets.scripts.length,
      probedCss: css
    },
    findings
  };
}

function recommendationsFor(project) {
  const recommendations = [];
  const { classification, production, scan } = project;
  if (!classification.dependency && project.projectName !== "nous-hermes-agent") {
    recommendations.push("Add @hermes/dashboard-kit dependency before more UI work.");
  }
  if (classification.findings.includes("runtime bridge still present")) {
    recommendations.push("Replace runtime bridge route with a package-native frontend entry that imports HDK components directly.");
  }
  if (classification.findings.some((finding) => finding.includes("compatibility or mount"))) {
    recommendations.push("Promote one HDK-first route as canonical and demote compatibility routes from operator navigation.");
  }
  if (scan.localCssMarkers > 500 || scan.hardcodedStyleMarkers > 500) {
    recommendations.push("Move shell, spacing, theme, card, table, and chart primitives into HDK tokens/components; keep project CSS to domain-only variants.");
  }
  if (production?.findings?.length) {
    recommendations.push("Fix production asset delivery/proof before declaring the dashboard visually governed.");
  }
  if (!recommendations.length) {
    recommendations.push("Keep HDK first, add visual regression baselines, and only build custom components behind explicit component contracts.");
  }
  return recommendations;
}

const projects = [];
for (const projectRoot of projectDirs()) {
  const projectName = path.basename(projectRoot);
  const pkg = readJsonSafe(path.join(projectRoot, "package.json")) ?? {};
  const manifest = readJsonSafe(path.join(projectRoot, ".hermes-dashboard.json"));
  const platform = readJsonSafe(path.join(projectRoot, ".hermes-dashboard-platform.json"));
  const scan = scanLocal(projectRoot);
  const classification = classify({ pkg, manifest, platform, scan, projectName });
  projects.push({
    projectName,
    projectPath: path.relative(workspaceRoot, projectRoot),
    scan,
    classification
  });
}

for (const project of projects) {
  project.production = await probeProduction(project);
  project.recommendations = recommendationsFor(project);
}

const summary = {
  projectCount: projects.length,
  hdkDependencyCount: projects.filter((project) => Boolean(project.classification.dependency) || project.projectName === "nous-hermes-agent").length,
  hdkBaselineCompliantCount: projects.filter((project) => project.classification.hdkBaselineCompliant).length,
  hdkFirstReadyCount: projects.filter((project) => project.classification.status === "hdk-first-ready").length,
  needsMigrationCount: projects.filter((project) => project.classification.status === "needs-migration").length,
  hdkFirstWithDebtCount: projects.filter((project) => project.classification.status === "hdk-first-with-debt").length,
  productionReachableCount: projects.filter((project) => project.production.status === "reachable").length,
  productionFindingCount: projects.reduce((sum, project) => sum + (project.production.findings?.length ?? 0), 0),
  localDebtFindingCount: projects.reduce((sum, project) => sum + project.classification.findings.length, 0)
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  purpose: "Audits whether each dashboard project is HDK-first by dependency, manifest, local implementation, and production delivery.",
  standard: {
    baseline: "Every dashboard must start from the @hermes/dashboard-kit shell, tokens, sidebar, spacing, card, table, chart, state, and proof contracts.",
    customComponentPolicy: "Custom project components are allowed only inside HDK layout slots and must use HDK tokens, sizing contracts, data states, and visual proof.",
    completionDefinition: "Package-native by implementation means the route imports/renders HDK primitives directly; dependency-only and static/runtime bridges are not enough."
  },
  summary,
  projects
};

writeJson(jsonPath, report);
writeMarkdown(mdPath, renderMarkdown(report));

console.log(`HDK-first fleet audit: ${summary.hdkFirstReadyCount}/${summary.projectCount} ready, ${summary.needsMigrationCount} need migration, ${summary.productionFindingCount} production finding(s).`);
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

if (strict && (summary.needsMigrationCount || summary.productionFindingCount)) {
  process.exitCode = 1;
}

function renderMarkdown(report) {
  const projectRows = report.projects.map((project) => [
    project.projectName,
    project.classification.status,
    project.classification.hdkBaselineCompliant ? "yes" : "no",
    project.classification.adoptionMode,
    project.classification.implementationMode,
    project.classification.packageNativeByImplementation ? "yes" : "no",
    project.production.status,
    project.classification.findings.length + (project.production.findings?.length ?? 0)
  ]);
  const productionRows = report.projects.map((project) => [
    project.projectName,
    project.classification.productionUrl ?? "none",
    project.production.route?.status ?? project.production.status,
    (project.production.assets?.probedCss ?? []).map((asset) => `${asset.href}: ${asset.status}${asset.hasTokens ? " +tokens" : ""}`).join("<br>") || "none",
    project.production.findings?.join("<br>") || "none"
  ]);
  const riskRows = report.projects
    .flatMap((project) => [
      ...project.classification.findings.map((finding) => [project.projectName, "local", finding]),
      ...(project.production.findings ?? []).map((finding) => [project.projectName, "production", finding])
    ])
    .sort((a, b) => a[0].localeCompare(b[0]));
  const recommendationRows = report.projects.map((project) => [
    project.projectName,
    project.recommendations.join("<br>")
  ]);

  return `# HDK-First Fleet Audit

Generated: ${report.generatedAt}

This audit closes the gap between "the kit is installed" and "the dashboard is actually governed by the kit." It checks package dependency, dashboard manifests, local implementation markers, raw/static route debt, and production stylesheet/route delivery.

## Summary

- Projects audited: ${report.summary.projectCount}
- HDK dependency present: ${report.summary.hdkDependencyCount}
- HDK baseline compliant: ${report.summary.hdkBaselineCompliantCount}
- HDK-first ready: ${report.summary.hdkFirstReadyCount}
- HDK-first with debt: ${report.summary.hdkFirstWithDebtCount}
- Need migration: ${report.summary.needsMigrationCount}
- Production routes reachable: ${report.summary.productionReachableCount}
- Local findings: ${report.summary.localDebtFindingCount}
- Production findings: ${report.summary.productionFindingCount}

## Project Status

${table(["Project", "Status", "HDK baseline", "Adoption", "Implementation", "Implementation native", "Production", "Finding count"], projectRows)}

## Production Delivery

${table(["Project", "Production URL", "Route status", "Probed CSS", "Findings"], productionRows)}

## Findings

${riskRows.length ? table(["Project", "Layer", "Finding"], riskRows) : "No findings."}

## Recommended Actions

${table(["Project", "Action"], recommendationRows)}

## Enforcement Rule

All dashboard projects should run \`npm run dashboard:hdk-first:audit\` from Nous Hermes before visual promotion. A project can keep custom domain components, but the page shell, sidebar, spacing, tables, charts, cards, drawers, theme, empty/loading/error states, and proof metadata must come through HDK contracts.
`;
}
