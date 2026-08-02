#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const assessmentPath = path.join(root, "docs/design/project-dashboard-tier-assessment.json");
const historyPath = path.join(root, "docs/design/dashboard-promotion-history.json");
const assessment = JSON.parse(fs.readFileSync(assessmentPath, "utf8"));
const previous = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, "utf8")) : { schemaVersion: 1, events: [] };
const existingKeys = new Set((previous.events ?? []).map((event) => `${event.sourceHash}:${event.project}:${event.currentBand}:${event.targetBand}`));
const events = [...(previous.events ?? [])];

for (const project of assessment.projects ?? []) {
  const key = `${assessment.sourceHash}:${project.project}:${project.currentBand}:${project.targetBand}`;
  if (existingKeys.has(key)) continue;
  const previousEvent = [...events].reverse().find((event) => event.project === project.project);
  events.push({
    recordedAt: new Date().toISOString(),
    sourceHash: assessment.sourceHash,
    project: project.project,
    projectName: project.name,
    currentBand: project.currentBand,
    targetBand: project.targetBand,
    previousBand: previousEvent?.currentBand ?? null,
    transition: previousEvent ? `${previousEvent.currentBand}->${project.currentBand}` : `initial->${project.currentBand}`,
    changed: previousEvent ? previousEvent.currentBand !== project.currentBand || previousEvent.targetBand !== project.targetBand : true,
    auditStatus: project.auditStatus,
    warnings: project.warnings,
    errors: project.errors
  });
}

const history = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "docs/design/project-dashboard-tier-assessment.json",
  eventCount: events.length,
  events
};

fs.writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
console.log(`Dashboard promotion history updated: ${events.length} event(s).`);
