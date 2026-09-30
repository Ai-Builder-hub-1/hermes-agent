# Operational Proof Report

Generated: 2026-09-30T20:36:21.731Z

## Summary

| Metric | Value |
| --- | --- |
| routes | 36 |
| readyRoutes | 36 |
| partialRoutes | 0 |
| blockedRoutes | 0 |
| chartedOrBetter | 12 |
| staticRoutes | 0 |
| liveSourceGaps | 0 |
| evidenceGaps | 0 |
| safeActions | 27 |
| safeActionHardeningGaps | 0 |
| routeValidationStatus | ready |
| routeValidationPassed | 36 |
| routeValidationFailed | 0 |
| routeValidationBlocked | 0 |
| liveSourceValidationStatus | ready |
| liveSourcesReachable | 51 |
| liveSourcesAuthRequired | 0 |
| liveSourcesDependencyUnavailable | 0 |
| liveSourcesFailed | 0 |
| liveSourcesBlocked | 0 |
| liveSourceImpactedRoutes | 0 |

## Groups

| Group | Routes | Ready | Partial | Blocked | Average score |
| --- | --- | --- | --- | --- | --- |
| operate | 14 | 14 | 0 | 0 | 100 |
| trading | 9 | 9 | 0 | 0 | 100 |
| system | 13 | 13 | 0 | 0 | 100 |

## Lowest-Scoring Routes

| Route | Group | Maturity | Score | Status | Next action |
| --- | --- | --- | --- | --- | --- |
| /compounding-intelligence | operate | intelligent | 100 | ready | proposal drill-through |
| /contradictions | operate | live | 100 | ready | inline resolution actions |
| /decision-lineage | operate | live | 100 | ready | resolution actions |
| /operate | operate | actionable | 100 | ready | closeout audit flow |
| /operate/actions | operate | actionable | 100 | ready | action completion API |
| /operate/approvals | operate | actionable | 100 | ready | approval inbox persistence |
| /operate/blockers | operate | actionable | 100 | ready | blocker close/reopen audit |
| /operate/chat-actions | operate | actionable | 100 | ready | permission preview |
| /operate/evidence | operate | charted | 100 | ready | artifact previews |
| /operate/incidents | operate | actionable | 100 | ready | incident timeline |

## Safe Actions

| Metric | Value |
| --- | --- |
| actions | 27 |
| evidenceBacked | 27 |
| auditExpected | 27 |
| needsHardening | 0 |

## Route Validation

| Metric | Value |
| --- | --- |
| status | ready |
| routes | 36 |
| passed | 36 |
| failed | 0 |
| blocked | 0 |
| generatedAt | 2026-09-30T03:16:37.190Z |

## Live Source Validation

| Metric | Value |
| --- | --- |
| status | ready |
| sources | 51 |
| reachable | 51 |
| authRequired | 0 |
| dependencyUnavailable | 0 |
| failed | 0 |
| blocked | 0 |
| impactedRoutes | 0 |
| authMode | loopback_session_token |
| sessionTokenDiscovered | true |
| generatedAt | 2026-09-29T14:12:04.170Z |

## Runtime Evidence Persistence

| Metric | Value |
| --- | --- |
| attempted | false |
| status | skipped |
| detail | Set HERMES_OPERATIONAL_PROOF_PERSIST=1 and HERMES_OPERATIONAL_PROOF_BASE_URL to persist proof evidence. |

## Next Actions

- Persist route validation output as operating-runtime evidence when a writable dashboard backend is available.
