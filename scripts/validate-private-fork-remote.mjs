#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const PUBLIC_UPSTREAM_PATTERNS = [
  "github.com/NousResearch/hermes-agent",
  "github.com/NousResearch/Hermes-Agent",
  "NousResearch/hermes-agent",
  "NousResearch/Hermes-Agent"
];

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch {
    return "";
  }
}

function isPublicUpstream(value) {
  return PUBLIC_UPSTREAM_PATTERNS.some((pattern) =>
    String(value || "").toLowerCase().includes(pattern.toLowerCase())
  );
}

const originFetch = git(["remote", "get-url", "origin"]);
const originPush = git(["remote", "get-url", "--push", "origin"]);
const pushDefault = git(["config", "--get", "remote.pushDefault"]);
const branchUpstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);

const issues = [];

if (isPublicUpstream(originPush)) {
  issues.push("origin push URL points at the public NousResearch upstream.");
}

if (pushDefault && isPublicUpstream(pushDefault)) {
  issues.push("remote.pushDefault points at the public NousResearch upstream.");
}

if (!pushDefault) {
  issues.push("remote.pushDefault is not set. Set it to the private project remote/backbone.");
}

if (branchUpstream.startsWith("origin/") && isPublicUpstream(originFetch) && isPublicUpstream(originPush)) {
  issues.push("current branch tracks origin and origin is pushable to the public upstream.");
}

console.log("Private fork remote validation");
console.log(`origin fetch: ${originFetch || "(missing)"}`);
console.log(`origin push: ${originPush || "(missing)"}`);
console.log(`remote.pushDefault: ${pushDefault || "(missing)"}`);
console.log(`branch upstream: ${branchUpstream || "(missing)"}`);

if (issues.length) {
  for (const issue of issues) console.error(`ERROR: ${issue}`);
  console.error("\nExpected setup: origin may be fetch-only upstream, but push/deploy work must target the private remote.");
  process.exit(1);
}

console.log("Remote guard passed: public upstream is not the default push target.");
