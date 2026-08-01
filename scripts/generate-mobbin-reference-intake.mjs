#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const title = args.title || "Dashboard";
const template = args.template || "cockpit";
const out = path.resolve(process.cwd(), args.out || "docs/design/mobbin-reference-intake.md");
const refs = readReferences(args.references);
const briefs = defaultBriefs(template);
const classified = refs.map(classifyReference);
const score = scoreReferences(classified);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, intakeMarkdown({ title, template, briefs, references: classified, score }));
fs.writeFileSync(out.replace(/\.md$/i, ".json"), `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  title,
  template,
  briefs,
  score,
  references: classified
}, null, 2)}\n`);

console.log(`Wrote ${path.relative(process.cwd(), out)}`);
console.log(`Reference score: ${score.overall}%`);

function readReferences(file) {
  if (!file) return [];
  const absolute = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolute)) throw new Error(`Reference file missing: ${file}`);
  const raw = fs.readFileSync(absolute, "utf8");
  if (file.endsWith(".json")) {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : json.references ?? json.screens ?? [];
  }
  return raw.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, url] = line.includes("|") ? line.split("|").map((part) => part.trim()) : ["Reference", line];
    return { label, mobbin_url: url };
  });
}

function classifyReference(reference) {
  const text = [
    reference.label,
    reference.app_name,
    reference.query,
    reference.mobbin_url,
    reference.notes
  ].filter(Boolean).join(" ").toLowerCase();
  const patterns = {
    shell: ["sidebar", "nav", "workspace", "app shell"],
    charts: ["chart", "trend", "analytics", "market", "trading", "graph"],
    tables: ["table", "grid", "records", "list", "queue"],
    drilldowns: ["drawer", "detail", "panel", "inspector"],
    filters: ["filter", "search", "segment", "date"],
    proofStates: ["empty", "error", "loading", "stale", "status", "health"],
    mobile: ["mobile", "responsive", "iphone"]
  };
  const tags = Object.entries(patterns)
    .filter(([, needles]) => needles.some((needle) => text.includes(needle)))
    .map(([tag]) => tag);
  return {
    id: reference.id || slug(reference.mobbin_url || reference.label || "reference"),
    appName: reference.app_name || reference.appName || "Unknown",
    label: reference.label || reference.app_name || "Mobbin reference",
    mobbinUrl: reference.mobbin_url || reference.mobbinUrl || reference.url,
    imageUrl: reference.image_url || reference.imageUrl,
    tags: tags.length ? tags : ["general"],
    score: Math.min(100, 45 + tags.length * 9)
  };
}

function scoreReferences(references) {
  const required = ["shell", "charts", "tables", "drilldowns", "filters", "proofStates"];
  const covered = new Set(references.flatMap((reference) => reference.tags));
  const coverage = Math.round((required.filter((tag) => covered.has(tag)).length / required.length) * 100);
  const countScore = Math.min(100, references.length * 20);
  return {
    overall: Math.round(coverage * 0.7 + countScore * 0.3),
    coverage,
    countScore,
    coveredTags: Array.from(covered).sort(),
    missingTags: required.filter((tag) => !covered.has(tag))
  };
}

function intakeMarkdown({ title, template, briefs, references, score }) {
  return `# Mobbin Reference Intake: ${title}

## Template

${template}

## Automated Search Briefs

${briefs.map((brief) => `- ${brief}`).join("\n")}

## Reference Score

- Overall: ${score.overall}%
- Pattern coverage: ${score.coverage}%
- Reference count: ${score.countScore}%
- Covered: ${score.coveredTags.join(", ") || "none"}
- Missing: ${score.missingTags.join(", ") || "none"}

## References Reviewed

${references.length ? references.map((reference) => `- [${reference.label}](${reference.mobbinUrl}) — ${reference.appName}; tags: ${reference.tags.join(", ")}; score: ${reference.score}%`).join("\n") : "- No references imported yet. Use Mobbin search, export the screen links/metadata, then rerun this command with `--references`."}

## Pattern Extraction

- Shell: identify the sidebar/header density and active-route treatment.
- Charts: extract axis, legend, tooltip, panel, and comparison patterns.
- Tables: extract full-width, tabbed, pagination, sticky-header, and row-detail patterns.
- Drilldowns: extract drawer/panel hierarchy and selected-entity evidence.
- States: extract empty/loading/error/stale/partial/proof treatments.

## Component Mapping

| Pattern | Dashboard-kit target |
| --- | --- |
| Shell/sidebar/header | DashboardShell, DashboardSidebar, DashboardHeader |
| KPI summary | MetricGrid, KpiCard |
| Dense records | DataTable, table tabs, DetailDrawerShell |
| Charts | ChartPanel, data-visualization primitives |
| Workflow review | ApprovalQueuePanel, PublishingQueuePanel |
| Proof | ProofEvidencePanel, VisualizationStateFrame |

## Acceptance Criteria

- References cover at least shell, charts, tables, drilldowns, filters, and proof states.
- The implementation translates patterns into kit components.
- Visual baseline screenshots are captured before approval.
`;
}

function defaultBriefs(template) {
  const briefs = {
    cockpit: ["analytics command center dashboard with sidebar charts tables proof states", "SaaS operating dashboard drilldown drawer"],
    "market-browser": ["trading market dashboard table chart sidebar filters asset detail panel", "market intelligence dashboard dense data table drawer chart"],
    "content-calendar": ["content calendar dashboard approval queue publishing workflow", "social media planning dashboard calendar drawer"],
    "cost-command": ["usage billing cost dashboard provider spend timeline", "SaaS cost analytics dashboard charts tables"],
    "household-planner": ["calendar planner dashboard weekly planning drawer", "meal planning app calendar library dashboard"],
    "operations-queue": ["operations queue dashboard job monitoring exceptions table", "workflow dashboard approvals errors status"],
    "approval-workflow": ["approval queue dashboard QA review publishing controls", "content moderation workflow dashboard"]
  };
  return briefs[template] ?? briefs.cockpit;
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

function slug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
