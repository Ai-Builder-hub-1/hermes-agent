# Dashboard Agent Build Protocol

Status: V14 active  
Owner: Nous Hermes Agent  
Applies to: agent-driven dashboard planning, redesign, migration, and proof work

## Purpose

Agent work should not begin with local patching. It must follow the standards path so the resulting dashboard does not drift into static routes, generic cards, hand-drawn charts, duplicated headers, or local CSS overrides.

## Required Sequence

1. Identify the active project and governed dashboard route.
2. Read the project surface manifest or register the surface if missing.
3. Select the primary layout pattern and component variants.
4. Check the domain-library registry for required domain wrappers.
5. Define the interaction and data-state contracts.
6. Check token, copy, information-priority, density, and accessibility rules.
7. Build with package-native `@hermes/dashboard-kit` components.
8. Run local validation and rendered proof where available.
9. Update design debt or deprecation records for any compromise.
10. Run or refresh visual proof rigor when the work changes layout, charts, tables, shell, theme, or interaction density.
11. Produce a final maturity report that names what improved and what remains.

## Blocked Actions

An agent should not call a dashboard Tier 3C complete when:

- the route uses static/prototype production UI
- the route bypasses approved domain wrappers
- the route relies on local protected visual overrides
- tables over 10 rows lack pagination
- charts lack meaningful axes/units when applicable
- actions are visual-only
- proof states are missing
- no rendered proof exists for material visual work
- only lexical/source checks passed but no screenshot or visual proof rigor exists
- a single desktop screenshot is treated as full responsive/theme/state regression proof
- expired design debt exists for the route

## Final Response Requirements

For dashboard work, the final response should state:

- changed route or component family
- selected registry entries
- validation commands run
- proof captured or not captured
- visual proof rigor status when relevant
- maturity impact
- remaining blockers
