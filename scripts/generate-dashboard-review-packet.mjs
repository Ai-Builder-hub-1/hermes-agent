#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.join(root, "docs/design/dashboard-review-packets");
const standardPath = path.join(root, "docs/design/dashboard-review-packet-standard.json");
const tierPath = path.join(root, "docs/design/project-dashboard-tier-assessment.json");
const backlogPath = path.join(root, "docs/design/dashboard-cross-project-action-backlog.json");
const mobbinPath = path.join(root, "docs/design/dashboard-mobbin-reference-map.json");
const visualPath = path.join(root, "docs/design/dashboard-visual-evidence-layer.json");
const componentPath = path.join(root, "docs/design/dashboard-component-maturity-registry.json");
const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const requestedProject = projectIndex >= 0 ? args[projectIndex + 1] : "";
const routeIndex = args.indexOf("--route");
const requestedRoute = routeIndex >= 0 ? args[routeIndex + 1] : "";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

for (const file of [standardPath, tierPath, backlogPath, mobbinPath, visualPath, componentPath]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required review-packet source: ${path.relative(root, file)}`);
    process.exit(1);
  }
}

const standard = readJson(standardPath);
const tiers = readJson(tierPath);
const backlog = readJson(backlogPath);
const mobbin = readJson(mobbinPath);
const visual = readJson(visualPath);
const components = readJson(componentPath);
const selectedProjects = requestedProject
  ? (tiers.projects ?? []).filter((project) => project.project === requestedProject)
  : (tiers.projects ?? []);
const selectedBacklogItems = requestedProject
  ? (backlog.items ?? []).filter((item) => item.project === requestedProject)
  : (backlog.items ?? []);

if (requestedProject && selectedProjects.length === 0) {
  console.error(`Unknown project for review packet: ${requestedProject}`);
  process.exit(1);
}
if (requestedProject && requestedRoute) {
  console.error("Use either --project or --route for review packet scope, not both.");
  process.exit(1);
}

const sourceHash = crypto
  .createHash("sha256")
  .update(JSON.stringify({ standard, tiers, backlog, mobbin, visual, components, requestedProject, requestedRoute }))
  .digest("hex")
  .slice(0, 16);

const packet = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceHash,
  scope: requestedRoute ? "route" : requestedProject ? "project" : "global",
  project: requestedProject || null,
  route: requestedRoute || null,
  standardVersion: standard.version,
  requiredSections: standard.requiredSections,
  projectCount: selectedProjects.length,
  backlogCount: selectedBacklogItems.length,
  referenceCount: (mobbin.references ?? []).length,
  componentCount: (components.components ?? []).length,
  visualViewportCount: (visual.viewportMatrix ?? []).length,
  projects: selectedProjects,
  backlogItems: selectedBacklogItems,
  approvalChecklist: standard.approvalChecklist
};

fs.mkdirSync(outputDir, { recursive: true });
const outputBase = requestedRoute ? `route-${requestedRoute.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "root"}` : requestedProject || "latest";
fs.writeFileSync(path.join(outputDir, `${outputBase}.json`), `${JSON.stringify(packet, null, 2)}\n`);

const lines = [
  requestedRoute ? `# Dashboard Review Packet: ${requestedRoute}` : requestedProject ? `# Dashboard Review Packet: ${requestedProject}` : "# Dashboard Review Packet",
  "",
  `Generated: ${packet.generatedAt}`,
  `Source hash: ${packet.sourceHash}`,
  `Scope: ${packet.scope}`,
  "",
  "## Summary",
  "",
  `- Projects assessed: ${packet.projectCount}`,
  `- External backlog items: ${packet.backlogCount}`,
  `- Mobbin references mapped: ${packet.referenceCount}`,
  `- Component maturity entries: ${packet.componentCount}`,
  `- Visual viewports required: ${packet.visualViewportCount}`,
  "",
  "## Approval Checklist",
  "",
  ...packet.approvalChecklist.map((item) => `- ${item}`),
  "",
  "## External Backlog",
  "",
  ...(packet.backlogItems.length ? packet.backlogItems.map((item) => `- ${item.priority} ${item.projectName}: ${item.action}`) : ["- No external backlog items."])
];

fs.writeFileSync(path.join(outputDir, `${outputBase}.md`), `${lines.join("\n")}\n`);
console.log(`Dashboard review packet generated: docs/design/dashboard-review-packets/${outputBase}.json (${packet.sourceHash})`);
