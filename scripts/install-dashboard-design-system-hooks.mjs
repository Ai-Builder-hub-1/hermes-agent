#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const hooksDir = path.join(root, ".git", "hooks");
const hookPath = path.join(hooksDir, "pre-commit");
const block = `# Hermes dashboard design-system gate
npm run dashboard:starter:validate
`;

if (!fs.existsSync(path.join(root, ".git"))) {
  console.error("No .git directory found; cannot install dashboard design-system hooks.");
  process.exit(1);
}

fs.mkdirSync(hooksDir, { recursive: true });
const current = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, "utf8") : "#!/bin/sh\n";
if (!current.includes("Hermes dashboard design-system gate")) {
  fs.writeFileSync(hookPath, `${current.trimEnd()}\n\n${block}`);
  fs.chmodSync(hookPath, 0o755);
}

console.log("Dashboard design-system hooks installed.");
