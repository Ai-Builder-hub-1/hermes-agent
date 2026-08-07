#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const projectDir = path.resolve(root, args.projectDir || ".");
const failures = [];
const warnings = [];

const manifestPath = path.join(projectDir, ".hermes-dashboard.json");
if (!fs.existsSync(manifestPath)) {
  fail(`missing .hermes-dashboard.json in ${projectDir}`);
  finish();
}

const manifest = readJson(manifestPath);
const packageNative = manifest.dashboardKit?.adoptionMode === "package-native" || manifest.dashboardKit?.implementationMode === "package-native";
if (!packageNative) fail("dashboardKit.adoptionMode or implementationMode must be package-native");
if (manifest.dashboardKit?.staticAdapterAllowed !== false) fail("dashboardKit.staticAdapterAllowed must be false for Tier 3 package-native dashboards");
if (manifest.dashboardKit?.currentExperienceTier < 3 && manifest.dashboardKit?.targetExperienceTier >= 3) warn("currentExperienceTier is below targetExperienceTier");

requireFile(manifest.referenceIntake?.path, "Mobbin reference intake");
requireFile(manifest.designReview?.path, "design review checklist");
requireFile(manifest.proof?.playwrightConfig, "Playwright proof config");
requireFile(manifest.proof?.captureScript, "proof screenshot capture script");

const surfaces = manifest.surfaces ?? [];
if (!surfaces.length) fail("manifest.surfaces must include at least one dashboard surface");
for (const surface of surfaces) {
  const surfacePath = path.join(projectDir, surface.path || "");
  if (!fs.existsSync(surfacePath)) {
    fail(`surface missing: ${surface.path}`);
    continue;
  }
  const source = fs.readFileSync(surfacePath, "utf8");
  for (const marker of ["@hermes/dashboard-kit", "DashboardShell", "DashboardSidebar", "DashboardHeader"]) {
    if (!source.includes(marker)) fail(`${surface.path} missing ${marker}`);
  }
  validateOperationalNavigation(source, surface.path);
  if (!source.includes("data-theme=") && !source.includes("hdk-theme-scope")) {
    fail(`${surface.path} missing theme scope`);
  }
  const duplicateShellPatterns = [/className=["'][^"']*\bsidebar\b/i, /className=["'][^"']*\btopbar\b/i, /<iframe\b/i];
  for (const pattern of duplicateShellPatterns) {
    if (pattern.test(source)) fail(`${surface.path} contains potential nested shell pattern: ${pattern}`);
  }
  validateReviewRegions(source, surface.path);
  const bridgeInProd = /visual-selection|review-bridge/.test(source) && !/import\.meta\.env\.DEV|NODE_ENV !== ["']production|localhost|127\.0\.0\.1/.test(source);
  if (bridgeInProd) fail(`${surface.path} appears to load visual selection/review markers without a dev-only guard`);
}

for (const file of collectFiles(projectDir, [".css", ".tsx", ".ts", ".jsx", ".js"], ["node_modules", "dist", "build", ".git", "proof"])) {
  const relative = path.relative(projectDir, file);
  const source = fs.readFileSync(file, "utf8");
  const hardcodedColorMatches = source.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g) ?? [];
  const allowTokenFile = relative.includes("dashboard-theme.css") || relative.includes("tokens") || relative.includes("hermes-dashboard-kit.css");
  if (hardcodedColorMatches.length && !allowTokenFile) {
    warn(`${relative} has ${hardcodedColorMatches.length} hardcoded color value(s); prefer kit tokens`);
  }
}

finish();

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function requireFile(relativePath, label) {
  if (!relativePath) {
    fail(`${label} path missing from manifest`);
    return;
  }
  if (!fs.existsSync(path.join(projectDir, relativePath))) fail(`${label} missing: ${relativePath}`);
}

function validateOperationalNavigation(source, surfacePath) {
  const checks =
    [
      ["brand mark/block", /hdk-brand|hdk-sidebar-brand|\bbrand\b|data-sidebar-brand|data-nav-brand|\bmark\b/i],
      ["grouped navigation", /nav-group|data-nav-group|<section[^>]*class=["'][^"']*nav|Command|Production|Business|Control|Operations/i],
      ["active route state", /aria-current=["']page|\.active\b|is-active|data-active|activeId|item\.active|active:\s*true/i],
      ["collapsed labels", /data-short|data-short-label|shortLabel|collapsed|aria-label/i],
      ["footer/status context", /hdk-sidebar-footer|sidebar-note|dashboard-switcher|data-sidebar-footer|data-dashboard-list|readiness|status/i],
      ["mobile navigation behavior", /max-width|matchMedia|mobile|drawer|top navigation|sidebar-collapsed/i]
    ];

  for (const [label, pattern] of checks) {
    if (!pattern.test(source)) {
      fail(`${surfacePath} missing Tier 3 operational sidebar evidence: ${label}`);
    }
  }
}

function validateReviewRegions(source, surfacePath) {
  const requiredHints = [
    ["shell/header region", /DashboardShell|DashboardHeader|hdk-shell|hdk-header|topbar/i],
    ["sidebar/navigation region", /DashboardSidebar|hdk-sidebar|sidebar|nav-item/i],
    ["interactive shortcut or action region", /data-view-shortcut|command-shortcuts|toolbar|actions|button/i],
  ];
  for (const [label, pattern] of requiredHints) {
    if (pattern.test(source) && !/data-review-id=/.test(source)) {
      warn(`${surfacePath} has ${label} evidence but no stable data-review-id markers for visual selection`);
      return;
    }
  }

  const reviewablePatterns = [
    ["shortcut rail", /command-shortcuts|data-view-shortcut/i],
    ["utility/admin rail", /admin-ops|operator-admin|ops-actions|utility-rail/i],
    ["chart surface", /Chart|chart|hdk-chart/i],
    ["table surface", /DataTable|<table\b|hdk-table/i],
    ["drawer surface", /Drawer|drawer/i],
    ["form surface", /<form\b|Form|form-/i],
  ];
  for (const [label, pattern] of reviewablePatterns) {
    if (pattern.test(source) && !nearReviewId(source, pattern)) {
      warn(`${surfacePath} has a ${label} pattern without nearby data-review-id instrumentation`);
    }
  }
}

function nearReviewId(source, pattern) {
  const match = source.match(pattern);
  if (!match || match.index === undefined) return false;
  const start = Math.max(0, match.index - 500);
  const end = Math.min(source.length, match.index + 800);
  return source.slice(start, end).includes("data-review-id=");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function collectFiles(dir, extensions, ignoredDirs) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.includes(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(absolute, extensions, ignoredDirs));
    } else if (extensions.includes(path.extname(entry.name))) {
      found.push(absolute);
    }
  }
  return found;
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function finish() {
  for (const warning of warnings) console.warn(`warn ${warning}`);
  if (failures.length) {
    console.error(`Package-native surface validation failed (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log("Package-native surface validation passed");
}
