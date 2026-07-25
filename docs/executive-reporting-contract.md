# Executive Reporting Contract

Status: implemented as a static contract, dashboard route, and readiness completion boundary.
Last updated: 2026-07-25.

## Purpose

Hermes needs one executive surface that can summarize TLC Capital Group without forcing the operator to inspect every project dashboard. The Executive Briefing Room is that surface.

It does not replace project dashboards. It consumes project-level reports and turns them into:

- business-unit readiness summaries
- co-CEO and officer reports
- decision requests
- risk and blocker rollups
- evidence references
- deferred human-owned setup items

## Current Implementation

The shared contract lives in:

- `packages/hermes-dashboard-kit/src/executive-reports.ts`
- `packages/hermes-dashboard-kit/src/readiness-completion.ts`

The first sample feed lives in:

- `web/src/pages/executive-briefing-data.ts`

The dashboard route lives in:

- `web/src/pages/ExecutiveBriefingRoomPage.tsx`
- `/executive-briefing`

The route now distinguishes:

- locally completed command-center capabilities
- local build queue items
- downstream project work
- external blockers that require credentials, production access, or authority signoff

## Data Ownership

Nous Hermes Agent owns the executive reporting UI and the shared reporting contract.

Individual projects should eventually emit their own report feed using the same contract shape. TLC Capital Group OS remains the enterprise authority layer for approval policy, business-unit readiness scoring, and portfolio-level governance.

## Deferred Human-Owned Items

These are intentionally not solved in the static contract layer:

- production SSH/drill windows
- live Hetzner verification access
- provider billing credentials
- social platform permissions
- paid model fallback approvals
- final authority matrix signoff

## Next Build Slice

Replace the static feed with project adapters that read report artifacts from:

- TLC Capital Group OS
- Hermes
- Media Engine
- Khashi VC
- Media Business OS
- Rinseables OS

Each adapter should preserve source confidence, freshness, and evidence links so the executive surface can distinguish real telemetry from manually curated status.
