#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const taxonomyPath = path.join(root, "docs/design/operating-interface-system-taxonomy.md");
const registryPath = path.join(root, "docs/design/operating-interface-system-registry.json");
const referenceLibraryPath = path.join(root, "docs/design/operating-interface-reference-library.json");
const stateCoveragePath = path.join(root, "docs/design/operating-interface-state-coverage.json");
const adoptionScorePath = path.join(root, "docs/design/operating-interface-adoption-score.json");
const visualQaPath = path.join(root, "docs/design/operating-interface-visual-qa.md");
const designContractPath = path.join(root, "packages/hermes-dashboard-kit/DESIGN.md");
const packageIndexPath = path.join(root, "packages/hermes-dashboard-kit/src/index.ts");
const productInterfacePath = path.join(root, "packages/hermes-dashboard-kit/src/product-interface.tsx");
const dataVisualizationPath = path.join(root, "packages/hermes-dashboard-kit/src/data-visualization.tsx");

const requiredFamilies = [
  "navigation-workspace",
  "information-architecture",
  "cards-panels",
  "tables-lists",
  "charts-visualization",
  "drilldowns-drawers",
  "command-control",
  "state-design",
  "search-filter-discovery",
  "ai-assisted-interaction",
  "visual-language",
  "reference-research",
  "project-retrofit",
];

const requiredComponents = [
  "DashboardShell",
  "DashboardSidebar",
  "DataTable",
  "KpiCard",
  "MarketTape",
  "MarketVolatilityDrawer",
  "PriceMovementChart",
  "LiquidityDepthChart",
  "CategoryHeatmap",
  "CommandBar",
  "VisualizationStateFrame",
  "TimeWindowSelector",
  "AiAssistantPanel",
  "EvidenceStack",
  "RecommendationStack",
  "DetailDrawerShell",
  "CommandPalette",
  "GlobalSearchOverlay",
  "SavedViewsManager",
  "ExpandableDataList",
  "CrosshairTooltipFrame",
  "OrderBookLadder",
  "ForecastConeChart",
  "WaterfallChart",
];

const requiredReferenceFamilies = [
  "executive-command",
  "trading-market-intelligence",
  "analytics-exploration",
  "incident-operations",
  "ai-copilot-workspaces",
  "search-filter-navigation",
  "review-approval-queues",
  "settings-permissions",
];

const requiredAdoptionProjects = ["nous-hermes-agent", "khashi-vc", "media-engine", "media-business-os", "tlc-capital-group-os", "hermes"];

function issue(severity, code, message) {
  return { severity, code, message };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validate() {
  const issues = [];
  for (const filePath of [taxonomyPath, registryPath, referenceLibraryPath, stateCoveragePath, adoptionScorePath, visualQaPath, designContractPath, packageIndexPath, productInterfacePath, dataVisualizationPath]) {
    if (!fs.existsSync(filePath)) {
      issues.push(issue("error", `missing:${path.relative(root, filePath)}`, `${path.relative(root, filePath)} is missing.`));
    }
  }
  if (issues.some((item) => item.severity === "error")) return issues;

  const taxonomy = fs.readFileSync(taxonomyPath, "utf8");
  const registry = readJson(registryPath);
  const referenceLibrary = readJson(referenceLibraryPath);
  const stateCoverage = readJson(stateCoveragePath);
  const adoptionScore = readJson(adoptionScorePath);
  const visualQa = fs.readFileSync(visualQaPath, "utf8");
  const designContract = fs.readFileSync(designContractPath, "utf8");
  const packageIndex = fs.readFileSync(packageIndexPath, "utf8");
  const productInterface = fs.readFileSync(productInterfacePath, "utf8");
  const dataVisualization = fs.readFileSync(dataVisualizationPath, "utf8");

  if (registry.schemaVersion !== 1) {
    issues.push(issue("error", "registry.schemaVersion", "schemaVersion must be 1."));
  }
  if (registry.canonicalPackage !== "@hermes/dashboard-kit") {
    issues.push(issue("error", "registry.canonicalPackage", "canonicalPackage must be @hermes/dashboard-kit."));
  }
  if (!Array.isArray(registry.families)) {
    issues.push(issue("error", "registry.families", "families must be an array."));
    return issues;
  }

  const families = new Map(registry.families.map((family) => [family.id, family]));
  for (const familyId of requiredFamilies) {
    const family = families.get(familyId);
    if (!family) {
      issues.push(issue("error", `family.missing:${familyId}`, `${familyId} is missing from the registry.`));
      continue;
    }
    for (const field of ["id", "label", "status"]) {
      if (!family[field]) issues.push(issue("error", `family.${familyId}.${field}`, `${field} is required.`));
    }
    if (!Array.isArray(family.components) || family.components.length === 0) {
      issues.push(issue("error", `family.${familyId}.components`, "components must list at least one current or planned component."));
    }
    if (!Array.isArray(family.gaps)) {
      issues.push(issue("error", `family.${familyId}.gaps`, "gaps must be listed, even when empty."));
    }
    if (!Array.isArray(family.firstConsumers) || family.firstConsumers.length === 0) {
      issues.push(issue("error", `family.${familyId}.firstConsumers`, "firstConsumers must identify the initial consuming project(s)."));
    }
  }

  for (const phrase of [
    "Navigation And Workspace Structure",
    "Information Architecture",
    "Cards And Panels",
    "Tables And Lists",
    "Charts And Data Visualization",
    "Drilldowns And Drawers",
    "Command And Control",
    "State Design",
    "Search, Filtering, And Discovery",
    "AI-Assisted Interaction",
    "Visual Language",
    "Reference Research Beyond Charts",
    "Project Retrofit Tracks",
  ]) {
    if (!taxonomy.includes(phrase)) {
      issues.push(issue("error", `taxonomy.section:${phrase}`, `taxonomy is missing section ${phrase}.`));
    }
  }

  for (const component of requiredComponents) {
    const inRegistry = registry.families.some((family) => (family.components ?? []).includes(component));
    if (!inRegistry) {
      issues.push(issue("error", `component.registry:${component}`, `${component} must appear in the operating interface registry.`));
    }
  }

  if (referenceLibrary.schemaVersion !== 1 || !Array.isArray(referenceLibrary.patternFamilies)) {
    issues.push(issue("error", "referenceLibrary.schema", "reference library must be schemaVersion 1 with patternFamilies."));
  } else {
    const referenceFamilies = new Set(referenceLibrary.patternFamilies.map((family) => family.id));
    for (const familyId of requiredReferenceFamilies) {
      if (!referenceFamilies.has(familyId)) {
        issues.push(issue("error", `referenceLibrary.family:${familyId}`, `${familyId} is missing from the reference library.`));
      }
    }
  }

  if (!Array.isArray(stateCoverage.requiredStates) || !stateCoverage.requiredStates.includes("permission-limited")) {
    issues.push(issue("error", "stateCoverage.requiredStates", "state coverage must include permission-limited."));
  }
  for (const component of ["CommandPalette", "GlobalSearchOverlay", "SavedViewsManager", "ExpandableDataList", "OrderBookLadder", "ForecastConeChart", "WaterfallChart"]) {
    if (!stateCoverage.components?.some((item) => item.id === component)) {
      issues.push(issue("error", `stateCoverage.component:${component}`, `${component} must have state coverage.`));
    }
  }

  if (adoptionScore.schemaVersion !== 1 || !Array.isArray(adoptionScore.projects)) {
    issues.push(issue("error", "adoptionScore.schema", "adoption score must be schemaVersion 1 with projects."));
  } else {
    const adoptionProjects = new Set(adoptionScore.projects.map((project) => project.id));
    for (const projectId of requiredAdoptionProjects) {
      if (!adoptionProjects.has(projectId)) {
        issues.push(issue("error", `adoptionScore.project:${projectId}`, `${projectId} is missing from adoption scoring.`));
      }
    }
  }

  for (const phrase of ["Required Viewports", "Required States", "Automated screenshot comparison"]) {
    if (!visualQa.includes(phrase)) {
      issues.push(issue("error", `visualQa:${phrase}`, `visual QA manifest must include ${phrase}.`));
    }
  }

  for (const expected of ["data_visualization", "product_interface", "MarketTape", "AiAssistantPanel", "CommandPalette", "OrderBookLadder"]) {
    if (!designContract.includes(expected)) {
      issues.push(issue("error", `designContract:${expected}`, `DESIGN.md must mention ${expected}.`));
    }
  }
  for (const expected of ["CommandPalette", "GlobalSearchOverlay", "SavedViewsManager", "ExpandableDataList"]) {
    if (!productInterface.includes(`function ${expected}`)) {
      issues.push(issue("error", `productInterface:${expected}`, `product-interface.tsx must export function ${expected}.`));
    }
  }
  for (const expected of ["CrosshairTooltipFrame", "OrderBookLadder", "ForecastConeChart", "WaterfallChart"]) {
    if (!dataVisualization.includes(`function ${expected}`)) {
      issues.push(issue("error", `dataVisualization:${expected}`, `data-visualization.tsx must export function ${expected}.`));
    }
  }
  for (const exportName of ["./data-visualization", "./product-interface"]) {
    if (!packageIndex.includes(exportName)) {
      issues.push(issue("error", `packageExport:${exportName}`, `src/index.ts must export ${exportName}.`));
    }
  }

  return issues;
}

const issues = validate();
const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
for (const item of issues) {
  console.log(`${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
}
console.log(`Operating interface system validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) process.exit(1);
