# CP04 Production-Independent Warehouse Durability Plan

Canonical plan: CP-04

Status: active-build

Generated: 2026-10-01

## Objective

Production must keep collecting data, storing data, deploying safely, and creating production-local recovery proof even when the local computer is off or the external drive is unplugged. The external warehouse mirror is a monitored downstream durability layer, not a runtime dependency.

Success means this sentence is true:

> If the local computer is off and the external drive is unplugged for a week, production still collects data, deploys when server-side proof is fresh, stores backups locally, alerts that the mirror is stale, and catches the external warehouse up when it returns.

## Durability Tiers

| Tier | Name | Role | Runtime dependency | Deploy dependency | Prune dependency |
| --- | --- | --- | --- | --- | --- |
| 0 | Production database | Active source of truth for live application state and collected records. | Required | Required | Required |
| 1 | Production-local backup/archive | Server-side recovery layer for backups, archive bundles, manifests, and restore proof. | Required | Required | Required |
| 2 | External warehouse mirror | Off-server durability and long-term mirror that catches up when connected. | Not required | Not required | Recommended; may be elevated by policy |
| 3 | Historical cold archive | Optional deep retention and long-horizon evidence archive. | Not required | Not required | Not required unless policy says so |

## Gate Split

Runtime, deployment, pruning, mirror, and continuity gates are separate. A stale external mirror must not stop production collectors or deployments when production-local proof is healthy.

| Gate class | Blocks runtime | Blocks deploy | Blocks destructive prune | Treat stale mirror as |
| --- | --- | --- | --- | --- |
| Runtime | Yes | Yes if service health is affected | Yes | Warning |
| Deploy | No | Yes | Yes if migration/restore proof is stale | Warning |
| Prune | No | No | Yes | Warning or policy precondition |
| Mirror | No | No | Not by default | Warning |
| Continuity | No | Warning unless server-side proof is stale | Warning or block by lag policy | Warning |

## Phase Plan

### Phase 1: Durability Tier Contract

Define Tier 0 through Tier 3 and make the non-dependency rule explicit.

Exit tests:

- Contract lists all four tiers.
- Tier 2 external mirror has `runtimeDependency: false`.
- Tier 2 external mirror has `deployDependency: false`.

### Phase 2: Runtime Gate Split

Separate runtime, deploy, prune, mirror, and continuity gates so the external warehouse cannot accidentally become a hard runtime dependency.

Exit tests:

- Gate classes are represented separately.
- Mirror gate does not block runtime.
- Mirror gate does not block deploy.

### Phase 3: Production-Local Backup Standard

Require each producer project to publish production-local backups, archive manifests, and restore proof before relying on external mirroring.

Exit tests:

- Investing lists production-local Postgres backup, OANDA archive, catalog, restore proof, and prune dry-run proof.
- Khashi lists production-local Postgres backup, StoreRecord rollup/export, restore proof, and retention dry-run proof.
- Nous lists dashboard/session/config backup, second-brain sync proof, registry backup, and restore proof.

### Phase 4: External Mirror Catch-Up

Treat the external drive as pull-based catch-up. If absent, record mirror lag and continue production.

Exit tests:

- Mirror behavior includes disconnected, reconnecting, catch-up, verified, and stale states.
- Disconnected mirror severity is warning unless off-server lag exceeds continuity policy.

### Phase 5: Nous CP04 Dashboard Visibility

Nous must show production source health, production backup health, restore proof age, external mirror lag, prune lock state, and deploy/prune safety separately.

Exit tests:

- Dashboard requirements include tier health, mirror lag, backup freshness, restore proof age, safe-to-deploy, and safe-to-prune cards.

### Phase 6: Deployment Gate Rework

Deployments depend on production-local proof, not a local external drive.

Exit tests:

- Deploy gate requires production backup freshness, restore proof freshness, rollback or migration proof, disk headroom, and service health.
- Deploy gate explicitly does not require external drive mounted, local warehouse current, or local computer online.

### Phase 7: Prune Gate Rework

Pruning remains stricter than deployments and requires explicit, scoped approval.

Exit tests:

- Prune gate requires archive proof, backup proof, restore proof, dry-run hash, approval packet, and post-prune verification.
- Destructive prune remains disabled by default.

### Phase 8: Alert Attribution

Alerts must identify the affected tier, project, dataset, gate class, severity, and next action.

Exit tests:

- Alert severities distinguish critical runtime/database conditions from warning-level mirror lag.
- Vague resource alerts are not considered mature unless they include attribution.

### Phase 9: Failure Drills

Document and rehearse the failure modes that matter.

Exit tests:

- Drill matrix covers local computer off, external drive unplugged, deploy with stale mirror, production backup missing, restore proof stale, disk pressure, collector stop, and mirror reconnect catch-up.

### Phase 10: Final CP04 Operating Standard

Make the tier split, gate split, alert behavior, dashboard visibility, and failure drills part of the standing CP04 operating standard.

Exit tests:

- The validator passes.
- CP04 truth contract references this durability contract.
- Investing and Khashi runbooks state production does not depend on the external drive for runtime or deploy.

