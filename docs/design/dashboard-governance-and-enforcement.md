# Dashboard Governance And Enforcement

Status: V6 standard  
Owner: Nous Hermes Agent  
Applies to: shared dashboard kit, downstream dashboard redesigns, production proof routes

## Purpose

Dashboard redesign work must be governed before implementation. A page should not become production-ready just because it renders. It needs an owner, reviewer, recipe, data contract, state model, proof route, and exception path.

This standard turns the Kaoshi experience architecture into a repeatable admission gate for Kashi VC, Media Engine, Hermes Agent, TLC Capital Group OS, Media Business OS, and future dashboards.

## Private Fork And Deployment Rule

Nous Hermes Agent is the source-of-truth workspace for this operating system, but this local working copy must not publish dashboard or design-intelligence work back to the public open-source upstream.

Required behavior:

- `origin` may remain a fetch-only upstream for reading and comparison.
- pushes, deployment triggers, and dashboard proof changes must target the project-owned private remote/backbone.
- dashboard/design-system work must not push to `NousResearch/hermes-agent` or any public upstream remote unless the user explicitly asks for an upstream contribution.
- local clones should run the remote guard before release work:

```bash
npm run repo:remote:validate
```

If the guard fails, deployment is blocked until the push remote points to the private project remote or the public upstream push URL is disabled.

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
| `domain-library-selection` | approved domain library and dashboard-kit wrapper are selected when the surface contains domain-native behavior | trading charts, calendars, editors, workflow boards, or media tools are rebuilt as static/local UI |
| `data-contract` | data fields, source, freshness, states, and null behavior are declared | UI is built before data reality is known |
| `interaction-contract` | key actions, drilldowns, pagination, filters, keyboard path, and fallback states are declared | controls exist as visual-only buttons |
| `proof-route` | production proof endpoint or approved proof alternative is declared | production cannot be verified without a human login |
| `visual-quality` | visual QA score or screenshot review target is declared | screen can ship while still looking generic |
| `adoption-reporting` | dashboard-kit adoption report includes the surface | project claims standards without evidence |
| `exception-review` | any missing gate has an owner, expiry date, and migration plan | exceptions become permanent |

## Tier Promotion Approval Flow

Tier movement is an evidence-backed approval, not a manual label change.

When a project asks to move up a tier or band, run the central approval request from `projects/nous-hermes-agent`:

```bash
npm run dashboard-kit:adoption:report
npm run dashboard:tier-approval:request -- --project <project-id> --target-band <band>
```

Use `--strict` in CI or before release:

```bash
npm run dashboard:tier-approval:request -- --project media-engine --target-band T3C --strict
```

The command writes:

- `docs/design/dashboard-review-packets/<project-id>-tier-approval.json`
- `docs/design/dashboard-review-packets/<project-id>-tier-approval.md`
- `docs/design/dashboard-review-packets/latest-tier-approval.json`
- `docs/design/dashboard-review-packets/latest-tier-approval.md`

Promotion status is interpreted as:

| Status | Meaning | Approval Action |
| --- | --- | --- |
| `approved` | Current band/tier satisfies the requested target, audit is current, and no external work items remain. | Approve the tier movement and update project/adoption records. |
| `needs-review` | No audit errors, but warnings or review gaps remain. | Hold approval unless a human reviewer records an explicit temporary exception. |
| `blocked` | Audit errors, lower current band/tier, missing package-native evidence, missing proof, or external work remains. | Deny approval until blockers are fixed. |

Required evidence for Tier 3 promotion includes:

- adoption audit result is `current`
- one shell with sidebar/header contract
- package-native `@hermes/dashboard-kit` import for T3C
- Mobbin/reference intake and design-review artifact
- domain-library registry selection and dashboard-kit wrapper evidence when the route contains trading charts, general charts, tables, calendars, workflow boards, node graphs, research editors, creative media tools, video templates, or complex forms
- visual proof screenshots for desktop/mobile and relevant states
- loading-performance contract: loading, freshness, stale, partial, empty, and error states
- table contract: full-width table surface, contained horizontal scroll, default 10-row pagination, and 10 / 25 / 50 page-size controls for tables over 10 rows
- table toolbar contract: sortable evidence tables use a card-level toolbar for row count, `Sort by`, sort direction, filters, and exports; dense tables must not repeat noisy visible sort controls in every header cell
- chart-before-evidence contract: operational time-series, issue, approval, activity, market, usage, or QA pages put a chart/trend decision surface above the raw queue/table when chartable history exists
- spacing contract: page, section, card, grid, and table spacing use `--hdk-space-*` tokens instead of one-off pixel gaps or uneven gutters
- help affordance contract: secondary explanations use `HelpTip` / `InfoPopover`; critical states remain visible and are not hidden in tooltips
- selectable review-region contract: every visible operator region that a human might ask to change must expose a stable `data-review-id`, including shortcut rails, utility/admin rails, page headers, cards, tables, charts, drawers, forms, and important action buttons
- visual-selection runtime contract: stable review markers may ship in production, but the visual-selection bridge/runtime must be loaded only in local/development or explicitly approved proof/review routes
- approved chart/table/drawer/state components
- UI quality system compliance for token governance, content/copy, information priority, density/responsiveness, accessibility, performance/loading UX, observability, design debt, pattern deprecation, component acceptance, human review, and agent build protocol

The project manifest should not be promoted by hand before this packet says `approved`.

## Build Order Rule

Dashboard work must start with the system path, not a quick page patch:

1. Select the dashboard recipe and target tier.
2. Gather Mobbin/reference examples before implementation.
3. Extract patterns into component requirements and acceptance criteria.
4. Select the approved domain library family from `docs/design/dashboard-domain-library-registry.json` when domain-native behavior is involved.
5. Define the data/state/interaction contract.
6. Build package-native or shared-kit components.
7. Compose the product route in the one shell.
8. Capture local and production proof screenshots.
9. Update adoption/tier reporting.

Skipping the reference and contract steps is allowed only for emergency fixes. Emergency fixes do not increase a dashboard's experience tier.

## Mobbin-First Reference Rule

Mobbin is part of the design workflow, not a late inspiration pass. For material dashboard redesigns, the handoff must include reference evidence before implementation:

- selected reference category or product pattern
- extracted layout pattern
- extracted interaction pattern
- mapped dashboard-kit components
- visual acceptance criteria
- screenshot proof after build

The implementation must translate the reference into original Hermes components. It must not copy proprietary Mobbin assets, markup, or product-specific branding.

## Domain Library Rule

Mobbin/reference evidence defines the product pattern. Domain libraries provide the hard behavior. The dashboard kit owns the wrapper.

The canonical registry lives at:

```text
docs/design/dashboard-domain-library-registry.json
```

The human-readable standard lives at:

```text
docs/design/dashboard-domain-library-standard.md
```

Use the registry when a dashboard route contains:

- financial or trading charts
- general dashboard charts
- tables or grids
- calendars
- drag/drop workflows
- node graphs or pipelines
- rich text or research editors
- image/thumbnail generation
- interactive canvas editing
- video template generation
- complex validated forms

The allowed integration path is:

```text
domain library -> @hermes/dashboard-kit wrapper -> project dashboard route
```

Direct project imports are allowed only with a temporary exception. Static or hand-drawn local replacements cannot satisfy T3C when an approved domain library and wrapper family exists.

Validate the registry with:

```bash
npm run dashboard:domain-libraries:validate
```

## UI Quality System Rule

The domain-library registry solves domain primitives. It does not by itself guarantee strong UI. Tier 3C also requires the broader UI quality system:

- design token governance
- content and copy standard
- information priority model
- density and responsiveness
- accessibility and keyboard operation
- performance and loading UX
- UI quality observability
- design debt registry
- pattern deprecation system
- component acceptance tests
- human review workflow
- agent build protocol

The canonical registry lives at:

```text
docs/design/dashboard-ui-quality-system-registry.json
```

Validate it with:

```bash
npm run dashboard:ui-quality:validate
```

Generate a maturity report with:

```bash
npm run dashboard:ui-quality:report
```

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

Use refined bands alongside numeric tiers when the coarse tier hides true status:

| Band | Numeric tier | Label |
| --- | ---: | --- |
| `T0P` | 0 | Planned or governance-only |
| `T0L` | 0 | Raw legacy surface |
| `T1A` | 1 | Adapter-aligned shell |
| `T1B` | 1 | Inventoried one-shell report |
| `T2A` | 2 | Hybrid shared-component dashboard |
| `T2B` | 2 | Package-native shared-component dashboard |
| `T3A` | 3 | Cockpit candidate with review gaps |
| `T3B` | 3 | Current static/hybrid product cockpit |
| `T3C` | 3 | Package-native product cockpit |

Media Engine is currently `T3B`: a current product-grade cockpit with static/hybrid delivery. Its next maturity target is `T3C`, package-native cockpit delivery.

Kashi VC is currently `T3A`: the project targets Tier 3 cockpit behavior, but current audit warnings for sidebar rail, command header, and chart-panel evidence keep it in review until repaired.

## Package-Native First Rule

The long-term dashboard path is package-native, not one-off HTML/CSS.

Tier meanings are enforced this way:

- Tier 1 may use static/server-rendered HTML when the goal is organization only.
- Tier 2 should use shared dashboard-kit components or a narrowly scoped static adapter.
- Tier 3 can be considered current through an approved static/hybrid bridge, but the highest maturity band is always `T3C`: package-native product cockpit.
- Server-rendered dashboard HTML/CSS is a legacy bridge unless it is generated from shared package components.
- A dashboard cannot be called finished at the highest standard while it hand-rolls its shell, charts, drawers, tables, forms, or calendar UX.

Every governed dashboard must declare its implementation mode. Valid modes are:

- `package-native`
- `hybrid`
- `static-adapter`
- `server-rendered-legacy`
- `planned`

Any `server-rendered-legacy` dashboard with target Tier 3 must declare a migration plan or exception.

## No Local Visual Overrides Rule

Shared dashboard-kit components own the visual primitives. Downstream dashboards should compose them, feed them data, and choose approved density or layout variants. They should not redefine how the shell, sidebar, header, cards, tables, charts, drawers, buttons, banners, proof states, forms, calendars, or theme tokens look.

Forbidden without an exception:

- redefining `.hdk-*` selectors in project CSS
- redefining generic shell primitives such as `.shell`, `.sidebar`, `.topbar`, `.command-header`, `.card`, `.metric`, `.table`, `.chart`, `.drawer`, `.button`, `.calendar`, or `.proof-strip`
- redefining protected theme/component tokens such as `--hdk-*`, `--surface-*`, `--text-*`, `--chart-*`, `--status-*`, `--bg`, `--panel`, `--sidebar`, `--line`, `--muted`, or `--accent`
- introducing one-off spacing values for dashboard grids, cards, tables, page gutters, or section rhythm instead of using the kit spacing scale
- creating local tooltip, help icon, or popover styles instead of the shared `HelpTip` / `InfoPopover` affordance
- shipping a Tier 3 route whose polished look depends on local CSS instead of package components and tokens

Allowed local styling is limited to page composition: route grid placement, token-based spacing between owned sections, brand data content, and narrow layout variants that do not change the kit-owned primitive contract.

Any exception must be declared in the project dashboard manifest:

```json
{
  "id": "media-special-calendar-density",
  "type": "local-visual-override",
  "path": "src/dashboard/calendar.css",
  "selector": ".calendar",
  "kind": "protected-selector",
  "owner": "project-owner",
  "reviewer": "design-system-owner",
  "reason": "Temporary density variant until CalendarPlanner ships in dashboard-kit.",
  "expiresAfter": "2026-09-01"
}
```

Exceptions do not make the local pattern canonical. The replacement plan should be to add a dashboard-kit variant, then remove the local override.

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

## Central UI Maturity Rule

Tier labels are not enough for promotion. Each dashboard is scored through the central UI maturity scorecard:

```bash
npm run dashboard:ui-quality:scorecard
```

The scorecard combines tier band, package distribution, visual evidence, proof route coverage, runtime-data policy, design debt, deprecated-pattern status, and V14 UI quality status.

Promotion interpretation:

- `tier3c-ready`: dashboard can move through final review when the review packet and deploy gates also pass.
- `needs-proof-hardening`: dashboard is visually/structurally close but lacks production proof, package-distribution hardening, or runtime-policy cleanup.
- `needs-migration`: dashboard should not be called complete until the named migration/evidence gap is closed.
- `needs-evidence`: dashboard lacks enough proof to judge maturity.

Visual regression requirements are generated with:

```bash
npm run dashboard:visual-regression:matrix
```

The matrix defines required screenshot evidence by dashboard, viewport, theme, and state. Tier 3C surfaces must have matrix coverage before promotion.

Design debt and deprecated patterns are checked with:

```bash
npm run dashboard:ui-quality:debt:strict
```

Expired or blocking design debt blocks Tier 3C.

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
npm run dashboard:local-overrides:scan
```

This validates the central governance gate file, surface ownership, reviewer coverage, recipe selection, single-shell route metadata, required contracts, proof requirements, and exception expiry metadata.

Use strict mode before promotion:

```bash
npm run dashboard:local-overrides:validate
```

Strict mode blocks Tier 3 dashboards when project-owned CSS overrides protected visual primitives without a declared exception.

For Kaoshi architecture work, run:

```bash
npm run dashboard:kaoshi:validate
```

The Kaoshi validator includes the governance artifacts so V6 cannot be marked complete if the enforcement layer is missing.
