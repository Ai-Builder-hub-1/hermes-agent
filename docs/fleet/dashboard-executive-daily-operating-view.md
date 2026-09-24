# Dashboard Executive Daily Operating View

Generated: 2026-09-24T20:37:30.455Z
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
- Recovery: recovery-attention
- Data operations: blocked (54/100)
- Data operations blocked layers: 7

## Top Priorities

- Resolve governed recovery audit failures before enabling new action classes.
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
- Score: 54/100
- Generated: 2026-09-24T20:34:37.444Z
- BLOCKED Khashi VC: collection-freshness - microstructure-history is 297 minutes old. orderbook-snapshots is 297 minutes old. enriched-market-snapshots is 297 minutes old.
- BLOCKED Khashi VC: warehouse-mirror - Warehouse root is not mounted: /Volumes/Hermes/market-warehouse
- BLOCKED Khashi VC: retention-readiness - StoreRecord has 1,054,892 estimated dead rows.
- BLOCKED Investing System: ledger-cardinality - OANDA ledger has 1,242,421 file(s).
- BLOCKED Investing System: archive-readiness - No OANDA archive catalog records found.
- BLOCKED Investing System: backup-readiness - No Postgres backup files visible to Investing.
- BLOCKED Investing System: external-sync - External root is not mounted: /Volumes/Hermes
