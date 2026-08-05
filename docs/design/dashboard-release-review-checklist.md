# Dashboard Release Review Checklist

Before a dashboard is marked Tier 3 complete:

- Adoption report is current.
- Surface validates against package-native requirements or has an approved bridge exception.
- Mobbin/reference intake is linked and translated into Hermes components.
- Operational sidebar proof covers expanded, collapsed, and mobile states.
- Loading, empty, error, stale, partial, and permission states are present.
- Tables over 10 rows use full-width table surfaces, contained horizontal scroll, default 10-row pagination, and 10 / 25 / 50 page-size controls.
- Sortable tables use a card-level toolbar with row count, `Sort by`, sort direction, filters, and export actions; dense table headers do not repeat visible sort controls across every column.
- Time-series, usage, issue, approval, activity, market, and QA views place an interactive chart or trend panel above the raw evidence table when chartable history exists.
- Chart controls are scoped to the chart card and include clear time-window, metric/state, grouping, and entity/brand selection where comparison is expected.
- Page, section, grid, card, and table spacing uses dashboard-kit spacing tokens and does not rely on one-off pixel gutters.
- Secondary helper copy uses `HelpTip` / `InfoPopover`; critical states, errors, blockers, and required instructions remain visible.
- Production proof endpoint is declared.
- Screenshot baseline is captured and reviewed.
- Health and snapshot URLs are declared.
- Telemetry contract report is complete or lists explicit downstream blockers.
- Hetzner/project deployment context is documented in the project registry.
