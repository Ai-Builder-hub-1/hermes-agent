#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const full = args.has("--full");
const strict = args.has("--strict");
const write = !args.has("--no-write");
const registryPath = path.join(root, "packages/hermes-dashboard-kit/adoption/registry.json");
const reportPath = path.join(root, "docs/design/dashboard-fleet-v60-e2e-report.json");
const markdownPath = path.join(root, "docs/design/dashboard-fleet-v60-e2e-report.md");
const sharedEnv = loadSharedEnv();

const baseCommandPlan = [
  { script: "dashboard:kit:check", required: false, kind: "kit" },
  { script: "dashboard:standard:check", required: true, kind: "standard" },
  { script: "dashboard:proof:capture", required: false, kind: "proof" },
  { script: "dashboard:proof", required: false, kind: "proof" },
  { script: "dashboard:proof:screenshot", required: false, kind: "proof" }
];

const fullCommandPlan = [
  ...baseCommandPlan,
  { script: "test", required: false, kind: "test" },
  { script: "smoke", required: false, kind: "smoke" },
  { script: "release:check", required: false, kind: "release" }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(file) {
  return fs.existsSync(file);
}

function packageScripts(projectRoot) {
  const packagePath = path.join(projectRoot, "package.json");
  if (!exists(packagePath)) return null;
  return readJson(packagePath).scripts ?? {};
}

async function runNpmScript(projectRoot, script, command = {}) {
  if (command.kind === "proof") {
    return withDashboardServer(projectRoot, () => runNpmScriptSync(projectRoot, script));
  }
  return runNpmScriptSync(projectRoot, script);
}

function runNpmScriptSync(projectRoot, script) {
  const result = spawnSync("npm", ["run", script], {
    cwd: projectRoot,
    env: { ...process.env, ...sharedEnv },
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 8
  });

  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  return {
    script,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    signal: result.signal,
    stdoutTail: tail(stdout),
    stderrTail: tail(stderr)
  };
}

async function withDashboardServer(projectRoot, runProof) {
  const launch = dashboardLaunchConfig(projectRoot);
  if (!launch.command?.length) return runProof();

  const alreadyHealthy = await isHealthy(launch.healthUrl);
  let child = null;
  let serverStarted = false;
  let serverLog = "";

  try {
    if (!alreadyHealthy) {
      child = spawn(launch.command[0], launch.command.slice(1), {
        cwd: projectRoot,
        env: { ...process.env, ...sharedEnv },
        stdio: ["ignore", "pipe", "pipe"]
      });
      serverStarted = true;
      child.stdout?.on("data", (chunk) => {
        serverLog += chunk.toString();
        serverLog = tail(serverLog, 40);
      });
      child.stderr?.on("data", (chunk) => {
        serverLog += chunk.toString();
        serverLog = tail(serverLog, 40);
      });
      const ready = await waitForHealth(launch.healthUrl, 20000);
      if (!ready) {
        const result = {
          script: "dashboard-server",
          status: "failed",
          exitCode: null,
          signal: null,
          stdoutTail: "",
          stderrTail: `Dashboard server did not become healthy at ${launch.healthUrl || "unknown health URL"}.\n${serverLog}`.trim()
        };
        return result;
      }
    }

    const result = runProof();
    result.server = {
      command: launch.command.join(" "),
      healthUrl: launch.healthUrl,
      startedForProof: serverStarted,
      alreadyHealthy
    };
    return result;
  } finally {
    if (child && serverStarted) {
      child.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!child.killed) child.kill("SIGKILL");
    }
  }
}

function dashboardLaunchConfig(projectRoot) {
  const manifestPath = path.join(projectRoot, "hermes.dashboards.json");
  const scripts = packageScripts(projectRoot) ?? {};
  let dashboard = null;
  if (fs.existsSync(manifestPath)) {
    try {
      dashboard = readJson(manifestPath).dashboards?.[0] ?? null;
    } catch {
      dashboard = null;
    }
  }

  const command =
    dashboard?.command?.length
      ? dashboard.command
      : fallbackDashboardCommand(scripts);
  return {
    command,
    healthUrl:
      normalizeHealthUrl(projectRoot, dashboard?.healthUrl)
  };
}

function fallbackDashboardCommand(scripts) {
  for (const script of ["dashboard:server", "ops:dashboard:server", "dev", "start"]) {
    if (scripts[script]) return ["npm", "run", script];
  }
  return [];
}

function normalizeHealthUrl(projectRoot, healthUrl) {
  if (healthUrl?.startsWith("http://") || healthUrl?.startsWith("https://")) return healthUrl;
  const basename = path.basename(projectRoot).toLowerCase();
  if (basename === "khashi-vc") return `http://127.0.0.1:3100${healthUrl || "/readyz"}`;
  if (basename === "meal-assistant") return `http://127.0.0.1:4184${healthUrl || "/health"}`;
  if (basename === "media-business-operations") return `http://127.0.0.1:4100${healthUrl || "/health"}`;
  if (basename === "media-engine") return `http://127.0.0.1:4200${healthUrl || "/health"}`;
  if (basename === "investing-system") return `http://127.0.0.1:3102${healthUrl || "/health"}`;
  if (!healthUrl) return "";
  return healthUrl;
}

async function isHealthy(url) {
  if (!url) return false;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForHealth(url, timeoutMs = 15000) {
  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return true;
  }
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthy(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function tail(value, maxLines = 18) {
  if (!value) return "";
  const lines = value.split(/\r?\n/);
  return lines.slice(Math.max(0, lines.length - maxLines)).join("\n");
}

function loadSharedEnv() {
  const envPath = path.join(process.env.HOME ?? "", ".hermes.env");
  if (!envPath || !fs.existsSync(envPath)) return {};
  const values = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) values[key] = value;
  }
  return values;
}

const registry = readJson(registryPath);
const generatedAt = new Date().toISOString();
const commandPlan = full ? fullCommandPlan : baseCommandPlan;
const projects = [];

for (const project of registry.projects ?? []) {
  const projectRoot = path.resolve(root, project.path);
  const scripts = packageScripts(projectRoot);
  const manifestPath = path.resolve(root, project.manifest);
  const manifestExists = exists(manifestPath);
  const commands = [];
  const missingRequired = [];

  if (!scripts) {
    projects.push({
      id: project.id,
      name: project.name,
      path: path.relative(root, projectRoot),
      status: "failed",
      manifestExists,
      packageExists: false,
      commands: [],
      missingRequired: ["package.json"],
      notes: ["Project has no package.json; cannot run V60 e2e checks."]
    });
    continue;
  }

  for (const command of commandPlan) {
    if (!scripts[command.script]) {
      if (command.required) missingRequired.push(command.script);
      continue;
    }
    commands.push(await runNpmScript(projectRoot, command.script, command));
  }

  const failedCommands = commands.filter((command) => command.status !== "passed");
  const status =
    !manifestExists || missingRequired.length || failedCommands.length
      ? "failed"
      : "passed";

  projects.push({
    id: project.id,
    name: project.name,
    path: path.relative(root, projectRoot) || ".",
    targetExperienceBand: project.targetExperienceBand,
    bridgeStatus: project.bridgeStatus,
    manifestExists,
    packageExists: true,
    status,
    commands,
    missingRequired,
    notes: [
      !manifestExists ? "Missing .hermes-dashboard.json manifest." : "",
      missingRequired.length ? `Missing required script(s): ${missingRequired.join(", ")}` : "",
      failedCommands.length ? `${failedCommands.length} command(s) failed.` : ""
    ].filter(Boolean)
  });
}

const summary = {
  totalProjects: projects.length,
  passed: projects.filter((project) => project.status === "passed").length,
  failed: projects.filter((project) => project.status !== "passed").length,
  fullMode: full,
  strict
};

const report = {
  schemaVersion: 1,
  generatedAt,
  sourceRegistry: "packages/hermes-dashboard-kit/adoption/registry.json",
  commandPlan: commandPlan.map((command) => command.script),
  summary,
  projects
};

if (write) {
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(markdownPath, renderMarkdown(report));
}

console.log(`Dashboard fleet V60 e2e: ${summary.passed}/${summary.totalProjects} passed (${summary.failed} failed).`);
for (const project of projects) {
  console.log(`- ${project.status.toUpperCase()} ${project.id}: ${project.commands.map((command) => `${command.script}=${command.status}`).join(", ") || "no commands"}${project.missingRequired.length ? `; missing ${project.missingRequired.join(", ")}` : ""}`);
}
if (write) {
  console.log(`Wrote ${path.relative(root, reportPath)}`);
  console.log(`Wrote ${path.relative(root, markdownPath)}`);
}

if (strict && summary.failed) {
  process.exit(1);
}

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Fleet V60 E2E Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.summary.fullMode ? "full" : "standard"}`,
    "",
    "## Summary",
    "",
    `- Projects: ${report.summary.totalProjects}`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "## Projects",
    "",
    "| Project | Status | Commands | Gaps |",
    "|---|---|---|---|"
  ];

  for (const project of report.projects) {
    const commands = project.commands.map((command) => `${command.script}: ${command.status}`).join("<br>");
    const gaps = [
      ...project.missingRequired.map((script) => `missing ${script}`),
      ...project.commands.filter((command) => command.status !== "passed").map((command) => `${command.script} failed`),
      ...(!project.manifestExists ? ["missing manifest"] : [])
    ].join("<br>") || "none";
    lines.push(`| ${escapePipe(project.name)} | ${project.status} | ${escapePipe(commands || "none")} | ${escapePipe(gaps)} |`);
  }

  const failures = report.projects.flatMap((project) =>
    project.commands
      .filter((command) => command.status !== "passed")
      .map((command) => ({ project, command }))
  );

  lines.push("", "## Failure Details", "");
  if (!failures.length) {
    lines.push("No command failures.");
  } else {
    for (const { project, command } of failures) {
      lines.push(`### ${project.name} - ${command.script}`);
      lines.push("");
      lines.push(`Exit: ${command.exitCode ?? "unknown"}${command.signal ? ` (${command.signal})` : ""}`);
      if (command.stdoutTail) {
        lines.push("", "Stdout tail:", "", "```text", command.stdoutTail, "```");
      }
      if (command.stderrTail) {
        lines.push("", "Stderr tail:", "", "```text", command.stderrTail, "```");
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}
