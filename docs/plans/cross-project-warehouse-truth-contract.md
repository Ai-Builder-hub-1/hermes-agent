# Cross-Project Warehouse Truth Contract

Canonical plan: CP-04

Status: active-ready

This contract defines what must be true before data collection, warehouse mirroring, archive trust, restore proof, retention, and pruning can be treated as mature across Nous Hermes Agent, Investing System, and Khashi VC.

## Current Position

The system is not blocked because the external drive is small. The system remains governed where destructive operations require explicit approval even after durable proof is ready.

The previous OANDA archive-trust blocker is resolved to bounded production proof: verified bundles now include manifest, checksum, count, and restore proof. Investing storage proof is ready. Khashi storage pressure is cleared by Docker build-cache maintenance proof. Khashi backup and targeted restore proof are ready. Destructive pruning remains disabled until every archive, backup, restore, rollup, and approval gate passes.

Production independence is now explicit: production collectors, production-local backups, and deployments must not depend on the local computer or external drive being online. The external warehouse mirror is a pull-based off-server durability layer. If it is disconnected, CP-04 records mirror lag and raises a warning, but production continues as long as Tier 0 and Tier 1 proof are healthy.

The production-independent durability standard is defined in:

- `docs/plans/cp04-production-independent-warehouse-durability.md`
- `docs/plans/cp04-production-independent-warehouse-durability.json`

## Durability Tiers

| Tier | Role | Runtime dependency | Deploy dependency |
| --- | --- | --- | --- |
| Tier 0: Production database | Active source of truth for live application state and collected records. | Yes | Yes |
| Tier 1: Production-local backup/archive | Server-side recovery layer for backups, archive bundles, manifests, and restore proof. | Yes | Yes |
| Tier 2: External warehouse mirror | Off-server durability and long-term mirror that catches up when connected. | No | No |
| Tier 3: Historical cold archive | Optional deep retention and long-horizon evidence archive. | No | No |

## Gate Split

- Runtime gates protect active collection and service health.
- Deploy gates require production-local backup, restore, rollback/migration, disk, and service health proof.
- Prune gates require archive, backup, restore, dry-run, explicit approval, and post-prune verification.
- Mirror gates measure off-server durability lag and catch-up proof.
- Continuity gates track how long the system can safely operate before off-server lag becomes a business continuity concern.

Deploy gates do not require an external drive mount, a current local warehouse mirror, or a local computer being online.

## Project Roles

| Project | Role | Current posture |
| --- | --- | --- |
| Khashi VC | Market-intelligence warehouse producer | Ready: fresh proof exists, Docker build-cache pressure is cleared, and backup/targeted restore proof is explicit. |
| Investing System | OANDA and financial-analysis warehouse producer | Ready/watch: archive trust proof exists; prune/live promotion remain approval-gated. |
| Nous Hermes Agent | Fleet visibility and operator control plane | Consumer/control plane; must surface warehouse, storage, freshness, workers, archive, and restore proof. |

## Maturity Gates

| Gate | Ready | Watch | Blocked |
| --- | --- | --- | --- |
| Collector continuity | Workers are running, restart deltas are low, and datasets refresh within cadence. | Some collectors are stale or restarting, but durable writes continue. | Required collector stopped, OOM killed, or producing no fresh rows. |
| Storage runway | Disk below 75% used or forecast outside danger windows. | Disk 75-85% used or runway forecast uncertain. | Disk above 85% without verified retention/export proof. |
| Archive integrity | Bundles have manifests, checksums, counts, and restore proof. | Bundles exist but restore proof/catalog coverage is incomplete. | Bundles missing, incomplete, too memory-heavy to reproduce, or fail verification. |
| Mirror integrity | External mirror is mounted in production, writable, cataloged, and verified. | Mirror exists locally but production writeability is unproven. | Mirror root missing or no verified bundles exist. |
| Restore proof | Current archive and database backup restored into staging or an isolated verification target. | Backup/archive artifacts exist but restore rehearsal is stale. | No restore proof exists for data that would be pruned or trusted. |
| Operator visibility | Nous shows growth, freshness, retention, mirror, archive, restore, and failed collectors. | Some facts visible, but drilldown or history is incomplete. | Operators cannot tell if data is fresh, mirrored, restorable, or safe to prune. |

## Non-Negotiable Pruning Rule

Destructive pruning remains disabled unless all of these are true:

- archive integrity is ready;
- database backup proof is ready;
- restore proof is ready;
- retention rollup proof is ready;
- operator approval is recorded.

## Wave 1 Exit

Wave 1 is complete only when:

- the canonical plan registry validates;
- this warehouse truth contract validates;
- the OANDA archive proof and remaining prune/live gates are explicitly represented;
- the Khashi data-ops implementation lane points at CP-04;
- pruning remains blocked unless backup, archive, restore, rollup, and approval gates pass.
