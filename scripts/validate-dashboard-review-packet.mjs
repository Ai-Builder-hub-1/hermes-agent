#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const standardPath = path.join(root, "docs/design/dashboard-review-packet-standard.json");
const packetPath = path.join(root, "docs/design/dashboard-review-packets/latest.json");
const packetMdPath = path.join(root, "docs/design/dashboard-review-packets/latest.md");
const issues = [];

function issue(severity, message, details = "") {
  issues.push({ severity, message, details });
}

if (!fs.existsSync(standardPath)) issue("error", "Review packet standard is missing.");
if (!fs.existsSync(packetPath)) issue("error", "Generated review packet JSON is missing; run npm run dashboard:review-packet:generate.");
if (!fs.existsSync(packetMdPath)) issue("error", "Generated review packet Markdown is missing; run npm run dashboard:review-packet:generate.");

if (!issues.some((item) => item.severity === "error")) {
  const standard = JSON.parse(fs.readFileSync(standardPath, "utf8"));
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  if (standard.version !== "V10") issue("error", "Review packet standard must declare version V10.");
  for (const section of standard.requiredSections ?? []) {
    if (!(packet.requiredSections ?? []).includes(section)) issue("error", "Review packet is missing required section.", section);
  }
  if ((packet.projectCount ?? 0) < 1) issue("error", "Review packet must include project tier context.");
  if ((packet.referenceCount ?? 0) < 2) issue("error", "Review packet must include multiple reference mappings.");
  if ((packet.componentCount ?? 0) < 6) issue("error", "Review packet must include component maturity context.");
  if ((packet.visualViewportCount ?? 0) < 5) issue("error", "Review packet must include responsive viewport context.");
  if (!packet.sourceHash) issue("error", "Review packet is missing sourceHash.");
}

const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
console.log(`Dashboard review packet validation: ${errors.length} error(s), ${warnings.length} warning(s).`);
for (const item of issues) console.log(`- ${item.severity.toUpperCase()} ${item.message}${item.details ? ` ${item.details}` : ""}`);
if (errors.length) process.exit(1);
