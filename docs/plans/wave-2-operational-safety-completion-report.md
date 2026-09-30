# Wave 2 Operational Safety Completion Report

Date: 2026-09-30

Scope:

- CP-05 Investing Trading / OANDA Live-Readiness
- CP-02 Operate / Trading / System Control Plane
- CP-11 Messaging / Agent Command Layer

## Result

Wave 2 is complete for the operational-safety contract layer.

The OANDA archive blocker now has a test-covered proof command path. Live money remains locked. Destructive pruning remains locked. The remaining work is production execution/proof capture, not deciding the standard.

## Completed

### CP-05

- Added canonical OANDA live-readiness matrix in Investing System.
- Changed `npm run storage:archive` to use the create -> verify -> restore proof path.
- Added `npm run oanda:archive:prove`.
- Added archive tests proving bounded create/verify/restore works in one flow.

### CP-02

- Wave 2 contract names the required control-plane pages:
  - `/system/warehouse`
  - `/system/storage`
  - `/system/freshness`
  - `/system/workers`
  - `/system/deployments`
  - `/system/credentials`
- Operational route validation passed against the local preview server:
  - 36/36 routes passed;
  - 0 failed;
  - 0 blocked.

### CP-11

- Wave 2 contract names the command-layer invariants:
  - Discord and Telegram cannot bypass role authorization;
  - commands cannot bypass OANDA live locks;
  - commands cannot bypass destructive pruning locks;
  - high-impact mutations need auditability.

## Remaining Production Proof

- Run the archive proof command against the production OANDA ledger with bounded settings appropriate for the production host.
- Capture restore proof into the production archive catalog.
- Run production command E2E tests for Discord/Telegram high-impact flows.
