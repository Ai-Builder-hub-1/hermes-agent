# Dashboard Executive Daily Operating View

Generated: 2026-09-25T17:19:11.766Z
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
- Data operations: blocked (70/100)
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
- Score: 70/100
- Generated: 2026-09-25T17:18:22.447Z
- BLOCKED Khashi VC: collection-freshness - microstructure-history is 743 minutes old; expected every 15 minutes via deploy-amari-recorder-1. orderbook-snapshots is 743 minutes old; expected every 15 minutes via deploy-amari-recorder-1. enriched-market-snapshots is 743 minutes old; expected every 15 minutes via deploy-amari-recorder-1.
- BLOCKED Khashi VC: retention-readiness - StoreRecord has 1,941,687 estimated dead rows.
- BLOCKED Khashi VC: freshness-recovery-routing - 3 stale store(s) need owner/service routing.
- BLOCKED Investing System: ledger-cardinality - OANDA ledger has 1,247,759 file(s).
- BLOCKED Investing System: ledger-budget-contract - Live ledger file budget is 50,000; over budget by 1,197,759 file(s).
- BLOCKED Investing System: archive-readiness - No OANDA archive catalog records found.
- BLOCKED Investing System: archive-catalog-contract - No verified OANDA archive catalog records found.
