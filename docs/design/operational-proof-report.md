# Operational Proof Report

Generated: 2026-09-29T13:56:57.019Z

## Summary

| Metric | Value |
| --- | --- |
| routes | 33 |
| readyRoutes | 33 |
| partialRoutes | 0 |
| blockedRoutes | 0 |
| chartedOrBetter | 11 |
| staticRoutes | 0 |
| liveSourceGaps | 0 |
| evidenceGaps | 0 |
| safeActions | 23 |
| safeActionHardeningGaps | 0 |
| routeValidationStatus | ready |
| routeValidationPassed | 33 |
| routeValidationFailed | 0 |
| routeValidationBlocked | 0 |
| liveSourceValidationStatus | ready |
| liveSourcesReachable | 49 |
| liveSourcesAuthRequired | 0 |
| liveSourcesDependencyUnavailable | 0 |
| liveSourcesFailed | 0 |
| liveSourcesBlocked | 0 |
| liveSourceImpactedRoutes | 0 |

## Groups

| Group | Routes | Ready | Partial | Blocked | Average score |
| --- | --- | --- | --- | --- | --- |
| operate | 11 | 11 | 0 | 0 | 100 |
| trading | 9 | 9 | 0 | 0 | 100 |
| system | 13 | 13 | 0 | 0 | 100 |

## Lowest-Scoring Routes

| Route | Group | Maturity | Score | Status | Next action |
| --- | --- | --- | --- | --- | --- |
| /compounding-intelligence | operate | live | 100 | ready | scheduled freshness proof |
| /decision-lineage | operate | live | 100 | ready | resolution actions |
| /operate | operate | actionable | 100 | ready | server-first runtime hydration |
| /operate/actions | operate | actionable | 100 | ready | action completion API |
| /operate/approvals | operate | actionable | 100 | ready | approval inbox persistence |
| /operate/blockers | operate | actionable | 100 | ready | blocker close/reopen audit |
| /operate/chat-actions | operate | actionable | 100 | ready | permission preview |
| /operate/evidence | operate | charted | 100 | ready | artifact previews |
| /operate/incidents | operate | actionable | 100 | ready | incident timeline |
| /operate/runs | operate | actionable | 100 | ready | loop run history |

## Safe Actions

| Metric | Value |
| --- | --- |
| actions | 23 |
| evidenceBacked | 23 |
| auditExpected | 23 |
| needsHardening | 0 |

## Route Validation

| Metric | Value |
| --- | --- |
| status | ready |
| routes | 33 |
| passed | 33 |
| failed | 0 |
| blocked | 0 |
| generatedAt | 2026-09-29T13:56:33.116Z |

## Live Source Validation

| Metric | Value |
| --- | --- |
| status | ready |
| sources | 49 |
| reachable | 49 |
| authRequired | 0 |
| dependencyUnavailable | 0 |
| failed | 0 |
| blocked | 0 |
| impactedRoutes | 0 |
| authMode | loopback_session_token |
| sessionTokenDiscovered | true |
| generatedAt | 2026-09-29T13:55:03.790Z |

## Next Actions

- Persist route validation output as operating-runtime evidence when a writable dashboard backend is available.
