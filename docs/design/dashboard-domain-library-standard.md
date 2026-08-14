# Dashboard Domain Library Standard

Status: V13 active  
Owner: Nous Hermes Agent  
Canonical registry: `docs/design/dashboard-domain-library-registry.json`

## Purpose

Dashboard projects should not rebuild hard domain behavior with static HTML, generic SVG, local CSS, or one-off scripts. If a domain has mature product expectations, use a proven domain library and wrap it through `@hermes/dashboard-kit`.

The standard is:

1. Select the domain from the registry.
2. Use the default approved library unless there is a documented reason to use the alternative.
3. Build or reuse a dashboard-kit wrapper component.
4. Feed project data into the wrapper.
5. Capture proof that the component behaves correctly.
6. Block Tier 3C promotion if the project bypasses the wrapper without an exception.

## Domain-Native Workspace Rule

Tier 3 dashboards must use the product workspace pattern that matches the operator's job. A page does not become product-grade just because it uses a chart, table, sidebar, and cards. The dominant workflow must control the page anatomy.

Required workspace families:

| Product domain | Required workspace anatomy | Anti-pattern |
| --- | --- | --- |
| Trading / investing | terminal toolbar, dominant chart canvas, slim tool rail, right watchlist/details rail, bottom positions/orders/account panel | primary chart inside a generic dashboard card with unrelated cards crowding the viewport |
| Market intelligence | category browser, live tape, selected-market detail, volatility/proof states, search/filter rail | blank search-first page with no browseable market hierarchy |
| Media operations | review queue, approval actions, brand output status, issue triage, evidence drilldowns | repeated summary cards and duplicate banners on every page |
| Research desk | project navigator, question/planning drawer, evidence workspace, source ledger, story/script artifact | textareas and static cards with no clickable workflow |
| Planning / calendar | month/week/day calendar, selection state, drawer planner, library, export/checklist | disconnected day cards instead of calendar behavior |
| OKR / KPI | objective tree, key-result ledger, task attribution, cadence review, proof stream | generic KPI cards without ownership or update workflow |

The workspace anatomy must be extracted from Mobbin/reference screenshots before implementation. The extraction must name:

- the primary viewport owner
- persistent rails or panels
- compact controls vs expanded detail
- drilldown pattern
- data states
- components that must not be rendered as generic cards

Skipping this extraction is allowed only for emergency fixes. Emergency fixes do not increase the experience tier.

### Reference Parity Proof

When a user provides a target screenshot or Mobbin screen, the implementation must include screenshot proof that the rendered dashboard has the same broad product anatomy. The proof is not pixel-copying. It verifies that the design translated the reference into the right operating shape:

- dominant surface takes the same role and approximate screen share
- persistent rails/panels appear in the same conceptual zones
- controls use the same density class: terminal, cockpit, planner, review queue, editor, or browser
- old dashboard cards do not surround the primary workflow unless the reference uses cards
- unnecessary banners or summary cards do not push the primary workflow below the fold
- mobile/tablet states preserve the same workflow priority

For trading terminal surfaces, reference parity proof must show the chart in the first viewport with no generic dashboard card wrapper around it. A chart renderer upgrade without a terminal workspace upgrade is not sufficient for Tier 3C.

## Why This Exists

The current failure mode is predictable:

- a project needs a trading chart, calendar, workflow board, research editor, or media editor
- the implementation uses local HTML/CSS because it is faster
- the result technically renders but looks generic or behaves below the domain standard
- the next project repeats the same mistake

The fix is not only better taste. The fix is better primitives.

## Default Library Map

| Domain | Default | Alternative | Primary Use |
| --- | --- | --- | --- |
| Financial / trading charts | `lightweight-charts` | TradingView Advanced Charts | OANDA, stock, market, Kashi live markets |
| General dashboard charts | `recharts` | `visx` | usage, issues, activity, cost, OKR/KPI trends |
| Data tables and grids | `@tanstack/react-table` | `ag-grid-react` | evidence tables, queues, approvals, operations grids |
| Calendar and scheduling | `@fullcalendar/*` | `react-big-calendar` | meal planning, publishing calendars, work schedules |
| Workflow and drag/drop | `@dnd-kit/*` | `react-dnd` | queues, assignment, kanban, review lanes |
| Node graphs and pipelines | `@xyflow/react` | Cytoscape.js | story trees, agent pipelines, research maps |
| Rich text and research docs | `@tiptap/*` | Lexical | scripts, research plans, evidence notes |
| Image and thumbnail generation | `sharp` | ImageJS | server-side thumbnails, resizing, compositing |
| Interactive canvas editing | `react-konva` | Fabric.js | thumbnail editor, creative overlay adjustment |
| Video template generation | Remotion | FFmpeg-only scripts | branded video templates, social clips, render queues |
| Forms and validation | React Hook Form + Zod | Formik + Yup | approval forms, intake forms, settings, safety checks |

## Enforcement Rules

### Library Selection Rule

Every Tier 3 dashboard surface must declare which domain-library family it uses when the surface contains:

- financial charts
- general charts
- tables over 10 rows
- calendars
- drag/drop workflows
- node graphs
- rich text editors
- image/video generation or preview surfaces
- complex forms

If the surface uses none of these, it should explicitly declare `domainLibraryRequired: false` in the project-specific manifest or review packet.

### Wrapper Rule

Domain libraries should not be imported directly by downstream production dashboards unless there is a temporary exception. The stable path is:

```text
domain library -> @hermes/dashboard-kit wrapper -> project dashboard route
```

This gives us one place to enforce:

- spacing
- theme tokens
- accessibility
- loading/empty/stale/error states
- proof markers
- visual selection markers
- responsive behavior
- Mobbin/reference-derived interaction patterns

### Static Fallback Rule

Static fallbacks are allowed only for:

- compatibility routes
- emergency degraded states
- local proof fixtures
- temporary migration bridges

A static fallback cannot satisfy Tier 3C.

### Admission Rule

Adding a new domain library requires:

- comparison against at least one alternative
- license review status
- bundle/performance review
- accessibility review
- dashboard-kit wrapper plan
- visual proof plan
- downstream migration plan

## Maturity Work Needed

### 1. Build wrappers before more downstream redesigns

Projects will keep falling back to generic UI until the kit supplies better primitives. The first maturity target is a real wrapper for each default domain library.

Required wrappers:

- `TradingTerminalWorkspace`
- `FinancialCandlestickChart`
- `TradingTopToolbar`
- `TradingWatchlistPanel`
- `PositionsOrdersPanel`
- `MetricTimelineChart`
- `PaginatedTableCard`
- `DashboardCalendar`
- `WorkflowBoard`
- `StoryTreeGraph`
- `ResearchEditor`
- `ThumbnailPipelineRenderer`
- `CreativeCanvasEditor`
- `VideoTemplatePreview`
- `ValidatedForm`

### 2. Make validation screenshot-aware

Current static validation can catch missing files and manifest fields. It cannot prove that:

- charts have visible axes
- table pagination is visible
- labels do not clip
- cards have consistent spacing
- dark mode contrast works
- sidebars do not overflow

Tier 3 validation needs rendered Playwright checks for each component family.

### 3. Score component families separately

One total dashboard score hides weak areas. A product can have a strong shell and weak charts. Maturity reports should score:

- shell/navigation
- charts
- tables
- forms
- calendars
- workflow boards
- proof states
- domain widgets
- accessibility
- performance/loading

### 4. Create library-admission RFCs

New dependencies should not be added casually. The registry should be backed by a short RFC template that records why a library was chosen and how it will be wrapped.

Use:

```text
docs/design/dashboard-domain-library-admission-rfc-template.md
```

### 5. Scan downstream project usage

The registry becomes useful when projects are checked. We need a scanner that flags:

- direct library imports in production routes
- local static chart/table/calendar implementations
- missing dashboard-kit wrappers
- library usage without proof markers
- static adapters claiming Tier 3C

### 6. Convert Mobbin/reference work into component requirements

Mobbin usage must produce implementation criteria:

- reference pattern
- extracted layout behavior
- extracted interaction behavior
- mapped dashboard-kit component
- acceptance criteria
- screenshot proof

Without that extraction step, the implementation will keep drifting back to generic primitives.

## Commands

Validate the registry:

```bash
npm run dashboard:domain-libraries:validate
```

Generate wrapper coverage evidence:

```bash
npm run dashboard:domain-libraries:coverage
```

Block missing wrapper coverage in strict mode:

```bash
npm run dashboard:domain-libraries:coverage:strict
```

Generate wrapper proof readiness:

```bash
npm run dashboard:domain-wrappers:proof
```

Block incomplete wrapper proof in strict mode:

```bash
npm run dashboard:domain-wrappers:proof:strict
```

Scan downstream direct usage:

```bash
npm run dashboard:domain-libraries:usage
```

Block direct downstream usage in strict mode:

```bash
npm run dashboard:domain-libraries:usage:strict
```

## Promotion Impact

Tier 3C requires:

- approved domain library selection when relevant
- dashboard-kit wrapper usage
- proof that the domain behavior is visible and interactive
- no local static fallback as the primary production implementation

If a dashboard uses local one-off components for a domain that has an approved library and wrapper, it can be no higher than Tier 3B unless an explicit exception is approved.
