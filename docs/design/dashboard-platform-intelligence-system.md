# Dashboard Platform Intelligence System

Generated: 2026-08-14T23:24:16.175Z

Purpose: Turn dashboard standards and product-quality checks into a portfolio-level product operating system that links business objectives, roadmap decisions, product architecture, proof, telemetry, learning, and release governance.

## Policy

| Rule | Required |
| --- | --- |
| everyDashboardRequiresProductPurpose | yes |
| everyDashboardRequiresBusinessObjectiveLinkage | yes |
| roadmapRequiresValueRiskEffortScore | yes |
| releasesRequireBusinessAndQualityGates | yes |
| productionTelemetryFeedsRoadmap | yes |
| humanReviewFeedsOrgMemory | yes |
| staleDashboardsEnterRefactorQueue | yes |

## Platform Layers

| # | Layer | Status | Purpose | Outputs |
| --- | --- | --- | --- | --- |
| 1 | product-strategy-intelligence | active | Understand what each dashboard exists to accomplish, which workflows matter, and what data proves business value. | product strategy brief, workflow priority, value proof contract |
| 2 | portfolio-product-map | active | Map every project, dashboard, workflow, data source, component dependency, maturity score, and business objective. | portfolio map, project dependency map, maturity map |
| 3 | autonomous-roadmap-builder | active | Propose roadmap work from business priority, maturity, debt, missing components, usage telemetry, revenue/risk impact, and feedback. | ranked roadmap, next-build candidates, blocked/deferred reasons |
| 4 | investment-roi-scoring | active | Score potential work by expected value, effort, risk, reuse potential, urgency, dependencies, and cost of delay. | ROI score, priority class, go/no-go rationale |
| 5 | business-objective-alignment | active | Connect dashboard work to TLC OKRs, business-unit OKRs, KPIs, bottlenecks, active projects, and task queues. | objective linkage, impact claim, ownership chain |
| 6 | adaptive-product-architecture | active | Detect when pages should merge, split, retire, change mode, or move into a new domain subkit. | architecture recommendation, migration path, retirement candidate |
| 7 | autonomous-task-generation | defined | Convert gaps into engineering, design, data-contract, QA, proof, documentation, and deployment tasks. | task set, owner suggestion, acceptance criteria |
| 8 | cross-functional-review-layer | defined | Run design, engineering, business, compliance/risk, data-quality, and operator-workflow reviews before promotion. | review decisions, approval state, exception record |
| 9 | production-learning-loop | defined | Feed production telemetry back into roadmap, component evolution, workflow redesign, OKR progress, and retirement decisions. | learning item, roadmap update, component feedback |
| 10 | autonomous-product-council | defined | Answer what should be built, fixed, retired, unblocked, or promoted next across the whole fleet. | council recommendation, fleet priority, blocked-project callout |
| 11 | scenario-planning | defined | Simulate migration cost, operator improvement, rollout risk, dependency conflict, and delay impact before build. | scenario comparison, risk/benefit note, recommended path |
| 12 | continuous-product-refactoring | defined | Continuously detect stale dashboards, low-use pages, failed workflows, redundant features, outdated components, and weak alignment. | refactor candidate, retire candidate, upgrade candidate |
| 13 | autonomous-release-governance | defined | Control releases through quality gates, business-value gates, risk gates, proof gates, rollback readiness, and post-release monitoring. | release decision, rollback plan, post-release proof |
| 14 | org-memory | defined | Persist why products exist, why decisions were made, which experiments worked, which patterns failed, and what the business values. | org memory item, future build rule, preference update |
| 15 | closed-loop-operating-system | defined | Connect business objective, product strategy, dashboard/workflow design, build, proof, deploy, telemetry, learning, and roadmap update. | closed-loop status, next operating cycle, maturity delta |

## Dashboard Coverage

| Dashboard | Project | Category | Next intelligence work |
| --- | --- | --- | --- |
| nous-hermes-agent.dashboard | Nous Hermes Agent | hermes-governance | Operate the product-quality console and closed-loop fleet roadmap. |
| khashi-vc.roc | Khashi VC | research-operations | Link research/market workflows to decision quality, evidence confidence, and experiment readiness. |
| media-engine.ops | Media Engine | media-operations | Link media workflow quality to publishing throughput, QA outcomes, and production learning. |
| media-business-operations.main | Media Business Operations | business-operations | Link workspace quality to evidence coverage, validation throughput, and deliverable completion. |
| business-mapper.workspace | Business Mapper | business-intelligence | Link workspace quality to evidence coverage, validation throughput, and deliverable completion. |
| meal-assistant.main | Meal Assistant | consumer-operations | Link planner/workflow completion to retention, fulfillment quality, and operator friction. |
| rinseables-os.main | Rinseables OS | consumer-operations | Link planner/workflow completion to retention, fulfillment quality, and operator friction. |
| investing-system.roc | Investing System | research-operations | Link research/market workflows to decision quality, evidence confidence, and experiment readiness. |
| hermes.workspace | Hermes Workspace | hermes-governance | Attach business objective, workflow proof, visual score, and production telemetry. |
| tlc-capital-group-os.main | TLC Capital Group OS | enterprise-operations | Link OKR/KPI outcomes to business-unit dashboards and owner task queues. |

## Strategy Workflows

| Workflow | Flow | Status |
| --- | --- | --- |
| objective-to-dashboard | business objective -> dashboard/workflow design -> component/data requirements -> proof | required |
| dashboard-to-roadmap | dashboard maturity + telemetry + debt -> ranked roadmap work | required |
| component-to-fleet | component health + usage + defects -> upgrade campaign | required |
| production-to-learning | production usage + failures + proof freshness -> learning item and standard update | required |
| review-to-memory | human approval/rejection -> design memory and future build rules | required |
| release-to-governance | release candidate -> gates -> deploy -> post-release proof | required |
