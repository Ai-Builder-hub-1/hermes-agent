# Dashboard Executive Daily Operating View

Generated: 2026-09-25T18:04:02.434Z
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
- Data operations: blocked (76/100)
- Data operations blocked layers: 6

## Top Priorities

- Resolve governed recovery audit failures before enabling new action classes.
- Resolve 6 blocked data operations layer(s) across Khashi VC and Investing System.

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
- Score: 76/100
- Generated: 2026-09-25T18:03:23.594Z
- BLOCKED Khashi VC: retention-readiness - StoreRecord has 1,980,093 estimated dead rows.
- BLOCKED Investing System: ledger-cardinality - OANDA ledger has 1,247,920 file(s).
- BLOCKED Investing System: ledger-budget-contract - Live ledger file budget is 50,000; over budget by 1,197,920 file(s).
- BLOCKED Investing System: archive-readiness - No OANDA archive catalog records found.
- BLOCKED Investing System: archive-catalog-contract - No verified OANDA archive catalog records found.
- BLOCKED Investing System: archive-restore-proof - No verified archive restore proof exists.
