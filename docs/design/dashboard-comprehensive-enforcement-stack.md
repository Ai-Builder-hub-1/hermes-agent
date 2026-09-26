# Dashboard Comprehensive Enforcement Stack

Generated: 2026-08-22T20:31:03.448Z

Turn HDK adoption from paperwork into a full source, rendered, visual, workflow, data, production, exception, and promotion enforcement system.

## Decision

- Active layers: 6/10
- Blocked layers: 3
- Enforcement-certified projects: 0/10
- Blocked projects: 10
- Total blockers: 35
- Total warnings: 3

## Commands

- Generate: `npm run dashboard:enforcement:stack`
- Strict: `npm run dashboard:enforcement:stack:strict`
- Full certification: `npm run dashboard:fleet:certify`
- Strict certification: `npm run dashboard:fleet:certify:strict`
- Ship gate: `npm run fleet:ship-check:full`

## Enforcement Layers

| Layer | Status | Artifacts | Blockers | Warnings |
| --- | --- | --- | --- | --- |
| fleet-registry | active | fleetRegistry | none | none |
| route-manifest | active | routeInventory<br>routeContract | none | none |
| source-decomposition | blocked | sourceDecomposition<br>sourceRepairs | source.projectsNeedDecomposition | none |
| dom-rendered | blocked | renderedCertification<br>renderedRepairs | rendered.blocked<br>rendered.unreachable | none |
| visual-baselines | active | visualBaselineRegistry<br>visualScorecard<br>visualCoverage<br>visualRegression | none | none |
| workflow-interaction | active | renderedCertification<br>preRepairReadiness | none | none |
| data-state | needs-review | runtimeData<br>health<br>monitoring | none | artifact.stale |
| production-drift | active | productionProof<br>productionScreenshots<br>releaseReadiness | none | none |
| exception-ledger | active | governanceExceptions<br>certificationRepairs<br>sourceRepairs<br>renderedRepairs | none | none |
| promotion-gate | blocked | shipCheck<br>certification<br>releaseReadiness | promotion.deployBlocked<br>promotion.commitBlocked | none |

## Project Posture

| Project | Status | Source | Rendered | Base Cert | Blockers |
| --- | --- | --- | --- | --- | --- |
| nous-hermes-agent.dashboard | blocked | needs-source-decomposition | blocked | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked<br>falseNativeRisk<br>shell.geometryBroken |
| khashi-vc.roc | blocked | needs-source-decomposition | needs-review | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked |
| media-engine.ops | blocked | needs-source-decomposition | blocked | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked<br>shell.geometryBroken |
| media-business-operations.main | blocked | needs-source-decomposition | blocked | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked<br>shell.geometryBroken |
| business-mapper.workspace | blocked | needs-source-decomposition | certified | blocked | source.notCertified<br>certification.blocked |
| meal-assistant.main | blocked | needs-source-decomposition | unreachable | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked |
| rinseables-os.main | blocked | needs-source-decomposition | certified | blocked | source.notCertified<br>certification.blocked |
| investing-system.roc | blocked | needs-source-decomposition | certified | blocked | source.notCertified<br>certification.blocked |
| hermes.workspace | blocked | needs-source-decomposition | unreachable | blocked | source.notCertified<br>rendered.notCertified<br>certification.blocked |
| tlc-capital-group-os.main | blocked | needs-source-decomposition | certified | blocked | source.notCertified<br>certification.blocked |

## Artifact Inventory

| Artifact | Exists | Generated/Modified | Stale Days | Path |
| --- | --- | --- | --- | --- |
| fleetRegistry | yes | 2026-08-18T12:57:54.702Z | n/a | hermes.dashboards.json |
| certification | yes | 2026-08-21T20:15:45.975Z | 1 | docs/fleet/dashboard-certification-report.json |
| certificationRepairs | yes | 2026-08-21T20:15:45.975Z | 1 | docs/fleet/dashboard-certification-repair-packets.json |
| sourceDecomposition | yes | 2026-08-21T20:34:26.598Z | 0 | docs/design/dashboard-source-decomposition-report.json |
| sourceRepairs | yes | 2026-08-21T20:34:26.598Z | 0 | docs/design/dashboard-source-decomposition-repair-packets.json |
| routeContract | yes | 2026-08-21T20:34:26.596Z | 0 | docs/design/dashboard-route-ownership-contract.json |
| renderedCertification | yes | 2026-08-22T20:30:58.828Z | 0 | docs/design/rendered-fleet-certification/report.json |
| renderedRepairs | yes | 2026-08-22T20:30:58.828Z | 0 | docs/design/rendered-fleet-certification/repair-packets.json |
| routeInventory | yes | 2026-08-22T19:34:45.776Z | 0 | docs/design/dashboard-canonical-route-inventory.json |
| visualBaselineRegistry | yes | 2026-08-22T19:34:45.775Z | 0 | docs/design/dashboard-visual-baseline-reference-registry.json |
| preRepairReadiness | yes | 2026-08-22T19:34:45.777Z | 0 | docs/design/dashboard-pre-repair-readiness.json |
| visualScorecard | yes | 2026-08-14T00:08:06.254Z | 8 | docs/design/dashboard-fleet-ui-maturity-scorecard.json |
| visualCoverage | yes | 2026-08-12T14:40:03.601Z | 10 | docs/design/dashboard-visual-coverage-report.json |
| visualRegression | yes | 2026-08-20T14:20:25.892Z | 2 | docs/design/dashboard-visual-regression-matrix.json |
| runtimeData | yes | 2026-08-12T15:24:58.650Z | 10 | docs/design/dashboard-runtime-data-report.json |
| health | yes | 2026-08-05T13:23:37.773Z | 17 | docs/design/dashboard-health-report.json |
| monitoring | yes | 2026-08-15T18:51:30.520Z | 7 | docs/design/dashboard-monitoring-registry.json |
| productionProof | yes | 2026-08-20T14:21:08.548Z | 2 | docs/design/dashboard-production-proof-registry.json |
| productionScreenshots | yes | 2026-08-20T15:26:48.057Z | 2 | docs/design/production-dashboard-screenshots-report.json |
| governanceExceptions | yes | 2026-08-12T13:47:31.567Z | n/a | docs/design/dashboard-design-debt-registry.json |
| shipCheck | yes | 2026-08-15T18:51:38.850Z | 7 | docs/fleet/fleet-ship-check.json |
| releaseReadiness | yes | 2026-08-15T18:51:37.998Z | 7 | docs/fleet/fleet-release-readiness.json |

## Next Actions

| Priority | Scope | Action | Command |
| --- | --- | --- | --- |
| P0 | standards | Repair blocked enforcement layer: Source Decomposition Gate | npm run dashboard:enforcement:stack |
| P0 | standards | Repair blocked enforcement layer: Rendered DOM Contract Gate | npm run dashboard:enforcement:stack |
| P0 | standards | Repair blocked enforcement layer: Commit And Deploy Promotion Gate | npm run dashboard:enforcement:stack |
| P0 | nous-hermes-agent.dashboard | Repair dashboard enforcement blockers for Nous Hermes Agent | npm run dashboard:certify:rendered -- --id nous-hermes-agent.dashboard |
| P0 | khashi-vc.roc | Repair dashboard enforcement blockers for Khashi VC ROC | npm run dashboard:certify:rendered -- --id khashi-vc.roc |
| P0 | media-engine.ops | Repair dashboard enforcement blockers for Media Engine Ops | npm run dashboard:certify:rendered -- --id media-engine.ops |
| P0 | media-business-operations.main | Repair dashboard enforcement blockers for Media Business Operations | npm run dashboard:certify:rendered -- --id media-business-operations.main |
| P0 | business-mapper.workspace | Repair dashboard enforcement blockers for Business Mapper Workspace | npm run dashboard:certify:rendered -- --id business-mapper.workspace |
| P0 | meal-assistant.main | Repair dashboard enforcement blockers for Meal Assistant | npm run dashboard:certify:rendered -- --id meal-assistant.main |
| P0 | rinseables-os.main | Repair dashboard enforcement blockers for Rinseables OS | npm run dashboard:certify:rendered -- --id rinseables-os.main |
| P0 | investing-system.roc | Repair dashboard enforcement blockers for Investing System ROC | npm run dashboard:certify:rendered -- --id investing-system.roc |
| P0 | hermes.workspace | Repair dashboard enforcement blockers for Hermes Workspace | npm run dashboard:certify:rendered -- --id hermes.workspace |
| P0 | tlc-capital-group-os.main | Repair dashboard enforcement blockers for TLC Capital Group OS | npm run dashboard:certify:rendered -- --id tlc-capital-group-os.main |

## Promotion Rule

A dashboard is not standard-compliant until every required layer is present and the project has no source/rendered/promotion blockers. Marker strings and package dependencies alone never certify a route.
