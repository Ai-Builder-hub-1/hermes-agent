# Dashboard Product Quality Control Plane

Generated: 2026-08-14T23:24:16.208Z

Purpose: Coordinate autonomous product architecture, dependency mapping, component health, UX telemetry, regression root-cause, upgrade campaigns, reference-driven generation, persona modeling, workflow learning, experiments, acceptance criteria, quality ledger, self-healing repairs, and org-level design governance across the dashboard fleet.

## Policy

| Rule | Required |
| --- | --- |
| everyRouteRequiresControlPlaneSignals | yes |
| tier3RequiresQualityGatePass | yes |
| productionPromotionRequiresFreshProof | yes |
| componentChangesRequireBlastRadius | yes |
| safeAutopatchesRequireProofRerun | yes |
| userRejectedPatternsBecomeFleetMemory | yes |

## Capabilities

| Capability | Status | Purpose | Outputs |
| --- | --- | --- | --- |
| autonomous-product-architect | defined | Infer product surface type, operator workflow, required components, applicable standards, and proof needs before implementation starts. | recommended blueprint, required components, proof plan, known risks |
| design-system-dependency-graph | defined | Track how every route depends on components, tokens, charts, tables, data contracts, and proof routes. | blast radius, stale component usage, local override risk, upgrade order |
| component-health-scores | defined | Score shared components by proof coverage, usage, accessibility, interaction completeness, defects, and overrides. | component health, certification status, replacement candidates |
| real-user-ux-analytics | defined | Measure production operator behavior, failures, slow paths, and ignored UI regions. | abandonment signals, dead-click signals, slow-route signals, workflow friction |
| design-regression-root-cause | defined | Explain why a rendered UI regressed by linking screenshots to component, token, data, viewport, or shell changes. | probable cause, affected routes, safe fix candidates |
| automated-component-upgrade-campaigns | defined | Generate ordered project migrations when the dashboard kit adds better certified components. | migration campaign, project patch queue, proof checklist |
| cross-fleet-ux-benchmarking | defined | Compare similar surfaces across projects and promote the strongest implementation as the fleet reference. | best-of-fleet reference, reuse candidates, upgrade targets |
| reference-driven-generation | defined | Convert approved reference patterns into component anatomy, layout constraints, state coverage, and acceptance criteria. | layout anatomy, component variants, acceptance criteria |
| operator-persona-modeling | defined | Adjust dashboard density, defaults, copy, and proof by operator persona. | density decision, navigation priority, default state |
| workflow-outcome-learning | defined | Learn which UI patterns reduce decision time, dead clicks, and manual workarounds. | pattern effectiveness, recommended replacements, operator outcome score |
| design-experiment-framework | defined | Run governed UI experiments for layout, chart, table, sidebar, drawer, and copy variations. | experiment result, approved pattern, rejected pattern |
| acceptance-criteria-generator | active | Generate required visibility, interaction, data-state, screenshot, and workflow proof criteria for every dashboard change. | acceptance checklist, test commands, proof artifacts |
| product-quality-ledger | active | Persist what changed, why it changed, proof before/after, user feedback, regression risk, and follow-up obligations. | quality history, regression notes, follow-up queue |
| self-healing-ui-layer | defined | Automatically apply safe repairs for known issues like missing pagination, duplicate helper text, deprecated classes, and old sidebar patterns. | safe patch plan, applied fix, proof rerun |
| org-level-design-governance | active | Expose TLC-level ownership, exceptions, release gates, signoffs, and design-system roadmap across all products. | governance state, blocked promotions, release readiness |

## Fleet Routes

| Route | Domain | Intent | Target | Proof focus |
| --- | --- | --- | --- | --- |
| nous-hermes-agent.dashboard | control-plane | command-cockpit | V4 | own the fleet quality console and review state |
| media-engine.ops | media-operations | approval-queue | V3 | prove package generation, approval, rejection, and posting status |
| media-business-operations.main | media-business | research-workspace | V3 | prove project creation, evidence review, and story workflow |
| meal-assistant.main | household-planning | planner-workspace | V3 | prove month calendar, multi-day planning, drawer save, and checklist export |
| khashi-vc.roc | market-intelligence | market-browser | V3 | prove category browse, live chart data, stale states, and pagination |
| investing-system.roc | trading | trading-terminal | V3 | prove chart, indicators, paper execution, risk gate, and no live trade without promotion |
| tlc-capital-group-os.main | holding-company | okr-kpi-cockpit | V3 | prove OKR/KPI hierarchy, ownership, task attribution, and review cadence |
| business-mapper.workspace | mapping | research-workspace | V3 | prove graph workspace, validation queue, deliverables, and advisory flow |
| hermes-os.main | platform | command-cockpit | V3 | prove deployment, routing, health, and adoption governance |
| rinseables-os.main | commerce-ops | command-cockpit | V3 | prove operations cockpit and proof route |

## Gates

| Gate | Stage | Blocks | Checks |
| --- | --- | --- | --- |
| pre-build-quality-plan | before-build | yes | route intent selected, blueprint selected, required components listed, proof plan generated |
| implementation-quality-gate | during-build | yes | package-native components used, local overrides justified, data states implemented, workflow controls clickable |
| rendered-proof-gate | after-build | yes | screenshots captured, visual score meets target, overflow scan clean, sidebar states clean |
| production-quality-gate | after-deploy | yes | proof route fresh, production load healthy, runtime errors clean, workflow telemetry available |
| human-taste-gate | promotion | yes | approved or excepted review decision, rejections recorded, preference memory updated |
