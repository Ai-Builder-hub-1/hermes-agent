# Dashboard Visual Baseline Reference Registry

Generated: 2026-08-22T19:34:45.775Z

These are the shared visual families every dashboard must prove. They are intentionally broader than package dependency checks because the user sees layout, density, state, and interaction quality.

| Family | Components | Required Proof |
| --- | --- | --- |
| shell-sidebar | DashboardShell, DashboardSidebar, DashboardHeader | desktop screenshot<br>mobile screenshot<br>no mobile full-screen sidebar cover<br>visible route navigation |
| workspace-density | PageFrame, SectionStack, MetricCard, StatePanel | consistent card gaps<br>no card nesting<br>no horizontal overflow |
| tables | DataTable, TableSurface, Pagination | table inside card<br>10/25/50 page size control<br>single footer |
| charts | LineChart, BarChart, DonutChart, ChartPanel | not hand-drawn<br>labeled axes or meaningful tooltip<br>loading and empty states |
| auth-session | SessionStatus, AuthPanel, CommandHeader | professional placement<br>proof route bypass or test password<br>save/update state visible |
| sidecars-drawers | SidecarPanel, Drawer, InspectorPanel | does not trap chart/workspace height<br>collapses to a predictable rail<br>scrolls internally |
| state-feedback | LoadingState, EmptyState, ErrorState, DataFreshnessStrip | no permanent dashes without reason<br>freshness and source visible<br>operator next action |
| proof-strip | ProofStrip, RuntimeStatus, HealthBadge | runtime heartbeat<br>data source freshness<br>environment mode<br>repair target |

## Shell And Sidebar

Every project must use the shared shell rhythm before page-level redesign begins.

## Workspace Density And Spacing

Cards must look placed by a system, not dropped behind existing content.

## Tables And Pagination

Every data table needs a surface, density, and pagination contract.

## Charts And Time Series

Chart work must use real chart components or approved domain libraries.

## Auth And Session Controls

Auth can exist, but it cannot block certification from reaching the real dashboard surface.

## Sidecars And Drawers

Inspectors belong in reusable sidecar/drawer patterns instead of one-off local panels.

## Empty Loading Error States

Missing data must explain whether it is loading, unavailable, stale, or misconfigured.

## Proof And Runtime Status

Proof surfaces must tell the truth about running, stopped, stale, and unknown states.
