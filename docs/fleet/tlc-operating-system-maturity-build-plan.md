# TLC Operating System Maturity Build Plan

Status: Draft trackable plan  
Owner: Nous Hermes Agent  
Scope: TLC Capital Group, Nous Hermes Agent, and all business-unit dashboards/products  
Last updated: 2026-08-14

## Purpose

This plan turns the maturity ladder discussed for TLC into a trackable build program. It is intentionally broader than dashboard cleanup. The target is a company operating system that can standardize product quality, learn from execution, coordinate humans and agents, connect work to outcomes, and support capital allocation, governance, and strategy.

## Tracking Model

Each work item should keep these fields when promoted into task systems:

- `id`: stable workstream/task identifier
- `status`: `not-started`, `in-progress`, `blocked`, `needs-review`, `complete`
- `owner`: human, agent, business unit, or shared
- `project`: canonical project or fleet-wide
- `target-tier`: intended maturity level
- `dependencies`: upstream work that must exist first
- `evidence`: links to docs, reports, screenshots, tests, dashboards, or production proof
- `acceptance`: objective completion criteria

## Maturity Ladder

| Level | Name | Outcome |
| --- | --- | --- |
| L0 | Technical Compliance | Projects use the required package-native/HDK contracts and no longer hide old implementation debt. |
| L1 | Visual Quality Migration | Dashboards look and behave like polished products, not just compliant pages. |
| L2 | Product-Building OS | Ideas become product briefs, component maps, workflows, tests, and proof before being called done. |
| L3 | Self-Improving Product OS | Usage, screenshots, failures, and human preference continuously improve products and standards. |
| L4 | Company Intelligence Layer | TLC has memory, decision intelligence, OKR/KPI linkage, risk, finance, and strategy execution visibility. |
| L5 | Compound Learning Enterprise | The company learns, allocates capital/resources, governs humans/agents, and compounds IP over time. |

## Program Phases

### Phase 0: Baseline And Control Plane

Goal: Know where every project stands and prevent silent regression.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P0.1 | Fleet project inventory | in-progress | Nous Hermes Agent | Every active project has route inventory, target tier, proof route, production URL, and owner. |
| P0.2 | Technical implementation audit | complete | Nous Hermes Agent | Strict rendered-implementation report shows 10/10 fully decomposed, 0 findings, 0 false-native risk. |
| P0.3 | Dirty-tree and release ledger | not-started | Fleet | Each repo has a release ledger entry showing uncommitted changes, proof artifacts, and deploy status. |
| P0.4 | Project status ledger normalization | in-progress | Nous Hermes Agent | Status ledger separates technical compliance, visual quality, product maturity, and company-OS maturity. |
| P0.5 | Evidence registry | in-progress | Nous Hermes Agent | Screenshots, reports, audits, and test outputs are linked to projects and maturity levels. |

### Phase 1: Technical Standards And Enforcement

Goal: Make standards executable, not just written.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P1.1 | Package-native dashboard standard | in-progress | Nous Hermes Agent | New dashboards start from approved package-native starter and import `@hermes/dashboard-kit`. |
| P1.2 | No static route drift | in-progress | Fleet | Static routes are only compatibility/dev routes and are not canonical operator paths. |
| P1.3 | One-shell enforcement | in-progress | Fleet | Every dashboard has one sidebar, one header region, one route model, and no nested app shell. |
| P1.4 | No local override policy | not-started | Nous Hermes Agent | Local visual primitive overrides require reason, expiration, proof, and promotion path. |
| P1.5 | CI/adoption gates | not-started | Fleet | Dependency, shell, route, proof, theme, and visual-selector checks run before promotion/deploy. |
| P1.6 | Vendor sync enforcement | not-started | Fleet | Projects consume the same dashboard-kit version and report drift automatically. |

### Phase 2: Visual Quality Migration System

Goal: Separate “technically compliant” from “visually excellent.”

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P2.1 | Visual tier model | complete | Nous Hermes Agent | Add `V0` through `V4` visual maturity tiers alongside technical/product tiers. |
| P2.2 | Visual acceptance rubric | complete | Nous Hermes Agent | Rubric scores sidebar, hierarchy, spacing, cards, typography, tables, charts, forms, drawers, responsive states, and interaction polish. |
| P2.3 | Screenshot QA matrix | in-progress | Fleet | Desktop expanded/collapsed, mobile, dense, empty, drawer/modal, and theme screenshots exist for each dashboard. |
| P2.4 | Visual regression gates | in-progress | Fleet | Approved baselines catch overflow, clipped text, broken sidebar, bad table width, blank charts, and layout regressions. |
| P2.5 | Design debt registry | in-progress | Nous Hermes Agent | Visual debt items include project, route, component, severity, screenshot, and expected fix. |
| P2.6 | Human visual review queue | in-progress | Nous Hermes Agent | User can approve/reject screenshots and convert feedback into design memory. |
| P2.7 | Visual review queue schema | complete | Nous Hermes Agent | `dashboard-visual-review-queue.json/md` exist and are validated by the UI-quality system gate. |
| P2.8 | Screenshot approval and rejection memory schema | complete | Nous Hermes Agent | `dashboard-design-preference-memory.json/md` exist and preserve approved/rejected patterns. |
| P2.9 | Meal Assistant visual migration packet | complete | Nous Hermes Agent | Meal Assistant V3 visual migration packet exists with target pages, components, workflow proof, visual proof, and acceptance criteria. |
| P2.10 | Dashboard visual review UI | complete | Nous Hermes Agent | Dashboard Kit Gallery exposes visual tiers, queued reviews, preference memory, rubric criteria, and the first Meal Assistant migration packet. |

### Phase 3: Component And Pattern System

Goal: Build better dashboards from better primitives and approved patterns.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P3.1 | Premium sidebar component | in-progress | Nous Hermes Agent | Collapsible/expandable sidebar standard supports density, grouping, active route, status badges, and no overflow. |
| P3.2 | Premium table component | in-progress | Nous Hermes Agent | Tables have card containment, tabs when needed, pagination, density controls, row actions, sorting, and horizontal overflow rules. |
| P3.3 | Premium chart suite | in-progress | Nous Hermes Agent | Line, area, bar, donut, heatmap, candlestick, comparison, timeline, gauge, and empty/error/stale states exist. |
| P3.4 | Planner/calendar components | not-started | Nous Hermes Agent | Month calendar, week/day drawer, multi-select, planner detail, and export states exist for Meal Assistant and future planners. |
| P3.5 | Research desk components | in-progress | Nous Hermes Agent | Project navigator, intake drawer, evidence board, source review, claim map, story tree, and script outline components exist. |
| P3.6 | Media approval workspace components | in-progress | Nous Hermes Agent | Queue, approval/reject/revise, Discord handoff, post success state, channel targeting, and QA logs are reusable. |
| P3.7 | Trading cockpit components | in-progress | Nous Hermes Agent / Investing System | Instrument switcher, chart canvas, indicators, gauges, order preview, risk panel, and practice/live controls are reusable. |
| P3.8 | OKR/KPI governance components | in-progress | Nous Hermes Agent / TLC OS | Objective tree, KR progress, KPI streams, tasks, evidence, review cadence, and owner accountability components exist. |
| P3.9 | Pattern library | in-progress | Nous Hermes Agent | Approved page patterns exist for command center, planner, research desk, trading cockpit, media ops, KPI cockpit, and admin console. |

### Phase 4: Reference And Taste System

Goal: Make Mobbin/reference usage structured, visible, and reusable.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P4.1 | Reference family taxonomy | in-progress | Nous Hermes Agent | References are grouped by dashboard/product archetype and component family. |
| P4.2 | Reference intake workflow | in-progress | Nous Hermes Agent | Every redesign captures references, extracted patterns, component mapping, and acceptance criteria before build. |
| P4.3 | Screenshot memory | in-progress | Nous Hermes Agent | Approved screenshots become canonical visual references for future work. |
| P4.4 | Rejection memory | in-progress | Nous Hermes Agent | Rejected patterns store reason, screenshot, replacement pattern, and affected components. |
| P4.5 | Design critic agent | not-started | Nous Hermes Agent | A reviewer scores UI against visual rubric before work can be called complete. |
| P4.6 | Auto-redesign options | not-started | Nous Hermes Agent | System proposes multiple layout options before implementation for major page redesigns. |

### Phase 5: Product-Building OS

Goal: Turn intent into product architecture, not one-off screens.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P5.1 | Intent-to-product protocol | not-started | Nous Hermes Agent | User intent becomes product goal, workflows, data model, routes, components, proof states, and tests. |
| P5.2 | Domain playbooks | not-started | Nous Hermes Agent | Playbooks exist for meal planning, trading, media production, business governance, OKR/KPI, research desk, and content approval. |
| P5.3 | Workflow simulation | not-started | Fleet | Before build, critical workflows are simulated and gaps are captured. |
| P5.4 | Product telemetry contract | not-started | Fleet | Dashboards report route usage, clicks, form abandonment, slow loads, errors, and repeated manual work. |
| P5.5 | Autonomous backlog generation | not-started | Nous Hermes Agent | Evidence creates ranked work items with severity, impact, effort, and project mapping. |
| P5.6 | Cross-project learning loop | not-started | Nous Hermes Agent | Useful fixes become kit components, standards, recipes, or audits instead of staying local. |

### Phase 6: Company Intelligence Layer

Goal: Connect projects, work, decisions, OKRs, KPIs, evidence, and outcomes.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P6.1 | Company memory model | not-started | TLC OS / Nous Hermes Agent | Decisions, experiments, launches, failures, wins, OKRs, KPIs, risks, assets, docs, and postmortems are queryable. |
| P6.2 | Decision intelligence | not-started | TLC OS | Major decisions capture rationale, assumptions, evidence, risk, revisit trigger, and outcome. |
| P6.3 | Strategy execution graph | not-started | TLC OS | TLC objectives connect to BU objectives, projects, tasks, dashboards, data streams, evidence, and financial outcomes. |
| P6.4 | OKR/KPI operating layer | in-progress | TLC OS | Company-level and business-unit OKRs/KPIs can be owned by humans/agents and backed by data streams or evidence. |
| P6.5 | Experiment operating system | in-progress | TLC OS / Fleet | Experiments capture hypothesis, cost, owner, evidence, result, and scale/stop/revise decision. |
| P6.6 | Risk intelligence | in-progress | TLC OS / Investing System | Financial, technical, compliance, operational, brand, platform, automation, and trading risks have mitigations and owners. |
| P6.7 | Board-level command center | not-started | TLC OS | Company health, BU health, OKRs, cash/risk, experiments, decisions, blockers, and opportunities are visible in one place. |

### Phase 7: Workforce And Governance

Goal: Coordinate humans, agents, VAs, contractors, and approvals safely.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P7.1 | Agent role registry | not-started | Nous Hermes Agent | Agent roles, permissions, work queues, escalation rules, audit logs, and performance history exist. |
| P7.2 | Human workforce layer | not-started | TLC OS | VAs/contractors/operators have SOPs, assigned work, proof requirements, QA, training, and performance summaries. |
| P7.3 | Approval governance | in-progress | Fleet | Actions that affect money, publishing, production deploys, or live trading require explicit approval gates. |
| P7.4 | Knowledge-to-SOP pipeline | not-started | Nous Hermes Agent / TLC OS | Repeated successful workflows become SOPs, checklists, automation candidates, QA criteria, and training material. |
| P7.5 | Governance constitution | in-progress | TLC OS | Agent permissions, capital/risk limits, deployment rules, brand rules, trading rules, data handling, and escalation policy are canonical. |

### Phase 8: Finance, Capital Allocation, And Outcome Attribution

Goal: Know what work and capital allocation are actually producing results.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P8.1 | Financial operating layer | not-started | TLC OS / Media Business Ops | BU P&L, project cost, AI/cloud/API spend, content ROI, trading exposure, revenue, budgets, runway, and reinvestment are tracked. |
| P8.2 | Resource allocation intelligence | not-started | TLC OS | System recommends where cash, human time, agent time, automation, and attention should go. |
| P8.3 | Outcome attribution | not-started | TLC OS / Fleet | Work connects to results: posts to traffic, tasks to OKRs, experiments to learnings, strategies to returns, dashboards to actions. |
| P8.4 | Capital allocation engine | not-started | TLC OS | Opportunities can be compared by cost, risk, upside, evidence, and strategic alignment. |
| P8.5 | Scenario planning | not-started | TLC OS | Hiring, scaling, account suspension, cost changes, trading promotion, and new brand launch scenarios can be modeled. |

### Phase 9: Compound Learning Enterprise

Goal: Preserve and compound TLC’s operating advantages.

| ID | Workstream | Status | Project | Acceptance |
| --- | --- | --- | --- | --- |
| P9.1 | Institutional knowledge engine | not-started | TLC OS / Nous Hermes Agent | Beliefs, evidence, contradictions, staleness, and decision impact are tracked. |
| P9.2 | Autonomous strategy review | not-started | TLC OS | System periodically challenges strategy, stale OKRs, failed assumptions, neglected projects, and promising signals. |
| P9.3 | Executive simulation | not-started | TLC OS | Major decisions can be simulated with assumptions, sensitivity, required work, and risk exposure. |
| P9.4 | Moat and IP layer | not-started | TLC OS / Nous Hermes Agent | Proprietary workflows, data models, investing frameworks, content frameworks, playbooks, automations, and research methods are cataloged. |
| P9.5 | External interface layer | not-started | Fleet | Client, investor, partner, contractor, and API surfaces can be permissioned and production-certified. |
| P9.6 | Continuous governance board | not-started | TLC OS | Weekly operating review, monthly strategy review, quarterly capital allocation/risk reviews, and annual thesis refresh are system-supported. |

## Cross-Cutting Standards

These standards apply to every phase:

- One shell per product.
- Package-native dashboards by default.
- Static routes are compatibility only.
- Visual selector loads in development only.
- No unapproved local visual primitive overrides.
- Tables require card containment, pagination, and density/sort rules when rows exceed threshold.
- Charts require real chart components, axes/labels where applicable, tooltips, states, and evidence that data is real or honestly unavailable.
- Sidebars require the premium sidebar standard.
- Dark/light mode must use theme tokens only.
- Dashboards must separate technical compliance from visual quality.
- Work that becomes repeatable must move from local project code into shared kit, standards, or SOPs.

## First Execution Order

The plan is intentionally large. Build in this order:

1. Finish release/dirty-tree hygiene for the recent fleet technical-debt pass.
2. Add separate visual tier tracking to the project status ledger.
3. Build visual quality rubric and human review queue.
4. Use Meal Assistant as the first full visual-quality migration test case.
5. Promote Meal Assistant learnings into dashboard-kit components and pattern library.
6. Repeat for Media Engine, Kashi VC, Media Business Ops, Investing System, TLC OS, Hermes OS, Business Mapper, and Rinseables.
7. Build the product-building OS protocol once the visual-quality loop is proven.
8. Expand TLC OS into company memory, OKR/KPI, decision intelligence, risk, finance, and governance.
9. Add workforce, capital allocation, outcome attribution, and compound learning layers.

## Current Known Baseline

As of the latest strict rendered-implementation audit:

```text
totalProjects: 10
pass: 10
findings: 0
fullyDecomposed: 10
bridgeAligned: 0
falseNativeRisk: 0
```

This means the technical compliance baseline is clean. It does not mean every dashboard is visually excellent. The next maturity milestone is visual quality scoring and screenshot-based approval.

## Promotion Gates

### Technical Gate

- Strict rendered-implementation audit passes.
- No false-native risk.
- No unapproved local shell/sidebar/card/table/chart/form debt.
- Project imports or consumes the approved dashboard kit path.

### Visual Gate

- Visual tier score meets target.
- Screenshots are captured for required states.
- Human review approves the route or documents required changes.
- No overflow, clipped text, broken sidebar, bad density, duplicate shell, or generic chart placeholders.

### Product Gate

- Main workflows are simulated end to end.
- Data states are honest.
- Actions have clear result/proof.
- Telemetry exists for critical interactions.
- Workflow can be resumed after page reload or later session.

### Company-OS Gate

- Work maps to OKR/KPI, experiment, decision, risk, or SOP.
- Evidence is stored and reviewable.
- Owner and cadence are known.
- Outcome can be measured or explicitly marked qualitative.

## Next Concrete Build Packet

Completed first packet:

1. Added `visualTier`, `visualScore`, `productTier`, and `companyOsTier` to the project status ledger generator.
2. Created a dashboard visual maturity rubric JSON/MD pair.
3. Added a visual review queue schema.
4. Added a screenshot approval/rejection preference memory schema.
5. Generated the first Meal Assistant visual migration packet.
6. Updated the UI quality validator so these artifacts are enforced.
7. Added a visual maturity review lane to the Dashboard Kit Gallery.
8. Completed the Meal Assistant project-side V3 candidate redesign with proof screenshots, authenticated visual review screenshots, local Playwright capture, and zero uncontained overflow diagnostics.

Next visual packet:

1. Review the Meal Assistant V3 candidate screenshots and approve or request changes.
2. Promote reusable Meal Assistant sidebar, planner, drawer, proof-route, and visual-review learnings into dashboard-kit guidance/components where needed.
3. Add screenshot-aware visual regression comparison for approved baselines.
4. Repeat the visual-quality migration loop for Media Engine, Kashi VC, Media Business Ops, Investing System, TLC OS, Hermes OS, Business Mapper, and Rinseables.

Recommended next packet:

1. Capture fresh Meal Assistant desktop/mobile/drawer screenshots.
2. Score Meal Assistant against the visual maturity rubric.
3. Use the approved packet to start the Meal Assistant V3 visual redesign.
4. Add screenshot-aware visual regression comparison for approved baselines.
5. Promote reusable Meal Assistant planner/sidebar patterns back into dashboard kit.
