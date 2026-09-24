# Dashboard Governed Recovery Audit

Generated: 2026-09-24T20:58:56.557Z
Status: recovery-attention

## Audit Checks

- PASS command-safe: Command governance is safe.
- PASS no-unsafe-mutations: No unsafe mutations are enabled.
- PASS no-unknown-actions: No unknown actions remain.
- PASS drift-stable: Maturity drift is stable.
- PASS visual-gate: Visual gate is passing.
- PASS predictive-low-risk: Predictive causal intelligence is low-risk.
- PASS ship-ready: Fleet is safe to commit and deploy.
- FAIL daily-clear: Daily operating view is clear.

## Recovery Classes

- AUTO-SAFE Refresh stale generated evidence: Regenerate maturity, health, monitoring, and visual reports.
- AUTO-SAFE Rerun live dashboard check: Run the live E2E or monitoring check for the affected dashboard.
- AUTO-SAFE Refresh production visual proof: Capture/compare visual proof and update the visual gate report.
- APPROVAL-REQUIRED Restart a stalled collector or worker: Requires project owner approval and linked evidence of stalled collection.
- MAINTENANCE-WINDOW Run pruning or compaction: Requires quiet window, backup proof, dry-run estimate, and rollback plan.
- APPROVAL-REQUIRED Enable a controlled mutating action: Requires command governance approval and action unlock evidence.
- APPROVAL-REQUIRED Deploy dashboard change: Requires ship check, maturity report validation, web build, and production verification.
- BLOCKED Delete or destructively prune data: Blocked until retention policy, backup proof, owner approval, and restore test are present.
