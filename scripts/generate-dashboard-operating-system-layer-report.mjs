#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "docs/design/dashboard-operating-system-layer-registry.json");
const packagePath = path.join(root, "package.json");
const jsonOutputPath = path.join(root, "docs/design/dashboard-operating-system-layer-report.json");
const mdOutputPath = path.join(root, "docs/design/dashboard-operating-system-layer-report.md");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const registry = readJson(registryPath);
const packageJson = readJson(packagePath);
const scripts = packageJson.scripts ?? {};
const generatedAt = new Date().toISOString();

const layers = (registry.layers ?? []).map((layer) => {
  const artifactResults = (layer.sourceArtifacts ?? []).map((artifact) => ({
    path: artifact,
    exists: exists(artifact)
  }));
  const commandResults = (layer.enforcementCommands ?? []).map((command) => ({
    name: command,
    exists: Boolean(scripts[command])
  }));
  const missingArtifacts = artifactResults.filter((artifact) => !artifact.exists);
  const missingCommands = commandResults.filter((command) => !command.exists);
  const status =
    missingArtifacts.length || missingCommands.length
      ? "needs-work"
      : "mapped";

  return {
    number: layer.number,
    id: layer.id,
    name: layer.name,
    band: layer.band,
    status,
    purpose: layer.purpose,
    maturityOutput: layer.maturityOutput,
    sourceArtifacts: artifactResults,
    enforcementCommands: commandResults,
    proofSignals: layer.proofSignals ?? [],
    gaps: [
      ...missingArtifacts.map((artifact) => `Missing artifact: ${artifact.path}`),
      ...missingCommands.map((command) => `Missing package script: ${command.name}`)
    ]
  };
});

const byBand = Object.fromEntries((registry.maturityBands ?? []).map((band) => {
  const bandLayers = layers.filter((layer) => layer.band === band.id);
  return [
    band.id,
    {
      range: band.range,
      meaning: band.meaning,
      total: bandLayers.length,
      mapped: bandLayers.filter((layer) => layer.status === "mapped").length,
      needsWork: bandLayers.filter((layer) => layer.status !== "mapped").length
    }
  ];
}));

const report = {
  schemaVersion: 1,
  generatedAt,
  registryVersion: registry.version,
  owner: registry.owner,
  summary: {
    totalLayers: layers.length,
    mapped: layers.filter((layer) => layer.status === "mapped").length,
    needsWork: layers.filter((layer) => layer.status !== "mapped").length,
    operatingSystemMappedPercent:
      layers.length ? Math.round((layers.filter((layer) => layer.status === "mapped").length / layers.length) * 1000) / 10 : 0
  },
  promotionPolicy: registry.promotionPolicy,
  maturityBands: byBand,
  layers
};

fs.writeFileSync(jsonOutputPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdOutputPath, renderMarkdown(report));

console.log(`Wrote ${path.relative(root, jsonOutputPath)}`);
console.log(`Wrote ${path.relative(root, mdOutputPath)}`);
console.log(`Dashboard operating system layer report: ${report.summary.mapped}/${report.summary.totalLayers} mapped (${report.summary.operatingSystemMappedPercent}%).`);

function renderMarkdown(report) {
  const lines = [
    "# Dashboard Operating System Layer Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Registry: ${report.registryVersion}`,
    `Owner: ${report.owner}`,
    "",
    "## Summary",
    "",
    `- Total layers: ${report.summary.totalLayers}`,
    `- Mapped layers: ${report.summary.mapped}`,
    `- Needs work: ${report.summary.needsWork}`,
    `- Operating system mapped: ${report.summary.operatingSystemMappedPercent}%`,
    "",
    "## Bands",
    ""
  ];

  for (const [id, band] of Object.entries(report.maturityBands)) {
    lines.push(`- ${id} (${band.range}): ${band.mapped}/${band.total} mapped. ${band.meaning}`);
  }

  lines.push("", "## Layers", "");
  lines.push("| # | Layer | Band | Status | Maturity Output |");
  lines.push("|---:|---|---|---|---|");
  for (const layer of report.layers) {
    lines.push(`| ${layer.number} | ${escapePipe(layer.name)} | ${layer.band} | ${layer.status} | ${escapePipe(layer.maturityOutput)} |`);
  }

  const gaps = report.layers.filter((layer) => layer.gaps.length);
  lines.push("", "## Gaps", "");
  if (!gaps.length) {
    lines.push("No missing artifacts or commands in the layer map.");
  } else {
    for (const layer of gaps) {
      lines.push(`- Layer ${layer.number} ${layer.name}: ${layer.gaps.join("; ")}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}
