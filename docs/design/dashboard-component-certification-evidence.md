# Dashboard Component Certification Evidence

Status: V8 evidence artifact

This file records the reusable evidence requirements for the shared dashboard-kit primitives. It is paired with:

- `tests/dashboard/design-system.spec.ts`
- `docs/design/dashboard-component-catalog.md`
- `docs/design/dashboard-route-a11y-matrix.json`
- `docs/design/dashboard-component-certification-checklist.json`

## Shared Evidence Matrix

| Component | State matrix | Keyboard/focus proof | Mobile/compact proof | Dark/density proof | Loading/empty/error proof | Documentation |
| --- | --- | --- | --- | --- | --- | --- |
| `DashboardShell` | shell, sidebar, header, footer, overflow | Playwright focus path | desktop/mobile projects | theme-system route | page route fallbacks | component catalog |
| `DashboardHeader` | title, eyebrow, description, meta, action | header actions tabbable | wraps meta/actions | theme-system route | route-level fallbacks | governance standard |
| `DataTable` | rows, empty, sorting, row action | sortable/clickable controls | compact table alternatives required by recipe | design-system route | empty state built into component | component catalog |
| `ChartPanel` | normal, empty, tooltip, chart chrome | chart alternatives required in handoff | chart panel stacks in mobile routes | chart tokens in theme-system route | empty state via chart wrappers | component catalog |
| `FilterBar` | search, segmented controls, date/window controls | native input/button tab order | wraps controls without overflow | token-compatible controls | zero-result state owned by page | component catalog |
| `DetailDrawerShell` | open, close, detail, permission-limited | focus management required by route test | mobile sheet behavior required by recipe | token-compatible surfaces | empty/detail fallback required | component catalog |
| `CommandBar` | enabled, disabled, destructive, queued | disabled reasons and buttons tabbable | wraps actions without overflow | token-compatible status/action colors | queue/error feedback required | component catalog |

## Advanced Behavior Decisions

`DataTable` virtualization is not a default behavior. It is required only when a route expects enough rows to create measurable render or scroll latency. Until then, table-first routes use pagination, filtering, column visibility, and compact mobile alternatives before virtualization.

`ChartPanel` accessibility requires a visible title, a short description or surrounding summary, tokenized chart colors, and a text/table alternative when the chart is decision-critical. Cross-filtering is treated as an explicit interaction contract, not default chart behavior.

`FilterBar` controls should synchronize shareable filters through URL state when filters materially change result sets. Ephemeral local filters are allowed for small in-memory tables.

`DetailDrawerShell` must behave as a drawer or sheet at narrow widths. Routes using it must keep the selected record state visible and provide a keyboard close path.

`CommandBar` destructive or permission-limited actions must expose disabled reasons, confirmation where needed, and queue/audit feedback after execution.
