# Cross-Project Warehouse Truth Contract

Canonical plan: CP-04

Status: active-watch

This contract defines what must be true before data collection, warehouse mirroring, archive trust, restore proof, retention, and pruning can be treated as mature across Nous Hermes Agent, Investing System, and Khashi VC.

## Current Position

The system is not blocked because the external drive is small. The system is on watch where durable proof is incomplete, stale, or approval-gated.

The previous OANDA archive-trust blocker is resolved to bounded production proof: verified bundles now include manifest, checksum, count, and restore proof. Remaining watch items are OANDA ledger files over live budget, approval-gated archive/prune batches, Khashi archive/mirror/restore proof, and keeping destructive pruning disabled until every gate passes.

## Project Roles

| Project | Role | Current posture |
| --- | --- | --- |
| Khashi VC | Market-intelligence warehouse producer | Watch-ready: production proof exists, but storage/watch items and rollups remain. |
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
