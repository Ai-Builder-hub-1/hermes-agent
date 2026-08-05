# Fleet Maturity Tracker

The fleet maturity tracker is the Nous Hermes Agent control-plane record for project readiness, production proof, deployment evidence, monitoring, external credentials, live E2E evidence, outcome feeds, and cross-project maturity work.

## Commands

- `npm run fleet:maturity:scan` refreshes the registry, evidence ledger, maturity work graph, suggestions, and markdown summaries.
- `npm run fleet:maturity:validate` verifies the generated tracker files, required projects, relationship targets, evidence coverage, suggestion links, and deployment-provider language.
- Set `HERMES_FLEET_REMOTE_EVIDENCE=0` before scanning when Hetzner SSH evidence should be skipped for an offline/local-only run.

## Generated Files

- `fleet-registry.json` is the structured project registry with production URLs, Hetzner service names, dashboard status, proof status, repo status, and project relationships.
- `fleet-evidence-ledger.json` tracks one evidence record per project per required evidence kind.
- `fleet-maturity-work-graph.json` converts non-current evidence and cross-project triggers into actionable maturity work.
- `fleet-maturity-suggestions.json` ranks the next work candidates and separates Codex-ready work from human-decision work.
- `fleet-maturity-status.md` is the top-level operator summary.
- `fleet-maturity-work-graph.md` is the readable work graph.
- `fleet-maturity-suggestions.md` is the readable suggestion queue.

## Operating Rules

- Nous Hermes Agent owns the tracker, but the target project owns implementation changes unless the work is fleet-level standards or deploy tooling.
- A work item closes only when its `evidenceRequiredToClose` entries are refreshed and current.
- Cross-project work should be evaluated after every maturity closure because one project can create valid follow-up work in another project.
- Human-decision suggestions must not be treated as build-ready until credential, authority, or product-scope ownership is resolved.
- Deployment evidence is Hetzner promotion evidence. Do not add Vercel assumptions to fleet proof or deployment records.
