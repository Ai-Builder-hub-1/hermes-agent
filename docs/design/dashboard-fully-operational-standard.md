# Dashboard Fully Operational Standard

Generated dashboard route certification proves that a route exists, has evidence,
uses the dashboard standard, and is safe to ship. Fully operational certification
is stricter: it proves the dashboard can be used as an operating surface without
requiring ad hoc SSH inspection or undocumented manual recovery.

## Required Posture

A dashboard fleet is fully operational only when all of the following are true:

- Every generated route has a complete ten-layer operational maturity packet.
- Every project dashboard is certified with no review or blocked status.
- Every production dashboard has live E2E evidence, monitoring evidence, live
  health evidence, and visual proof.
- Every dashboard action is classified as read-only, safe, approval-required,
  maintenance-window-only, retired, or intentionally blocked.
- No unsafe mutation is enabled.
- No action remains unknown or unclassified.
- Mutating actions are allowed to remain blocked when their classification
  requires approval, maintenance context, rollback proof, or live endpoint work.
- The command governance ledger has zero missing controls.
- The fleet ship check is safe to commit and safe to deploy.

## Ten Operational Layers

Each generated dashboard page must expose or certify:

1. Access and recovery.
2. Purpose and orientation.
3. Live data contract.
4. Operational summary.
5. Drilldowns.
6. History and trends.
7. Governed actions.
8. Incidents and alerts.
9. Business workflow.
10. Rollup and certification.

## Action Rules

Read-only actions may be enabled when they are permissioned and audited.

Safe actions may be enabled when they are idempotent, rate-limited, audited, and
return a clear result state.

Material mutations must remain blocked until they have a live endpoint,
permission gate, confirmation, approval path, audit write, cooldown, duplicate
suppression, and recovery proof.

Maintenance-window actions must remain blocked unless there is an approved
maintenance or incident context with rollback proof.

Destructive actions must never be treated as routine dashboard actions.

## Certification Output

The fleet-level certification output is:

- `docs/fleet/dashboard-fully-operational-certification.json`
- `docs/fleet/dashboard-fully-operational-certification.md`

The gate command is:

- `npm run dashboard:fully-operational:certify`

The validation command is:

- `npm run dashboard:fully-operational:validate`
