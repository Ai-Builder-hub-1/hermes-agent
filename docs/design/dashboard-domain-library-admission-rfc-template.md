# Dashboard Domain Library Admission RFC

Status: template  
Owner: Nous Hermes Agent  
Applies to: any new domain library added to `docs/design/dashboard-domain-library-registry.json`

## Summary

- Proposed domain:
- Proposed library:
- Alternative compared:
- Requesting project:
- Owner:
- Reviewer:
- Target dashboard tier/band:

## Problem

Describe the domain behavior that generic dashboard-kit primitives cannot solve.

Examples:

- trading charts need candlesticks, time scales, crosshair, and volume
- calendars need month/week/day selection and event manipulation
- research desks need rich text documents, structured output, and save state
- media packages need deterministic thumbnail rendering and asset manifests

## Candidate Comparison

| Candidate | Why use it | Strengths | Tradeoffs | License/bundle status |
| --- | --- | --- | --- | --- |
| proposed |  |  |  |  |
| alternative |  |  |  |  |

## Decision

Selected library:

Decision rationale:

Rejected alternative rationale:

## Dashboard Kit Wrapper Plan

The library must enter downstream projects through `@hermes/dashboard-kit`.

Required wrapper components:

- `ComponentName`

Wrapper responsibilities:

- theme tokens
- spacing tokens
- loading/empty/stale/error states
- accessibility contract
- visual-selection markers
- proof markers
- responsive sizing
- screenshot proof selectors

## Data And Interaction Contract

Required data fields:

Required interactions:

Fallback states:

Persistence rules:

## Proof Plan

Required local proof:

Required production proof:

Required visual checks:

- desktop screenshot
- mobile screenshot
- empty state
- loading state
- error state
- insufficient-data state, if relevant
- hover/focus/selected state, if relevant

## Adoption Plan

First project:

Follow-up projects:

Migration path from local/static implementation:

Temporary exceptions:

## Maintenance

Library owner:

Wrapper owner:

Upgrade review cadence:

Known risks:
