# Operational Proof Report

Generated: 2026-09-29T14:05:43.442Z

## Summary

| Metric | Value |
| --- | --- |
| routes | 34 |
| readyRoutes | 34 |
| partialRoutes | 0 |
| blockedRoutes | 0 |
| chartedOrBetter | 11 |
| staticRoutes | 0 |
| liveSourceGaps | 0 |
| evidenceGaps | 0 |
| safeActions | 24 |
| safeActionHardeningGaps | 0 |
| routeValidationStatus | ready |
| routeValidationPassed | 34 |
| routeValidationFailed | 0 |
| routeValidationBlocked | 0 |
| liveSourceValidationStatus | ready |
| liveSourcesReachable | 50 |
| liveSourcesAuthRequired | 0 |
| liveSourcesDependencyUnavailable | 0 |
| liveSourcesFailed | 0 |
| liveSourcesBlocked | 0 |
| liveSourceImpactedRoutes | 0 |

## Groups

| Group | Routes | Ready | Partial | Blocked | Average score |
| --- | --- | --- | --- | --- | --- |
| operate | 12 | 12 | 0 | 0 | 100 |
| trading | 9 | 9 | 0 | 0 | 100 |
| system | 13 | 13 | 0 | 0 | 100 |

## Lowest-Scoring Routes

| Route | Group | Maturity | Score | Status | Next action |
| --- | --- | --- | --- | --- | --- |
| /compounding-intelligence | operate | live | 100 | ready | scheduled freshness proof |
| /contradictions | operate | live | 100 | ready | inline resolution actions |
| /decision-lineage | operate | live | 100 | ready | resolution actions |
| /operate | operate | actionable | 100 | ready | server-first runtime hydration |
| /operate/actions | operate | actionable | 100 | ready | action completion API |
| /operate/approvals | operate | actionable | 100 | ready | approval inbox persistence |
| /operate/blockers | operate | actionable | 100 | ready | blocker close/reopen audit |
| /operate/chat-actions | operate | actionable | 100 | ready | permission preview |
| /operate/evidence | operate | charted | 100 | ready | artifact previews |
| /operate/incidents | operate | actionable | 100 | ready | incident timeline |

## Safe Actions

| Metric | Value |
| --- | --- |
| actions | 24 |
| evidenceBacked | 24 |
| auditExpected | 24 |
| needsHardening | 0 |

## Route Validation

| Metric | Value |
| --- | --- |
| status | ready |
| routes | 34 |
| passed | 34 |
| failed | 0 |
| blocked | 0 |
| generatedAt | 2026-09-29T14:05:35.193Z |

## Live Source Validation

| Metric | Value |
| --- | --- |
| status | ready |
| sources | 50 |
| reachable | 50 |
| authRequired | 0 |
| dependencyUnavailable | 0 |
| failed | 0 |
| blocked | 0 |
| impactedRoutes | 0 |
| authMode | loopback_session_token |
| sessionTokenDiscovered | true |
| generatedAt | 2026-09-29T14:04:06.268Z |

## Next Actions

- Persist route validation output as operating-runtime evidence when a writable dashboard backend is available.
