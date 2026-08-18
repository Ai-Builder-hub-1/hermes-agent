#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const projectDir = path.resolve(root, args.projectDir || ".");
const failures = [];
const warnings = [];

const pkgPath = path.join(projectDir, "package.json");
const manifestPath = path.join(projectDir, ".hermes-dashboard.json");
const registryPath = path.join(projectDir, "hermes.dashboards.json");
const requiredDashboardKitFields = {
  baseline: "hdk-first",
  package: "@hermes/dashboard-kit",
  adoptionMode: "package-native",
  implementationMode: "package-native",
  packageNativeRequired: true,
  staticAdapterAllowed: false,
  shell: "hdk",
  sidebar: "hdk",
  header: "hdk",
  theme: "hdk",
  spacing: "hdk"
};
const requiredSurfaceComponents = [
  "DashboardShell",
  "DashboardSidebar",
  "DashboardHeader"
];
const requiredLocalScripts = [
  "hdk:check",
  "hdk:proof",
  "hdk:visual"
];

if (!fs.existsSync(manifestPath)) {
  failures.push("New dashboard projects must include .hermes-dashboard.json. Use npm run dashboard:package-native:create.");
} else {
  const manifest = readJson(manifestPath);
  const dashboardKit = manifest.dashboardKit ?? {};
  const targetTier = Number(manifest.dashboardKit?.targetExperienceTier ?? 0);
  const currentTier = Number(manifest.dashboardKit?.currentExperienceTier ?? 0);
  const packageNative = manifest.dashboardKit?.adoptionMode === "package-native" || manifest.dashboardKit?.implementationMode === "package-native";
  for (const [field, expected] of Object.entries(requiredDashboardKitFields)) {
    if (dashboardKit[field] !== expected) {
      failures.push(`HDK baseline requires dashboardKit.${field}=${JSON.stringify(expected)}.`);
    }
  }
  if (targetTier >= 3 && !packageNative) failures.push("Tier 3 dashboards must start package-native or be explicitly registered as a migration bridge.");
  if (targetTier >= 3 && currentTier < 3 && manifest.dashboardKit?.tierMigrationRequired !== true) {
    warnings.push("Tier 3 target with lower current tier should declare tierMigrationRequired when not complete.");
  }
  if (targetTier >= 3 && manifest.dashboardKit?.staticAdapterAllowed !== false) {
    failures.push("Tier 3 package-native dashboards must set staticAdapterAllowed=false.");
  }
  if (manifest.dashboardKit?.customComponentsPolicy !== "allowed-only-inside-hdk-shell-and-token-contracts") {
    failures.push("HDK baseline requires customComponentsPolicy=allowed-only-inside-hdk-shell-and-token-contracts.");
  }
  if (manifest.referenceIntake?.required !== true || !manifest.referenceIntake?.path) {
    failures.push("HDK baseline requires a required referenceIntake.path.");
  }
  if (manifest.designReview?.required !== true || !manifest.designReview?.path) {
    failures.push("HDK baseline requires a required designReview.path.");
  }
  if (!manifest.proof?.playwrightConfig || !manifest.proof?.captureScript) {
    failures.push("HDK baseline requires proof.playwrightConfig and proof.captureScript.");
  }
  for (const script of requiredLocalScripts) {
    if (!manifest.enforcement?.localScripts?.includes(script)) {
      failures.push(`HDK baseline requires enforcement.localScripts to include ${script}.`);
    }
  }
  const surfaceComponents = new Set((manifest.surfaces ?? []).flatMap((surface) => surface.requiredComponents ?? []));
  for (const component of requiredSurfaceComponents) {
    if (!surfaceComponents.has(component)) {
      failures.push(`HDK baseline requires a surface declaring ${component}.`);
    }
  }
  const activeExceptions = (manifest.exceptions ?? []).filter((exception) => !exception.expiresAt);
  if (activeExceptions.length) {
    failures.push("HDK baseline exceptions must include expiresAt.");
  }
}

if (!fs.existsSync(registryPath)) {
  failures.push("New dashboard projects must include hermes.dashboards.json with canonical route ownership.");
} else {
  const registry = readJson(registryPath);
  const dashboards = registry.dashboards ?? [];
  if (!dashboards.some((dashboard) => dashboard.canonical === true && dashboard.implementationMode === "package-native" && dashboard.package === "@hermes/dashboard-kit")) {
    failures.push("hermes.dashboards.json must declare one canonical package-native @hermes/dashboard-kit dashboard.");
  }
}

if (fs.existsSync(pkgPath)) {
  const pkg = readJson(pkgPath);
  if (!pkg.dependencies?.["@hermes/dashboard-kit"] && !pkg.devDependencies?.["@hermes/dashboard-kit"]) {
    failures.push("New dashboard projects must depend on @hermes/dashboard-kit.");
  }
  for (const script of requiredLocalScripts) {
    if (!pkg.scripts?.[script]) failures.push(`package.json must expose npm run ${script}.`);
  }
} else {
  warnings.push("No package.json found; creation gate can only validate manifest files.");
}

const staticEntrypoints = collect(projectDir, [".html", ".css"], ["node_modules", "dist", "build", ".git", "proof"]);
const manifestForStaticScan = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
const staticAllowlist = manifestForStaticScan.enforcement?.staticEntrypointAllowlist ?? [];
for (const file of staticEntrypoints) {
  const relative = path.relative(projectDir, file);
  if (isAllowed(relative, staticAllowlist)) continue;
  const source = fs.readFileSync(file, "utf8");
  const looksLikeStandalone = /<html[\s>]/i.test(source) && /sidebar|topbar|dashboard|app-shell/i.test(source);
  if (looksLikeStandalone && !/dev-only|prototype|compatibility route/i.test(source)) {
    failures.push(`${relative} looks like a standalone dashboard shell. New Tier 3 dashboards must be package-native route content.`);
  }
}

for (const warning of warnings) console.warn(`warn ${warning}`);
if (failures.length) {
  console.error(`Dashboard creation gate failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Dashboard creation gate passed");

function collect(dir, extensions, ignoredDirs) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.includes(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collect(absolute, extensions, ignoredDirs));
    else if (extensions.includes(path.extname(entry.name))) found.push(absolute);
  }
  return found;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isAllowed(relativePath, allowlist) {
  return allowlist.some((entry) => {
    const pattern = String(entry);
    if (pattern.endsWith("/**")) return relativePath.startsWith(pattern.slice(0, -3));
    if (pattern.endsWith("*")) return relativePath.startsWith(pattern.slice(0, -1));
    return relativePath === pattern || relativePath.startsWith(`${pattern}/`);
  });
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
