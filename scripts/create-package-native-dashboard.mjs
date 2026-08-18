#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));

if (args.help || !args.projectDir || !args.projectId || !args.name) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

const projectDir = path.resolve(root, args.projectDir);
const projectId = kebab(args.projectId);
const packageName = kebab(args.packageName || args.projectId);
const title = args.name;
const description = args.description || `${title} package-native dashboard.`;
const theme = args.theme || "system";
const route = args.route || "/";
const template = resolveStarterTemplate(args.template || "cockpit");
const cssHash = hash(path.join(root, "packages/hermes-dashboard-kit/static/hermes-dashboard-kit.css"));

if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0 && args.force !== "true") {
  throw new Error(`Refusing to scaffold into non-empty directory without --force true: ${projectDir}`);
}

writeNewFile(path.join(projectDir, "package.json"), packageJsonTemplate({ packageName }));
writeNewFile(path.join(projectDir, "index.html"), indexTemplate({ title }));
writeNewFile(path.join(projectDir, "src/main.tsx"), mainTemplate());
writeNewFile(path.join(projectDir, "src/App.tsx"), appTemplate({ title, description, theme, template }));
writeNewFile(path.join(projectDir, "src/dashboard-theme.css"), themeCssTemplate());
writeNewFile(path.join(projectDir, "docs/design/mobbin-reference-intake.md"), mobbinIntakeTemplate({ title, template }));
writeNewFile(path.join(projectDir, "docs/design/design-review-checklist.md"), designReviewTemplate({ title, template }));
writeNewFile(path.join(projectDir, ".hermes-dashboard.json"), adoptionManifestTemplate({ projectId, cssHash }));
writeNewFile(path.join(projectDir, "hermes.dashboards.json"), dashboardRegistryTemplate({ projectId, title, template }));
writeNewFile(path.join(projectDir, "tests/dashboard.spec.ts"), playwrightTestTemplate({ route, title }));
writeNewFile(path.join(projectDir, "scripts/capture-proof-screenshots.mjs"), proofCaptureTemplate());
writeNewFile(path.join(projectDir, "tsconfig.json"), tsconfigTemplate());
writeNewFile(path.join(projectDir, "vite.config.ts"), viteConfigTemplate());
writeNewFile(path.join(projectDir, "playwright.config.ts"), playwrightConfigTemplate());
writeNewFile(path.join(projectDir, "README.md"), readmeTemplate({ title, projectId }));

console.log(`Created package-native dashboard scaffold: ${title}`);
console.log(`Project: ${path.relative(root, projectDir)}`);
console.log("Next:");
console.log(`  cd ${path.relative(root, projectDir)}`);
console.log("  npm install");
console.log("  npm run dev");

function parseArgs(raw) {
  const parsed = {};
  for (let index = 0; index < raw.length; index += 1) {
    const arg = raw[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
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

function printUsage() {
  console.log(`Usage:
  npm run dashboard:package-native:create -- --project-dir ../new-dashboard --project-id new-dashboard --name "New Dashboard"

Required:
  --project-dir     Target project directory.
  --project-id      Dashboard adoption id.
  --name            Product/dashboard display name.

Options:
  --package-name    npm package name. Defaults from project id.
  --description     Dashboard description.
  --theme           light, dark, or system. Defaults to system.
  --template        cockpit, operations-queue, market-browser, content-calendar, cost-command, household-planner, approval-workflow.
  --route           Primary route for proof test. Defaults to /.
  --force true      Allow scaffolding into an existing non-empty directory.`);
}

function writeNewFile(file, content) {
  if (fs.existsSync(file) && args.force !== "true") {
    throw new Error(`Refusing to overwrite existing file: ${file}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function kebab(value) {
  return String(value)
    .trim()
    .replace(/['"]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function resolveStarterTemplate(id) {
  const templates = {
    cockpit: {
      id: "cockpit",
      label: "Product Cockpit",
      operatorQuestion: "What needs attention now and what decision should I make?",
      nav: ["Command", "Evidence", "Proof"],
      metrics: ["Decision State", "Open Signals", "Proof Coverage"],
      tableTitle: "Operating Evidence",
      chartTitle: "Signal Trend",
      chartLabels: ["Attention", "Risk", "Proof"],
      intakeBriefs: ["product cockpit dashboard command center", "analytics dashboard sidebar metrics table", "dashboard proof states drilldown"]
    },
    "operations-queue": {
      id: "operations-queue",
      label: "Operations Queue",
      operatorQuestion: "What work is running, blocked, due, or ready for review?",
      nav: ["Queue", "Workers", "Exceptions"],
      metrics: ["Running", "Due", "Blocked"],
      tableTitle: "Work Queue",
      chartTitle: "Queue Pressure",
      chartLabels: ["Queued", "Running", "Blocked"],
      intakeBriefs: ["operations queue dashboard", "job monitoring dashboard", "workflow approvals dashboard"]
    },
    "market-browser": {
      id: "market-browser",
      label: "Market Browser",
      operatorQuestion: "Which market, category, or asset is worth inspecting next?",
      nav: ["Markets", "Categories", "Detail"],
      metrics: ["Live Markets", "Chart Ready", "Stale"],
      tableTitle: "Market Tape",
      chartTitle: "Market Movement",
      chartLabels: ["Volume", "Spread", "Move"],
      intakeBriefs: ["trading market browser dashboard", "market intelligence dashboard table charts", "financial dashboard drawer detail"]
    },
    "content-calendar": {
      id: "content-calendar",
      label: "Content Calendar",
      operatorQuestion: "What content is planned, missing, approved, or ready to publish?",
      nav: ["Calendar", "Brands", "Output"],
      metrics: ["Planned", "Ready", "Needs QA"],
      tableTitle: "Content Plan",
      chartTitle: "Publishing Cadence",
      chartLabels: ["Planned", "Approved", "Posted"],
      intakeBriefs: ["content calendar dashboard", "social media planning dashboard", "approval calendar product UI"]
    },
    "cost-command": {
      id: "cost-command",
      label: "Cost Command",
      operatorQuestion: "Where is spend moving and which unit/provider needs action?",
      nav: ["Spend", "Providers", "Units"],
      metrics: ["Daily Spend", "Provider Calls", "Efficiency"],
      tableTitle: "Cost Breakdown",
      chartTitle: "Spend Timeline",
      chartLabels: ["LLM", "Media", "Storage"],
      intakeBriefs: ["cost dashboard SaaS analytics", "usage billing dashboard charts", "provider spend dashboard"]
    },
    "household-planner": {
      id: "household-planner",
      label: "Household Planner",
      operatorQuestion: "What is planned for the household and what needs to be decided?",
      nav: ["Planner", "Library", "Shopping"],
      metrics: ["Planned Days", "Open Meals", "Shopping Items"],
      tableTitle: "Plan Items",
      chartTitle: "Weekly Balance",
      chartLabels: ["Protein", "Sides", "Open"],
      intakeBriefs: ["calendar planner dashboard", "meal planning app dashboard", "household planning calendar UI"]
    },
    "approval-workflow": {
      id: "approval-workflow",
      label: "Approval Workflow",
      operatorQuestion: "What needs approval, what failed QA, and what is safe to publish?",
      nav: ["Review", "QA", "Publish"],
      metrics: ["Pending", "Rejected", "Approved"],
      tableTitle: "Review Queue",
      chartTitle: "QA Outcomes",
      chartLabels: ["Approved", "Rejected", "Rework"],
      intakeBriefs: ["approval queue dashboard", "content moderation review dashboard", "QA workflow dashboard"]
    }
  };
  const normalized = kebab(id);
  if (!templates[normalized]) {
    throw new Error(`Unknown template ${id}. Options: ${Object.keys(templates).join(", ")}`);
  }
  return templates[normalized];
}

function packageJsonTemplate({ packageName }) {
  return `${JSON.stringify({
    name: packageName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite --host 127.0.0.1",
      build: "tsc -p tsconfig.json && vite build",
      preview: "vite preview --host 127.0.0.1",
      test: "playwright test",
      "proof:screenshots": "node scripts/capture-proof-screenshots.mjs",
      "hdk:check": "node ../nous-hermes-agent/scripts/enforce-dashboard-creation-gate.mjs --project-dir .",
      "hdk:proof": "npm run test && npm run proof:screenshots",
      "hdk:visual": "npm run proof:screenshots"
    },
    dependencies: {
      "@hermes/dashboard-kit": "file:../nous-hermes-agent/packages/hermes-dashboard-kit",
      "@vitejs/plugin-react": "^5.2.0",
      "lucide-react": "^0.577.0",
      "react": "^19.2.4",
      "react-dom": "^19.2.4",
      "recharts": "^3.9.2",
      "vite": "^7.3.6"
    },
    devDependencies: {
      "@playwright/test": "^1.61.1",
      "@types/react": "^19.2.14",
      "@types/react-dom": "^19.2.4",
      "typescript": "^6.0.3"
    }
  }, null, 2)}\n`;
}

function indexTemplate({ title }) {
  return `<!doctype html>
<html lang="en" data-theme="system">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body class="hdk-body">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function mainTemplate() {
  return `import React from "react";
import { createRoot } from "react-dom/client";
import "@hermes/dashboard-kit/static/hermes-dashboard-kit.css";
import "./dashboard-theme.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function appTemplate({ title, description, theme, template }) {
  const navItems = template.nav.map((label, index) => ({
    id: kebab(label),
    label,
    shortLabel: label.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase() || `N${index + 1}`,
    icon: ["BarChart3", "Database", "ShieldCheck"][index] ?? "Database",
    active: index === 0,
  }));
  const metricCards = template.metrics.map((label, index) => ({
    label,
    value: index === 0 ? "Native" : index === 1 ? "Tier 3" : "Ready",
    detail: index === 0 ? "@hermes/dashboard-kit runtime" : index === 1 ? "Product-grade target" : template.label,
    tone: index === 0 ? "success" : index === 1 ? "info" : "neutral",
  }));
  const chartData = template.chartLabels.map((label, index) => ({ label, value: [74, 52, 31, 65][index] ?? 40 }));
  const primaryNavId = navItems[0]?.id ?? "command";
  const tableNavId = navItems[1]?.id ?? "evidence";
  const proofNavId = navItems[2]?.id ?? "proof";
  return `import { BarChart3, Database, RefreshCw, ShieldCheck } from "lucide-react";
import {
  ChartPanel,
  DashboardEmptyState,
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSidebar,
  DataTable,
  KpiCard,
  MetricGrid,
  SimpleBarChart,
  StatusPill,
  type DataTableColumn
} from "@hermes/dashboard-kit";

interface EvidenceRow {
  id: string;
  source: string;
  status: "ready" | "needs-data";
  owner: string;
}

const rows: EvidenceRow[] = [
  { id: "mobbin-intake", source: "${escapeTemplate(template.label)} Mobbin reference intake", status: "ready", owner: "Design" },
  { id: "dashboard-contract", source: "${escapeTemplate(template.tableTitle)} data contract", status: "needs-data", owner: "Engineering" },
  { id: "proof-route", source: "Production proof route and screenshots", status: "needs-data", owner: "Operations" }
];

const columns: DataTableColumn<EvidenceRow>[] = [
  { id: "source", header: "Source", accessor: (row) => row.source, sortValue: (row) => row.source },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <StatusPill tone={row.status === "ready" ? "success" : "warning"}>{row.status}</StatusPill>,
    sortValue: (row) => row.status
  },
  { id: "owner", header: "Owner", accessor: (row) => row.owner, sortValue: (row) => row.owner }
];

export default function App() {
  return (
    <div className="hdk-theme-scope dashboard-app mobile-navigation-ready" data-theme="${theme}">
      <DashboardShell
        sidebar={(
          <DashboardSidebar
            title="${escapeTemplate(title)}"
            description="${escapeTemplate(template.label)}"
            mark="${escapeTemplate(title.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "HD")}"
            status="Package-native Tier 3 starter. Replace sample data before production."
            footer={<div data-dashboard-list="true">Dashboard registry pending.</div>}
            groups={[
              {
                id: "command",
                label: "Command",
                items: [
                  ${navItems.slice(0, 1).map((item) => `{ id: "${item.id}", label: "${escapeTemplate(item.label)}", shortLabel: "${item.shortLabel}", href: "#${item.id}", active: ${item.active}, icon: ${item.icon} }`).join(",\n                  ")}
                ]
              },
              {
                id: "evidence",
                label: "Evidence",
                items: [
                  ${navItems.slice(1).map((item) => `{ id: "${item.id}", label: "${escapeTemplate(item.label)}", shortLabel: "${item.shortLabel}", href: "#${item.id}", active: ${item.active}, icon: ${item.icon} }`).join(",\n                  ")}
                ]
              }
            ]}
          />
        )}
        header={(
          <DashboardHeader
            title="${escapeTemplate(title)}"
            eyebrow="Tier 3 package-native starter"
            description="${escapeTemplate(`${description} ${template.operatorQuestion}`)}"
            actions={<button className="hdk-button primary" type="button"><RefreshCw size={16} />Refresh</button>}
            meta={<StatusPill tone="info">data-theme=${theme}</StatusPill>}
          />
        )}
      >
        <MetricGrid id="${primaryNavId}" columns={3}>
          ${metricCards.map((metric) => `<KpiCard label="${escapeTemplate(metric.label)}" value="${escapeTemplate(metric.value)}" detail="${escapeTemplate(metric.detail)}" tone="${metric.tone}" />`).join("\n          ")}
        </MetricGrid>

        <div className="dashboard-grid">
          <DashboardSection id="${tableNavId}" title="${escapeTemplate(template.tableTitle)}" description="Replace sample rows with live product data, proof states, pagination, and drilldowns.">
            <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
          </DashboardSection>
          <ChartPanel title="${escapeTemplate(template.chartTitle)}" description="Replace with the first real time series, category comparison, or QA outcome chart.">
            <SimpleBarChart data={${JSON.stringify(chartData)}} />
          </ChartPanel>
        </div>

        <div id="${proofNavId}">
          <DashboardEmptyState
            title="Connect the real data contract"
            description="This starter is package-native. The next step is wiring project data, states, drilldowns, and proof screenshots."
          />
        </div>
      </DashboardShell>
    </div>
  );
}
`;
}

function themeCssTemplate() {
  return `.dashboard-app {
  min-height: 100dvh;
}

.dashboard-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 1180px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(22rem, 0.8fr);
  }
}

@media (max-width: 760px) {
  .dashboard-app [data-hdk-component="DashboardSidebar"] {
    position: static;
  }

  .dashboard-app [data-nav-group] {
    margin-bottom: 0.75rem;
  }
}
`;
}

function adoptionManifestTemplate({ projectId, cssHash }) {
  return `${JSON.stringify({
    schemaVersion: 1,
    projectId,
    dashboardKit: {
      baseline: "hdk-first",
      package: "@hermes/dashboard-kit",
      requiredVersion: "0.1.0",
      adoptionMode: "package-native",
      implementationMode: "package-native",
      currentExperienceTier: 3,
      targetExperienceTier: 3,
      targetExperienceBand: "T3C",
      packageNativeRequired: true,
      staticAdapterAllowed: false,
      mobbinReferenceRequired: true,
      customComponentsPolicy: "allowed-only-inside-hdk-shell-and-token-contracts",
      shell: "hdk",
      sidebar: "hdk",
      header: "hdk",
      theme: "hdk",
      spacing: "hdk",
      auth: "hdk-compatible",
      canonicalCssHash: cssHash
    },
    surfaces: [
      {
        id: "dashboard",
        path: "src/App.tsx",
        status: "package-native",
        requiredComponents: [
          "DashboardShell",
          "DashboardSidebar",
          "DashboardHeader",
          "MetricGrid",
          "KpiCard",
          "DataTable",
          "ChartPanel",
          "DashboardEmptyState"
        ],
        markers: [
          "data-theme=",
          "@hermes/dashboard-kit"
        ],
        notes: "Package-native starter surface. Replace sample data before production use."
      }
    ],
    referenceIntake: {
      path: "docs/design/mobbin-reference-intake.md",
      required: true,
      status: "draft"
    },
    designReview: {
      path: "docs/design/design-review-checklist.md",
      required: true,
      status: "draft"
    },
    proof: {
      playwrightConfig: "playwright.config.ts",
      captureScript: "scripts/capture-proof-screenshots.mjs",
      screenshotStates: ["light", "dark", "system"],
      status: "starter"
    },
    enforcement: {
      localScripts: ["hdk:check", "hdk:proof", "hdk:visual"],
      creationGate: "hdk:check",
      deployGate: "hdk:check",
      exceptionsRequireExpiry: true
    },
    exceptions: []
  }, null, 2)}\n`;
}

function dashboardRegistryTemplate({ projectId, title, template }) {
  return `${JSON.stringify({
    schemaVersion: 1,
    projectId,
    dashboards: [
      {
        id: "dashboard",
        title,
        route: "/",
        canonical: true,
        experienceTier: 3,
        template: template.id,
        operatorQuestion: template.operatorQuestion,
        shell: "single",
        implementationMode: "package-native",
        package: "@hermes/dashboard-kit",
        proof: {
          playwrightConfig: "playwright.config.ts",
          captureScript: "scripts/capture-proof-screenshots.mjs",
          evidenceDir: "proof/dashboard-screenshots"
        }
      }
    ]
  }, null, 2)}\n`;
}

function mobbinIntakeTemplate({ title, template }) {
  return `# Mobbin Reference Intake: ${title}

## Product Type

${template.label} package-native operating dashboard.

## Primary Operator Question

${template.operatorQuestion}

## Search Briefs

${template.intakeBriefs.map((brief) => `- ${brief}`).join("\n")}

## References Reviewed

Add Mobbin links here before implementation.

## Extracted Layout Patterns

- One app shell with one sidebar and one command header.
- Sidebar includes brand mark, grouped navigation, active route, collapsed labels, footer/status context, and mobile behavior.
- Metric strip above evidence tables and charts.
- Full-width table sections or tabbed tables when records are dense.

## Extracted Interaction Patterns

- Drilldown drawers for selected entities.
- Filter chips and time-window selectors near chart/table surfaces.
- Empty, loading, stale, partial, error, and permission-limited states.

## Component Mapping

| Need | Dashboard-kit component |
| --- | --- |
| Shell | DashboardShell |
| Navigation | DashboardSidebar |
| Header | DashboardHeader |
| Metrics | MetricGrid, KpiCard |
| Tables | DataTable |
| Charts | ChartPanel and chart primitives |
| States | DashboardEmptyState, DashboardErrorState, VisualizationStateFrame |

## Theme Decision

Default: system mode with validated light and dark tokens.

## Acceptance Criteria

- Package-native imports from @hermes/dashboard-kit.
- No primary static adapter runtime.
- One shell and one route model.
- Operational navigation satisfies \`dashboard-operational-navigation-standard.md\`.
- Light and dark screenshots pass visual QA.
- Proof route or proof capture exists before production completion.
`;
}

function designReviewTemplate({ title, template }) {
  return `# Design Review Checklist: ${title}

## Target

- Experience tier: Tier 3
- Template: ${template.label}
- Operator question: ${template.operatorQuestion}

## Required Evidence

- [ ] Mobbin references reviewed and linked in \`mobbin-reference-intake.md\`.
- [ ] One app shell only: one sidebar, one header, one route model.
- [ ] Sidebar includes brand mark, grouped nav, active route state, collapsed labels, footer/status context, and mobile behavior.
- [ ] Package-native imports from \`@hermes/dashboard-kit\`.
- [ ] No static adapter as the primary runtime.
- [ ] No production visual-selection bridge.
- [ ] Tables are full-width or tabbed when dense.
- [ ] Charts include axis labels, state frames, legends/tooltips where useful, and non-hand-drawn styling.
- [ ] Light, dark, and system screenshots captured.
- [ ] Empty, loading, stale, partial, error, permission-limited, and proof states are represented.
- [ ] Hardcoded color usage is replaced by design tokens.

## Component Map

| Area | Expected component family |
| --- | --- |
| Shell | DashboardShell, DashboardSidebar, DashboardHeader |
| Metrics | MetricGrid, KpiCard |
| Dense records | DataTable, tabbed table layout, detail drawer |
| Charts | ChartPanel, chart primitives, VisualizationStateFrame |
| Workflow | ApprovalQueuePanel, PublishingQueuePanel, ProofEvidencePanel |
| Planning | CalendarMonthGrid when relevant |

## Reviewer Notes

Add screenshot links, production proof links, and any approved exceptions here.
`;
}

function proofCaptureTemplate() {
  return `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const outDir = path.resolve("proof/dashboard-screenshots");
const baseUrl = process.env.DASHBOARD_PROOF_URL || "http://127.0.0.1:4177";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

for (const theme of ["light", "dark", "system"]) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
  await page.screenshot({ path: path.join(outDir, \`\${theme}.png\`), fullPage: true });
}

await browser.close();
console.log(\`Captured dashboard proof screenshots in \${outDir}\`);
`;
}

function playwrightTestTemplate({ route, title }) {
  return `import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test("${escapeTemplate(title)} renders in " + theme + " mode", async ({ page }) => {
    await page.goto("${route}");
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    await expect(page.getByRole("heading", { name: /${escapeRegExp(title)}/i }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
`;
}

function playwrightConfigTemplate() {
  return `import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev -- --port 4177",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:4177",
    viewport: { width: 1440, height: 1000 }
  }
});
`;
}

function tsconfigTemplate() {
  return `${JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ES2022"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src", "tests", "vite.config.ts", "playwright.config.ts"],
    references: []
  }, null, 2)}\n`;
}

function viteConfigTemplate() {
  return `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()]
});
`;
}

function readmeTemplate({ title, projectId }) {
  return `# ${title}

Package-native Hermes dashboard scaffold.

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

## Validate

\`\`\`bash
npm run build
npm test
\`\`\`

Project adoption id: \`${projectId}\`
`;
}

function escapeTemplate(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
