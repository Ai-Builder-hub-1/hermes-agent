# Dashboard Admission RFC Template

Status: V6 template  
Owner: Nous Hermes Agent

Use this before building or materially redesigning a dashboard surface.

## Summary

- Surface ID:
- Project:
- Owner:
- Reviewer:
- Workspace:
- Primary recipe:
- Secondary recipe, if any:
- Intended production URL:
- Canonical route:
- Shell model: single-shell | standalone-dev-only | compatibility-route
- Legacy/compatibility routes:
- Current experience tier: 0 raw legacy report | 1 one-shell organized report | 2 shared component dashboard | 3 product-grade cockpit
- Target experience tier:
- Tier migration required:
- Tier migration blockers:
- Proof route:

## User Decision

What decision should this surface help the operator make?

## Data Contract

| Field | Source | Unit | Required | Null Behavior | Freshness |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## State Contract

Required states:

- initial
- loading
- partial
- empty
- success
- refreshing
- stale
- unavailable
- error

State notes:

## Interaction Contract

- Primary interactions:
- Drilldowns:
- Filters:
- Pagination / virtualization:
- Keyboard path:
- Fallback table or text alternative:

## Shell And Route Contract

- One production shell:
- Primary sidebar/top nav owner:
- Global header owner:
- Auth surface owner:
- Dashboard switcher owner, if any:
- Shell elements prohibited inside page content:
- Compatibility routes and sunset dates:
- Prototype promotion decomposition:
  - Shell layout:
  - Page content:
  - Reusable components:
  - Route config:

## Experience Tier Contract

- Current tier:
- Target tier:
- Why the target tier is required:
- Missing shared components:
- Missing charts or visualization states:
- Missing drilldowns:
- Missing proof states:
- Missing interaction polish:
- Raw report/debug surfaces that must move out of the primary operator path:

## Visualization Decision

- User question:
- Selected chart family:
- Selected chart variant:
- Why this chart:
- Why simpler display is insufficient:
- Fallback display:

## Production Proof

- Proof URL:
- Proof auth:
- Screenshot baseline path:
- Required proof checks:
- Mock/preview behavior:

## Exceptions

| Gate | Reason | Owner | Reviewer | Expires | Replacement Plan |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## Exit Criteria

- [ ] owner and reviewer declared
- [ ] workspace mapping declared
- [ ] canonical route and single-shell model declared
- [ ] current and target experience tiers declared
- [ ] Tier 1 surfaces are not called complete when target is Tier 2 or Tier 3
- [ ] primary recipe selected
- [ ] data contract accepted
- [ ] interaction contract accepted
- [ ] proof route or exception declared
- [ ] visual QA target declared
- [ ] adoption report path declared
- [ ] validation command passes
