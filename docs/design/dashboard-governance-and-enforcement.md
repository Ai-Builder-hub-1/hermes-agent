# Dashboard Governance And Enforcement

Status: V6 standard  
Owner: Nous Hermes Agent  
Applies to: shared dashboard kit, downstream dashboard redesigns, production proof routes

## Purpose

Dashboard redesign work must be governed before implementation. A page should not become production-ready just because it renders. It needs an owner, reviewer, recipe, data contract, state model, proof route, and exception path.

This standard turns the Kaoshi experience architecture into a repeatable admission gate for Kashi VC, Media Engine, Hermes Agent, TLC Capital Group OS, Media Business OS, and future dashboards.

## Required Gate Sequence

Every new or materially redesigned dashboard surface must pass these gates in order:

| Gate | Required Evidence | Fails When |
| --- | --- | --- |
| `owner-reviewer` | surface owner and reviewer are declared | no accountable owner or reviewer |
| `workspace-mapping` | page maps to an approved workspace | page becomes another one-off tab |
| `single-shell-route-model` | one canonical route, one shell model, and no nested production shell | page ships as an app inside another app |
| `shell-visual-contract` | sidebar rail, compact command header, active route, and overflow protections are declared | the shell technically exists but feels like a bloated report or card stack |
| `experience-tier` | current tier, target tier, and migration delta are declared | a shell-only report is called complete |
| `recipe-selection` | one primary dashboard recipe is selected | UI starts from layout taste instead of user decision |
| `data-contract` | data fields, source, freshness, states, and null behavior are declared | UI is built before data reality is known |
| `interaction-contract` | key actions, drilldowns, pagination, filters, keyboard path, and fallback states are declared | controls exist as visual-only buttons |
| `proof-route` | production proof endpoint or approved proof alternative is declared | production cannot be verified without a human login |
| `visual-quality` | visual QA score or screenshot review target is declared | screen can ship while still looking generic |
| `adoption-reporting` | dashboard-kit adoption report includes the surface | project claims standards without evidence |
| `exception-review` | any missing gate has an owner, expiry date, and migration plan | exceptions become permanent |

## Required Recipe Selection

Each governed dashboard must pick one primary recipe before UI build:

- `executive-command`: summary, risk, alerts, drilldowns, compact evidence.
- `live-market-intelligence`: live tape, freshness, selected entity drawer, snapshot charts, stale states.
- `operations-health`: system state, queues, incidents, freshness, retries, logs.
- `research-workbench`: candidates, evidence, review states, decision notes, learnings.
- `cost-efficiency`: spend, usage, capacity, unit economics, trends, waste.
- `readiness-build`: plans, gaps, proof, adoption, validation, launch blockers.

Secondary recipes are allowed, but they must not blur the primary user question.

## Mandatory Experience Tiers

The shell standard is the floor. It prevents product architecture drift, but it does not prove the dashboard is modern, useful, or production-grade.

Every governed surface must declare:

- `currentExperienceTier`
- `targetExperienceTier`
- `tierMigrationRequired`
- the concrete missing capabilities blocking the target tier

| Tier | Label | Description |
| --- | --- | --- |
| `0` | Raw legacy report | Raw/static report output, prototype page, or table dump. |
| `1` | One-shell organized report | One production shell and grouped pages, but still mostly report sections. |
| `2` | Shared component dashboard | Main operator path uses shared dashboard-kit components and required states. |
| `3` | Product-grade cockpit | The page is a purpose-built cockpit with drilldowns, chart/live data, proof states, polished interaction, and decision clarity. |

Priority dashboards default to `targetExperienceTier: 3`. Lower targets require an exception with owner, reviewer, expiration date, and replacement plan.

Media Engine is currently a Tier 1 dashboard after the one-shell migration. It must remain marked as requiring Tier 3 migration until its production operator path replaces raw report sections with package-native/shared-kit pages for Command Center, Production Queue, QA & Review, Brand Operations, Content Intelligence, Publishing & Channels, Cost & Usage, Issues & Reliability, and Settings/Registry.

## One Shell Rule

Each dashboard product gets exactly one production app shell:

- one primary sidebar or top navigation
- one auth surface
- one global header region
- one dashboard switcher, if the product needs one
- one route model and one canonical route

Pages inside that product are workspace content, not applications. They may include local tabs, filters, drawers, split panes, tables, and chart panels, but they must not recreate the global shell.

## Shell Visual Quality Rule

One shell is necessary, but not sufficient. A production shell must be good enough to operate from:

- The sidebar must be a real navigation rail, not a stack of cards. It needs bounded width, active-route treatment, overflow-safe labels, scroll-safe long navs, and footer/status content that cannot spill out of the rail.
- The global header must be a compact command header, not a marketing hero or fat banner. It should state the current operator question, keep copy short, and place actions/filters in a compact row or responsive grid.
- Page banners are reserved for alerts, proof states, onboarding empty states, or material warnings. They should not be used as the default top container for every view.
- Sidebar cards, badges, and buttons must not overflow horizontally. If a label cannot fit, it truncates, wraps intentionally, or moves into a tooltip/detail panel.
- Tier 3 dashboards must show evidence of the rail/header contract through `DashboardSidebar`/`.hdk-sidebar-rail`, `DashboardHeader`/`.hdk-command-header`, and overflow protection.

If this rule is not met, the dashboard can be Tier 1 or Tier 2, but it cannot be considered Tier 3.

## No Nested Shells Rule

A page, prototype, iframe, or embedded route cannot bring its own sidebar, global nav, app title bar, login form, or dashboard switcher unless it is intentionally marked `standalone-dev-only` or `compatibility-route`.

Forbidden production patterns include:

- multiple `.sidebar` or `.topbar` app frames on the same operator path
- a dashboard iframe that loads another full dashboard
- duplicate login forms inside a dashboard page
- prototype files linked from primary production navigation
- visual-selection bridge scripts loaded from production hosts

## Prototype Promotion Rule

When a prototype becomes production, it must be decomposed into:

- shell-level layout
- page content
- reusable components
- route config

The prototype cannot be shipped as a full standalone HTML app inside another dashboard. A standalone prototype can remain for review only when it is marked dev-only or compatibility-only and is excluded from primary navigation.

## Compatibility Route Rule

Old standalone pages can remain temporarily as redirects, compatibility routes, or dev review pages. They should not be the primary operator path. Each compatibility route needs a replacement surface, owner, expiry, and migration note.

## Route Registry Rule

Every governed surface declares:

- `canonicalRoute`: the primary operator URL
- `shellModel`: `single-shell`, `standalone-dev-only`, or `compatibility-route`
- `legacyRoutes`: old routes that must not be primary navigation

For Kashi, the canonical route is `/` with `live-command` active. `/market-intelligence-live.html` may remain only as a compatibility route until the live command content is package-native in the unified shell.

## Production Proof Rule

Production dashboards need a proof route unless they have an explicit exception.

The preferred route is readonly and token-protected:

```text
/dashboard/proof?view={surface}
Authorization: Bearer $HERMES_DASHBOARD_PROOF_TOKEN
```

The proof route must not expose credentials, destructive actions, private user content, or editable controls. It should render enough real state to prove the primary page is not blank, not blocked by auth, and not relying on mock data.

## Exception And Deprecation Policy

Exceptions are allowed only when they are explicit:

- owner
- reviewer
- affected surface or capability
- missing gate
- reason
- expiration date
- replacement plan
- validation command that will fail once the exception expires

Deprecated dashboards must declare:

- replacement surface
- sunset criteria
- migration owner
- proof that the replacement covers the old user question

## Local Enforcement

Run:

```bash
npm run dashboard:governance:validate
```

This validates the central governance gate file, surface ownership, reviewer coverage, recipe selection, single-shell route metadata, required contracts, proof requirements, and exception expiry metadata.

For Kaoshi architecture work, run:

```bash
npm run dashboard:kaoshi:validate
```

The Kaoshi validator includes the governance artifacts so V6 cannot be marked complete if the enforcement layer is missing.
