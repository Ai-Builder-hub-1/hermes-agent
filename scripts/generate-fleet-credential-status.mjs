#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  markdownTable,
  root,
  workspaceRoot,
  writeJson,
  writeMarkdown
} from "./dashboard-report-utils.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const production = args.has("--production");
const strict = args.has("--strict");
const hostArg = process.argv.find((arg) => arg.startsWith("--host="));
const host = hostArg ? hostArg.slice("--host=".length) : "hermes-os";
const generatedAt = new Date().toISOString();

const contracts = [
  {
    credentialId: "binance.trading-api",
    label: "Binance Trading API",
    variables: ["BINANCE_API_KEY", "BINANCE_SECRET_KEY"],
    consumers: [
      {
        projectId: "investing-system",
        repo: "investing-system",
        envExamplePath: path.join(workspaceRoot, "investing-system", ".env.example"),
        localEnvPath: path.join(workspaceRoot, "investing-system", ".env"),
        expectedProductionEnv: "/root/apps/investing-system/.env",
        containers: ["deploy-investing-system-1", "deploy-oanda-practice-runtime-1"]
      },
      {
        projectId: "khashi-vc",
        repo: "khashi-vc",
        envExamplePath: path.join(workspaceRoot, "khashi-vc", ".env.example"),
        localEnvPath: path.join(workspaceRoot, "khashi-vc", ".env"),
        expectedProductionEnv: "/root/apps/khashi-vc/.env",
        containers: [
          "deploy-khashi-1",
          "deploy-khashi-scheduler-1",
          "deploy-khashi-sync-worker-1",
          "deploy-khashi-poll-worker-1",
          "deploy-khashi-stream-worker-1",
          "deploy-khashi-maintenance-worker-1"
        ]
      }
    ]
  }
];

const productionRows = production ? inspectProduction(host, contracts) : new Map();

const projects = contracts.flatMap((contract) => contract.consumers.map((consumer) => {
  const templateVariables = inspectEnvFile(consumer.envExamplePath, contract.variables);
  const localVariables = inspectEnvFile(consumer.localEnvPath, contract.variables);
  const containerRows = consumer.containers.map((container) => productionRows.get(container) ?? {
    container,
    available: false,
    health: "not-checked",
    variables: contract.variables.map((name) => ({
      name,
      configured: false,
      valueLength: 0,
      source: "production_not_checked"
    }))
  });
  const productionVariables = contract.variables.map((name) => summarizeProductionVariable(name, containerRows));
  const missingProduction = production ? productionVariables.filter((item) => !item.configured).map((item) => item.name) : [];
  const templateMissing = templateVariables.filter((item) => !item.declared).map((item) => item.name);
  const status = production
    ? missingProduction.length
      ? missingProduction.length === contract.variables.length ? "missing" : "partial"
      : "ready"
    : "unknown";

  return {
    projectId: consumer.projectId,
    credentialId: contract.credentialId,
    status,
    expectedProductionEnv: consumer.expectedProductionEnv,
    envTemplate: {
      path: path.relative(root, consumer.envExamplePath),
      variables: templateVariables
    },
    localEnv: {
      path: path.relative(root, consumer.localEnvPath),
      variables: localVariables
    },
    containers: containerRows,
    variables: productionVariables,
    blockers: [
      ...templateMissing.map((name) => `Template missing ${name}`),
      ...missingProduction.map((name) => `Production missing ${name}`)
    ]
  };
}));

const report = {
  id: "fleet-credential-status",
  contractVersion: "fleet-credential-status.v1",
  generatedAt,
  mode: production ? "production-proof" : "local-template-scan",
  host: production ? host : null,
  secretExposurePolicy: "values_never_read_or_returned",
  credentials: contracts.map((contract) => ({
    credentialId: contract.credentialId,
    label: contract.label,
    variables: contract.variables,
    consumers: contract.consumers.map((consumer) => ({
      projectId: consumer.projectId,
      expectedProductionEnv: consumer.expectedProductionEnv,
      containers: consumer.containers
    }))
  })),
  projects,
  summary: summarize(projects, production)
};

const jsonPath = path.join(root, "docs/fleet/fleet-credential-status.json");
const mdPath = path.join(root, "docs/fleet/fleet-credential-status.md");
const runtimeJsonPath = path.join(root, "hermes_cli/data/fleet-credential-status.json");
if (write) {
  writeJson(jsonPath, report);
  writeJson(runtimeJsonPath, report);
  writeMarkdown(mdPath, renderMarkdown(report));
}

console.log(`Fleet credential status: ${report.summary.readyProjects}/${report.summary.totalProjects} ready (${report.mode}).`);
for (const project of projects) {
  console.log(`- ${project.projectId}: ${project.status}${project.blockers.length ? ` (${project.blockers.join("; ")})` : ""}`);
}

if (strict && report.summary.blockers.length) process.exit(1);

function inspectEnvFile(file, variables) {
  let content = "";
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    return variables.map((name) => ({ name, declared: false, configured: false, valueLength: 0, source: "file_missing" }));
  }
  return variables.map((name) => {
    const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
    const value = match ? match[1] ?? "" : "";
    return {
      name,
      declared: Boolean(match),
      configured: Boolean(value),
      valueLength: stripQuotes(value).length,
      source: "project_env_file"
    };
  });
}

function stripQuotes(value) {
  return String(value).replace(/^['"]|['"]$/g, "");
}

function inspectProduction(host, contracts) {
  const containers = [...new Set(contracts.flatMap((contract) => contract.consumers.flatMap((consumer) => consumer.containers)))];
  const variables = [...new Set(contracts.flatMap((contract) => contract.variables))];
  const remoteScript = `
set -e
for container in ${containers.map(shellQuote).join(" ")}; do
  if docker inspect "$container" >/dev/null 2>&1; then
    state=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || printf unknown)
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || printf unknown)
    for variable in ${variables.map(shellQuote).join(" ")}; do
      length=$(docker exec "$container" sh -lc 'value=$(printenv "$1" || true); printf "%s" "\${#value}"' sh "$variable" 2>/dev/null || printf 0)
      printf '%s\\t%s\\t%s\\t%s\\t%s\\n' "$container" "$state" "$health" "$variable" "$length"
    done
  else
    for variable in ${variables.map(shellQuote).join(" ")}; do
      printf '%s\\tmissing\\tmissing\\t%s\\t0\\n' "$container" "$variable"
    done
  fi
done
`;
  const output = execFileSync("ssh", [host, remoteScript], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const byContainer = new Map();
  for (const line of output.split("\n").filter(Boolean)) {
    const [container, state, health, name, rawLength] = line.split("\t");
    if (!byContainer.has(container)) {
      byContainer.set(container, { container, available: state !== "missing", state, health, variables: [] });
    }
    byContainer.get(container).variables.push({
      name,
      configured: Number(rawLength) > 0,
      valueLength: Number(rawLength) || 0,
      source: "production_container"
    });
  }
  return byContainer;
}

function summarizeProductionVariable(name, containerRows) {
  const rows = containerRows.flatMap((row) => row.variables.filter((item) => item.name === name));
  const configuredContainers = rows.filter((item) => item.configured).length;
  const lengths = [...new Set(rows.filter((item) => item.configured).map((item) => item.valueLength))];
  return {
    name,
    configured: rows.length > 0 && configuredContainers === rows.length,
    configuredContainers,
    expectedContainers: rows.length,
    valueLength: lengths.length === 1 ? lengths[0] : 0,
    source: "production_container"
  };
}

function summarize(projects, productionMode) {
  const readyProjects = projects.filter((project) => project.status === "ready").length;
  const blockers = projects.flatMap((project) => project.blockers.map((blocker) => `${project.projectId}: ${blocker}`));
  return {
    status: blockers.length ? "blocked" : productionMode ? "ready" : "unknown",
    totalProjects: projects.length,
    readyProjects,
    blockers
  };
}

function renderMarkdown(report) {
  const projectRows = report.projects.map((project) => [
    project.projectId,
    project.credentialId,
    project.status,
    project.variables.map((item) => `${item.name}: ${item.configured ? "set" : "missing"}${item.valueLength ? ` (${item.valueLength})` : ""}`).join("<br>"),
    project.blockers.length ? project.blockers.join("<br>") : "none"
  ]);
  const containerRows = report.projects.flatMap((project) => project.containers.map((container) => [
    project.projectId,
    container.container,
    container.available ? "available" : "missing",
    container.health,
    container.variables.map((item) => `${item.name}: ${item.configured ? "set" : "missing"}${item.valueLength ? ` (${item.valueLength})` : ""}`).join("<br>")
  ]));
  return [
    "# Fleet Credential Status",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Mode: ${report.mode}`,
    "",
    `Secret policy: ${report.secretExposurePolicy}`,
    "",
    "## Project Status",
    "",
    markdownTable(["Project", "Credential", "Status", "Variables", "Blockers"], projectRows),
    "",
    "## Production Containers",
    "",
    markdownTable(["Project", "Container", "Available", "Health", "Variables"], containerRows),
    "",
    "## Frontend Rule",
    "",
    "Render configured/missing status, source, last verified time, and optional value length. Never render credential values or ask the operator to paste secrets into chat."
  ].join("\n");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}
