# Dashboard Information Architecture

Hermes dashboards use a consistent operating IA:

1. Shell: brand, grouped navigation, active route, status footer.
2. Command header: page title, current operating question, primary actions.
3. Summary band: dominant metrics, freshness, readiness, action pressure.
4. Workspace: charts, tables, queues, feeds, inspectors, and drill-down panels.
5. Proof/state layer: loading, empty, error, stale, partial, permission, and evidence states.

Navigation should be grouped by operator task, not by implementation module.
Dense pages should prefer table-first or workspace patterns. Executive pages
should prefer summary, trend, action queue, and exception-first patterns.
