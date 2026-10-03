# Canonical Software Maturity Gate

Generated: 2026-10-03T17:12:45.255Z

Status: software-maturity-gate-ready

## Summary

| Metric | Value |
| --- | --- |
| plans | 12 |
| blockers | 7 |
| activeBlockers | 4 |
| lockedBlockers | 2 |
| resolvedBlockers | 1 |
| requiredSoftwareHarnesses | 8 |
| unresolvedSoftwareHarnessGaps | 0 |
| activeUnclassifiedBlockers | 0 |
| errors | 0 |
| warnings | 0 |

## Remaining Runtime Gates

| ID | CP | Type | Status | Owner | Unblock |
| --- | --- | --- | --- | --- | --- |
| CMB-002 | CP-04/CP-06 | production-env | active | Investing System / Operations | Set/verify EARNINGS_BACKFILL_ARCHIVE_ROOT and EARNINGS_WAREHOUSE_ARCHIVE_ROOT, then run production mirror/restore proof. |
| CMB-003 | CP-07/CP-08/CP-10 | stale-production-proof | active | Khashi VC / Operations | Run npm run khashi:freshness:proof against production with the correct base URL/token, run npm run khashi:storage:maturity with readable warehouse catalog access, regenerate Khashi v2 reports/hard-stop, then run npm run khashi:maturity:truth until status is ready or only documented optional watches remain. |
| CMB-004 | CP-11 | production-token | active | Nous Hermes / Operations | Run live Discord and Telegram command E2E checks with production credentials. |
| CMB-007 | CP-01/CP-02/CP-03 | proof-environment | active | Nous Hermes / Operations | Rerun npm run dashboard:operational-sources:validate -- --base-url https://agent.tlccapitalgroup.com with production dashboard auth configured, then store the refreshed source report with protected APIs reachable or intentionally classified. |
| CMB-005 | CP-05 | approval-policy | locked | Investing System | Human approval after risk gate, live ops review, incident drill, and restore proof. |
| CMB-006 | CP-04 | approval-policy | locked | Operations | Human approval after all prune readiness gates pass. |

## Issues

No software-maturity gate issues found.
