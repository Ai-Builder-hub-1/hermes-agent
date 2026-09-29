# Operational Proof Report

Generated: 2026-09-29T12:55:27.664Z

## Summary

| Metric | Value |
| --- | --- |
| routes | 32 |
| readyRoutes | 32 |
| partialRoutes | 0 |
| blockedRoutes | 0 |
| chartedOrBetter | 11 |
| staticRoutes | 0 |
| liveSourceGaps | 0 |
| evidenceGaps | 0 |
| safeActions | 23 |
| safeActionHardeningGaps | 0 |

## Groups

| Group | Routes | Ready | Partial | Blocked | Average score |
| --- | --- | --- | --- | --- | --- |
| operate | 10 | 10 | 0 | 0 | 100 |
| trading | 9 | 9 | 0 | 0 | 100 |
| system | 13 | 13 | 0 | 0 | 100 |

## Lowest-Scoring Routes

| Route | Group | Maturity | Score | Status | Next action |
| --- | --- | --- | --- | --- | --- |
| /compounding-intelligence | operate | live | 100 | ready | scheduled freshness proof |
| /operate | operate | actionable | 100 | ready | server-first runtime hydration |
| /operate/actions | operate | actionable | 100 | ready | action completion API |
| /operate/approvals | operate | actionable | 100 | ready | approval inbox persistence |
| /operate/blockers | operate | actionable | 100 | ready | blocker close/reopen audit |
| /operate/chat-actions | operate | actionable | 100 | ready | permission preview |
| /operate/evidence | operate | charted | 100 | ready | artifact previews |
| /operate/incidents | operate | actionable | 100 | ready | incident timeline |
| /operate/runs | operate | actionable | 100 | ready | loop run history |
| /second-brain | operate | live | 100 | ready | warehouse sync trend |

## Safe Actions

| Metric | Value |
| --- | --- |
| actions | 23 |
| evidenceBacked | 23 |
| auditExpected | 23 |
| needsHardening | 0 |

## Next Actions

- Add Playwright route validation for Operate, Trading, and System pages.
- Persist route validation output as operating-runtime evidence.
