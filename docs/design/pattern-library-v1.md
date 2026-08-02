# Pattern Library v1

Patterns describe reusable page and workflow structures. They are not visual skins and do not override Kaoshi/Hermes design tokens.

## Page Patterns

### Executive Dashboard

- Problem: leaders need fast orientation and accountable next actions.
- Use when: the primary task is summary review, trend detection, and exception spotting.
- Avoid when: operators need row-level triage as the main task.
- Components: KPI ribbon, trend chart, ranked insight list, alert feed, summary table.
- Responsive rule: KPI ribbon wraps first; charts stack before tables; actions remain reachable.
- Required states: loading, partial data, stale data, empty, error.
- Accessibility: metrics need text equivalents and time windows.

### Market Intelligence Workspace

- Problem: analysts need to filter, compare, and investigate opportunities.
- Use when: data density is high and decisions require drill-down.
- Avoid when: the user only needs a static briefing.
- Components: filter toolbar, KPI ribbon, chart/table pair, ranked table, inspector panel.
- Responsive rule: table-first desktop, chart/table stacked tablet, inspector as drawer on mobile.
- Required states: loading, zero-results, no selection, stale data, export error.
- Accessibility: filters must be keyboard reachable and reflected in URL/share state.

### Monitoring And Alerting Page

- Problem: operators need to detect anomalies and respond quickly.
- Use when: time, severity, and ownership matter.
- Avoid when: data is not operationally actionable.
- Components: status summary, alert feed, incident table, timeline, command bar.
- Responsive rule: alert feed and active incidents remain first; historical charts move below.
- Required states: live disconnected, stale data, acknowledged, muted, escalated.
- Accessibility: alerts must not rely on color alone.

### Master-Detail Data Explorer

- Problem: users need to scan many records and inspect one deeply.
- Use when: row scanning and detail investigation are both frequent.
- Avoid when: every item needs a dedicated full page.
- Components: data grid, filter bar, detail panel, row actions, empty state.
- Responsive rule: split view on desktop, list plus drawer on mobile.
- Required states: no selection, loading detail, record unavailable, permission restricted.
- Accessibility: row selection must expose selected state and panel relationship.

### Settings And Configuration Page

- Problem: users need to manage scoped configuration without accidental production changes.
- Use when: actions modify policies, credentials, integrations, or runtime behavior.
- Avoid when: the task is pure analysis.
- Components: section nav, grouped forms, inline validation, danger zone, audit history.
- Responsive rule: nav collapses to tabs or select; forms remain single-column on mobile.
- Required states: dirty, saving, saved, server validation error, unsaved changes.
- Accessibility: every control needs label, description where risky, and error text.

## Component Patterns

### KPI Summary Ribbon

- Solves: quick comparison across related operational metrics.
- Requires: compact cards, consistent trend grammar, fixed time window.
- Avoid: unrelated metrics or decorative counts.
- States: loading, partial, stale, empty.

### Filter Toolbar

- Solves: visible, shareable result scoping.
- Requires: search, segmented controls/selects, reset, applied count.
- Avoid: hiding primary filters in drawers.
- States: default, dirty, applied, invalid, zero-results.

### Persistent Filter Drawer

- Solves: lower-frequency filters without overwhelming the main toolbar.
- Requires: grouped filters, apply/reset, active count.
- Avoid: filters that must be adjusted every few seconds.
- States: open, closed, dirty, applied.

### Chart And Table Combination

- Solves: seeing aggregate trend and underlying records together.
- Requires: shared filters, matching time window, synchronized empty/loading states.
- Avoid: charts and tables that answer unrelated questions.
- States: chart loading, table loading, partial, no matching rows.

### Inspector Panel

- Solves: focused detail without losing list context.
- Requires: selection model, close behavior, keyboard focus management.
- Avoid: deeply nested workflows better suited to full pages.
- States: no selection, loading, loaded, error, permission restricted.

### Empty State

- Solves: explains absence and gives the next useful action.
- Requires: state-specific message and one relevant action when available.
- Avoid: generic "nothing here" copy.
- States: first-run, zero-results, permission-restricted, integration-missing.
