# Dashboard Design Intelligence Registry

Generated: 2026-08-14T22:49:31.954Z

Purpose: Make visual quality enforce screen intent, experience blueprints, taste memory, reference matching, workflow proof, production UX monitoring, and auto-promotion across the dashboard fleet.

## Promotion Policy

| Gate | Required |
| --- | --- |
| tier3RequiresIntent | yes |
| tier3RequiresBlueprint | yes |
| tier3RequiresPageRegistration | yes |
| tier3RequiresSpacingContract | yes |
| tier3RequiresCardDensityContract | yes |
| tier3RequiresTableContainmentContract | yes |
| tier3RequiresWorkflowProof | yes |
| tier3RequiresScreenshotReview | yes |
| tier3RequiresHumanDecision | yes |
| tier4RequiresReusablePatternPromotion | yes |

## Screen Intents

| Intent | Density | Primary question | Required blueprints |
| --- | --- | --- | --- |
| Command cockpit | standard | What needs attention now? | command-center, proof-strip, priority-queue |
| Planner workspace | comfortable | What is being planned, for whom, and what happens next? | calendar-planner, right-drawer-workflow, checklist-export |
| Research workspace | comfortable | What is the project, what evidence exists, and what decision is next? | project-navigator, evidence-board, inspector-drawer |
| Approval queue | standard | What is waiting for review and what can be approved, revised, or declined? | review-queue, state-tabs, decision-buttons |
| Market browser | standard | Which market/category should be inspected and why? | category-browser, detail-drawer, live-chart-panel |
| Trading terminal | compact | What is the instrument state, strategy signal, risk state, and execution state? | terminal-chart, watchlist-rail, order-ticket, risk-panel |
| OKR/KPI cockpit | standard | Are objectives on track, what changed, and who owns the next action? | objective-tree, key-result-scorecard, task-attribution |

## Blueprints

| Blueprint | Intent | Required sections | Components | Proof |
| --- | --- | --- | --- | --- |
| command-center | command-cockpit | decision summary, priority queue, proof/freshness, current blockers | DashboardShell, MetricCard, ActionQueue, ProofStrip, DataFreshnessStrip | desktop screenshot, collapsed-sidebar screenshot, priority action click proof, stale/error state proof |
| calendar-planner | planner-workspace | month grid, selection state, right drawer, library/search, export checklist | MealPlannerCalendar, MealWeekDrawer, MealLibrary, ShoppingListExportPanel | month screenshot, drawer-open screenshot, multi-select proof, save/reload proof |
| research-desk | research-workspace | project navigator, active project brief, evidence board, workflow actions, inspector | ResearchDeskWorkspace, DrilldownPanel, DataTable, AlertQueue | new project proof, resume project proof, evidence review proof, workflow save proof |
| review-queue | approval-queue | queue status, tabs, full-width table, decision controls, posting/result status | ContentPackageWorkspace, DataTable, TimeWindowSelector, StatePanel | approval screenshot, decline reason proof, pagination proof, post result proof |
| market-browser | market-browser | category rail, market list, live chart/detail, freshness/stale state, pagination | PremiumMarketBrowser, DataTable, LineChart, Drawer, ProofStrip | category navigation proof, market selection proof, real-data chart proof, insufficient-data state proof |
| trading-terminal | trading-terminal | instrument toolbar, primary chart, watchlist, order ticket, risk/signal sidecar, positions | CandlestickChart, TradingTerminal, ActionQueue, ProofStrip, DataTable | chart screenshot, indicator toggle proof, paper-order rehearsal proof, risk gate proof |

## Maturity Layers

| # | Layer | Status | Purpose | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | design-intent-engine | active | Infer screen intent before judging layout. | Every primary route declares intent, density, primary question, and forbidden patterns. |
| 2 | experience-blueprints | active | Use canonical page/workflow blueprints instead of one-off route structures. | Each Tier 3 route maps to an approved blueprint. |
| 3 | component-recommendation-system | active | Recommend required kit components and missing component families for a route. | Migration packets list required/missing components before build. |
| 4 | design-memory | active | Persist approved and rejected user design preferences. | Preference memory is loaded by review packets and validation. |
| 5 | taste-calibration-loop | active | Turn screenshot approvals/rejections into future acceptance criteria. | Every material redesign records feedback as repeat/block rules. |
| 6 | screenshot-aware-review | active | Review rendered screenshots, not only DOM/source markers. | Screenshots are required before visual promotion. |
| 7 | reference-matching | active | Map route intent to Mobbin/reference families automatically. | Blueprints cite reference families and extraction notes. |
| 8 | visual-diff-intelligence | active | Summarize visual changes and regressions between captures. | Review packets include before/after delta notes. |
| 9 | design-system-ci-blockers | active | Block promotion when visual intelligence requirements are missing. | Validation fails when Tier 3 routes lack intent/blueprint/proof. |
| 10 | production-ux-monitoring | active | Track slow loads, stale states, dead clicks, and proof freshness. | Production UX metrics feed scorecards and stale queues. |
| 11 | design-debt-autopatcher | defined | Generate concrete safe patches for known visual debt. | Next-action reports include patchable selectors and component replacements. |
| 12 | cross-project-pattern-reuse | defined | Propagate a fixed pattern to similar routes in other projects. | Reusable learnings are promoted into dashboard kit then fleet packets. |
| 13 | product-workflow-proof | defined | Prove the route supports its core task end to end. | Primary workflows have executable proof scripts or explicit manual proof. |
| 14 | design-to-data-contract | defined | Tie visual components to required data shapes and states. | Components declare data contracts, freshness, empty, partial, and error states. |
| 15 | operator-outcome-metrics | defined | Judge dashboards by decision speed, trust, recovery, and workflow completion. | Scorecards include outcome metrics beyond visual pass/fail. |
| 16 | auto-tier-promotion | defined | Promote only when technical, visual, workflow, production, and human gates pass. | Tier approval command consumes all required evidence. |
| 17 | design-system-release-train | defined | Version design-system standards and migration requirements. | Kit releases include affected projects and adoption deadlines. |
| 18 | project-creation-gate | defined | Prevent new dashboards from starting without blueprint, data, and proof contracts. | Starter generator requires intent, target tier, and proof route. |
| 19 | autonomous-fleet-refactor-loop | defined | Scan fleet, rank safe patches, and produce deployable migration packets. | Fleet backlog ranks redesign debt by severity and expected score gain. |
| 20 | human-taste-console | defined | Expose screenshots, approvals, rejections, and preferences in a review UI. | Dashboard Kit Gallery shows queue, memory, rubric, blueprints, and decisions. |

## Route Intent Map

| Route | Intent | Blueprint | Density | Target |
| --- | --- | --- | --- | --- |
| meal-assistant.main | planner-workspace | calendar-planner | comfortable | V3 |
| media-engine.ops | approval-queue | review-queue | standard | V3 |
| media-business-operations.main | research-workspace | research-desk | comfortable | V3 |
| khashi-vc.roc | market-browser | market-browser | standard | V3 |
| investing-system.roc | trading-terminal | trading-terminal | compact | V3 |
| tlc-capital-group-os.main | okr-kpi-cockpit | command-center | standard | V3 |
| nous-hermes-agent.dashboard | command-cockpit | command-center | standard | V4 |
