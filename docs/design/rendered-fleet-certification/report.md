# Rendered Fleet HDK Certification

Generated: 2026-08-22T20:30:58.828Z

This report opens the actual dashboard routes in a browser. It is meant to catch the exact escape hatch we have been seeing: dependency/marker compliance without visual/component compliance.

## Summary

- Total: 10
- Certified: 4
- Needs review: 1
- Blocked: 3
- Unreachable: 2
- Average score: 73.2%

| Dashboard | Verdict | Score | URL | Blockers | Warnings | Routes | Screenshots |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nous-hermes-agent.dashboard | blocked | 74 | http://127.0.0.1:5173/dashboard-kit-gallery | 1 | 2 | 3 | docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-desktop.png<br>docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-mobile.png |
| khashi-vc.roc | needs-review | 95 | http://localhost:4102/ | 0 | 1 | 5 | docs/design/rendered-fleet-certification/khashi-vc-roc-desktop.png<br>docs/design/rendered-fleet-certification/khashi-vc-roc-mobile.png |
| media-engine.ops | blocked | 79 | http://localhost:4200/ | 1 | 1 | 3 | docs/design/rendered-fleet-certification/media-engine-ops-desktop.png<br>docs/design/rendered-fleet-certification/media-engine-ops-mobile.png |
| media-business-operations.main | blocked | 84 | http://localhost:5176/dashboard/react/ | 1 | 0 | 5 | docs/design/rendered-fleet-certification/media-business-operations-main-desktop.png<br>docs/design/rendered-fleet-certification/media-business-operations-main-mobile.png |
| business-mapper.workspace | certified | 100 | http://localhost:8765/dashboard | 0 | 0 | 2 | docs/design/rendered-fleet-certification/business-mapper-workspace-desktop.png<br>docs/design/rendered-fleet-certification/business-mapper-workspace-mobile.png |
| meal-assistant.main | unreachable | 0 | unreachable | 1 | 0 | 0 | none |
| rinseables-os.main | certified | 100 | http://localhost:4320/dashboard | 0 | 0 | 3 | docs/design/rendered-fleet-certification/rinseables-os-main-desktop.png<br>docs/design/rendered-fleet-certification/rinseables-os-main-mobile.png |
| investing-system.roc | certified | 100 | http://localhost:3102/roc | 0 | 0 | 2 | docs/design/rendered-fleet-certification/investing-system-roc-desktop.png<br>docs/design/rendered-fleet-certification/investing-system-roc-mobile.png |
| hermes.workspace | unreachable | 0 | unreachable | 1 | 0 | 0 | none |
| tlc-capital-group-os.main | certified | 100 | http://localhost:3001/ | 0 | 0 | 3 | docs/design/rendered-fleet-certification/tlc-capital-group-os-main-desktop.png<br>docs/design/rendered-fleet-certification/tlc-capital-group-os-main-mobile.png |

## Nous Hermes Agent

Verdict: **blocked**  
Score: 74  
URL: http://127.0.0.1:5173/dashboard-kit-gallery

### Blockers
- BLOCKER layout.sidebarGeometryInvalid (desktop): Desktop sidebar/nav geometry does not look like a rail, sidebar, or approved top command bar.

### Warnings
- WARNING layout.excessNestedScroll (desktop): 14 visible scroll containers were detected; dashboard shells should avoid nested scrollbars unless explicitly approved.
- WARNING layout.excessNestedScroll (mobile): 17 visible scroll containers were detected; dashboard shells should avoid nested scrollbars unless explicitly approved.

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://127.0.0.1:5174/dashboard-kit-gallery | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5174/dashboard-kit-gallery Call log: [2m  - navigating to "http://127.0.0.1:5174/dashboard-kit-gallery", waiting until " |
| http://localhost:5174/dashboard-kit-gallery | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/dashboard-kit-gallery Call log: [2m  - navigating to "http://localhost:5174/dashboard-kit-gallery", waiting until " |
| http://127.0.0.1:5173/dashboard-kit-gallery | 200 | 1439 | 944 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-desktop.png; shell=1; sidebar=1; cards=37; localCards=0; overflowX=0; controls=253; sidebarControls=0
- mobile: docs/design/rendered-fleet-certification/nous-hermes-agent-dashboard-mobile.png; shell=1; sidebar=1; cards=37; localCards=0; overflowX=0; controls=254; sidebarControls=0

### Component Coverage
- desktop: missing=proof; visible=DashboardQueryBoundary=1, hdk-card=33, hdk-section=11, hdk-section-grid=2, hdk-gallery-actual-demo=10, ComponentQualityMaturityGraph=1, hdk-card__header=16, hdk-eyebrow=2, hdk-status-badge=2, hdk-quality-graph__rows=1, hdk-quality-row=9, hdk-quality-row__bar=9, DashboardShell=1, Sidebar=1, hdk-brand=1, hdk-sidebar-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-group=1, hdk-nav-group-title=1, hdk-sidebar-footer=1, hdk-sidebar-status=1, hdk-main=1, Header=1, StateChecklist=1, hdk-state-row=3, hdk-tone-neutral=5, PremiumComparisonChart=3, hdk-card__header-row=6, hdk-section-kicker=9, TimeWindowSelector=3, hdk-chart-toolbar=3, hdk-chart-legend=3, hdk-chart-legend-item=8, BarChart=1, DonutChart=1, hdk-donut-layout=1, hdk-legend=1, hdk-swatch=3, hdk-fill-0=1, hdk-fill-1=1, hdk-fill-2=1, hdk-form=1, hdk-form-control=1, DataTable=3, TableSurface=2, hdk-table=2, Pagination=2, PremiumDrilldownWorkspace=1, hdk-premium-drilldown__context=1, hdk-premium-drilldown__drawer=1, hdk-fact-grid=2, hdk-panel-actions=3, PremiumMarketBrowser=1, hdk-premium-market-browser__categories=1, hdk-browser-category=5, hdk-premium-market-browser__tape=1, hdk-market-tape-body=1, hdk-market-tape-row=3, hdk-market-title=3, hdk-market-meta=3, hdk-positive=2, hdk-negative=1, hdk-premium-market-browser__detail=1, hdk-mini-metrics=2, PremiumMediaApprovalWorkspace=1, hdk-premium-media-workspace__grid=1, hdk-package-preview=1, hdk-premium-media-workspace__preview=1, hdk-thumbnail-placeholder=1, hdk-package-assets=1, hdk-premium-media-workspace__copy=1, hdk-premium-media-workspace__channels=1, hdk-postability=3, hdk-tone-success=2, hdk-tone-warning=1, hdk-premium-media-workspace__checklist=1, hdk-state-line=4, PremiumPlannerCalendar=1, hdk-premium-planner__calendar=1, hdk-calendar-weekdays=1, hdk-calendar-month-grid=1, hdk-calendar-day=35, hdk-premium-planner__drawer=1, GovernanceChecklist=1, hdk-panel-metrics=1, hdk-operational-list=1, hdk-operational-row=3, hdk-tone-danger=1
- mobile: missing=proof; visible=DashboardQueryBoundary=1, hdk-card=33, hdk-section=11, hdk-section-grid=2, hdk-gallery-actual-demo=10, ComponentQualityMaturityGraph=1, hdk-card__header=16, hdk-eyebrow=2, hdk-status-badge=2, hdk-quality-graph__rows=1, hdk-quality-row=9, hdk-quality-row__bar=9, DashboardShell=1, Sidebar=1, hdk-brand=1, hdk-sidebar-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-group=1, hdk-nav-group-title=1, hdk-sidebar-footer=1, hdk-sidebar-status=1, hdk-main=1, Header=1, StateChecklist=1, hdk-state-row=3, hdk-tone-neutral=5, PremiumComparisonChart=3, hdk-card__header-row=6, hdk-section-kicker=9, TimeWindowSelector=3, hdk-chart-toolbar=3, hdk-chart-legend=3, hdk-chart-legend-item=8, BarChart=1, DonutChart=1, hdk-donut-layout=1, hdk-legend=1, hdk-swatch=3, hdk-fill-0=1, hdk-fill-1=1, hdk-fill-2=1, hdk-form=1, hdk-form-control=1, DataTable=3, TableSurface=2, hdk-table=2, Pagination=2, PremiumDrilldownWorkspace=1, hdk-premium-drilldown__context=1, hdk-premium-drilldown__drawer=1, hdk-fact-grid=2, hdk-panel-actions=3, PremiumMarketBrowser=1, hdk-premium-market-browser__categories=1, hdk-browser-category=5, hdk-premium-market-browser__tape=1, hdk-market-tape-body=1, hdk-market-tape-row=3, hdk-market-title=3, hdk-market-meta=3, hdk-positive=2, hdk-negative=1, hdk-premium-market-browser__detail=1, hdk-mini-metrics=2, PremiumMediaApprovalWorkspace=1, hdk-premium-media-workspace__grid=1, hdk-package-preview=1, hdk-premium-media-workspace__preview=1, hdk-thumbnail-placeholder=1, hdk-package-assets=1, hdk-premium-media-workspace__copy=1, hdk-premium-media-workspace__channels=1, hdk-postability=3, hdk-tone-success=2, hdk-tone-warning=1, hdk-premium-media-workspace__checklist=1, hdk-state-line=4, PremiumPlannerCalendar=1, hdk-premium-planner__calendar=1, hdk-calendar-weekdays=1, hdk-calendar-month-grid=1, hdk-calendar-day=35, hdk-premium-planner__drawer=1, GovernanceChecklist=1, hdk-panel-metrics=1, hdk-operational-list=1, hdk-operational-row=3, hdk-tone-danger=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| /dashboard-kit-gallery | yes | no | no | route.notDashboardLike |
| / | yes | no | no | route.notDashboardLike |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Khashi VC ROC

Verdict: **needs-review**  
Score: 95  
URL: http://localhost:4102/

### Blockers
- None

### Warnings
- WARNING layout.excessNestedScroll (mobile): 6 visible scroll containers were detected; dashboard shells should avoid nested scrollbars unless explicitly approved.

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:4102/ | 200 | 619 | 98 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/khashi-vc-roc-desktop.png; shell=2; sidebar=1; cards=32; localCards=32; overflowX=0; controls=60; sidebarControls=8
- mobile: docs/design/rendered-fleet-certification/khashi-vc-roc-mobile.png; shell=2; sidebar=1; cards=32; localCards=32; overflowX=0; controls=60; sidebarControls=8

### Component Coverage
- desktop: missing=proof; visible=hdk-body=1, DashboardShell=2, Sidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-brand__title=1, hdk-brand__subtitle=1, hdk-nav-item=8, hdk-nav-label=8, hdk-main=1, Header=1, hdk-eyebrow=4, hdk-button=2, TimeWindowControl=1, ReactIsland=1, MarketGenomeLayer=1, MissionControlOperatingSnapshot=1, DecisionStateCard=4, MissionControlBrief=1, StatePanel=3, StreamObservabilityPanel=1, MetricCard=29, hdk-metric__label=22, hdk-metric__value=22, hdk-metric__detail=22, HotMarketTable=1, DataTable=3, Pagination=3, ChartPanel=12, WindowComparison=3, RetentionPruningIntelligence=1, MetricCardGroup=1, TabbedWorkspace=1, ActionQueue=1
- mobile: missing=proof; visible=hdk-body=1, DashboardShell=2, Sidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-nav-item=8, hdk-main=1, Header=1, hdk-eyebrow=4, hdk-button=2, TimeWindowControl=1, ReactIsland=1, MarketGenomeLayer=1, MissionControlOperatingSnapshot=1, DecisionStateCard=4, MissionControlBrief=1, StatePanel=3, StreamObservabilityPanel=1, MetricCard=29, hdk-metric__label=22, hdk-metric__value=22, hdk-metric__detail=22, HotMarketTable=1, DataTable=3, Pagination=3, ChartPanel=12, WindowComparison=3, RetentionPruningIntelligence=1, MetricCardGroup=1, TabbedWorkspace=1, ActionQueue=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| / | yes | yes | no | none |
| /dashboard/proof?view=mission-control | yes | no | no | route.notDashboardLike |
| /dashboard/proof?view=market-intelligence | yes | no | no | route.notDashboardLike |
| /dashboard/proof?view=collection-capacity | yes | no | no | route.notDashboardLike |
| /dashboard/proof?view=live-market-intelligence | yes | no | no | route.notDashboardLike |

## Media Engine Ops

Verdict: **blocked**  
Score: 79  
URL: http://localhost:4200/

### Blockers
- BLOCKER layout.mainBelowFold (mobile): Primary dashboard content starts too far below the first viewport.

### Warnings
- WARNING layout.excessNestedScroll (mobile): 5 visible scroll containers were detected; dashboard shells should avoid nested scrollbars unless explicitly approved.

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:4200/ | 200 | 7903 | 4867 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/media-engine-ops-desktop.png; shell=1; sidebar=1; cards=28; localCards=0; overflowX=0; controls=40; sidebarControls=28
- mobile: docs/design/rendered-fleet-certification/media-engine-ops-mobile.png; shell=1; sidebar=1; cards=28; localCards=0; overflowX=0; controls=40; sidebarControls=28

### Component Coverage
- desktop: missing=none; visible=hdk-body=1, DashboardShell=1, Sidebar=1, hdk-brand=1, hdk-sidebar-brand=1, hdk-brand__mark=1, hdk-sidebar-toggle=1, hdk-nav=1, hdk-nav-group=1, hdk-nav-group-title=1, hdk-nav-item=9, hdk-nav-item__icon=9, hdk-nav-item__copy=9, hdk-sidebar-footer=1, hdk-card=16, hdk-button=18, hdk-main=1, hdk-page-frame=1, hdk-section-stack=1, hdk-view-surface=1, DashboardHeader=1, hdk-command-header-main=1, hdk-command-header-eyebrow=1, hdk-command-header-title=1, HelpTip=1, hdk-help__trigger=1, hdk-command-header-description=1, hdk-pill=5, hdk-metric-grid=1, MetricCard=4, DataTable=3, hdk-card__header=4, TableSurface=3, hdk-table=3, Pagination=3, EntitySummaryGrid=1, EntitySummaryCard=3, hdk-entity-card__header=3, hdk-status-unknown=3, hdk-muted=3, hdk-fact-grid=4, StateChecklist=1, hdk-state-row=3, hdk-tone-success=9, Tier3ProofSurface=1, ProofStrip=1, hdk-proof=4, hdk-tone-info=1, DataFreshnessStrip=1, hdk-freshness=4, hdk-state-ready=3, hdk-state-partial=1, hdk-tone-warning=1, Tier3StateLab=1, hdk-kicker=1, DashboardLoadingShell=1, hdk-loading-shell__header=1, hdk-loading-shell__spinner=1, hdk-loading-shell__body=1, SkeletonDashboardGrid=1, SkeletonMetricCard=3, SkeletonChart=1, SkeletonTable=1, StatePanel=2, DashboardQueryBoundary=3, hdk-stale-inline=1, PartialDataBanner=1, Drawer=1, hdk-eyebrow=1, hdk-drawer-section=1
- mobile: missing=none; visible=hdk-body=1, DashboardShell=1, Sidebar=1, hdk-brand=1, hdk-sidebar-brand=1, hdk-brand__mark=1, hdk-sidebar-toggle=1, hdk-nav=1, hdk-nav-group=1, hdk-nav-group-title=1, hdk-nav-item=9, hdk-nav-item__icon=9, hdk-nav-item__copy=9, hdk-sidebar-footer=1, hdk-card=16, hdk-button=18, hdk-main=1, hdk-page-frame=1, hdk-section-stack=1, hdk-view-surface=1, DashboardHeader=1, hdk-command-header-main=1, hdk-command-header-eyebrow=1, hdk-command-header-title=1, HelpTip=1, hdk-help__trigger=1, hdk-command-header-description=1, hdk-pill=5, hdk-metric-grid=1, MetricCard=4, DataTable=3, hdk-card__header=4, TableSurface=3, hdk-table=3, Pagination=3, EntitySummaryGrid=1, EntitySummaryCard=3, hdk-entity-card__header=3, hdk-status-unknown=3, hdk-muted=3, hdk-fact-grid=4, StateChecklist=1, hdk-state-row=3, hdk-tone-success=9, Tier3ProofSurface=1, ProofStrip=1, hdk-proof=4, hdk-tone-info=1, DataFreshnessStrip=1, hdk-freshness=4, hdk-state-ready=3, hdk-state-partial=1, hdk-tone-warning=1, Tier3StateLab=1, hdk-kicker=1, DashboardLoadingShell=1, hdk-loading-shell__header=1, hdk-loading-shell__spinner=1, hdk-loading-shell__body=1, SkeletonDashboardGrid=1, SkeletonMetricCard=3, SkeletonChart=1, SkeletonTable=1, StatePanel=2, DashboardQueryBoundary=3, hdk-stale-inline=1, PartialDataBanner=1, Drawer=1, hdk-eyebrow=1, hdk-drawer-section=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| / | yes | yes | no | none |
| /dashboard | yes | yes | no | none |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Media Business Operations

Verdict: **blocked**  
Score: 84  
URL: http://localhost:5176/dashboard/react/

### Blockers
- BLOCKER layout.sidebarGeometryInvalid (desktop): Desktop sidebar/nav geometry does not look like a rail, sidebar, or approved top command bar.

### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:5176/dashboard/react/ | 200 | 497 | 122 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/media-business-operations-main-desktop.png; shell=1; sidebar=1; cards=1; localCards=0; overflowX=0; controls=17; sidebarControls=11
- mobile: docs/design/rendered-fleet-certification/media-business-operations-main-mobile.png; shell=1; sidebar=1; cards=1; localCards=0; overflowX=0; controls=17; sidebarControls=11

### Component Coverage
- desktop: missing=charts, proof; visible=hdk-body=1, hdk-theme-light=1, DashboardShell=1, DashboardSidebar=1, hdk-sidebar-title=3, hdk-nav-item=10, hdk-sidebar-note=1, hdk-main=1, hdk-page-frame=1, DashboardHeader=1, hdk-button=6, DataFreshnessStrip=1, hdk-freshness=4, hdk-state-ready=3, hdk-state-neutral=1, StatePanel=1
- mobile: missing=charts, proof; visible=hdk-body=1, hdk-theme-light=1, DashboardShell=1, DashboardSidebar=1, hdk-sidebar-title=3, hdk-nav-item=10, hdk-sidebar-note=1, hdk-main=1, hdk-page-frame=1, DashboardHeader=1, hdk-button=6, DataFreshnessStrip=1, hdk-freshness=4, hdk-state-ready=3, hdk-state-neutral=1, StatePanel=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| /dashboard/react/ | yes | yes | no | none |
| /dashboard/react/research-desk | yes | yes | no | none |
| /dashboard | yes | no | no | route.notDashboardLike |
| /research-desk | yes | no | no | route.notDashboardLike |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Business Mapper Workspace

Verdict: **certified**  
Score: 100  
URL: http://localhost:8765/dashboard

### Blockers
- None

### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:8765/dashboard | 200 | 4293 | 428 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/business-mapper-workspace-desktop.png; shell=1; sidebar=1; cards=48; localCards=14; overflowX=0; controls=68; sidebarControls=8
- mobile: docs/design/rendered-fleet-certification/business-mapper-workspace-mobile.png; shell=1; sidebar=1; cards=48; localCards=14; overflowX=0; controls=62; sidebarControls=7

### Component Coverage
- desktop: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-loading=2, hdk-nav-item=7, hdk-form-control=11, hdk-form=4, hdk-button=30, hdk-sidebar-footer=1, hdk-main=1, hdk-overflow-guard=1, DashboardHeader=1, hdk-metric-grid=1, hdk-card=48, hdk-kpi-value=4, hdk-kpi-label=4, DataFreshnessStrip=1, StaleDataBadge=1, hdk-section-grid=7, ReviewCenter=2, hdk-card-header=12, hdk-pill=14, hdk-section=5, WorkspaceGraph=2, ValidationQueue=4, hdk-empty=5, RoadmapBoard=2, AdvisoryPanel=2, DeliverablesPanel=2
- mobile: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-nav-item=7, hdk-main=1, hdk-overflow-guard=1, DashboardHeader=1, hdk-loading=1, hdk-button=29, hdk-metric-grid=1, hdk-card=48, hdk-kpi-value=4, hdk-kpi-label=4, DataFreshnessStrip=1, StaleDataBadge=1, hdk-section-grid=7, ReviewCenter=2, hdk-card-header=12, hdk-pill=14, hdk-section=5, WorkspaceGraph=2, hdk-form=3, hdk-form-control=6, ValidationQueue=4, hdk-empty=5, RoadmapBoard=2, AdvisoryPanel=2, DeliverablesPanel=2

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| /dashboard | yes | yes | no | none |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Meal Assistant

Verdict: **unreachable**  
Score: 0  
URL: unreachable

### Blockers
- BLOCKER route.unreachable: No local candidate URL loaded successfully. Attempts: http://localhost:4184/dashboard/proof => page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/dashboard/proof
Call log:
[2m  - navigating to "http://localhost:4184/dashboard/proof", waiting until "domcontentloaded"[22m
; http://127.0.0.1:4184/dashboard/proof => page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4184/dashboard/proof
Call log:
[2m  - navigating to "http://127.0.0.1:4184/dashboard/proof", waiting until "domcontentloaded"[22m
; http://localhost:4184/ => page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/
Call log:
[2m  - navigating to "http://localhost:4184/", waiting until "domcontentloaded"[22m
; http://127.0.0.1:4184/ => page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4184/
Call log:
[2m  - navigating to "http://127.0.0.1:4184/", waiting until "domcontentloaded"[22m
; http://localhost:4184/login => page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/login
Call log:
[2m  - navigating to "http://localhost:4184/login", waiting until "domcontentloaded"[22m


### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:4184/dashboard/proof | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/dashboard/proof Call log: [2m  - navigating to "http://localhost:4184/dashboard/proof", waiting until "domcontentlo |
| http://127.0.0.1:4184/dashboard/proof | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4184/dashboard/proof Call log: [2m  - navigating to "http://127.0.0.1:4184/dashboard/proof", waiting until "domcontentlo |
| http://localhost:4184/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/ Call log: [2m  - navigating to "http://localhost:4184/", waiting until "domcontentloaded"[22m  |
| http://127.0.0.1:4184/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4184/ Call log: [2m  - navigating to "http://127.0.0.1:4184/", waiting until "domcontentloaded"[22m  |
| http://localhost:4184/login | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4184/login Call log: [2m  - navigating to "http://localhost:4184/login", waiting until "domcontentloaded"[22m  |

### Captures
- None

### Component Coverage
- None

### Route Inventory
No route inventory captured.

## Rinseables OS

Verdict: **certified**  
Score: 100  
URL: http://localhost:4320/dashboard

### Blockers
- None

### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:4320/dashboard | 200 | 599 | 59 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/rinseables-os-main-desktop.png; shell=1; sidebar=1; cards=2; localCards=0; overflowX=0; controls=13; sidebarControls=10
- mobile: docs/design/rendered-fleet-certification/rinseables-os-main-mobile.png; shell=1; sidebar=1; cards=2; localCards=0; overflowX=0; controls=13; sidebarControls=10

### Component Coverage
- desktop: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-group=2, hdk-nav-group-title=2, hdk-nav-item=10, hdk-sidebar-footer=1, hdk-main=1, hdk-page-frame=1, hdk-section-stack=1, DashboardHeader=1, hdk-form-control=2, hdk-button=1, hdk-form=1, DataFreshnessStrip=1, hdk-card=1, hdk-section=1
- mobile: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-item=10, hdk-main=1, hdk-page-frame=1, hdk-section-stack=1, DashboardHeader=1, hdk-form-control=2, hdk-button=1, hdk-form=1, DataFreshnessStrip=1, hdk-card=1, hdk-section=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| /dashboard | yes | yes | no | none |
| / | yes | yes | no | none |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Investing System ROC

Verdict: **certified**  
Score: 100  
URL: http://localhost:3102/roc

### Blockers
- None

### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:3102/roc | 200 | 706 | 1284 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/investing-system-roc-desktop.png; shell=1; sidebar=1; cards=8; localCards=8; overflowX=0; controls=19; sidebarControls=7
- mobile: docs/design/rendered-fleet-certification/investing-system-roc-mobile.png; shell=1; sidebar=1; cards=8; localCards=8; overflowX=0; controls=19; sidebarControls=7

### Component Coverage
- desktop: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-main=1, hdk-page-frame=1, hdk-page-frame--wide=1, hdk-section-stack=5, DataFreshnessStrip=1, DashboardSessionControl=1, hdk-session-status=1, hdk-form-control=3, hdk-session-field=1, hdk-card=8, hdk-section=5, DataTable=3, hdk-form=1
- mobile: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-main=1, hdk-page-frame=1, hdk-page-frame--wide=1, hdk-section-stack=5, DataFreshnessStrip=1, DashboardSessionControl=1, hdk-session-status=1, hdk-form-control=3, hdk-session-field=1, hdk-card=8, hdk-section=5, DataTable=3, hdk-form=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| /roc | yes | yes | no | none |
| /dashboard/proof | yes | no | no | route.notDashboardLike |

## Hermes Workspace

Verdict: **unreachable**  
Score: 0  
URL: unreachable

### Blockers
- BLOCKER route.unreachable: No local candidate URL loaded successfully. Attempts: http://localhost:3920/ => page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3920/
Call log:
[2m  - navigating to "http://localhost:3920/", waiting until "domcontentloaded"[22m
; http://127.0.0.1:3920/ => page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3920/
Call log:
[2m  - navigating to "http://127.0.0.1:3920/", waiting until "domcontentloaded"[22m
; http://localhost:3921/ => page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3921/
Call log:
[2m  - navigating to "http://localhost:3921/", waiting until "domcontentloaded"[22m
; http://127.0.0.1:3921/ => page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3921/
Call log:
[2m  - navigating to "http://127.0.0.1:3921/", waiting until "domcontentloaded"[22m


### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:3920/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3920/ Call log: [2m  - navigating to "http://localhost:3920/", waiting until "domcontentloaded"[22m  |
| http://127.0.0.1:3920/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3920/ Call log: [2m  - navigating to "http://127.0.0.1:3920/", waiting until "domcontentloaded"[22m  |
| http://localhost:3921/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3921/ Call log: [2m  - navigating to "http://localhost:3921/", waiting until "domcontentloaded"[22m  |
| http://127.0.0.1:3921/ | n/a | 0 | 0 | page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3921/ Call log: [2m  - navigating to "http://127.0.0.1:3921/", waiting until "domcontentloaded"[22m  |

### Captures
- None

### Component Coverage
- None

### Route Inventory
No route inventory captured.

## TLC Capital Group OS

Verdict: **certified**  
Score: 100  
URL: http://localhost:3001/

### Blockers
- None

### Warnings
- None

### Candidate Attempts
| Candidate | Status | Text | Elements | Error |
| --- | --- | --- | --- | --- |
| http://localhost:3001/ | 200 | 3180 | 339 | none |

### Captures
- desktop: docs/design/rendered-fleet-certification/tlc-capital-group-os-main-desktop.png; shell=1; sidebar=1; cards=3; localCards=3; overflowX=0; controls=51; sidebarControls=16
- mobile: docs/design/rendered-fleet-certification/tlc-capital-group-os-main-mobile.png; shell=1; sidebar=1; cards=3; localCards=3; overflowX=0; controls=51; sidebarControls=16

### Component Coverage
- desktop: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-group=4, hdk-nav-group-title=4, hdk-nav-item=16, hdk-sidebar-footer=1, hdk-main=1, hdk-page-frame=1, hdk-section-stack=2, DashboardHeader=1, hdk-form-control=27, hdk-button=8, hdk-card=3, hdk-section=3, hdk-card-header=2, hdk-form=7, DataFreshnessStrip=1
- mobile: missing=charts, proof; visible=hdk-body=1, DashboardQueryBoundary=1, DashboardSidebar=1, hdk-brand=1, hdk-brand__mark=1, hdk-nav=1, hdk-nav-item=16, hdk-main=1, hdk-page-frame=1, hdk-section-stack=2, DashboardHeader=1, hdk-form-control=27, hdk-button=8, hdk-card=3, hdk-section=3, hdk-card-header=2, hdk-form=7, DataFreshnessStrip=1

### Route Inventory
| Path | Reachable | Dashboard-like | Auth wall | Issues |
| --- | --- | --- | --- | --- |
| / | yes | yes | no | none |
| /dashboard | yes | yes | no | none |
| /dashboard/proof | yes | no | no | route.notDashboardLike |
