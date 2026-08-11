#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distDir = path.join(root, "hermes_cli/web_dist/assets");
const kib = 1024;
const budgets = {
  entryChunkKiB: 650,
  routeChunkKiB: 650,
  cssChunkKiB: 180
};
const issues = [];

function issue(message, details = "") {
  issues.push({ message, details });
}

if (!fs.existsSync(distDir)) {
  issue("Web build output is missing.", "Run npm run build --workspace web first.");
} else {
  const files = fs.readdirSync(distDir).map((name) => {
    const filePath = path.join(distDir, name);
    return {
      name,
      filePath,
      sizeKiB: fs.statSync(filePath).size / kib
    };
  });
  const entryChunks = files.filter((file) => /^index-[\w-]+\.js$/.test(file.name));
  if (!entryChunks.length) {
    issue("No web entry chunk found.", "Expected assets/index-*.js.");
  }
  for (const file of entryChunks) {
    if (file.sizeKiB > budgets.entryChunkKiB) {
      issue("Entry chunk exceeds budget.", `${file.name}: ${file.sizeKiB.toFixed(1)} KiB > ${budgets.entryChunkKiB} KiB`);
    }
  }
  for (const file of files.filter((item) => item.name.endsWith(".js") && !item.name.startsWith("vendor-"))) {
    if (file.sizeKiB > budgets.routeChunkKiB) {
      issue("Route chunk exceeds budget.", `${file.name}: ${file.sizeKiB.toFixed(1)} KiB > ${budgets.routeChunkKiB} KiB`);
    }
  }
  for (const file of files.filter((item) => item.name.endsWith(".css"))) {
    if (file.sizeKiB > budgets.cssChunkKiB) {
      issue("CSS chunk exceeds budget.", `${file.name}: ${file.sizeKiB.toFixed(1)} KiB > ${budgets.cssChunkKiB} KiB`);
    }
  }

  const largest = files
    .filter((file) => file.name.endsWith(".js") || file.name.endsWith(".css"))
    .sort((a, b) => b.sizeKiB - a.sizeKiB)
    .slice(0, 8)
    .map((file) => `${file.name} ${file.sizeKiB.toFixed(1)} KiB`);

  console.log("Web build budget largest assets:");
  for (const line of largest) console.log(`- ${line}`);
}

if (issues.length) {
  console.log(`Web build budget validation: ${issues.length} issue(s).`);
  for (const item of issues) console.log(`- ${item.message}${item.details ? ` ${item.details}` : ""}`);
  process.exit(1);
}

console.log("Web build budget validation: 0 issue(s).");
