# Canonical Maturity Blocker Tracker

Generated: 2026-10-02

Purpose: keep long-running canonical maturity work moving. A blocker listed here does not stop adjacent build work; it identifies the exact missing proof, owner, unblock command/action, and evidence path.

| ID | CP | Type | Impact | Owner | Continue Path | Unblock Command / Action | Evidence Path | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CMB-001 | CP-03 / CP-11 | runtime-integration | Embedded PTY chat/gateway command execution and live messaging gateway commands now have registered preflight software coverage before high-impact execution. Dashboard REST routes for deploy, warehouse, operating-runtime adapters, release trains, provider backfill, trading research, Khashi signals, reports, spawned Hermes actions, installs, imports, gateway lifecycle, checkpoint pruning, embedded TUI command dispatch, slash worker dispatch, messaging `/update`, and messaging quick-command exec are test-covered. | Nous Hermes | Keep route, gateway, and messaging command tests green; live credentialed Discord/Telegram E2E evidence is tracked separately under CMB-004. | `uv run pytest -q tests/test_tui_gateway_server.py tests/cli/test_quick_commands.py tests/gateway/test_slash_access_dispatch.py tests/gateway/test_update_streaming.py tests/test_high_impact_preflight_adapters.py` | `docs/proofs/cp03-second-brain-production-readiness.md` | resolved |
| CMB-002 | CP-04 / CP-06 | production-env | Investing earnings warehouse mirror/restore proof needs production archive roots verified. | Investing System / Operations | Build proof harness, coverage reports, and dashboard observability. | Set/verify `EARNINGS_BACKFILL_ARCHIVE_ROOT` and `EARNINGS_WAREHOUSE_ARCHIVE_ROOT`, then run production mirror/restore proof. | `investing-system/docs/proofs/earnings-event-trading-e05-e24-full-extent-audit.md` | active |
| CMB-003 | CP-07 / CP-10 | source-contract | Khashi market intelligence and reporting need finalized source cadence and report ingestion contract. | Khashi VC | Build contracts, validators, sample ingestion, and Nous visibility with mocked examples. | Confirm source list/cadence and run Khashi signal/report ingestion proof. | `khashi-vc/docs/ops/KHASHI_CP07_MARKET_INTELLIGENCE_LANE.md` | active |
| CMB-004 | CP-11 | production-token | Discord/Telegram production E2E command proof may require live bot/session credentials. | Nous Hermes / Operations | Build authorization tests, audit contracts, and simulated command proofs. | Run live Discord and Telegram command E2E checks with production credentials. | `docs/plans/wave-2-operational-safety-completion-report.md` | active |
| CMB-005 | CP-05 | approval-policy | OANDA live trading must remain blocked until explicit approval packet, risk gate, incident drill, and restore proof pass. | Investing System | Build/readiness proofs and approval packet; do not enable live execution. | Human approval after risk gate, live ops review, incident drill, and restore proof. | `investing-system/docs/oanda-live-readiness-canonical-matrix.md` | locked |
| CMB-006 | CP-04 | approval-policy | Destructive pruning remains disabled until archive, backup, restore, rollup, and explicit approval gates pass. | Operations | Build dry-run and readiness proof; do not enable deletion. | Human approval after all prune readiness gates pass. | `docs/plans/cross-project-warehouse-truth-contract.md` | locked |

## Rules

- Add blockers here instead of stopping the build when the blocker is external, credential-based, approval-based, or production-environment-based.
- Keep software, tests, docs, contracts, mocks, dashboard states, and proof harnesses moving around active blockers.
- Never downgrade `locked` blockers to active without explicit approval evidence.
