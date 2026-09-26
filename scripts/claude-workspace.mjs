#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const hubRoot = resolve(scriptDir, "..");
const projectsRoot = resolve(hubRoot, "..");

const projectDirs = readdirSync(projectsRoot)
  .map((name) => join(projectsRoot, name))
  .filter((path) => {
    if (path === hubRoot) return false;
    if (!statSync(path).isDirectory()) return false;
    return existsSync(join(path, "package.json")) || existsSync(join(path, ".git"));
  })
  .sort();

const claudeArgs = ["--add-dir", ...projectDirs, ...process.argv.slice(2)];

const child = spawn("claude", claudeArgs, {
  cwd: hubRoot,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
