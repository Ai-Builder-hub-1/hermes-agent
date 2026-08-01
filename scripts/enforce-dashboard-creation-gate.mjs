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

if (!fs.existsSync(manifestPath)) {
  failures.push("New dashboard projects must include .hermes-dashboard.json. Use npm run dashboard:package-native:create.");
} else {
  const manifest = readJson(manifestPath);
  const targetTier = Number(manifest.dashboardKit?.targetExperienceTier ?? 0);
  const currentTier = Number(manifest.dashboardKit?.currentExperienceTier ?? 0);
  const packageNative = manifest.dashboardKit?.adoptionMode === "package-native" || manifest.dashboardKit?.implementationMode === "package-native";
  if (targetTier >= 3 && !packageNative) failures.push("Tier 3 dashboards must start package-native or be explicitly registered as a migration bridge.");
  if (targetTier >= 3 && currentTier < 3 && manifest.dashboardKit?.tierMigrationRequired !== true) {
    warnings.push("Tier 3 target with lower current tier should declare tierMigrationRequired when not complete.");
  }
  if (targetTier >= 3 && manifest.dashboardKit?.staticAdapterAllowed !== false) {
    failures.push("Tier 3 package-native dashboards must set staticAdapterAllowed=false.");
  }
}

if (!fs.existsSync(registryPath)) {
  failures.push("New dashboard projects must include hermes.dashboards.json with canonical route ownership.");
}

if (fs.existsSync(pkgPath)) {
  const pkg = readJson(pkgPath);
  if (!pkg.dependencies?.["@hermes/dashboard-kit"] && !pkg.devDependencies?.["@hermes/dashboard-kit"]) {
    failures.push("New dashboard projects must depend on @hermes/dashboard-kit.");
  }
} else {
  warnings.push("No package.json found; creation gate can only validate manifest files.");
}

const staticEntrypoints = collect(projectDir, [".html", ".css"], ["node_modules", "dist", "build", ".git", "proof"]);
for (const file of staticEntrypoints) {
  const relative = path.relative(projectDir, file);
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
