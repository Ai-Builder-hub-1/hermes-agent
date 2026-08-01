# Nous Hermes Agent UI Standards Modernization Assessment

Date: 2026-08-01  
Scope: Nous Hermes Agent, web app, desktop app, dashboard kit, design governance, and agent-facing standards  
Status: v1 handoff for upgrading standards and adding the design-intelligence workflow to the system

## 1. Purpose

This assessment is for Nous Hermes Agent, not an external Kaoshi application. The goal is to modernize the Hermes Agent interface standards, strengthen the shared system, and make future agent-generated UI work more consistent, enforceable, and implementation-ready.

The objective is not to replace the existing Hermes visual identity or dashboard kit. The repository already has a substantial design-system foundation. The work should:

- Assess the current frontend and design-system implementation.
- Identify gaps affecting UI quality, consistency, responsiveness, accessibility, performance, and maintainability.
- Establish a shared UI vocabulary for Hermes Agent surfaces.
- Extend the reusable pattern library around real agent workflows.
- Use Mobbin as a visual-reference and review tool.
- Create a Hermes Design Standards Agent that can produce grounded page and component proposals.
- Ensure proposed UI work can be implemented using the existing Hermes stack and governance scripts.

The governing relationship should be:

```text
Hermes product requirement
-> Hermes UI vocabulary
-> page-pattern selection
-> Mobbin reference search
-> Hermes design contracts
-> dashboard-kit and @nous-research/ui inventory
-> implementation proposal
-> human review
-> Codex implementation
-> automated validation
-> visual and functional QA
```

## 2. Current-State Stack Report

### 2.1 Core Architecture

Hermes Agent is a multi-surface product:

- Python core package: `hermes-agent` in `pyproject.toml`.
- Web app: React 19, Vite, TypeScript, React Router 7 in `web`.
- Desktop app: Electron 40, React 19, Vite, TypeScript, Tailwind 4 in `apps/desktop`.
- Shared dashboard kit: `@hermes/dashboard-kit` in `packages/hermes-dashboard-kit`.
- Shared UI package: `@nous-research/ui`.
- Additional CLI, TUI, plugins, MCP, runtime, and automation surfaces.

The web and desktop apps are client-rendered Vite applications, not Next.js applications. There is no App Router or Pages Router. Routing is owned by React Router and route registries.

Deployment assumptions differ by surface:

- `web` builds as a Vite web artifact.
- `apps/desktop` builds an Electron renderer with intentionally disabled renderer code splitting for packaging stability.
- Dashboard-kit consumers may use package-native React imports or static CSS adapters.
- Python tests must be run through `scripts/run_tests.sh` per `AGENTS.md`.

### 2.2 Language and Type Safety

The repo uses both Python and TypeScript.

TypeScript findings:

- `web/tsconfig.app.json` has `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`.
- `apps/desktop/tsconfig.json` has `strict: true`, `allowJs: false`, `isolatedModules`, and path aliases.
- `packages/hermes-dashboard-kit/tsconfig.json` has `strict: true`, declaration output, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- Public dashboard-kit contracts are exported from `packages/hermes-dashboard-kit/src/index.ts`.

Python findings:

- `pyproject.toml` pins Python to `>=3.11,<3.14`.
- The project uses typed Python heavily enough that test and lint conventions are documented in `AGENTS.md`.
- Existing architecture emphasizes a narrow core, with capabilities added through skills, plugins, CLI, services, or MCP rather than expanding core tools.

Key gap:

- TypeScript strictness is strong inside major packages, but runtime data contracts and cross-surface schema ownership need to be more visible in the design workflow. UI proposals should identify the contract layer before implementation begins.

### 2.3 Styling Architecture

Styling is a controlled hybrid:

- Tailwind CSS v4 via `@tailwindcss/vite`.
- CSS variables and tokenized Hermes theme values in `web/src/index.css`.
- `@nous-research/ui` fonts and global styles.
- `@hermes/dashboard-kit` CSS and component contracts.
- Desktop renderer pins an explicit empty PostCSS config so Tailwind v4 builds hermetically.

The current approach is structurally sound and worth retaining. It should not be replaced with default Tailwind styling. Modernization should focus on stronger conventions, enforcement, documentation, and cross-surface adoption.

### 2.4 Design System Implementation

Hermes already has explicit design-system assets:

- `docs/design/hermes-dashboard-design-contract.md`
- `docs/design/product-architecture-system-handbook.md`
- `docs/design/product-architecture-standards-current-assessment.md`
- `docs/design/dashboard-ultimate-gap-assessment.md`
- `docs/design/mobbin-reference-workflow.md`
- `packages/hermes-dashboard-kit/README.md`
- `packages/hermes-dashboard-kit/DESIGN.md`
- `web/src/pages/DesignSystemPage.tsx`

The canonical dashboard component layer is `@hermes/dashboard-kit`. It exports shell, metric, data-table, chart, state, launcher, operation, executive, signal, theme, marketplace, validation, and workspace primitives.

Existing non-negotiable rules include:

- One production app shell.
- Extend the dashboard kit before creating local duplicates.
- Decompose prototypes before promotion.
- Avoid nested shells and nested cards.
- Declare chart type, data contract, axes, units, loading, empty, and error states.
- Keep route roots thin.
- Use stable dimensions for dashboard surfaces.
- Treat static adapters as downstream compatibility, not the highest maturity target.

Key gap:

- Standards exist, but agent workflows can still drift unless every new page proposal is forced through a retrieval, classification, component-map, state-map, and validation gate.

### 2.5 Component Architecture

Component layers:

```text
Tokens
-> accessible primitives / @nous-research/ui
-> @hermes/dashboard-kit
-> domain components
-> page patterns
-> routes
```

Observed reusable dashboard-kit primitives include:

- Shell: `DashboardShell`, `DashboardSidebar`, `DashboardHeader`, `DashboardMain`, `DashboardSection`.
- Metrics: `MetricGrid`, `KpiCard`, `StatusPill`, `HealthBadge`, `ProgressMetric`, `CapacityMeter`.
- Tables and filters: `DataTable`, `FilterBar`, `SearchInput`, `SegmentedControl`, `DateRangeToggle`.
- Charts: `ChartPanel`, simple chart wrappers, heatmap and visualization utilities.
- Intelligence: `InsightPanel`, `FindingCard`, `RecommendationCard`.
- Operations: run status, queues, timelines, audit events.
- Marketplace and launch surfaces.
- Validation and snapshot contracts.

Classification:

- Foundational primitives: shell, section, state, metrics, filters, tables, chart panel.
- Reusable UI components: dashboard launcher, command bar, project switcher, status panels.
- Domain components: model routing, permission security, operating loops, package-native migration, project snapshots.
- Page-specific components: many dashboard pages in `web/src/pages`.
- Components requiring refactoring: page-local dashboard chrome that duplicates kit capabilities, if any remain.
- Missing or immature components: reference extraction cards, standards gate panels, design-agent run history, proof/evidence timeline, schema-contract inspector, Mobbin reference map cards.

### 2.6 UI Primitive Layer

Hermes uses a layered primitive strategy:

- `@nous-research/ui` provides shared product UI primitives.
- `apps/desktop` includes Radix-related dependencies and local UI primitives.
- `@hermes/dashboard-kit` owns dashboard appearance and dashboard-specific composition.

Recommendation:

- Keep accessible behavior in primitives and product UI packages.
- Keep dashboard appearance and patterns in `@hermes/dashboard-kit`.
- Do not introduce another broad component library unless a concrete accessibility or interaction gap is demonstrated.

### 2.7 State Management

Observed state patterns:

- React context for web theme, profile scope, page header, system actions, i18n, and plugin registry.
- URL search params for profile, resume, settings deep links, and channel/resume flows.
- Nanostores in desktop for shared UI state such as session, layout, panes, composer, prompts, gateway, command palette, profile, notifications, and preview.
- TanStack Query in desktop and selected web data modules for server-state fetching.
- Local React state inside routes and components.

Key risks:

- The repo has the right tools, but page proposals need a standard state map before implementation.
- URL-shareable state should be required for dashboard filters and drill-downs where repeatability matters.
- Server data, local UI state, persistent preferences, and runtime/gateway state should not be collapsed into one generic store.

### 2.8 Data Visualization

Hermes has a dashboard-kit chart layer and data-visualization exports. The web app also depends on Observable Plot and Three.js.

Current strength:

- `ChartPanel` and related contracts already define shared chrome.
- `DESIGN.md` requires chart type, data contract, axes, units, and all states.

Gaps:

- Chart selection guidance should be more prescriptive for agent-generated pages.
- Cross-filtering, drill-down, export, and chart accessibility conventions should be explicit page-pattern requirements.
- Live data freshness and stale-data states remain a known gap in the broader assessment docs.

### 2.9 Data Tables and Grids

Hermes has a shared `DataTable` in `@hermes/dashboard-kit`.

Current strength:

- Many pages already import `DataTable` and `DataTableColumn` from `@hermes/dashboard-kit`.
- This is the right default for dashboard tables.

Gaps:

- Advanced table behaviors should be explicitly tiered: basic table, sortable/filterable table, virtualized operational grid, and master-detail explorer.
- The design agent should not propose custom table behavior unless the shared table cannot support the needed interaction.
- Missing states and mobile alternatives should be checked per page proposal.

### 2.10 Forms and Validation

Observed validation-related assets:

- Python package uses typed runtime boundaries and test conventions.
- Root JS dependencies include `joi`.
- Dashboard-kit exports contracts and validation helpers.
- Desktop and web have typed API helpers and React Query usage in selected areas.

Gaps:

- A standard "form contract" for complex settings/configuration pages is not as visible as dashboard contracts.
- New configuration surfaces should define client validation, server validation, persistence, unsaved-change behavior, and error announcements before implementation.

### 2.11 Responsive Design

Existing dashboard contracts already require desktop expanded, desktop collapsed, and mobile screenshots for Tier 3 dashboards.

Gaps:

- The screenshot requirement needs to become a normal validation gate, not a best-effort artifact.
- Narrow embedded panels and desktop right-rail surfaces should be included in the pattern library.
- Table and chart mobile alternatives need explicit recipes.

### 2.12 Accessibility

Current strengths:

- The design contracts call out focus rings, keyboard navigation, contrast, non-color-only status, semantic table behavior, chart alternatives, and reduced motion.
- The root dev dependencies include accessibility validation tooling such as axe-related packages.

Gaps:

- Accessibility acceptance criteria should be present in every generated page handoff.
- Custom controls should name their primitive source.
- Chart and visualization alternatives should be concrete, not generic.

### 2.13 Performance

Current strengths:

- Vite, React Router lazy loading, and desktop packaging constraints are explicit.
- Desktop renderer bundle size is intentionally managed, with a high warning ceiling because code splitting is disabled for packaging stability.
- The architecture warns that dynamic UI does not mean every surface should become uncontrolled client-side state.

Gaps:

- Dashboard proposals should include data fetching, caching, and rerender-risk notes.
- Large visualization dependencies should require justification.
- Virtualization criteria for tables and logs should be explicit.

### 2.14 Testing and Validation

Validated during this assessment:

- `npm run dashboard:design-system:status` passed.
- `npm run architecture:standards:validate` passed.
- `npm run dashboard:governance:validate` passed.
- `npm run dashboard:interface-system:validate` passed.

Additional validators exist:

- `npm run dashboard-kit:adoption:audit`
- `npm run dashboard:world-class:audit`
- `npm run dashboard:recipe:score`
- `npm run dashboard:v80:validate`

These should be part of the modernization gate, but high-volume output should be summarized by scripts or CI artifacts so agents can consume pass/fail and key findings reliably.

## 3. Gap Matrix

| Gap | Evidence | Severity | Priority | Recommended action | Dependency | Complexity | Blocks new pages |
|---|---|---:|---:|---|---|---:|---|
| Standards are documented but not fully agent-enforced | Existing docs define rules; `dashboard-ultimate-gap-assessment.md` calls out advisory governance and drift | High | P0 | Add a required design-agent checklist and validator gate before dashboard/page implementation | Existing design docs and npm validators | Medium | Yes, for Tier 3 pages |
| Dashboard kit vs product UI boundaries need clearer decision rules | Both `@hermes/dashboard-kit` and `@nous-research/ui` are active | High | P0 | Document ownership: product primitives in `@nous-research/ui`, dashboard patterns in `@hermes/dashboard-kit` | Package maintainers | Medium | Yes |
| Page-pattern classification is not mandatory | Many pages exist, recipes exist, but proposals can still start from visuals | High | P0 | Require page type, user task, data density, and pattern before Mobbin search | Pattern library v1 | Low | Yes |
| Live data contract maturity is uneven | Existing assessments call out static adapter dependency and data freshness ambiguity | High | P1 | Require DashboardSnapshot/source/freshness contract in implementation handoffs | Backend/API owners | High | Sometimes |
| Visual QA is not yet a universal gate | Tier 3 screenshot rules exist, but enforcement remains uneven | High | P1 | Add screenshot matrix and visual checklist to Codex handoff | Playwright/browser workflow | Medium | Yes for promoted pages |
| Chart behavior is standardized at chrome level but not always at interaction level | `ChartPanel` exists; cross-filtering/export/drill-down rules need recipes | Medium | P1 | Add chart pattern recipes and chart selection matrix | Data-viz owners | Medium | No |
| Advanced table tiers are not explicit enough | Shared `DataTable` exists; operational grid behaviors vary by need | Medium | P1 | Define table tiers and escalation criteria for virtualization/inline edit/master-detail | Dashboard kit | Medium | Sometimes |
| Form/configuration pattern is less mature than dashboard pattern | Settings and provider surfaces exist; dashboard docs are stronger than form docs | Medium | P2 | Add settings/configuration page pattern with validation and unsaved-change rules | Desktop/web owners | Medium | No |
| Mobbin workflow exists but needs execution templates | `mobbin-reference-workflow.md` exists | Medium | P1 | Add extraction cards and reference maps to design-agent output | Mobbin MCP | Low | No |
| Runtime schema ownership is not visible enough to design agents | TypeScript strictness is strong, but API/UI model mapping is not always required in proposals | Medium | P1 | Require API type, UI model, runtime schema, and transformation owner in handoff | API and contract owners | Medium | Sometimes |
| Cross-project adoption remains uneven | Static adapters are synced, but package-native adoption is the higher maturity target | Medium | P2 | Continue package-native migration roadmap and adoption audit | Downstream projects | High | No |
| Component catalog needs richer implementation guidance | `/design-system` exists; missing agent-ready decision prompts | Medium | P2 | Add "when to use / avoid / state requirements / responsive rules" to catalog data | Dashboard kit docs | Medium | No |

## 4. Recommended Build Versions

The gaps should be addressed as versioned standards upgrades. Each version should be shippable, independently useful, and tied to validation gates.

### V1: Standards Gate Foundation

Goal:
Stop new UI work from bypassing the existing Hermes standards.

Primary gaps addressed:

- Standards documented but not fully agent-enforced.
- Page-pattern classification not mandatory.
- Mobbin workflow needs execution templates.

Build scope:

- Add a required page-proposal checklist for Codex and Hermes agents.
- Require classification, user task, data density, component map, state map, responsive behavior, accessibility notes, data contract, and validator commands before implementation.
- Add the Mobbin reference extraction template to the design workflow.
- Add a concise "do not start from broad dashboard inspiration" rule to agent-facing docs.

Recommended artifacts:

- Agent-ready proposal template.
- `ReferenceCard` data shape.
- Standards gate checklist.
- Updated design docs index or AGENTS design section.

Validation gate:

- `npm run dashboard:design-system:status`
- `npm run architecture:standards:validate`
- `npm run dashboard:governance:validate`
- `npm run dashboard:interface-system:validate`

Exit criteria:

- Every new dashboard/page proposal can be reviewed before code starts.
- Mobbin references are tied to specific patterns, not copied screens.
- Tier 3 pages cannot proceed without state, responsive, and accessibility coverage.

### V2: Component Ownership and Pattern Registry

Goal:
Make component choices deterministic for humans and agents.

Primary gaps addressed:

- Dashboard kit vs product UI boundaries need clearer decision rules.
- Component catalog needs richer implementation guidance.
- Form/configuration pattern is less mature than dashboard pattern.

Build scope:

- Define the ownership boundary between `@nous-research/ui` and `@hermes/dashboard-kit`.
- Convert key dashboard recipes into agent-readable registry data.
- Add pattern entries for command center, agent workbench, configuration page, monitoring page, marketplace, design-system gallery, executive operating page, and master-detail explorer.
- Extend `/design-system` or adjacent docs with "when to use", "when to avoid", required states, responsive rules, and accessibility rules.

Recommended artifacts:

- Component ownership decision table.
- Pattern registry module or JSON.
- Settings/configuration page recipe.
- Component usage rules for table, chart, metric, command, and inspector patterns.

Validation gate:

- `npm run dashboard:recipe:score`
- `npm run dashboard-kit:adoption:audit`
- Existing governance validators from V1.

Exit criteria:

- Agents can choose existing components before creating new ones.
- Local component duplication becomes easy to detect.
- Configuration pages have parity with dashboard pages for validation and state rules.

### V3: Data Contracts and Runtime Readiness

Goal:
Make dashboards decision-grade by requiring source, freshness, schema, and transformation ownership.

Primary gaps addressed:

- Live data contract maturity is uneven.
- Runtime schema ownership is not visible enough to design agents.
- Dashboard proposals need data fetching, caching, and rerender-risk notes.

Build scope:

- Require every dashboard proposal to declare API type, UI model, runtime schema, freshness SLA, stale-data behavior, and transformation owner.
- Add `ContractInspector` pattern for high-value dashboards.
- Add data freshness and partial-data language to implementation handoffs.
- Define server-state vs UI-state vs persistent-preference ownership.

Recommended artifacts:

- Dashboard data contract template.
- Freshness and stale-data state checklist.
- API type to UI model mapping convention.
- Contract inspector component spec.

Validation gate:

- Architecture standards validator.
- Dashboard governance validator.
- New data-contract lint/check where feasible.

Exit criteria:

- Promoted dashboards state whether data is live, cached, stale, partial, simulated, or static.
- UI models are not implicitly coupled to raw API responses.
- Agents cannot propose charts/tables without data ownership notes.

### V4: Visual QA and Responsive Proof

Goal:
Make visual quality, responsiveness, and accessibility measurable before promotion.

Primary gaps addressed:

- Visual QA is not yet a universal gate.
- Responsive behavior needs proof across desktop, tablet, mobile, and embedded panes.
- Accessibility acceptance criteria need to be present in every handoff.

Build scope:

- Add screenshot matrix requirements to Codex handoffs.
- Add `ResponsiveProofMatrix` and `StandardsGatePanel` specs.
- Define minimum visual QA for Tier 3 pages: desktop expanded, desktop collapsed, tablet, mobile, and narrow embedded panel.
- Require chart alternatives, keyboard path, focus behavior, and reduced-motion notes.

Recommended artifacts:

- Screenshot proof checklist.
- Accessibility acceptance checklist.
- Playwright visual QA harness or documented command.
- Standards gate panel component.

Validation gate:

- Existing V1 validators.
- Playwright screenshot review for implemented pages.
- Axe/accessibility checks where available.

Exit criteria:

- Promoted dashboards include visual proof, not just code review.
- Text containment and layout overlap issues are caught before release.
- Accessibility is reviewed at pattern level and implementation level.

### V5: Advanced Workspaces, Tables, and Charts

Goal:
Standardize high-density operational interfaces.

Primary gaps addressed:

- Chart behavior is standardized at chrome level but not always at interaction level.
- Advanced table tiers are not explicit enough.
- Cross-filtering, drill-down, export, and virtualization criteria need recipes.

Build scope:

- Define table tiers: basic table, sortable/filterable table, master-detail grid, virtualized operational grid.
- Define chart selection matrix: KPI, trend, distribution, comparison, heatmap, scatter, timeline, probability, capacity.
- Add recipes for chart/table combinations, drill-down chart, master-detail data grid, inspector panel, and alert feed.
- Add export and cross-filtering rules where useful.

Recommended artifacts:

- Table tier decision matrix.
- Chart selection guide.
- Master-detail explorer recipe.
- Drill-down and cross-filtering interaction spec.

Validation gate:

- Dashboard recipe score.
- Dashboard world-class audit.
- Visual QA from V4.

Exit criteria:

- Agents stop inventing table and chart behavior per page.
- Dense operational pages can be implemented using known patterns.
- Virtualization and export are added only when justified.

### V6: Package-Native Adoption and Downstream Rollout

Goal:
Move the standards from central documentation into repeatable, package-native adoption across Hermes surfaces and downstream projects.

Primary gaps addressed:

- Cross-project adoption remains uneven.
- Static adapters are synced but package-native adoption is the higher maturity target.
- Validator outputs need concise summaries for agent consumption.

Build scope:

- Continue migration from static adapters to package-native `@hermes/dashboard-kit` where appropriate.
- Add concise validator summaries for high-volume scripts.
- Track adoption by project, route, component, and maturity tier.
- Add downstream rollout guidance for web, desktop, plugins, and external project dashboards.

Recommended artifacts:

- Adoption dashboard.
- Validator summary output format.
- Downstream migration checklist.
- Package-native dashboard starter.

Validation gate:

- `npm run dashboard-kit:adoption:audit`
- `npm run dashboard:world-class:audit`
- `npm run dashboard:v80:validate`
- V1-V5 gates as applicable.

Exit criteria:

- Agents can see which projects are synced, package-native, stale, or non-compliant.
- Downstream projects reuse kit contracts instead of copying static styles.
- Governance output is concise enough to be consumed in CI and agent workflows.

### Recommended Sequence

| Version | Build theme | Priority | Why this order |
|---|---|---:|---|
| V1 | Standards Gate Foundation | P0 | Prevents further drift immediately |
| V2 | Component Ownership and Pattern Registry | P0 | Makes implementation choices deterministic |
| V3 | Data Contracts and Runtime Readiness | P1 | Turns dashboards from visual shells into decision-grade interfaces |
| V4 | Visual QA and Responsive Proof | P1 | Makes quality measurable before promotion |
| V5 | Advanced Workspaces, Tables, and Charts | P1 | Supports high-density modern interfaces without one-off behavior |
| V6 | Package-Native Adoption and Rollout | P2 | Scales standards across Hermes and downstream projects |

## 5. Hermes UI Vocabulary v1

### Page Types

Command center:
An operator-first page for monitoring work, status, queues, and actions. Use for daily repeated operation. Avoid for narrative reporting.

Agent workbench:
A workspace for running, inspecting, and steering agent sessions. Common components: session rail, transcript, command bar, tool activity, preview panel, approval controls.

Configuration page:
A settings surface for model routing, providers, gateway, permissions, MCP, plugins, and local preferences. Requires form validation, dirty-state handling, and permission-aware controls.

Monitoring page:
A health, reliability, latency, error, and incident surface. Common components: status ribbon, alert feed, time-series chart, run table, incident inspector.

Marketplace page:
A discovery and install/manage surface for plugins, skills, dashboards, themes, or tools. Requires search, category filters, trust metadata, install state, and compatibility messaging.

Design-system gallery:
A reference and governance page that shows components, states, usage rules, recipes, and validation evidence. Use for internal standards and agent grounding.

Executive operating page:
A low-frequency summary page for leadership decisions. Common components: executive metrics, decision ledger, risk list, readiness score, recommended actions.

Master-detail explorer:
A high-density workspace for scanning rows and inspecting one selected item. Common components: filter bar, data grid, inspector, activity/history panel.

### Layout Terms

Single scroll owner:
One container owns vertical scrolling for the app surface. Required for complex dashboards and desktop panes.

Command header:
Compact header containing page identity, health/freshness metadata, primary action, and secondary commands.

Inspector panel:
Right-side or bottom panel for details about a selected row, run, plugin, model, or alert.

Persistent rail:
Stable navigation or session rail that does not disappear during repeated work.

Split workbench:
Two- or three-pane interface with navigation, primary work area, and contextual detail/preview.

### Component Terms

KPI ribbon:
Dense row of metrics showing current operating state.

Run status panel:
Component showing active, queued, blocked, failed, and completed runs.

Queue panel:
Operational queue summary with priority, owner, status, and next action.

Reference card:
Mobbin or internal screenshot reference with pattern fit, what to adapt, and what not to copy.

Standards gate panel:
Validation summary showing design-contract, governance, accessibility, responsive, and visual QA status.

Contract inspector:
Panel that shows data source, schema, freshness, permissions, and UI model mapping.

### Interaction Terms

Drill-down:
Moving from summary signal to row, detail, evidence, or trace.

Approval flow:
User confirmation before an agent action, plugin install, permission change, or destructive command.

Cross-filtering:
Selecting a chart/metric segment filters related tables or panels.

Evidence trail:
Audit-friendly list of sources, validations, screenshots, logs, and decisions behind a recommendation.

### State Terms

Loading state:
Initial or refresh state that preserves layout stability.

Empty state:
Valid state where no data exists yet.

Zero-results state:
Valid state where filters exclude all rows.

Partial-data state:
Some sources are missing, stale, delayed, or permission-restricted.

Stale-data state:
Data is available but freshness violates the page contract.

Permission-restricted state:
User cannot view or act on part of the page.

## 6. Pattern Library v1

### 6.1 Command Center

Problem:
Operators need to know what is running, what is blocked, and what action is required.

Use when:
The page is used daily, has live or near-live state, and supports action.

Avoid when:
The page is mainly retrospective reporting.

Required components:
`DashboardShell`, `DashboardHeader`, `DashboardSidebar`, `MetricGrid`, `KpiCard`, `RunStatusPanel`, `QueuePanel`, `DataTable`, `ActivityTimeline`, `CommandBar`.

Responsive rules:
Desktop uses rail + main + optional inspector. Tablet collapses inspector below. Mobile prioritizes status, queues, then actions.

States:
Loading, partial-data, stale-data, empty queue, error recovery, permission-restricted actions.

### 6.2 Agent Workbench

Problem:
Users need to run, inspect, and steer agent sessions without losing context.

Use when:
The primary task is interactive agent operation.

Required components:
Session rail, chat/thread, tool activity timeline, approval controls, preview/terminal panel, model/profile controls.

Responsive rules:
Desktop supports split workbench. Narrow widths collapse preview and session rail into drawers or tabs.

Accessibility:
Keyboard navigation through transcript, command input, tool approvals, and panels is required.

### 6.3 Configuration and Policy Page

Problem:
Users need to safely configure providers, permissions, model routing, gateway settings, plugins, and MCP.

Use when:
Fields persist, validation matters, and mistakes have runtime impact.

Required components:
Settings navigation, form sections, inline validation, save/reset command bar, audit trail, permission labels.

States:
Dirty, saving, saved, validation error, server error, permission-restricted, stale configuration.

### 6.4 Monitoring and Incident Page

Problem:
Operators need health, errors, latency, traces, incidents, and recovery actions.

Required components:
Health ribbon, alert feed, time-series chart, incident table, inspector, action log.

Data-viz rules:
Charts must declare units, freshness, thresholds, and fallback table.

### 6.5 Marketplace and Capability Catalog

Problem:
Users need to discover, install, manage, trust, and update capabilities.

Required components:
Search, category filters, capability cards, compatibility metadata, install state, changelog, permissions, trust signal, detail drawer.

Avoid:
Marketing-style landing pages that hide the actual management workflow.

### 6.6 Design-System Gallery and Standards Console

Problem:
Agents and humans need one place to verify component use, recipes, states, and validation status.

Required components:
Recipe selector, component examples, state matrix, reference map, validator status, adoption audit summary.

## 7. Mobbin Reference Map

Mobbin remains a visual-reference system. It must not become the source of truth for Hermes branding, tokens, accessibility, architecture, or component APIs.

Reference candidates gathered through Mobbin MCP:

| Hermes pattern | Reference | What to study | What not to copy |
|---|---|---|---|
| Developer command center | [Modal screen](https://mobbin.com/screens/3910777c-e414-4971-a4b9-06f67f18f02c) | Dense console structure, navigation hierarchy, operational grouping | Visual identity, colors, complete layout |
| Document/process workspace | [PandaDoc screen](https://mobbin.com/screens/79d68519-f53a-4cee-af87-32c39727a0dd) | Sidebar + table/detail workflow and action placement | Product-specific document semantics |
| Evaluation/AI operations | [Braintrust screen](https://mobbin.com/screens/6afb4b94-70da-4bf0-9174-b5a9479accc0) | AI/devtool density, evaluation-oriented hierarchy | Branding and exact component styling |
| Model/tool command UI | [ElevenLabs screen](https://mobbin.com/screens/17bfb444-4520-487d-9cf1-d1cc6584be43) | Technical product controls and high-signal settings surfaces | Brand palette and domain-specific content |
| Market/data intelligence | [Fey screen](https://mobbin.com/screens/54b4f913-aa07-40e0-9b51-3f6cc0d9b11d) | Dense financial workspace hierarchy | Whole-screen clone |
| Monitoring/alerting | [Better Stack screen](https://mobbin.com/screens/b06f4a90-1c59-4ec7-a9ff-11290860e8a4) | Incident and monitoring conventions | Exact visual treatment |
| Incident operations | [incident.io screen](https://mobbin.com/screens/1a2f60e2-10d1-4fc3-82a6-875096ff78ac) | Incident workflow and action/event grouping | Product-specific incident model |

Reference extraction template:

```text
Reference:
Pattern demonstrated:
Useful structural idea:
What Hermes should adapt:
What Hermes must not copy:
Relevant Hermes components:
Required token/theme constraints:
Accessibility or responsive lesson:
Implementation risk:
```

## 8. Hermes Design Standards Agent Specification

### 8.1 Inputs

Every page or major component proposal must receive:

- Surface: web, desktop, dashboard kit, plugin, static adapter, docs-only.
- Page or component name.
- Business or operator purpose.
- Primary user role.
- Primary task.
- Secondary tasks.
- Data displayed.
- Decisions supported.
- Required actions.
- Frequency of use.
- Data density.
- Permissions and trust boundaries.
- Device and pane expectations.
- Existing design contracts.
- Existing components to reuse.
- Data contracts and runtime schema owner.
- Known technical constraints.

### 8.2 Retrieval Process

The agent must retrieve, in order:

1. `AGENTS.md` frontend and dashboard instructions.
2. `packages/hermes-dashboard-kit/DESIGN.md`.
3. `packages/hermes-dashboard-kit/README.md`.
4. Relevant docs in `docs/design`.
5. Existing page/component implementations.
6. Existing route and state patterns.
7. Mobbin references for selected patterns only.

The agent must not begin with a broad visual search such as "modern dashboard". It must first classify the page and identify the workflow.

### 8.3 Decision Rules

- Use `@hermes/dashboard-kit` for dashboard shell, sections, metrics, tables, chart chrome, dashboard states, and dashboard recipes.
- Use `@nous-research/ui` for product primitives where it is already the product source of truth.
- Extend the shared package before creating competing local dashboard components.
- Keep route roots thin.
- Define loading, empty, zero-results, partial-data, stale-data, error, and permission states.
- Define responsive behavior before implementation.
- Define data freshness and schema ownership before implementation.
- Require human review before promoting prototypes.
- Run the governance validators after implementation.

### 8.4 Output Schema

```json
{
  "classification": "command-center | agent-workbench | configuration | monitoring | marketplace | design-system-gallery | executive-operating | master-detail-explorer",
  "recommendedPattern": "string",
  "userTasks": ["string"],
  "informationHierarchy": ["string"],
  "sections": ["string"],
  "existingComponents": ["string"],
  "newComponents": ["string"],
  "stateMap": {
    "loading": "string",
    "empty": "string",
    "zeroResults": "string",
    "partialData": "string",
    "staleData": "string",
    "error": "string",
    "permissionRestricted": "string"
  },
  "responsiveBehavior": ["string"],
  "accessibilityRequirements": ["string"],
  "dataContracts": ["string"],
  "mobbinReferences": [
    {
      "url": "string",
      "pattern": "string",
      "adapt": "string",
      "doNotCopy": "string"
    }
  ],
  "implementationRisks": ["string"],
  "validationCommands": ["string"],
  "humanApprovalPoints": ["string"],
  "codexHandoff": "string"
}
```

### 8.5 Human Approval Points

Human review is required before:

- Creating new shared components.
- Adding dependencies.
- Promoting prototypes to production routes.
- Changing shell/navigation patterns.
- Introducing a new data contract.
- Adding a new cross-project adapter.
- Changing core design tokens or theme identity.

## 9. Pilot Page Proposal: Hermes Design Intelligence Command Center

### Purpose

Create a standards-modernization page/workflow that lets humans and agents see whether a proposed Hermes UI meets the system standards before implementation or promotion.

### Option A: Validator-First Standards Console

Best for:
Engineering leads and agents validating implementation readiness.

Structure:

- Command header with current standards status.
- KPI ribbon for governance, adoption, visual QA, data contracts, and accessibility.
- Validator results table.
- Gap matrix table.
- Evidence timeline.
- Right-side inspector for selected finding.

Tradeoff:
Strong enforcement, weaker design education.

### Option B: Pattern-Library Workbench

Best for:
Designing new pages and teaching agents the vocabulary.

Structure:

- Pattern category navigation.
- Component and state examples.
- Mobbin reference cards.
- Design-token and component ownership notes.
- Codex-ready handoff generator.

Tradeoff:
Strong design guidance, weaker operational validation.

### Option C: Hybrid Design Intelligence Command Center

Best for:
Hermes modernization because it combines standards, references, component inventory, and validation gates.

Structure:

- `DashboardShell` with standards sidebar.
- `DashboardHeader` with surface selector, status, and primary "Create proposal" command.
- `MetricGrid` showing adoption, governance, visual QA, state coverage, and contract coverage.
- Main tabs: Patterns, Components, Proposals, Validators, References.
- Pattern detail view with required components, states, responsive rules, accessibility rules, and Mobbin references.
- Proposal inspector showing state map, component map, data contracts, risks, and validation commands.
- Evidence timeline for validator runs, screenshots, and human approvals.

Recommended:
Option C. It matches the actual modernization need: not just documenting standards, but making the standards executable for humans, Codex, and Hermes agents.

### Component Map

Reuse:

- `DashboardShell`
- `DashboardSidebar`
- `DashboardHeader`
- `DashboardSection`
- `MetricGrid`
- `KpiCard`
- `StatusPill`
- `HealthBadge`
- `DataTable`
- `FilterBar`
- `SearchInput`
- `SegmentedControl`
- `ChartPanel`
- `InsightPanel`
- `RecommendationCard`

Likely new shared components:

- `ReferenceCard`
- `StandardsGatePanel`
- `DesignProposalInspector`
- `ContractInspector`
- `ValidationEvidenceTimeline`

### State Map

- Loading: validator summaries and pattern registry load with stable skeletons.
- Empty: no proposals yet.
- Zero-results: search/filter excludes all patterns or proposals.
- Partial-data: some validators or Mobbin references unavailable.
- Stale-data: last validation is older than the configured threshold.
- Error: validator command failed or registry cannot load.
- Permission-restricted: user can view standards but cannot approve promotion.

### Responsive Behavior

- Large desktop: sidebar, main work area, optional inspector.
- Standard desktop: sidebar collapsible, inspector drawer.
- Tablet: tabs above content, inspector below selection.
- Mobile: metric ribbon becomes compact list; tables use stacked row summaries; inspector opens as sheet.
- Embedded pane: show proposal status, required actions, and validator summary first.

### Codex-Ready Implementation Specification

1. Add a pattern/standards registry module under the existing dashboard or design-system data area.
2. Implement the pilot route using `@hermes/dashboard-kit` components only for dashboard chrome.
3. Add reference cards using Mobbin URLs and extraction metadata.
4. Add validation command metadata for the existing npm scripts.
5. Add states for loading, empty, zero-results, stale-data, partial-data, error, and permission-restricted.
6. Validate with the existing dashboard governance scripts and screenshot QA when implemented.

## 10. Implementation Roadmap

### Immediate Fixes

- Treat this document as the corrected Hermes Agent modernization handoff.
- Add this workflow to the design docs index if one exists.
- Require page proposals to include classification, state map, component map, data contract, responsive behavior, and validation commands.
- Keep Mobbin references tied to specific patterns, not broad visual inspiration.

### Foundational Refactors

- Clarify `@nous-research/ui` vs `@hermes/dashboard-kit` ownership in one short decision table.
- Convert the most important dashboard recipes into agent-readable registry data.
- Make validator outputs easier for agents to consume as concise pass/fail summaries.
- Add a schema/freshness section to dashboard implementation handoffs.

### Missing Reusable Components

- `ReferenceCard`
- `StandardsGatePanel`
- `DesignProposalInspector`
- `ContractInspector`
- `ValidationEvidenceTimeline`
- `ResponsiveProofMatrix`

### Pattern-Library Development

- Add patterns for command center, agent workbench, configuration, monitoring, marketplace, design-system gallery, executive operating page, and master-detail explorer.
- For each pattern, define required components, data density, responsive behavior, accessibility, states, tokens, and validator expectations.

### Design-Agent Development

- Create a Hermes Design Standards Agent prompt/spec using the schema above.
- Require retrieval of `AGENTS.md`, dashboard-kit `DESIGN.md`, dashboard-kit `README.md`, and relevant design docs.
- Add Mobbin extraction template to the agent output.
- Add human approval points before implementation or promotion.

### Pilot Implementation

- Build the Hybrid Design Intelligence Command Center as a package-native dashboard route.
- Reuse dashboard-kit components.
- Add registry-backed pattern pages.
- Include validator status and evidence timeline.
- Run governance, architecture, design-system, and visual QA gates.

### Validation and Rollout

- Continue using:
  - `npm run dashboard:design-system:status`
  - `npm run architecture:standards:validate`
  - `npm run dashboard:governance:validate`
  - `npm run dashboard:interface-system:validate`
- Add concise summaries for:
  - `npm run dashboard-kit:adoption:audit`
  - `npm run dashboard:world-class:audit`
  - `npm run dashboard:recipe:score`
  - `npm run dashboard:v80:validate`
- Promote the workflow to downstream projects only after package-native adoption and visual QA are stable.

## 11. Definition of Success

The modernization succeeds when a Hermes requirement such as:

> Create an agent operations page that helps operators understand what is running, what is blocked, and what action should be taken.

Consistently produces:

- The correct page classification.
- A user-task-driven information hierarchy.
- A reusable Hermes page pattern.
- Relevant Mobbin references with extraction notes.
- A component map using `@hermes/dashboard-kit` and `@nous-research/ui` correctly.
- Complete loading, empty, zero-results, partial-data, stale-data, error, permission, and responsive states.
- Data contract and freshness requirements.
- Human approval points.
- Codex-ready implementation steps.
- Passing governance and dashboard validation.
- A final interface that is responsive, accessible, testable, maintainable, and aligned with the Hermes Agent system.
