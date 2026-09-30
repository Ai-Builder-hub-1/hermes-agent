# Wave 1 Truth Layer Completion Report

Date: 2026-09-30

Scope:

- CP-12 Legacy Umbrella / Historical Plans
- CP-04 Cross-Project Data Warehouse / Storage / Archive
- CP-08 Khashi Data Operations / Infrastructure Reliability

## Result

Wave 1 is complete for the planning and proof-contract layer.

This does not mean every warehouse/archive blocker is fixed. It means the source of truth, gate contract, Khashi implementation lane, and validators now exist so the remaining blockers are explicit and testable.

## Completed

### CP-12

- Added machine-readable canonical registry:
  - `docs/plans/canonical-cross-project-plan-registry.json`
- Added validator:
  - `scripts/validate-cross-project-plan-registry.mjs`
- Validator confirms:
  - 12 canonical plans exist;
  - Wave 1 order is `CP-12 -> CP-04 -> CP-08`;
  - all mapped source files exist;
  - known overlaps are explicit instead of accidental.

### CP-04

- Added cross-project warehouse truth contract:
  - `docs/plans/cross-project-warehouse-truth-contract.md`
  - `docs/plans/cross-project-warehouse-truth-contract.json`
- Added validator:
  - `scripts/validate-warehouse-truth-contract.mjs`
- Contract defines required gates:
  - collector continuity;
  - storage runway;
  - archive integrity;
  - mirror integrity;
  - restore proof;
  - operator visibility.
- OANDA archive trust remains explicitly blocked until verified archive/compaction and restore proof exist.

### CP-08

- Added Khashi implementation lane:
  - `khashi-vc/docs/ops/KHASHI_CP08_DATA_OPS_IMPLEMENTATION_LANE.md`
  - `khashi-vc/docs/ops/KHASHI_CP08_DATA_OPS_IMPLEMENTATION_LANE.json`
- Added validator:
  - `scripts/validate-khashi-cp08-lane.mjs`
- Khashi lane now maps every CP-04 warehouse gate to Khashi-specific proof and keeps destructive pruning disabled by policy.

## Validation Commands

```bash
node scripts/validate-cross-project-plan-registry.mjs
node scripts/validate-warehouse-truth-contract.mjs
node scripts/validate-khashi-cp08-lane.mjs
```

Expected results:

- `registry validation passed: 12 plans, wave one CP-12 -> CP-04 -> CP-08`
- `warehouse truth validation passed: 3 projects, 6 gates`
- `khashi CP-08 validation passed: 6 gates, pruning disabled`

## Remaining Blockers After Wave 1

- OANDA archive bundles still need a verified lower-memory archive/compaction path.
- Restore proof still needs to be produced for archive/database artifacts before destructive pruning can be enabled.
- Khashi production mirror/writeability and restore rehearsal should be kept as visible proof, not assumed from local drive availability.
- Nous operational pages still need to surface these facts as operator-visible warehouse/storage/freshness/worker status.
