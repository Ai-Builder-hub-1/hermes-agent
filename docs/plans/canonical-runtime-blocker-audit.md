# Canonical Runtime Blocker Audit

Generated: 2026-10-03T22:58:55.907Z

Status: ready-with-locked-approvals

## Summary

| Metric | Value |
| --- | --- |
| checks | 5 |
| ready | 3 |
| blocked | 0 |
| locked | 2 |

## Checks

| ID | Check | Status | Evidence | Blockers | Next Actions |
| --- | --- | --- | --- | --- | --- |
| CMB-002 | Investing earnings warehouse production proof | ready | investing-system/docs/proofs/earnings-warehouse-production-proof-latest.json | none | Keep the production proof fresh before scaled collection expansion. |
| CMB-003 | Khashi freshness/storage production proof | ready | khashi-vc/docs/reports/khashi-maturity-truth/latest.json | none | Keep Khashi maturity truth fresh before relying on market intelligence reports. |
| CMB-007 | Nous production route/source proof | ready | nous-hermes-agent/docs/design/operational-route-validation-report.json and nous-hermes-agent/docs/design/operational-live-source-validation-report.json | none | Keep production route/source validation fresh after dashboard deploys. |
| CMB-005 | OANDA live trading | locked | canonical approval policy | Human approval remains required before live execution. | Do not unlock without explicit human approval and current risk/restore/incident proof. |
| CMB-006 | destructive pruning | locked | canonical approval policy | Human approval remains required before destructive pruning. | Do not unlock without explicit human approval and current risk/restore/incident proof. |
