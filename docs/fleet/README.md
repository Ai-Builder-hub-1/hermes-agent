# Fleet Maturity Tracker

The fleet maturity tracker is the Nous Hermes Agent control-plane record for project readiness, production proof, deployment evidence, monitoring, external credentials, live E2E evidence, outcome feeds, and cross-project maturity work.

## Commands

- `npm run fleet:maturity:scan` refreshes the registry, evidence ledger, maturity work graph, suggestions, and markdown summaries.
- `npm run fleet:maturity:validate` verifies the generated tracker files, required projects, relationship targets, evidence coverage, suggestion links, and deployment-provider language.
- `npm run fleet:maturity:check` is the scoped tracker gate. It intentionally runs only the fleet tracker validation so unrelated workspace build or package drift does not block fleet evidence checks.
- `npm run fleet:maturity:check:full` runs the broader aggregate maturity gate, including dashboard maturity report validation and dashboard kit tests.
- `npm run fleet:release-readiness` classifies dirty-tree changes across registered dashboards before commit/deploy.
- `npm run fleet:release-readiness:strict` fails when any project has unsafe or unknown dirty files.
- `npm run fleet:release-readiness:validate` validates the generated release-readiness report schema and flags unsafe/unknown files as review warnings.
- `npm run fleet:ship-check` runs the standard commit/deploy gate: release readiness, strict readiness, readiness validation, web build budget, and dashboard governance validation.
- `npm run fleet:ship-check:full` adds heavier adoption, maturity, and review-packet validation for larger releases.
- Set `HERMES_FLEET_REMOTE_EVIDENCE=0` before scanning when Hetzner SSH evidence should be skipped for an offline/local-only run.

## Generated Files

- `tlc-operating-system-maturity-build-plan.md` is the trackable build plan for the full maturity ladder from dashboard technical compliance through compound-learning enterprise operations.
- `tlc-operating-system-maturity-build-plan.json` is the machine-readable companion plan for turning those maturity layers into task records, dashboards, and governance checks.
- `tlc-operating-system-maturity-build-assessment.md` records the latest assessment of what the current maturity-control build packet completed and what remains.
- `tlc-operating-system-maturity-build-assessment.json` is the machine-readable companion assessment.
- `fleet-registry.json` is the structured project registry with production URLs, Hetzner service names, dashboard status, proof status, repo status, and project relationships.
- `fleet-evidence-ledger.json` tracks one evidence record per project per required evidence kind.
- `fleet-maturity-work-graph.json` converts non-current evidence and cross-project triggers into actionable maturity work.
- `fleet-maturity-suggestions.json` ranks the next work candidates and separates Codex-ready work from human-decision work.
- `fleet-maturity-status.md` is the top-level operator summary.
- `fleet-maturity-work-graph.md` is the readable work graph.
- `fleet-maturity-suggestions.md` is the readable suggestion queue.
- `fleet-release-readiness.json` classifies dirty-tree files as deployable source, generated evidence, screenshot proof, local-only, unsafe, or unknown.
- `fleet-release-readiness.md` is the readable commit/deploy readiness table.
- `fleet-ship-check.json` records the final standard/full ship decision, failed gates, and readiness summary.
- `fleet-ship-check.md` is the readable ship decision report.

## Operating Rules

- Nous Hermes Agent owns the tracker, but the target project owns implementation changes unless the work is fleet-level standards or deploy tooling.
- A work item closes only when its `evidenceRequiredToClose` entries are refreshed and current.
- Cross-project work should be evaluated after every maturity closure because one project can create valid follow-up work in another project.
- Human-decision suggestions must not be treated as build-ready until credential, authority, or product-scope ownership is resolved.
- Deployment evidence is Hetzner promotion evidence. Do not add Vercel assumptions to fleet proof or deployment records.
- Dirty-tree cleanup should use release readiness classification before commit/deploy. Generated evidence and screenshot proof may be committed only when tied to a registry, baseline, or generator command. Local-only, unsafe, and unknown files must be excluded or reviewed before deployment.
- Commit intent must be explicit. A project should be labeled `source-change`, `generated-evidence`, `proof-refresh`, `mixed`, `local-cleanup`, `manual-review`, or `clean` before a commit is treated as ship-ready.
- Proof screenshots are required for dashboard route, shell, theme, interaction, and component layout changes. They are not required for docs-only, script-only, or generated-evidence refreshes unless the changed generator owns visual proof.
- `npm run fleet:ship-check` is the default answer to “can we commit and deploy?” A failed ship check means the release needs cleanup, validation, or scope separation before deployment.
