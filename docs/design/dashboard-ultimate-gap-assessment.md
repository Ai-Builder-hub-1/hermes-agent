# Dashboard Ultimate Gap Assessment

Generated posture: 2026-08-03

This document separates current dashboard readiness from future maturity work.

- **Current readiness:** the governed dashboard fleet is world-class-ready according to the executable audit.
- **Future maturity:** the remaining work is about durability, automation, package distribution, release governance, and expansion of the Hermes control plane.

The executable source of truth is:

```bash
npm run dashboard-kit:adoption:report
npm run dashboard:tier-assessment:sync
npm run dashboard:readiness-impact:report
node scripts/generate-dashboard-promotion-readiness.mjs
node scripts/generate-dashboard-maturity-report.mjs
npm run dashboard:world-class:report
```

## Current State

| Evidence | Current Result |
|---|---:|
| World-class dashboard audit | 100/100 |
| Open world-class gaps | 0 |
| Dashboard next actions | 0 |
| Production proof baselines | 9/9 |
| Live health checks | 9/9 |
| Adoption errors | 0 |
| Adoption warnings | 0 |
| Cross-project blocking backlog | 0 |

## Current Project Status

| Project | Band | Maturity | Promotion |
|---|---:|---:|---|
| Kashi VC | T3C | Level 10 | promotion-ready |
| Media Engine | T3C | Level 10 | promotion-ready |
| Media Business OS | T3C | Level 10 | promotion-ready |
| Business Mapper | T2B | Level 10 | promotion-ready |
| Meal Assistant | T3C | Level 10 | promotion-ready |
| Hermes OS | T3C | Level 10 | promotion-ready |
| TLC Capital Group OS | T3C | Level 10 | promotion-ready |

Business Mapper remains `T2B` by design because its target band is package-native shared-component dashboard, not Tier 3 cockpit. Its evidence still reaches Level 10 because telemetry, proof, visual quality, and readiness gates are complete for its target.

## Closed Historical Gaps

The following items were previously open and should no longer be described as current blockers:

- Missing or stale `.hermes-dashboard.json` manifests.
- Missing production proof endpoints for registered dashboards.
- Missing production screenshot baselines.
- Missing telemetry `snapshotUrl` coverage.
- T0/T1/T3A stale tier classifications for the current governed fleet.
- Cross-project external work items created solely because package-native adoption was required.
- Readiness penalties or caps caused by dashboard adoption status.

## Remaining Maturity Work

These are not current release blockers. They are the next durability and expansion layers.

### 1. Refresh Pipeline Hardening

Current risk: generated reports can drift if commands are run out of order.

Needed:

- Add one canonical `dashboard:governance:refresh-all` command.
- Regenerate adoption, tier assessment, readiness, promotion, proof, telemetry, maturity, world-class, next actions, visual, token, and a11y reports in dependency order.
- Add source hashes and freshness checks to every derived artifact.
- Fail validation when narrative docs contradict current machine reports.

### 2. Deployment Source Of Truth

Current risk: Hetzner can be deployed from local committed archives while Git remotes may still be ahead/behind.

Needed:

- Record exact deployed commit SHA per service.
- Decide whether production promotion source is GitHub branch, tag, archive, or release artifact.
- Require rollback SHA and post-deploy health/proof evidence.
- Flag deployments made from local-only commits.

### 3. Package Distribution

Current risk: independent projects can break if they depend on sibling workspace paths.

Needed:

- Choose a deterministic distribution path for `@hermes/dashboard-kit`.
- Prefer internal package release, pinned Git dependency, or generated vendor snapshot.
- Add Docker/build validation that fails unresolved dashboard-kit imports before deployment.
- Keep vendored adapters explicitly versioned when used.

### 4. Runtime Data Hygiene

Current risk: generated runtime files can dirty repos or enter deploy commits.

Needed:

- Standardize `data/runtime`, `data/fixtures`, and `data/seeds` policy across projects.
- Ignore logs, ledgers, generated telemetry, and local adjudication files unless they are deliberate fixtures.
- Add a source-control hygiene check for tracked runtime data.

### 5. Protected Visual Primitive Enforcement

Current risk: local CSS can silently degrade shared primitives such as sidebars, topbars, tables, drawers, and metric cards.

Needed:

- Refresh local visual override scans after every fleet standards update.
- Require declared exceptions with owner, reviewer, expiry, and replacement plan.
- Promote repeated local overrides into dashboard-kit tokens or components.

### 6. Production Visual And Accessibility Depth

Current risk: route-level checks prove coverage, but deeper product quality needs broader proof.

Needed:

- Add desktop, tablet, and mobile production screenshot baselines.
- Add focus-order evidence for key workflows.
- Add reduced-motion and contrast token validation.
- Add chart/table accessibility alternatives.
- Add visual assertions for clipped text, overlap, and blank primary regions.

### 7. Hermes Executive Control Plane

Current risk: dashboard governance is strong, but the executive command layer can become more operationally useful.

Needed:

- Add cross-project action queue.
- Add "what changed since yesterday" summaries.
- Add cost, capacity, failed job, and blocked-work rollups.
- Add owner and next-action tracking.
- Add deployment freshness and data freshness by project.

### 8. Autonomous Cross-Project Execution

Current risk: cross-project work is possible, but still relies on the operator invoking the right sequence.

Needed:

- Add one command to assess all governed projects.
- Add one command to execute safe automatic fixes.
- Add one command to deploy selected services.
- Emit a final release report with commits, services, health, proof, and exceptions.
- Define stop conditions for major issues only.

## Recommended Next Versions

### V14: Governance Refresh Pipeline

Build `dashboard:governance:refresh-all`, make report freshness deterministic, and prevent stale docs from surviving alongside green machine reports.

### V15: Deployment Ledger And Promotion Source

Record deployed commit SHAs, promotion source, rollback source, service name, health, proof, and screenshot evidence for each Hetzner deploy.

### V16: Dashboard Kit Distribution

Move from fragile local workspace assumptions to deterministic package release, pinned Git dependency, or generated vendor snapshot.

### V17: Runtime Data Governance

Apply the Media Engine runtime-data cleanup pattern across all projects and add a tracking check.

### V18: Visual Primitive Protection

Turn sidebar, topbar, table, drawer, chart, metric, filter, and state surfaces into protected primitives with exception-based overrides.

### V19: Executive Command Layer

Turn Hermes into the live operating cockpit for cross-project health, cost, capacity, blockers, deployments, and next actions.

### V20: Autonomous Fleet Runner

Make Nous Hermes Agent able to assess, fix, validate, commit, deploy, and report across the fleet through a single governed workflow.
