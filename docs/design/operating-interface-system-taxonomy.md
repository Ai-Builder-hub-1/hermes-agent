# Hermes/TLC Operating Interface System Taxonomy

This is the complete taxonomy for modern Hermes/TLC operating surfaces. It exists so dashboard work does not collapse into one-off charts, local CSS, or disconnected prototypes.

The canonical implementation is `@hermes/dashboard-kit` in `packages/hermes-dashboard-kit`.

## Completion Model

Each pattern family moves through these stages:

| Stage | Meaning |
| --- | --- |
| `identified` | The pattern is named and belongs in the system. |
| `researched` | Reference patterns and Mobbin searches have been captured. |
| `contracted` | Data/interaction contract is defined. |
| `prototyped` | At least one realistic prototype direction exists. |
| `implemented` | Shared package or static adapter component exists. |
| `adopted` | At least one project uses it. |
| `validated` | Build, spine, state, accessibility, and adoption checks pass. |

## 1. Navigation And Workspace Structure

Purpose: help operators move between scopes without tab sprawl.

Patterns:

- Dashboard shell
- Primary sidebar
- Collapsible sidebar
- Workspace switcher
- Business-unit switcher
- Breadcrumb trail
- Page header
- Split view
- Master/detail layout
- Drilldown route
- Command palette
- Mobile navigation

Required states:

- Active item
- Disabled item
- Permission-limited item
- Unavailable route
- Collapsed/expanded
- Mobile fallback

First consumers:

- Hermes Agent command cockpit
- Kashi market intelligence
- Media Engine operations
- TLC enterprise portfolio

## 2. Information Architecture

Purpose: decide what belongs on overview, drilldown, alert, command, and detail surfaces.

Patterns:

- Six-workspace mapping: Command, Operations, Intelligence, Capacity, Projects, Controls
- Overview page
- Focus page
- Drilldown page
- Entity detail page
- Review queue
- Control room
- Report page
- Executive rollup

Required decisions:

- What question does the page answer?
- What must be above the fold?
- What can be hidden until selected?
- What is actionable vs observational?
- What data is real, stale, partial, or mock-preview?

## 3. Cards And Panels

Purpose: make state scannable without turning dashboards into decorative card piles.

Patterns:

- KPI card
- Cost card
- Health card
- Readiness card
- Evidence card
- Finding card
- Recommendation card
- Action card
- Queue card
- Risk card
- Source/freshness panel
- Summary strip
- Stat rail
- Compact dense card
- Executive spacious card

Required states:

- Loading
- Empty
- Error
- Warning
- Critical
- Stale
- Preview
- Selected
- Disabled

## 4. Tables And Lists

Purpose: support dense scanning, sorting, ranking, and row drilldowns.

Patterns:

- Data table
- Ranked table
- Market tape
- Entity list
- Alert list
- Audit log
- Job queue
- Expandable row
- Sticky header
- Row-level actions
- Inline status
- Inline sparkline
- Table toolbar
- Saved view list

Required interactions:

- Sort
- Search
- Filter
- Select row
- Open drawer
- Pin row
- Bulk action
- Export/report

## 5. Charts And Data Visualization

Purpose: reveal movement, composition, comparison, distribution, and anomaly.

Time-series:

- Single line
- Multi-line
- Area
- Stacked area
- Step line
- Sparkline
- Event-annotated timeline
- Rolling-window chart

Market/trading:

- Price movement
- Spread band
- Liquidity depth
- Order-book ladder
- Volume pulse
- Volatility window
- Market tape
- Movement heat strip
- Imbalance chart
- Resolution path
- Candlestick/OHLC when true OHLC exists

Heatmaps:

- Category heatmap
- Tag opportunity heatmap
- Time-window heatmap
- Liquidity heatmap
- Signal-rate heatmap
- Risk heatmap
- Cost heatmap
- Calendar heatmap
- Matrix heatmap

Comparison:

- Vertical bar
- Horizontal ranked bar
- Grouped bar
- Stacked bar
- Diverging bar
- Bullet chart
- Waterfall chart
- Pareto chart

Distribution:

- Histogram
- Box plot
- Violin plot
- Dot plot
- Percentile bands
- Outlier plot

Relationships:

- Scatter plot
- Bubble chart
- Quadrant chart
- Correlation matrix
- Risk/reward plot
- Cost/output plot
- Confidence/impact plot

Flow and hierarchy:

- Funnel
- Sankey
- Pipeline stages
- Queue flow
- Treemap
- Sunburst
- Allocation view

Status and executive:

- Alert rail
- Incident timeline
- Health matrix
- SLA/SLO meter
- Capacity meter
- Readiness radar
- Forecast cone
- Budget burn-down
- Business-unit comparison

## 6. Drilldowns And Drawers

Purpose: keep overview surfaces clean while preserving inspection depth.

Patterns:

- Side drawer
- Bottom sheet
- Detail panel
- Evidence drawer
- Chart inspector
- Source/freshness drawer
- Entity profile drawer
- Action confirmation drawer
- Compare drawer

Required behavior:

- Opens from selected row/card/chart point
- Contains exact values and context
- Shows source and freshness
- Shows actions separately from evidence
- Has mobile fallback
- Has close/focus behavior

## 7. Command And Control

Purpose: make operator actions safe, visible, reversible when possible, and auditable.

Patterns:

- Command bar
- Action button group
- Approval panel
- Retry panel
- Deploy/promote panel
- Start/stop/tune controls
- Acknowledge alert control
- Confirmation flow
- Disabled reason
- Risk label
- Permission badge
- Audit trail

Required states:

- Enabled
- Disabled with reason
- Needs approval
- In progress
- Succeeded
- Failed
- High-risk
- Permission-limited

## 8. State Design

Purpose: prevent “blank dashboard” confusion.

States:

- Normal
- Loading
- Empty
- Error
- Warning
- Critical
- Stale
- Degraded
- Preview/mock
- Permission-limited
- Offline
- Syncing
- Partial data
- First-run setup

Every dashboard module must declare which states it supports.

## 9. Search, Filtering, And Discovery

Purpose: help operators find the right slice quickly.

Patterns:

- Global search
- Scoped search
- Saved filters
- Quick filter chips
- Business-unit filter
- Provider filter
- Category/tag filter
- Time-window selector
- Confidence filter
- Status filter
- Query explanation
- “Why am I seeing this?” panel

Required behavior:

- Filter applies visibly
- Empty filtered state differs from empty data state
- Saved view shows owner/scope
- Filter reset is obvious

## 10. AI-Assisted Interaction

Purpose: make dashboards explain, compare, summarize, and turn insights into work.

Patterns:

- Ask-this-dashboard panel
- Explain spike
- Summarize row
- Compare entities
- Suggest next action
- Generate report
- Create investigation
- Inline AI editor
- Regenerate section
- Confidence and source panel
- Human approval checkpoint

Required boundaries:

- AI output must be labeled
- Sources/freshness must be visible when claims are made
- Action recommendations must not execute without permissions
- Generated text must be editable or reviewable

## 11. Visual Language

Purpose: produce modern interfaces without decoration overpowering operations.

System rules:

- Compact but breathable density
- Stable left navigation
- Clear active and selected states
- Strong table rhythm
- Purposeful charts with labels and legends
- Semantic colors only
- Consistent spacing/radius/type scale
- No decorative blobs/orbs
- No generic card piles
- No mock data without preview labels
- Responsive layouts with stable fixed-format elements

## 12. Reference Research Beyond Charts

Mobbin/reference searches must cover:

- Dashboards
- Admin panels
- Fintech apps
- Trading apps
- Analytics products
- Incident management
- Command centers
- CRM/entity detail pages
- AI copilots
- Project management tools
- Search/filter experiences
- Onboarding/configuration flows
- Settings/permissions pages
- Mobile dashboard patterns

Research output must name:

- Pattern family
- Reference direction
- What works
- What to adapt
- What to avoid
- Candidate shared component
- Candidate consuming projects

## 13. Project Retrofit Tracks

Initial retrofit order:

1. Kashi VC market intelligence and live volatility.
2. Hermes Agent cost/capacity cockpit.
3. Media Engine operations and human-video production cockpit.
4. Media Business OS provider/cost/revenue cockpit.
5. TLC Capital Group OS portfolio/readiness command center.

Each retrofit must:

- Map current screens to the taxonomy.
- Replace local UI with shared primitives where possible.
- Document exceptions.
- Validate package build, dashboard spine, static adapter sync, visual selection bridge, and state coverage.
