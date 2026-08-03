#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const dryRun = !apply || Boolean(args.dryRun);
const validate = Boolean(args.validate);
const regenerate = Boolean(args.regenerate);
const cleanOnly = Boolean(args.cleanOnly);
const skipDirty = Boolean(args.skipDirty) || cleanOnly;
const safeAutoOnly = Boolean(args.safeAuto);
const selectedProject = args.project ?? "";
const selectedCategory = args.category ?? "";
const selectedStrategy = args.strategy ?? "";
const maxActions = Number(args.maxActions ?? Number.POSITIVE_INFINITY);
const reportPath = path.join(root, "docs/design/dashboard-next-actions-report.json");
const registryPath = path.join(root, "hermes.dashboards.json");
const profilesPath = path.join(root, "docs/design/dashboard-project-validation-profiles.json");
const executionJsonPath = path.join(root, "docs/design/dashboard-next-actions-execution-report.json");
const executionMdPath = path.join(root, "docs/design/dashboard-next-actions-execution-report.md");

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = raw[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readOptionalJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return readJson(file);
}

function run(command, cwd) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf8"
  });
  return {
    command: command.join(" "),
    cwd,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function projectMap() {
  const registry = fs.existsSync(registryPath) ? readJson(registryPath) : { dashboards: [] };
  const profiles = readOptionalJson(profilesPath, { profiles: [] });
  const map = new Map();
  for (const dashboard of registry.dashboards ?? []) {
    const project = dashboardProjectKey(dashboard);
    if (!project || map.has(project)) continue;
    map.set(project, {
      project,
      projectPath: dashboard.projectPath,
      absolutePath: path.resolve(root, dashboard.projectPath ?? "."),
      dashboardId: dashboard.id,
      label: dashboard.label,
      validationProfile: null
    });
  }
  map.set("media-business-os", {
    project: "media-business-os",
    projectPath: "../media-business-operations",
    absolutePath: path.resolve(root, "../media-business-operations"),
    dashboardId: "media-business-operations.main",
    label: "Media Business Operations",
    validationProfile: null
  });
  map.set("hermes-os", {
    project: "hermes-os",
    projectPath: "../hermes",
    absolutePath: path.resolve(root, "../hermes"),
    dashboardId: "hermes.workspace",
    label: "Hermes Workspace",
    validationProfile: null
  });
  map.set("tlc-capital-group-os", {
    project: "tlc-capital-group-os",
    projectPath: "../tlc-capital-group-os",
    absolutePath: path.resolve(root, "../tlc-capital-group-os"),
    dashboardId: "tlc-capital-group-os.dashboard",
    label: "TLC Capital Group OS",
    validationProfile: null
  });
  for (const profile of profiles.profiles ?? []) {
    const existing = map.get(profile.project) ?? {
      project: profile.project,
      projectPath: profile.projectPath,
      absolutePath: path.resolve(root, profile.projectPath ?? "."),
      dashboardId: null,
      label: profile.project
    };
    map.set(profile.project, {
      ...existing,
      projectPath: profile.projectPath ?? existing.projectPath,
      absolutePath: path.resolve(root, profile.projectPath ?? existing.projectPath ?? "."),
      validationProfile: profile
    });
  }
  return map;
}

function dashboardProjectKey(dashboard) {
  if (dashboard.id === "media-business-operations.main") return "media-business-os";
  if (dashboard.id === "hermes.workspace") return "hermes-os";
  return String(dashboard.projectPath ?? dashboard.id ?? "")
    .replace(/^\.\.\//, "")
    .replace(/^\.$/, "nous-hermes-agent")
    .replace(/\.main$|\.workspace$|\.roc$|\.ops$|\.dashboard$/g, "");
}

function gitSafety(project) {
  if (!fs.existsSync(project.absolutePath)) {
    return { status: "missing-project", dirty: true, details: `Project path not found: ${project.absolutePath}` };
  }
  const status = run(["git", "status", "--short"], project.absolutePath);
  if (status.status !== 0) {
    return { status: "not-git", dirty: true, details: status.stderr || status.stdout };
  }
  return {
    status: status.stdout ? "dirty" : "clean",
    dirty: Boolean(status.stdout),
    details: status.stdout
  };
}

function classify(action) {
  if (action.category === "bridge") return { mode: "patch-with-review", confidence: "medium", reason: "Bridge fixes can touch runtime paths and review hooks; generate a targeted patch after inspecting the owning project." };
  if (action.category === "proof") return { mode: "project-implementation", confidence: "medium", reason: "Proof endpoints must be implemented in the owning app, not declared centrally without a route." };
  if (action.category === "telemetry") return { mode: "project-implementation", confidence: "medium", reason: "Snapshot endpoints require project-owned API/data adapters." };
  if (action.category === "deployment") return { mode: "patch-with-review", confidence: "medium", reason: "Deployment metadata must match the Hetzner deployment spine or the project must be removed from production registry." };
  if (action.category === "adoption") return { mode: "project-implementation", confidence: "low", reason: "Adoption fixes require package-native surface changes in the owning project." };
  if (action.category === "visual") return { mode: "project-implementation", confidence: "low", reason: "Visual quality fixes require page-specific UI work and screenshot review." };
  if (action.category === "migration") return { mode: "project-implementation", confidence: "medium", reason: "Migration candidates require explicit package-native cutover work." };
  if (action.category === "readiness") return { mode: "derived", confidence: "high", reason: "Readiness clears automatically after adoption/proof/telemetry blockers clear." };
  return { mode: "project-implementation", confidence: "low", reason: "No safe automated strategy registered." };
}

function validationCommands() {
  return [
    ["npm", "run", "dashboard-kit:adoption:report"],
    ["npm", "run", "dashboard:production-proof:registry"],
    ["npm", "run", "dashboard:telemetry-contract:report"],
    ["npm", "run", "dashboard:readiness-impact:report"],
    ["npm", "run", "dashboard:visual-quality:score"],
    ["npm", "run", "dashboard:deployment-metadata:validate"],
    ["npm", "run", "dashboard:project-profiles:validate"],
    ["npm", "run", "dashboard:next-actions:report"],
    ["npm", "run", "dashboard:next-actions:execute"],
    ["npm", "run", "dashboard:world-class:report"]
  ];
}

function regenerationCommands() {
  return [
    ["npm", "run", "dashboard-kit:adoption:report"],
    ["npm", "run", "dashboard:production-proof:registry"],
    ["npm", "run", "dashboard:telemetry-contract:report"],
    ["npm", "run", "dashboard:readiness-impact:report"],
    ["npm", "run", "dashboard:visual-quality:score"],
    ["npm", "run", "dashboard:deployment-metadata:validate"],
    ["npm", "run", "dashboard:project-profiles:validate"],
    ["npm", "run", "dashboard:next-actions:report"]
  ];
}

if (!fs.existsSync(reportPath)) {
  console.error("Missing dashboard next-actions report. Run npm run dashboard:next-actions:report first.");
  process.exit(1);
}

if (regenerate) {
  for (const command of regenerationCommands()) {
    run(command, root);
  }
}

const report = readJson(reportPath);
const projects = projectMap();
const flatActions =
  (report.projects ?? [])
    .flatMap((project) => project.actions ?? [])
    .filter((action) => !selectedProject || action.project === selectedProject)
    .filter((action) => !selectedCategory || action.category === selectedCategory)
    .filter((action) => {
      const strategy = classify(action);
      if (selectedStrategy && strategy.mode !== selectedStrategy) return false;
      if (safeAutoOnly && strategy.mode !== "safe-auto" && strategy.mode !== "derived") return false;
      return true;
    });

const results = [];
for (const action of flatActions) {
  const project = projects.get(action.project) ?? {
    project: action.project,
    absolutePath: path.resolve(root, "..", action.project),
    projectPath: `../${action.project}`,
    label: action.project,
    validationProfile: null
  };
  const safety = gitSafety(project);
  const strategy = classify(action);
  if (cleanOnly && safety.dirty) continue;
  const skippedByDirtyFilter = skipDirty && safety.dirty;
  const result = {
    action,
    project: {
      project: project.project,
      label: project.label,
      path: project.projectPath,
      absolutePath: project.absolutePath,
      validationProfile: project.validationProfile
    },
    git: safety,
    strategy,
    mode: dryRun ? "dry-run" : "apply",
    status: skippedByDirtyFilter ? "skipped-dirty-worktree" : "planned"
  };
  if (!dryRun && skippedByDirtyFilter) {
    result.status = "skipped-dirty-worktree";
  } else if (!dryRun && safety.dirty) {
    result.status = "blocked-dirty-worktree";
  } else if (!dryRun && strategy.mode === "derived") {
    result.status = "derived-noop";
  } else if (!dryRun && strategy.mode !== "safe-auto") {
    result.status = "blocked-manual-strategy";
  }
  results.push(result);
  if (results.length >= maxActions) break;
}

const validation = [];
if (validate) {
  for (const command of validationCommands()) {
    const executed = run(command, root);
    validation.push(executed);
  }
}

const execution = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: dryRun ? "dry-run" : "apply",
  filters: {
    project: selectedProject || null,
    category: selectedCategory || null,
    strategy: selectedStrategy || null,
    cleanOnly,
    skipDirty,
    safeAutoOnly,
    regenerate,
    maxActions: Number.isFinite(maxActions) ? maxActions : null
  },
  actionCount: results.length,
  blockedCount: results.filter((result) => result.status.startsWith("blocked")).length,
  skippedCount: results.filter((result) => result.status.startsWith("skipped")).length,
  summary: summarize(results),
  results,
  validation
};

fs.writeFileSync(executionJsonPath, `${JSON.stringify(execution, null, 2)}\n`);

const lines = [
  "# Dashboard Next Actions Execution Report",
  "",
  `Generated: ${execution.generatedAt}`,
  `Mode: ${execution.mode}`,
  `Actions evaluated: ${execution.actionCount}`,
  `Blocked: ${execution.blockedCount}`,
  `Skipped: ${execution.skippedCount}`,
  "",
  "## Summary",
  "",
  `- Git status: ${formatCounts(execution.summary.gitStatusCounts)}`,
  `- Strategies: ${formatCounts(execution.summary.strategyCounts)}`,
  `- Status: ${formatCounts(execution.summary.statusCounts)}`,
  `- Recommended clean batch: ${execution.summary.recommendedCleanBatch.length} action(s)`,
  "",
  "## Actions",
  ""
];
for (const result of results) {
  lines.push(`- ${result.action.priority} ${result.action.project} [${result.action.category}] ${result.action.title}`);
  lines.push(`  Status: ${result.status}`);
  lines.push(`  Project path: ${result.project.path}`);
  lines.push(`  Git: ${result.git.status}`);
  lines.push(`  Strategy: ${result.strategy.mode} (${result.strategy.confidence}) - ${result.strategy.reason}`);
  if (result.project.validationProfile?.validationCommands?.length) {
    lines.push(`  Project validation: ${result.project.validationProfile.validationCommands.join(" | ")}`);
  }
}
if (validation.length) {
  lines.push("", "## Validation", "");
  for (const item of validation) {
    lines.push(`- ${item.status === 0 ? "pass" : "fail"} \`${item.command}\``);
  }
}
fs.writeFileSync(executionMdPath, `${lines.join("\n")}\n`);

console.log(`Dashboard next-actions execution report: ${path.relative(root, executionJsonPath)}`);
if (!dryRun && execution.blockedCount) process.exit(1);

function summarize(items) {
  const gitStatusCounts = countBy(items, (item) => item.git.status);
  const strategyCounts = countBy(items, (item) => item.strategy.mode);
  const statusCounts = countBy(items, (item) => item.status);
  const recommendedCleanBatch = items
    .filter((item) => item.git.status === "clean")
    .filter((item) => ["P0", "P1"].includes(item.action.priority))
    .slice(0, 10)
    .map((item) => ({
      project: item.action.project,
      priority: item.action.priority,
      category: item.action.category,
      title: item.action.title,
      strategy: item.strategy.mode
    }));
  return {
    gitStatusCounts,
    strategyCounts,
    statusCounts,
    recommendedCleanBatch
  };
}

function countBy(items, fn) {
  const counts = {};
  for (const item of items) {
    const key = fn(item) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function formatCounts(counts) {
  return Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(", ") || "none";
}
