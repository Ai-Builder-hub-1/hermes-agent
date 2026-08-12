# Dashboard UI Quality System Handbook

Status: V14 active  
Owner: Nous Hermes Agent  
Registry: `docs/design/dashboard-ui-quality-system-registry.json`

## Purpose

This handbook expands dashboard quality beyond domain libraries. The goal is to make high-quality UI repeatable through registries, proof, scoring, and governance.

## Content And Copy Standard

Dashboard copy must be operator-facing.

Rules:

- Page titles state the workspace or operator question.
- Helper text explains only what is not obvious.
- Duplicate headers are removed.
- Debug telemetry is hidden unless it directly supports a decision.
- Empty, stale, partial, and error states explain what happened and what the operator can do.
- Tooltips explain secondary context, not critical status.

## Information Priority Model

Every Tier 3 page must separate:

- primary: the decision or action the operator came for
- secondary: evidence needed to make that decision
- tertiary: logs, debug detail, implementation telemetry, raw evidence

Top rows should not be filled with non-actionable telemetry. Debug details move into drawers, proof panels, or admin views.

## Density And Responsiveness

Approved density modes:

- comfortable: executive and review pages
- compact: operating cockpits and dashboards
- dense: tables, logs, queues, and analyst workspaces

Rules:

- Sidebar collapse must preserve navigation access.
- Tables own horizontal scroll inside the table surface.
- Wide charts/tables should use full-width rows unless a split layout is selected.
- Mobile views use drawers or bottom sheets for detail.

## Accessibility And Keyboard Operation

Required:

- visible focus states
- keyboard-accessible buttons, tabs, drawers, and menus
- accessible labels for icon controls
- non-drag alternative for drag/drop workflows
- chart/table descriptions where visual-only data would block understanding

## Performance And Loading UX

Required:

- nonblank shell appears first
- skeletons match final layout
- slow data is lazy-loaded where possible
- stale/freshness state is visible
- large tables/charts use pagination, virtualization, or progressive loading

## Observability

Production dashboards should track:

- UI load failures
- slow dashboard loads
- failed save/approve/post actions
- stale data age
- proof route freshness
- chart/table empty-rate where data is expected

## Central Maturity Reports

Required central reports:

- `dashboard-fleet-ui-maturity-scorecard.json`: cross-project UI maturity score across tier, kit distribution, visual evidence, proof route, runtime-data policy, design debt, and V14 system status.
- `dashboard-visual-regression-matrix.json`: required screenshot matrix by dashboard, viewport, theme, and state.
- `dashboard-design-debt-report.json`: active design debt, expired debt, blocking debt, and deprecated pattern status.

Promotion rules:

- T3C cannot pass with expired or blocking design debt.
- T3C cannot pass without an explicit visual-regression matrix entry.
- Low scorecard results do not automatically fail local development, but they must be resolved or explained before promotion.

## Design Debt

Temporary compromises must be recorded in `dashboard-design-debt-registry.json`.

Debt requires:

- owner
- reviewer
- route/component scope
- reason
- maturity impact
- replacement plan
- expiry date

Expired blocking debt prevents Tier 3C.

## Pattern Deprecation

Deprecated patterns live in `dashboard-pattern-deprecation-registry.json`.

Once a replacement exists, deprecated patterns should be blocked for Tier 3C unless explicitly excepted.

## Human Review

Material redesigns require a human review record with:

- reference intake
- before/after proof
- selected layout/component/interaction patterns
- approval or changes-requested reason

## Agent Protocol

Agents must follow `dashboard-agent-build-protocol.md` before claiming dashboard work is complete.
