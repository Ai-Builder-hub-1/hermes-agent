#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tierPath = path.join(root, "docs/design/project-dashboard-tier-assessment.json");
const visualPath = path.join(root, "docs/design/dashboard-visual-coverage-report.json");
const componentPath = path.join(root, "docs/design/dashboard-component-evidence-backlog.json");
const tokenPath = path.join(root, "docs/design/dashboard-token-scan-report.json");
const outputPath = path.join(root, "docs/design/dashboard-promotion-readiness.json");
const mdPath = path.join(root, "docs/design/dashboard-promotion-readiness.md");

const tiers = JSON.parse(fs.readFileSync(tierPath, "utf8"));
const visual = JSON.parse(fs.readFileSync(visualPath, "utf8"));
const component = JSON.parse(fs.readFileSync(componentPath, "utf8"));
const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const visualByOwner = new Map((visual.items ?? []).flatMap((item) => [
  [item.dashboardId, item],
  [String(item.label ?? "").toLowerCase(), item]
]));
const componentPenalty = Math.min(20, (component.itemCount ?? 0) * 1.5);
const tokenPenalty = Math.min(15, Math.ceil((token.issueCount ?? 0) / 10));

function bandScore(band) {
  if (band === "T3C") return 40;
  if (band === "T3B") return 34;
  if (band === "T3A") return 28;
  if (band?.startsWith("T2")) return 22;
  if (band?.startsWith("T1")) return 14;
  return 6;
}

function statusFor(score) {
  if (score >= 90) return "promotion-ready";
  if (score >= 75) return "near-ready";
  if (score >= 55) return "needs-work";
  return "blocked";
}

const items = (tiers.projects ?? []).map((project) => {
  const visualItem = [...visualByOwner.entries()].find(([key]) => key.includes(project.project) || key.includes(String(project.name).toLowerCase()))?.[1];
  const visualScore = visualItem?.status === "covered" ? 25 : 8;
  const auditScore = project.auditStatus === "current" ? 20 : 8;
  const backlogPenalty = Math.min(15, (project.externalWorkItems ?? []).length * 5);
  const score = Math.max(0, Math.round(bandScore(project.currentBand) + visualScore + auditScore - backlogPenalty - componentPenalty - tokenPenalty));
  return {
    project: project.project,
    name: project.name,
    currentBand: project.currentBand,
    targetBand: project.targetBand,
    auditStatus: project.auditStatus,
    visualStatus: visualItem?.status ?? "unknown",
    externalWorkItems: project.externalWorkItems?.length ?? 0,
    score,
    status: statusFor(score),
    blockers: {
      project: [
        ...(visualItem?.status === "covered" ? [] : ["visual-coverage"])
      ],
      central: [
        ...((component.itemCount ?? 0) ? ["component-evidence"] : []),
        ...((token.issueCount ?? 0) ? ["token-debt"] : [])
      ],
      external: [
        ...((project.externalWorkItems ?? []).length ? ["external-work"] : [])
      ]
    },
    flatBlockers: [
      ...(visualItem?.status === "covered" ? [] : ["visual-coverage"]),
      ...((project.externalWorkItems ?? []).length ? ["external-work"] : []),
      ...((component.itemCount ?? 0) ? ["component-evidence"] : []),
      ...((token.issueCount ?? 0) ? ["token-debt"] : [])
    ]
  };
});

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  itemCount: items.length,
  items
};
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(mdPath, `${[
  "# Dashboard Promotion Readiness",
  "",
  `Generated: ${payload.generatedAt}`,
  "",
  ...items.map((item) => `- ${item.status} ${item.name}: ${item.score}/100 (${item.currentBand} -> ${item.targetBand}) blockers=${item.flatBlockers.join(", ") || "none"}`)
].join("\n")}\n`);
console.log(`Dashboard promotion readiness generated: ${items.length} project(s).`);
