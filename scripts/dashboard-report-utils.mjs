import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, "..");
export const workspaceRoot = path.resolve(root, "..");
export const designDir = path.join(root, "docs/design");

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeMarkdown(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`);
}

export function dashboardRegistry() {
  return readJson(path.join(root, "hermes.dashboards.json")).dashboards ?? [];
}

export function resolveProjectPath(projectPath) {
  return path.resolve(root, projectPath);
}

export function runGit(cwd, args) {
  if (!fs.existsSync(path.join(cwd, ".git"))) return "";
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function statusLines(cwd, relative = ".") {
  return runGit(cwd, ["status", "--short", relative]).split("\n").filter(Boolean);
}

export function markdownTable(headers, rows) {
  const escape = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  const header = `| ${headers.map(escape).join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(escape).join(" | ")} |`);
  return [header, rule, ...body].join("\n");
}
