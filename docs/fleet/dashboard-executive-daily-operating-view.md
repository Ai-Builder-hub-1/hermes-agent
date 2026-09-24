# Dashboard Executive Daily Operating View

Generated: 2026-09-24T20:22:14.776Z
Status: needs-attention

## Summary

- Dashboards: 10
- Attention: 0
- Fully operational score: 100
- Drift: stable
- Visual: visual-gate-passed
- Safe to deploy: true
- Policy: inside-policy
- Forecast: low-risk
- Recovery: recovery-ready
- Data operations: blocked (57/100)
- Data operations blocked layers: 7

## Top Priorities

- Resolve 7 blocked data operations layer(s) across Khashi VC and Investing System.

## Dashboard Posture

- PASS TLC Capital Group OS: Keep live checks, monitoring, health, and visual proof current.
- PASS Nous Hermes Agent: Keep live checks, monitoring, health, and visual proof current.
- PASS Hermes OS: Keep live checks, monitoring, health, and visual proof current.
- PASS Media Engine: Keep live checks, monitoring, health, and visual proof current.
- PASS Media Business Operations: Keep live checks, monitoring, health, and visual proof current.
- PASS Khashi VC: Keep live checks, monitoring, health, and visual proof current.
- PASS Business Mapper / Consulting: Keep live checks, monitoring, health, and visual proof current.
- PASS Meal Assistant: Keep live checks, monitoring, health, and visual proof current.
- PASS Rinseables OS: Keep live checks, monitoring, health, and visual proof current.
- PASS Investing System: Keep live checks, monitoring, health, and visual proof current.

## Data Operations

- Status: blocked
- Score: 57/100
- Generated: 2026-09-24T20:22:14.465Z
- BLOCKED Khashi VC: collection-freshness - microstructure-history is 285 minutes old. orderbook-snapshots is 285 minutes old. enriched-market-snapshots is 285 minutes old.
- BLOCKED Khashi VC: warehouse-mirror - Warehouse root is not mounted: /Volumes/Hermes/market-warehouse
- BLOCKED Khashi VC: retention-readiness - StoreRecord has 1,049,515 estimated dead rows.
- BLOCKED Investing System: ledger-cardinality - OANDA ledger has 1,242,382 file(s).
- BLOCKED Investing System: archive-readiness - No OANDA archive catalog records found.
- BLOCKED Investing System: backup-readiness - No Postgres backup files visible to Investing.
- BLOCKED Investing System: external-sync - External root is not mounted: /Volumes/Hermes
