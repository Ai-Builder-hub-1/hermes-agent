# Hermes OS Handoff And Readiness Assessment

Last updated: 2026-07-25

Purpose: this is the primary handoff artifact for any future AI agent working on the Hermes/TLC operating system. Read this before making architecture, dashboard, automation, deployment, or multi-agent changes.

This document summarizes current state, target end state, gaps, technical debt, decisions, and the master build roadmap. It does not replace the detailed build plans. It points future agents to the right surfaces and prevents them from rebuilding or undoing intentional decisions.

## 0. How To Use This Handoff

Before starting work:

1. Confirm the active project is `nous-hermes-agent`.
2. Read this document.
3. Read the specific plan relevant to the requested work.
4. Check the dirty tree before editing.
5. Do not treat placeholder dashboards, static prototypes, or sample data as live production capability.
6. Do not add automation that spends money, deploys, modifies secrets, runs production tasks, or increases autonomy without explicit approval gates.

Primary supporting documents:

| Document | Purpose |
| --- | --- |
| `docs/hermes-os-system-explainer.md` | Architecture-first mental model and source-of-truth boundaries. |
| `docs/hermes-os-integration-plan.md` | Hermes OS and official Hermes Agent integration plan. |
| `docs/hermes-os-conversational-operating-layer-plan.md` | Chat-first Chief of Staff, workflow, memory, and delegation roadmap. |
| `docs/design/dashboard-information-architecture.md` | Six-workspace dashboard model. |
| `docs/design/hermes-dashboard-design-system-build-plan.md` | Dashboard design system build history. |
| `docs/design/v31-v40-executive-operating-system-build-plan.md` | Executive control-plane layer. |
| `docs/design/v41-v50-live-operations-build-plan.md` | Live operations layer. |
| `docs/design/v71-v80-operational-readiness-build-plan.md` | Current operational readiness checklist and production gaps. |
| `docs/design/capacity-command-center-plan.md` | Current cost/capacity cockpit direction. |

Primary cross-repo Hermes OS evidence:

| Project / Document | Purpose |
| --- | --- |
| `../hermes/docs/business-unit-readiness-plan.md` | Hermes OS technical control-plane readiness plan. |
| `../hermes/docs/central-command-build-plan.md` | Hermes technical central command plan and command-center boundary. |
| `../hermes/docs/federated-coceo-operating-contract.md` | Federated Human + AI CoCEO operating contract. |
| `../hermes/src/technical-control-plane/technical-control-plane-readiness.ts` | Machine-readable readiness report builder. |
| `../hermes/src/technical-command-center/technical-command-center.ts` | Technical command-center report builder. |
| `../hermes/deploy/hetzner/` | Hetzner deployment spine, scripts, and production hardening helpers. |

## 1. Executive Summary

### Vision

Hermes becomes the executive control plane for TLC Capital Group and its business units. It should let the operator manage strategy, build progress, production health, cost, risks, approvals, learning, and delegated work from one coherent operating layer.

### Mission

Hermes should answer:

- What is happening across TLC Capital Group?
- What changed since the last review?
- What needs a human decision?
- Which business units are healthy, blocked, expensive, or accelerating?
- What work is active, waiting, failed, or ready for review?
- What has the system learned?
- What should be built next?
- What should not be automated yet?

### End-State Architecture

```text
User / Human Co-CEO
  -> Hermes Control Plane
      -> Executive Briefing Room
      -> Business Unit Portfolio
      -> Operations Command
      -> Cost And Capacity
      -> Build And Product Roadmap
      -> Intelligence And Learning
      -> Governance And Risk
      -> Project Drilldowns
  -> Shared Source Of Truth
      -> Project Registry
      -> Task Queue
      -> Work Graphs
      -> Memory
      -> Artifacts
      -> Knowledge
      -> Decisions
      -> Approvals
      -> Telemetry
  -> Dispatcher
      -> Codex Cloud
      -> VPS Workers
      -> Local Mac Workers
      -> Review Agents
      -> Test Agents
      -> Research Agents
  -> Projects / Business Units
      -> TLC Capital Group OS
      -> Media Business OS
      -> Media Engine
      -> Khashi VC
      -> Rinseables OS
      -> Business Mapper
      -> Consulting
      -> Meal Planner
      -> Future ventures
```

### Current Maturity Level

Hermes is a strong architecture and dashboard control-plane foundation, but it is not yet a fully live, always-on, multi-agent operating company layer.

Current overall readiness estimate after accounting for the separate `projects/hermes` implementation and the completed local Nous executive command-center layer: **72%**.

The local command-center surface is now considered **100% complete for the current V1 operating scope** because the dashboard shell, executive briefing route, plan command center, reporting contracts, capacity cockpit prototype, readiness completion boundary, project feed registry, action-gate model, production evidence cards, and human integration checklist now exist. External integration readiness is estimated at **56%** because provider billing, live project feeds, production drill evidence, and always-on worker execution still depend on credentials, production access, or downstream project implementation.

This estimate is intentionally conservative because many surfaces are implemented as plans, contracts, static prototypes, local routes, validators, and sample runtime evidence. The major remaining gap is live production execution, automatic telemetry ingestion, durable artifacts, provider billing reconciliation, and true multi-agent task execution.

Important distinction:

- `projects/hermes` is relatively mature as a **local technical control plane / builder rail**.
- `projects/nous-hermes-agent` is the **operator interface, runtime adapter, dashboard kit, and conversational surface**.
- `projects/tlc-capital-group-os` should remain the **enterprise authority and portfolio/business-unit source of truth**.

Do not collapse these into one project. They converge through contracts and feeds.

### Top Priorities

1. Adopt the standard project feed contract inside every business unit and shared capability project.
2. Connect provider billing credentials and exports so the cost/capacity cockpit becomes actual spend telemetry.
3. Attach production evidence capture: screenshots, health checks, restore drills, server secret scans, and deploy proof.
4. Finish the always-on Hermes worker runtime, dispatch, merge coordination, and review enforcement.
5. Promote action gates from preparation-only into approved execution paths only after evidence capture and approval policy are reliable.

### Biggest Risks

| Risk | Impact | Current Mitigation | Remaining Need |
| --- | --- | --- | --- |
| Dashboard sprawl | Operators cannot tell what matters | Six-workspace IA exists | Executive Briefing Room and category-level pages need implementation. |
| Static surfaces mistaken for live capability | False confidence | Plans distinguish built surface from runtime gap | Dashboards must label freshness, source, confidence, and live/estimated status. |
| Multi-agent overbuild before queue/review rails | Work becomes untraceable | Governance docs exist | Implement dispatcher, artifact handoff, independent review, and merge coordinator. |
| Production access inconsistency | Agents cannot diagnose live issues | Shared rail concepts exist | Standard production map, outcome adapters, secret posture, and approved SSH execution. |
| Cost opacity | Paid providers can run up spend | Cost governor concepts exist | Provider usage imports, budget breakers, local Codex ledger, per-unit attribution. |
| Source-of-truth drift | Future agents undo decisions | Decision logs and docs exist | This handoff must remain updated after major changes. |

## 2. Target End State

Hermes should behave like a company operating system.

It should not be only:

- a chat bot
- a dashboard launcher
- a project registry
- a local script runner
- a collection of generated dashboards

It should be the layer that coordinates:

- executive summaries
- officer reports
- project plans
- readiness status
- work dispatch
- agent delegation
- production monitoring
- cost controls
- approvals
- evidence and artifacts
- learning loops
- risk boundaries

### Executive Reporting Hierarchy

The reporting model should be:

```text
TLC Executive Brief
  -> Business Unit Executive Reports
      -> Co-CEO Report
      -> CMO Report
      -> CTO / Operator Report
      -> CFO / Cost Report
      -> Research / Learning Report
      -> Product / Roadmap Report
  -> Evidence
      -> Metrics
      -> Logs
      -> Screenshots
      -> Incidents
      -> Runs
      -> Reports
      -> Decisions
```

The executive page should show summaries and allow drilldown. It should not display all raw data by default.

Every report should contain:

- narrative summary
- status
- wins
- blockers
- risks
- cost/capacity
- revenue/traction where available
- decisions needed
- recommended actions
- evidence links
- confidence/freshness

Proposed report contract:

```json
{
  "reportId": "media-engine-2026-07-25-morning",
  "businessUnit": "media-engine",
  "role": "cmo",
  "period": "24h",
  "status": "watch",
  "summary": "Audience growth is stable, but two platform connections are degraded.",
  "wins": [],
  "blockers": [],
  "risks": [],
  "metrics": {},
  "decisionsNeeded": [],
  "recommendedActions": [],
  "evidenceLinks": [],
  "confidence": 0.82,
  "generatedAt": "2026-07-25T09:00:00Z"
}
```

### Dashboard Hierarchy

Level 1: Executive Cockpit / Briefing Room

- TLC-wide status
- top attention items
- co-CEO/officer summary rollup
- decision queue
- cost/capacity posture
- risks and incidents
- readiness by business unit
- what changed since last review

Level 2: Category command pages

- Business Unit Portfolio
- Operations Command
- Cost And Capacity
- Build And Product Roadmap
- Intelligence And Learning
- Governance And Risk

Level 3: Business-unit drilldowns

- Media Business OS
- Media Engine
- Khashi VC
- Rinseables OS
- TLC Capital Group OS
- Nous Hermes Agent
- Business Mapper
- Consulting
- Meal Planner

Level 4: Raw logs, records, and evidence

- job logs
- screenshots
- telemetry records
- cost ledger rows
- incidents
- audit events
- run artifacts

## 3. Current State Assessment

| Area | Status | Complete | Risk | Notes |
| --- | --- | ---: | --- | --- |
| Architecture-first framework | Green | 85% | Low | Strong docs, contracts, CLI concepts, and governance posture exist. |
| Control plane foundation | Yellow | 68% | Medium | `projects/hermes` has a strong local technical control plane; live orchestration and enterprise integration remain incomplete. |
| Project registry | Green | 85% | Low | `projects/hermes` includes project registry/runtime contracts; production sync and cross-repo consumption still need hardening. |
| Dashboard design system | Green | 92% | Medium | Package, static adapter, recipes, registry, prototypes, validators, executive briefing, capacity/readiness surfaces, adapter registry, and action/evidence surfaces exist. Adoption is uneven. |
| Executive cockpit | Green | 90% | Medium | Executive Briefing Room, reporting contract, decision queue, evidence rollups, completion boundary, feed registry, action gates, and integration checklist exist; live report adapters still need downstream adoption. |
| Task queue | Yellow | 70% | Medium | `projects/hermes` has queue persistence, priority, state, task manager, and tests; cross-runtime dispatch still needs completion. |
| Agent dispatcher | Yellow | 42% | High | `projects/hermes` has agent roles, registration, delegation, assignment, and communication modules; production worker dispatch remains incomplete. |
| Context engine | Green | 85% | Medium | `projects/hermes` has context manager and project context loader; Nous now has plan indexing, command-center summaries, and readiness registry context. Automatic packaging across all projects remains incomplete. |
| Artifact system | Yellow | 70% | Medium | `projects/hermes` writes evidence artifacts and reports; durable external backend and retention policy are not complete. |
| Review pipeline | Yellow | 45% | High | `projects/hermes` has review managers and evidence bundle writers; independent review and promotion enforcement still need end-to-end hardening. |
| VPS runtime | Yellow | 35% | High | `projects/hermes/deploy/hetzner` has deployment scripts and compose assets; always-on worker runtime and production drills remain open. |
| Production operations | Yellow | 55% | High | Routes, command plans, and production evidence readiness cards exist; live sweeps, screenshots, promotion, secret scans, and incidents need approved execution. |
| Cost/capacity observability | Yellow | 62% | High | Cost cockpit, capacity command prototypes, and provider integration checklist exist; universal telemetry, provider billing credentials, and provider reconciliation are missing. |
| Security and approvals | Yellow | 55% | High | Breaker concepts and permission audit exist; enforcement coverage is incomplete. |
| Mobile control | Red | 10% | Medium | Mobile dashboard/control surface is not built. |
| Multi-agent execution | Yellow | 45% | High | `projects/hermes` has local agent role/delegation/communication foundations and Nous now surfaces agent action gates; live parallel worker execution and merge coordination are not ready. |
| Business-unit readiness hub | Yellow | 82% | Medium | Readiness contracts, project plan command center, executive briefing cards, and project feed adapter registry exist; automatic project reporting still uneven. |

## 3A. `projects/hermes` Actual Implementation Assessment

The original version of this handoff was based mostly on `projects/nous-hermes-agent` planning and dashboard documents. That was incomplete. The separate `projects/hermes` repository contains substantial implemented control-plane work and must be included in any honest readiness assessment.

### What `projects/hermes` Adds

Evidence from `../hermes`:

- `docs/build-progress.md` reports the older V2 local build at 41/41 tasks complete.
- `docs/business-unit-readiness-plan.md` reframes Hermes OS as a shared technical control plane rather than a normal business unit.
- `docs/central-command-build-plan.md` marks Technical Central Command V1-V8 complete for the local/software contract boundary.
- `docs/federated-coceo-operating-contract.md` defines the TLC / business-unit / Hermes / Nous authority split.
- `src/technical-control-plane/technical-control-plane-readiness.ts` builds a machine-readable readiness report with:
  - `localReadiness: 5`
  - `enterpriseIntegrationReadiness: 2.5`
  - `productionOperationsReadiness: 2.5`
  - status `local-complete-external-integration-open`
- `src/queue/`, `src/agents/`, `src/workflow/`, `src/reviews/`, `src/context/`, `src/projects/`, `src/workspace/services/`, and `src/deploy/` contain concrete implementations, not only plans.
- `deploy/hetzner/` contains Caddy, Docker, deploy, promote, rollback, backup, restore drill, resource guard, TLS/DNS, and server drift scripts.

### Corrected Interpretation

Hermes OS should be treated as:

```text
Local technical control plane: strong / mostly complete
Enterprise integration: partial
Production operations: partial
Always-on autonomous runtime: not complete
```

This means future work should not rebuild basic Hermes queue, agent role, project registry, deploy spine, or CoCEO reference concepts from scratch. It should inspect and extend the existing `projects/hermes` implementation, then connect it into `nous-hermes-agent` and `tlc-capital-group-os` through contracts.

### Remaining `projects/hermes` Boundary

The Hermes project itself says the remaining work is external/system integration:

- TLC authority matrix.
- Production SSH alias and approved deployment drills.
- External secret rails.
- Centralized logs and alerting.
- Business-unit CoCEO summary feeds.
- TLC OS consumption of Hermes outcomes.
- Production/staging split and restore drills.

That aligns with the system-wide gap assessment: the local control-plane engine is much further along than the live enterprise operating company layer.

## 4. Gap Analysis

### Control Plane

Current capability:

- Hermes has an architecture-first model, many plans, validators, dashboard routes, and operating concepts.

Desired capability:

- Hermes owns state, decisions, tasks, workflows, approvals, artifacts, dashboards, telemetry, and promoted knowledge across all business units.

Gap:

- Runtime state is not uniformly live.
- Source-of-truth storage is not fully centralized.
- Dashboard rollups still depend on incomplete project adapters.

Priority: Critical.

Dependencies:

- project outcome adapters
- durable artifact backend
- standardized telemetry contracts
- executive reporting contract

Estimated complexity: High.

### Project Registry

Current capability:

- Project registry concepts, launcher behavior, and business-unit readiness tracking exist.

Desired capability:

- Every project has a registry record with local path, production URL, health endpoint, dashboard manifest, ownership, current readiness, and outcome feed.

Gap:

- Not every project emits standardized `/api/hermes/outcomes`.
- Production mapping and health evidence are not uniformly live.

Priority: Critical.

Dependencies:

- production map
- project adapters
- DNS/Caddy verification

Estimated complexity: Medium.

### Task Queue

Current capability:

- Hermes can model tasks and plan work. `projects/hermes` includes queue persistence, priority handling, task loading, task management, and task state management.

Desired capability:

- Hermes can create, prioritize, schedule, dispatch, retry, cancel, review, and archive tasks.

Gap:

- Need production-ready cross-runtime dispatch, cancellation, retry policy across worker failures, worker assignment, and operator status reporting tied to the executive layer.

Priority: Critical.

Dependencies:

- database
- dispatcher
- worker registry
- review pipeline

Estimated complexity: High.

### Agent Dispatcher

Current capability:

- Agent roles, registration, delegation, assignment, communication, and role-specific agents exist in `projects/hermes`.

Desired capability:

- Hermes can assign work to Codex Cloud, VPS workers, local Mac workers, review agents, test agents, and research agents based on cost, risk, capability, availability, and permissions.

Gap:

- Need production worker registration, capability matching against real runtimes, execution transport, artifact handoff validation across repos, error handling, escalation, and merge coordination.

Priority: Critical.

Dependencies:

- task queue
- worker registry
- permissions
- artifacts
- review pipeline

Estimated complexity: High.

### Context Engine

Current capability:

- Project memory, session memory, and context-packing concepts exist. `projects/hermes` includes context manager and project context loader implementations.

Desired capability:

- Hermes automatically packages the right context for each task, role, project, and workflow step while preserving source links and redacting secrets.

Gap:

- Need automatic context loader, relevance selection, freshness detection, redaction, and handoff bundles.

Priority: High.

Dependencies:

- project registry
- document index
- memory store
- artifact store

Estimated complexity: Medium to high.

### Artifact System

Current capability:

- Artifact pointer, fingerprint, evidence bundle, review bundle, and report-writing concepts exist. `projects/hermes` includes concrete artifact/report writers.

Desired capability:

- Hermes stores durable screenshots, logs, traces, reports, generated assets, run artifacts, evals, and deployment evidence with retention rules and stable links.

Gap:

- Need durable storage backend choice, cross-project artifact indexing, signed URLs or internal links, retention jobs, and storage usage monitoring.

Priority: High.

Dependencies:

- local mounted volume or R2/S3
- production runners
- incident system
- dashboard evidence views

Estimated complexity: Medium.

### Review Pipeline

Current capability:

- Review gates, evidence bundle writers, review managers, and validation gates exist locally in `projects/hermes`.

Desired capability:

- Every delegated artifact or code change gets independent review, test evidence, and promotion approval before becoming source of truth.

Gap:

- Need enforced reviewer assignment across delegated work, artifact review contracts tied into production promotion, test/eval integration, approval records, and merge coordination.

Priority: Critical.

Dependencies:

- dispatcher
- artifact system
- task queue
- GitHub integration

Estimated complexity: High.

### VPS Runtime

Current capability:

- Projects deploy on Hetzner, production rails have been modeled, and `projects/hermes/deploy/hetzner` includes deploy/promote/rollback/backup/restore/TLS/DNS/server-drift scripts.

Desired capability:

- Hermes can run 24/7 without relying on the local Mac, with workers, schedulers, logs, monitoring, and safe command gates.

Gap:

- Need always-on Hermes service, queue workers, scheduler, monitoring, centralized logs, database, approved production SSH/drills, and shared promotion execution wired to real services.

Priority: High.

Dependencies:

- Docker/Compose
- production `.env`
- shared deploy root
- secret scanner
- incident fanout

Estimated complexity: High.

### Mobile Control

Current capability:

- Not meaningfully implemented.

Desired capability:

- Operator can review briefs, approve/deny actions, inspect incidents, stop autonomy, and see executive status from mobile.

Gap:

- Need mobile-first dashboard or PWA, auth, notification routing, approval UX, and incident drilldowns.

Priority: Medium.

Dependencies:

- executive reporting contract
- incident system
- auth
- approval gates

Estimated complexity: Medium.

## 5. Readiness Assessment

### Architecture

- [x] Architecture-first doctrine exists.
- [x] Source-of-truth boundary exists.
- [x] Project document template concept exists.
- [x] Work graph roadmap exists.
- [ ] All projects are fully architecture-reviewed and continuously refreshed.

Status: Mostly complete.

### Memory

- [ ] Global memory is fully live.
- [ ] Project memory is automatically loaded per active project.
- [ ] Agent memory is explicitly non-authoritative and synchronized through handoff rules.
- [ ] Context packages are generated automatically.
- [ ] Memory freshness/drift warnings are enforced.

Status: Partially complete.

### Task System

- [x] Planning concepts exist.
- [ ] Durable queue is complete.
- [ ] Scheduling is complete.
- [ ] Dependencies are complete.
- [ ] Retry is complete.
- [ ] Cancellation is complete.
- [ ] Review handoff is complete.

Status: Partially complete.

### Multi-Agent

- [x] Planner role is designed.
- [x] Coder/worker role is designed.
- [x] Reviewer role is designed.
- [x] Tester role is designed.
- [x] Researcher role is designed.
- [ ] Worker registry is live.
- [ ] Parallel execution is live.
- [ ] Independent review is enforced.
- [ ] Merge coordinator is live.

Status: Designed, not fully implemented.

### Infrastructure

- [ ] Always-on Hermes VPS runtime is complete.
- [x] Docker/Compose exists across production projects.
- [ ] Hermes monitoring is complete.
- [ ] Centralized logging is complete.
- [ ] Backups are defined and tested.
- [ ] Hetzner promotion runner is fully wired.
- [ ] Production screenshot runner is fully wired.

Status: Partially complete.

### Dashboards

- [x] Six-workspace information architecture exists.
- [x] Dashboard kit exists.
- [x] Static prototype gallery exists.
- [x] Capacity/cost cockpit V2 prototype exists.
- [ ] Executive Briefing Room is live-data-backed.
- [ ] Project drilldowns are fully normalized.
- [ ] Dashboard quality review is mandatory.

Status: Foundation strong, live rollups incomplete.

### Governance

- [x] Permission and breaker concepts exist.
- [x] Risk classes exist.
- [ ] Breakers are enforced in every live execution path.
- [ ] Approval agenda is fully wired.
- [ ] Secret scanning covers GitHub and Hetzner consistently.
- [ ] Production audit trail is complete.

Status: Partially complete.

## 6. Engineering Checklist

### Phase 1: Single-Agent Hermes

Goal: Hermes can manage one development task end-to-end with durable context, artifact output, validation, and review.

- [ ] Stable task queue.
- [ ] Context loader.
- [ ] Artifact writer.
- [ ] Codex integration contract.
- [ ] Task execution records.
- [ ] Test execution records.
- [ ] Review record.
- [ ] Logs and trace IDs.
- [ ] Final handoff artifact.

Exit criteria:

- Hermes can take a scoped task, load context, produce or delegate work, capture artifacts, run validation, request review, and persist the outcome.

### Phase 2: Always-On Hermes

Goal: Hermes runs without the local Mac.

- [ ] VPS service deployment.
- [ ] Production database.
- [ ] Queue workers.
- [ ] Scheduler.
- [ ] Monitoring.
- [ ] Central logs.
- [ ] Dashboard health.
- [ ] Backups.
- [ ] Restart and rollback procedure.

Exit criteria:

- Hermes can run 24/7 on Hetzner, recover from restarts, and show live health.

### Phase 3: Multi-Agent Hermes

Goal: multiple agents can complete project work together under Hermes governance.

- [ ] Planner.
- [ ] Dispatcher.
- [ ] Worker registry.
- [ ] Parallel execution.
- [ ] Independent review.
- [ ] Test agent.
- [ ] Merge coordinator.
- [ ] Failure fallback.
- [ ] Cost-aware routing.

Exit criteria:

- Hermes can split work, assign workers, collect artifacts, run review/testing, and coordinate merge/promotion without losing traceability.

### Phase 4: Personal Operating System / Business OS Layer

Goal: Hermes oversees TLC Capital Group and business units as an executive system.

- [ ] TLC Capital Group OS executive rollup.
- [ ] Media Business OS reporting feed.
- [ ] Media Engine outcome/cost/feed integration.
- [ ] Khashi VC outcome/research/feed integration.
- [ ] Rinseables OS readiness/reporting feed.
- [ ] Consulting/business mapper feed.
- [ ] Meal Planner feed if active.
- [ ] Business-unit officer report contracts.
- [ ] Executive Briefing Room.

Exit criteria:

- Hermes can summarize business-unit status, cost, readiness, risks, decisions, learning, and next actions from structured source data.

## 7. Technical Debt Register

| Priority | Item | Risk | Effort | Dependencies | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Critical | Static/sample dashboards can be mistaken for live dashboards | High | Medium | Live telemetry contracts | Hermes dashboard layer | Open |
| Critical | No universal project outcome adapter across all projects | High | Medium | Per-project API work | Project OS owners | Open |
| Critical | Dispatcher is not ready for real multi-agent execution | High | High | Queue, worker registry, review pipeline | Hermes runtime | Open |
| Critical | Review pipeline is advisory, not enforced | High | High | Artifacts, task queue, GitHub integration | Hermes runtime | Open |
| High | Production checks are not fully browser/screenshot backed | Medium | Medium | Playwright runner, artifacts | Hermes operations | Open |
| High | Hetzner promotion rail is not fully live behind gates | High | High | SSH runner, rollback evidence, breakers | Hermes operations | Open |
| High | Secret posture is incomplete across GitHub and Hetzner | High | Medium | Secret manifests, server scanner | Hermes security | Open |
| High | Cost attribution is estimated and incomplete | High | Medium | Provider usage imports, manual rates | Hermes finance | Open |
| High | Local Codex usage is not captured as operational capacity | Medium | Medium | Local ledger design | Hermes capacity | Open |
| High | Revenue context is not standardized | Medium | Medium | TLC OS and business-unit feeds | TLC OS | Open |
| Medium | Mobile approval/control surface missing | Medium | Medium | Executive brief, auth, incidents | Hermes UI | Open |
| Medium | Design quality is not automatically scored beyond validation | Medium | Medium | Scorecard, screenshot runner | Dashboard kit | Open |
| Medium | Artifact retention policy not implemented | Medium | Medium | Storage backend | Hermes artifacts | Open |
| Medium | Dashboard route count can still grow without page hierarchy | Medium | Low | Executive IA enforcement | Hermes dashboard layer | Open |

## 8. Decision Log

| Decision | Rationale | Alternatives Considered | Why Alternatives Were Rejected | Status |
| --- | --- | --- | --- | --- |
| Hermes OS owns state and governance; agents produce artifacts | Prevents runtime memory and delegated agents from becoming source of truth | Let agents own tasks/projects | Too much drift and difficult auditability | Active |
| Official Hermes Agent is an optional runtime under Hermes OS | Preserves existing Hermes OS control plane while allowing delegated execution | Replace Hermes OS with official agent | Would lose custom governance and business OS work | Active |
| Dashboards follow six workspaces: Command, Operations, Intelligence, Capacity, Projects, Controls | Stops tab sprawl and gives every screen a job | One sidebar item per feature | Becomes unusable as projects grow | Active |
| Architecture-first before implementation | Prevents building features without business/domain/workflow clarity | Idea-to-code by default | Created repeated rework and unclear ownership | Active |
| Business units own domain specifics; Hermes owns operating contracts | Keeps Hermes reusable for future ventures | Hardcode Khashi/Media/Rinseables logic into Hermes | Would make Hermes brittle and domain-specific | Active |
| Runtime memory is not source of truth | Keeps handoffs auditable and portable | Let agent conversations be authoritative | Conversations are lossy and hard to query safely | Active |
| Paid provider usage must be governed by budget breakers | Prevents unexpected cost escalation | Let model router auto-upgrade freely | Cost and quality tradeoffs are not yet measured | Active |
| Static adapters are transitional | Allows consistency while package-native dashboards mature | Rewrite every dashboard immediately | Too disruptive; current projects still need production stability | Active |
| Mobbin is a visual reference source, not a data model or implementation source | Useful for layout/polish, not business logic | Let Mobbin dictate dashboards | References do not know Hermes data or operating questions | Active |
| Direct publishing and high-risk production actions remain deferred until gates are reliable | Avoids unsafe automation | Automate immediately | Insufficient observability, rollback, and approval coverage | Active |

## 9. Missing Research

| Topic | Question | Priority | Output Needed |
| --- | --- | --- | --- |
| Codex Cloud integration | How should Hermes dispatch work to Codex Cloud without losing source-of-truth control? | Critical | Runtime adapter spec and proof of concept. |
| VPS worker runtime | What is the minimal always-on worker architecture for Hetzner? | Critical | Deployment architecture, queue worker plan, monitoring plan. |
| Agent authentication | How do agents receive scoped credentials without broad secret exposure? | Critical | Permission and token scope model. |
| Cost optimization | Which model/provider should handle each task family? | High | Golden evals with cost/quality scoring. |
| Security model | What actions require approval, breaker checks, or hard denial? | High | Permission matrix and enforcement points. |
| Mobile dashboard | What mobile actions are safe and useful? | Medium | Mobile Briefing Room UX plan. |
| Long-term memory | What belongs in global, project, session, and agent memory? | High | Memory schema and retention policy. |
| Agent permissions | How should Hermes grant tools by task, role, risk, and project? | Critical | Tool policy engine. |
| Durable artifacts | Local volume, R2/S3, or hybrid? | High | Storage decision and adapter implementation. |
| Production observability | What minimum health, logs, cost, queue, and incident data must every project emit? | Critical | Standard telemetry contract and rollout plan. |
| Executive report generation | How often should co-CEO/officer reports generate, and from which evidence? | Critical | Reporting cadence and contract. |

## 10. Final Readiness Score

| Area | Score |
| --- | ---: |
| Architecture | 88% |
| Planning | 90% |
| Documentation | 88% |
| Dashboard foundation | 92% |
| Executive reporting | 90% |
| Infrastructure | 42% |
| Automation | 52% |
| Multi-agent | 35% |
| Security and approvals | 55% |
| Observability | 55% |
| Deployment | 40% |
| Cost/capacity attribution | 62% |
| Mobile | 10% |

Overall readiness: **approximately 72%**.

Interpretation:

- Hermes is past the early planning stage.
- The local Hermes technical control-plane implementation is meaningful and should be reused.
- Nous Hermes now has the local executive command-center surface through the current V1 completion boundary: reporting contract, project-plan intelligence, adapter registry, action gates, production evidence checklist, and human integration queue.
- The system is not yet ready for broad autonomous production execution.
- The next gains come from live adapters, durable runtime, standardized reporting, and enforcement.

## 11. Master Build Roadmap

This roadmap tracks whether major capabilities are planned, designed, implemented, tested, deployed, blocked, and delegable to Codex.

| Capability | Planned | Designed | Implemented | Tested | Deployed | Blocks / Gaps | Unlocks | Depends On | Delegable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Executive reporting contract | Yes | Yes | Static contract | Kit build | No | Needs project feed adapters and generators | Executive Briefing Room, officer reports | Project feeds | Yes |
| Executive Briefing Room | Yes | Yes | Static dashboard route | Web build | No | Needs live summaries, project adapters, and decisions | TLC-wide oversight | Reporting contract, telemetry | Yes |
| Business Unit Portfolio | Yes | Partial | Partial | Partial | No | Needs standardized readiness/outcome feeds | Compare business units | Project registry | Yes |
| Cost And Capacity cockpit | Yes | Yes | Static V2 prototype | Spine validation | No | Needs live usage/cost feeds | Budget control and provider routing | Cost telemetry | Yes |
| Operations Command | Yes | Partial | Partial | Partial | No | Live queues/incidents incomplete | Triage and production support | Telemetry, incidents | Yes |
| Intelligence And Learning | Yes | Partial | Partial | Partial | No | Outcome ingestion incomplete | Evidence-backed recommendations | Project outcome feeds | Yes |
| Governance And Risk | Yes | Partial | Partial | Partial | No | Breaker enforcement incomplete | Safer autonomy | Permission runtime | Yes |
| Project outcome adapters | Yes | Partial | Khashi/Media partial | Partial | Partial | Remaining projects missing | Executive rollups | Per-project work | Yes |
| Production screenshot runner | Yes | Yes | No | No | No | Browser runner and artifacts missing | Visual production QA | Artifact backend | Yes |
| Hetzner promotion transport | Yes | Yes | Partial command plan | Partial | No | Real SSH execution and rollback capture | Shared deploy rail | Approval gates | Yes |
| Server secret scanner | Yes | Yes | Partial | Partial | No | Hetzner env-name scanner needed | Deployment readiness | Secret manifests | Yes |
| Incident fanout | Yes | Partial | No | No | No | Discord/Telegram/email targets | Operator alerts | Incident store | Yes |
| Durable artifact backend | Yes | Partial | No | No | No | Backend decision needed | Evidence retention | Storage choice | Yes |
| Task queue | Yes | Partial | Partial | Partial | No | Durable retries/priorities missing | Delegated execution | Database | Yes |
| Worker registry | Yes | Partial | Partial local | Partial | No | Real runtime availability records | Multi-agent dispatch | Runtime adapters | Yes |
| Agent dispatcher | Yes | Partial | Partial local | Partial | No | Production assignment policy and execution transport | Multi-agent execution | Queue, registry | Yes |
| Review pipeline | Yes | Partial | Partial local | Partial | No | Independent review not enforced across all delegated/promotion paths | Safe artifact/code promotion | Dispatcher, artifacts | Yes |
| Context engine | Yes | Partial | Partial local | Partial | No | Automatic cross-project context packs missing | Better task execution | Memory index | Yes |
| Provider eval runner | Yes | Yes | Partial schema | Partial | No | Real golden runs gated | Model routing confidence | Budget breakers | Yes |
| Mobile control | Yes | No | No | No | No | UX and auth not designed | Mobile approvals/incidents | Executive brief | Yes |

### Roadmap Execution Order

Do not build these randomly. Recommended order:

1. Executive reporting contract. Complete as static contract in `@hermes/dashboard-kit`.
2. Project outcome adapter standard.
3. Business-unit readiness/outcome feed rollout.
4. Executive Briefing Room live-data skeleton. Static route exists at `/executive-briefing`; replace sample feed with adapters next.
5. Cost/capacity live telemetry adapter.
6. Reconcile and reuse `projects/hermes` queue/agent/workflow implementations instead of rebuilding them in Nous.
7. Task queue hardening for cross-runtime dispatch.
8. Artifact backend.
9. Production screenshot runner.
10. Server secret scanner.
11. Hetzner promotion transport.
12. Incident fanout.
13. Worker registry productionization.
14. Agent dispatcher productionization.
15. Independent review pipeline enforcement.
16. Provider eval runner.
17. Mobile control.

## 12. Current Practical Next Slice

The next build should not be another set of generic dashboard pages.

Recommended next slice:

1. Complete project feed adapters for TLC Capital Group OS, Hermes, Media Engine, Khashi VC, Media Business OS, and Rinseables OS.
2. Replace the static Executive Briefing Room sample feed with adapter-backed reports.
3. Map those reports to the existing `projects/hermes` federated CoCEO contract and outcome feed shape.
4. Add source/freshness/confidence fields from real artifacts so summaries can be queried and drilled into.
5. Add generator jobs for recurring co-CEO and officer reports.
6. Keep all live automation disabled until task queue, artifact storage, permissions, and review gates are stronger.

This is the highest-leverage slice because it converts Hermes from many dashboards into an executive operating layer.

## 13. Non-Negotiable Boundaries

- Do not store raw secrets in docs, dashboard records, incidents, or generated reports.
- Do not treat generated prose as evidence unless it links to source records.
- Do not mark a capability complete because a route or static prototype exists.
- Do not wire autonomous spending without budget breakers.
- Do not wire autonomous production deployment without approval, rollback, and post-deploy verification.
- Do not make Hermes domain-specific. Project domains belong to project artifacts and adapters.
- Do not let agent memory become the source of truth.
- Do not expand dashboard navigation without checking the six-workspace collapse rule.
