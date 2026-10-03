# Canonical Runtime Blocker Audit

Generated: 2026-10-03T02:50:06.978Z

Status: blocked

## Summary

| Metric | Value |
| --- | --- |
| checks | 5 |
| ready | 0 |
| blocked | 3 |
| locked | 2 |

## Checks

| ID | Check | Status | Evidence | Blockers | Next Actions |
| --- | --- | --- | --- | --- | --- |
| CMB-002 | Investing earnings warehouse production proof | blocked | investing-system/docs/proofs/earnings-warehouse-production-proof-latest.json | Missing EARNINGS_BACKFILL_ARCHIVE_ROOT.; Missing EARNINGS_WAREHOUSE_ARCHIVE_ROOT.; No durable production/archive warehouse root is included in the readiness evidence.; No destination warehouse archive root was provided.; No durable warehouse archive root is configured for mirror targets.; No durable production staging/archive root is included.; No durable warehouse root is included.; No artifacts have a successful warehouse mirror ledger entry.; Warehouse mirror was not written; proof is dry-run only.; EARNINGS_WAREHOUSE_ARCHIVE_ROOT / --warehouse-root is not configured. | Set EARNINGS_BACKFILL_ARCHIVE_ROOT and EARNINGS_WAREHOUSE_ARCHIVE_ROOT in the production/runtime environment.; Run `npm run earnings:warehouse:production-proof -- --write-mirror --output=docs/proofs/earnings-warehouse-production-proof-latest.json` from investing-system.; Rerun this canonical runtime blocker audit. |
| CMB-003 | Khashi freshness/storage production proof | blocked | khashi-vc/docs/reports/khashi-maturity-truth/latest.json | Missing KHASHI_FRESHNESS_TOKEN or AMARI_* token.; Required artifact is blocked: blocked; 11 blocker(s).; Required artifact is expired: 2247m old, max 120m.; Required artifact is expired: 9152m old, max 120m.; Required artifact is expired: 9196m old, max 180m. | Run `KHASHI_FRESHNESS_MODE=production npm run khashi:freshness:proof` from khashi-vc with production URL/token configured.; Run `npm run khashi:storage:maturity` from khashi-vc with readable warehouse root configured.; Regenerate Khashi v2 reports and run `npm run khashi:maturity:truth`. |
| CMB-007 | Nous production route/source proof | blocked | nous-hermes-agent/docs/design/operational-route-validation-report.json and nous-hermes-agent/docs/design/operational-live-source-validation-report.json | Missing dashboard auth input for protected source validation.; 53 dashboard sources still require auth. | Set DASHBOARD_BEARER_TOKEN, DASHBOARD_AUTH_COOKIE, HERMES_DASHBOARD_SESSION_TOKEN, or DASHBOARD_SESSION_TOKEN.; Run `npm run dashboard:operational-sources:validate -- --base-url https://agent.tlccapitalgroup.com`.; Rerun `npm run canonical:runtime-blockers:audit`. |
| CMB-005 | OANDA live trading | locked | canonical approval policy | Human approval remains required before live execution. | Do not unlock without explicit human approval and current risk/restore/incident proof. |
| CMB-006 | destructive pruning | locked | canonical approval policy | Human approval remains required before destructive pruning. | Do not unlock without explicit human approval and current risk/restore/incident proof. |
