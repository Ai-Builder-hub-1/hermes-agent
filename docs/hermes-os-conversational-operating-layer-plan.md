# Hermes OS Conversational Operating Layer Plan

Generated: 2026-06-17

Source: Hermes OS Conversational Operating Layer (COL) specification v1.0.

## Direction

Hermes OS becomes a conversational operating layer where the operator can state an outcome in natural language and the Chief of Staff coordinates skills, agents, workflows, approvals, artifacts, and project state behind the scenes.

The control-plane boundary remains unchanged:

```text
Hermes OS owns state, governance, workflows, approvals, tasks, dashboards, and promoted artifacts.
Chief of Staff coordinates.
Agents and skills produce delegated artifacts.
Runtime memory is never the source of truth.
```

## Target Architecture

```text
User
  -> Conversational Interface
  -> Chief of Staff Agent
  -> Intent Router
  -> Workflow Engine
  -> Skills and Agents
  -> Artifacts
  -> Hermes OS Source-of-Truth State
```

## Success Scenario

A user types:

```text
Build a CRM for wholesalers.
```

Hermes should automatically route the request through:

```text
grill-me
  -> PRD
  -> architecture
  -> plan
  -> tasks
  -> agents.md
  -> tracker.md
  -> dashboard
  -> project workspace
```

The user should not need to know which Hermes command or skill comes next.

## Generated Phases

### Phase 65 - Conversational Operating Layer Foundation

Establish the chat-first operating layer as a first-class Hermes OS control-plane surface while preserving Hermes OS ownership of state, governance, and authoritative artifacts.

- `task-388`: Define Conversational Operating Layer contracts and ownership boundaries.
- `task-389`: Add conversational session schema for user, project, goal, initiative, and transcript metadata.
- `task-390`: Add chat request and response envelope contracts for CLI, API, and UI consumers.
- `task-391`: Add persisted conversation transcript model with source-of-truth references.
- `task-392`: Add COL configuration and feature flags for staged rollout.
- `task-393`: Document COL safety boundaries for commands, agents, workflows, and artifacts.
- `task-394`: Add Chief of Staff context packing contract for conversational turns.
- `task-395`: Add COL audit event records for intent, routing, delegation, approval, and artifact generation.
- `task-396`: Add command routing discovery for chat-capable Hermes OS commands.
- `task-397`: Add foundation tests for COL schemas, config, and audit records.

### Phase 66 - Chat CLI Surface

Give operators a natural conversational entrypoint through `hermes chat`, one-shot `hermes ask`, and interactive `hermes` usage without requiring prior command knowledge.

- `task-398`: Add `hermes chat` command contract and non-executing prototype.
- `task-399`: Add `hermes ask` one-shot command for quoted natural-language requests.
- `task-400`: Add interactive default `hermes` shell mode behind a feature flag.
- `task-401`: Add slash-command parser for conversational shortcuts such as `/grill-me` and `/plan`.
- `task-402`: Add streaming status update contract for long-running conversational workflows.
- `task-403`: Add conversation transcript save and load behavior for CLI sessions.
- `task-404`: Add project switch support from conversational CLI requests.
- `task-405`: Add structured chat command error envelopes for unknown intent, unsafe action, and missing project.
- `task-406`: Add CLI help text and docs examples for chat-first workflows.
- `task-407`: Add CLI smoke tests for `hermes chat`, `hermes ask`, and interactive startup.

### Phase 67 - Chief of Staff Agent

Create the coordinating agent that interprets user goals, selects workflows, delegates work, tracks progress, and reports status without performing implementation work directly.

- `task-408`: Add Chief of Staff role schema with responsibilities, prohibitions, and output contracts.
- `task-409`: Add orchestration policy that prevents Chief of Staff from directly performing worker tasks.
- `task-410`: Add Chief of Staff decision loop for understand, route, plan, delegate, track, and report.
- `task-411`: Add action plan output schema with selected workflow, agents, approvals, and expected artifacts.
- `task-412`: Add delegation record schema linking user intent to agents, skills, workflows, and artifacts.
- `task-413`: Add conversational status reporter for active workflow progress and blocked steps.
- `task-414`: Add recommendation generator for next best project, task, review, or research action.
- `task-415`: Add clarification and approval prompt contracts for ambiguous or high-risk requests.
- `task-416`: Add Chief of Staff memory handoff into project memory and session memory.
- `task-417`: Add Chief of Staff tests for routing, delegation, status, and direct-work prohibition.

### Phase 68 - Intent Routing Engine

Automatically classify natural-language requests into new-project, existing-project, research, architecture, task-work, review, and unknown-intent routes.

- `task-418`: Add intent schema with confidence, alternatives, required context, and selected route.
- `task-419`: Add deterministic phrase and command-pattern classifier for common Hermes OS intents.
- `task-420`: Add model-assisted intent fallback contract for uncertain requests.
- `task-421`: Add new-project route for build, create, start, and launch requests.
- `task-422`: Add existing-project route for continue, update, fix, and improve requests.
- `task-423`: Add research route for research, analyze, compare, and investigate requests.
- `task-424`: Add architecture route for review architecture, refactor system, and design workflow requests.
- `task-425`: Add task and review route for implement task, review task, approve, and reject requests.
- `task-426`: Add ambiguity handling with clarification questions and safe default routes.
- `task-427`: Add intent routing evaluation set with representative conversational examples.

### Phase 69 - Conversational Workflow Engine

Turn routed intents into checkpointed Hermes OS workflows that can run skills, call agents, produce artifacts, pause for approval, resume, cancel, and report progress.

- `task-428`: Add conversational workflow registry for named workflows and route bindings.
- `task-429`: Add workflow state machine for planned, running, waiting, delegated, validating, completed, failed, and canceled states.
- `task-430`: Add workflow checkpoint persistence for each conversational step and artifact boundary.
- `task-431`: Add new-project workflow chain for grill-me, PRD, architecture, plan, tasks, agents, tracker, dashboard, and workspace open.
- `task-432`: Add existing-project workflow chain for context load, route selection, task planning, execution, and review.
- `task-433`: Add research workflow chain for research agents, evidence collection, synthesis, and report artifact generation.
- `task-434`: Add architecture workflow chain for architect review, refactor planning, and work graph generation.
- `task-435`: Add task-work workflow chain for task selection, execution delegation, validation, and review handoff.
- `task-436`: Add workflow dry-run preview showing steps, agents, skills, approvals, and artifacts before execution.
- `task-437`: Add workflow resume, cancel, and failure-recovery tests.

### Phase 70 - Project And Session Memory Layer

Load the right project context automatically and preserve conversational continuity across active project, active goal, active initiative, recent decisions, and source-backed memory.

- `task-438`: Add project identity memory contract for selected project and workspace path.
- `task-439`: Add core project memory loader for project, architecture, decisions, progress, tracker, backlog, and agents documents.
- `task-440`: Add working context builder that condenses project memory for Chief of Staff and delegated agents.
- `task-441`: Add decision and progress retrieval scoped by topic, recency, and confidence.
- `task-442`: Add rolling conversation memory for recent user decisions, preferences, and unresolved questions.
- `task-443`: Add active project, active goal, and active initiative session store.
- `task-444`: Add memory freshness and drift warnings during conversational context loading.
- `task-445`: Add memory redaction and source-link policy for context passed to agents.
- `task-446`: Add agent context package builder with project memory, task context, and workflow checkpoint data.
- `task-447`: Add memory-layer tests for loading, summarization, redaction, source links, and drift warnings.

### Phase 71 - Agent Hierarchy And Delegation

Implement the CEO-to-Chief-of-Staff-to-management-to-worker hierarchy with explicit artifact handoffs, traceability, review, and fallback behavior.

- `task-448`: Add conversational agent role registry for management and worker layers.
- `task-449`: Add management-layer agent definitions for Planner, Architect, Research Lead, Engineering Lead, and Product Lead.
- `task-450`: Add worker-layer agent definitions for Engineer, Reviewer, Researcher, Analyst, QA, and Writer.
- `task-451`: Add delegation protocol schema for assignment, input artifacts, output artifacts, and completion evidence.
- `task-452`: Add agent assignment planner using intent, workflow step, capability, cost, availability, and risk.
- `task-453`: Add artifact handoff validation between agents and workflow steps.
- `task-454`: Add multi-agent trace timeline records for conversational workflows.
- `task-455`: Add reviewer approval flow for delegated artifacts before promotion to source-of-truth state.
- `task-456`: Add agent failure fallback and escalation behavior for unavailable, low-confidence, or policy-blocked agents.
- `task-457`: Add delegation tests for single-agent, chained-agent, parallel-agent, review, and fallback scenarios.

### Phase 72 - Hermes Chat UI And Dashboard

Expose the Conversational Operating Layer in the web experience with chat, project switching, task visibility, reviews, recommendations, and agent activity.

- `task-458`: Add Chief of Staff API endpoints for chat turns, workflow status, recommendations, and active context.
- `task-459`: Add Open WebUI integration contract for chat requests, session identity, and streamed responses.
- `task-460`: Add Hermes chat page with persistent conversation and workflow status.
- `task-461`: Add project switcher UI tied to session memory and project context loading.
- `task-462`: Add task backlog view filtered by active project and conversational workflow.
- `task-463`: Add review queue view for approving, rejecting, or requesting more context on artifacts.
- `task-464`: Add recommendation panel for next best tasks, reviews, research, and project actions.
- `task-465`: Add active agent activity view with assignments, status, traces, and artifacts.
- `task-466`: Add active project, active initiative, open tasks, pending reviews, and dashboard status widgets.
- `task-467`: Add UI tests for chat, project switching, task viewing, review actions, and status refresh.

### Phase 73 - Dynamic Commands And Launch Success

Convert skills into conversational commands and prove the end-to-end launch experience where a user can type a product idea and Hermes creates the project operating artifacts without manual command choreography.

- `task-468`: Add skill manifest index for conversational command generation.
- `task-469`: Add slash-command aliases generated from registered Hermes skills and workflows.
- `task-470`: Add natural-language skill invocation for common skill goals without explicit command names.
- `task-471`: Add contextual command recommendation from active project, selected workflow, and recent conversation.
- `task-472`: Add permission and approval checks for generated conversational commands before execution.
- `task-473`: Add Chief of Staff dashboard panels for active project, initiative, tasks, reviews, agents, and recommendations.
- `task-474`: Add end-to-end success scenario for "Build a CRM for wholesalers" through project workspace creation.
- `task-475`: Add user guide for conversational Hermes OS workflows and operator expectations.
- `task-476`: Add rollout and migration guide from command-first Hermes to chat-first Hermes.
- `task-477`: Add regression release tests for dynamic commands, launch workflow, dashboard panels, and documentation links.

### Phase 74 - Remote Operator Runtime

Make Hermes available as an always-on operator service that can receive remote requests, route them through the Chief of Staff, execute approved workflows through controlled workers, and stream progress back without requiring the operator to sit at the local computer.

Build status: local dry-run foundation complete as of 2026-07-26. Live VPS service execution and gateway tokens remain external setup items.

- `task-478`: Define Remote Operator Runtime contracts for inbound messages, normalized requests, workflow jobs, worker sessions, progress events, approvals, and final summaries.
- `task-479`: Add runtime deployment topology for VPS-hosted Hermes API, gateway workers, project workspace access, logs, persistence, and health checks.
- `task-480`: Add remote operator configuration schema for enabled gateways, allowed projects, allowed workflows, approval policy, budget ceilings, and emergency stop controls.
- `task-481`: Add operator identity and authorization model for Discord users, Telegram users, admin profiles, project scopes, and action classes.
- `task-482`: Add remote request audit records linking platform message IDs to Hermes sessions, workflow IDs, approvals, artifacts, commits, deploys, and dashboard events.
- `task-483`: Add remote operator health endpoint covering gateway status, worker availability, queue depth, active jobs, recent failures, and policy blocks.
- `task-484`: Add tests for remote operator contracts, identity mapping, audit records, policy checks, and degraded-runtime behavior.

### Phase 75 - Discord And Telegram Gateways

Expose Hermes through Discord and Telegram as first-class conversational control surfaces for daily briefings, project switching, agent messaging, workflow launch, approvals, and streamed status updates.

- `task-485`: Add shared gateway adapter interface for inbound messages, outbound replies, streaming updates, approval prompts, file attachments, and command metadata.
- `task-486`: Add Discord gateway implementation for direct messages, allowed channels, slash commands, threaded progress, reactions/buttons for approvals, and admin-only commands.
- `task-487`: Add Telegram gateway implementation for private chats, allowed chat IDs, short approval replies, mobile/watch-friendly summaries, and resumable workflow status.
- `task-488`: Add remote command parser for natural-language requests and slash shortcuts such as `/status`, `/briefing`, `/switch`, `/ask-agent`, `/run`, `/approve`, `/reject`, and `/stop`.
- `task-489`: Add gateway-to-Hermes command envelope mapping so Discord, Telegram, CLI, API, and dashboard requests use the same routing contract.
- `task-490`: Add streaming progress fanout so long-running workflows can report step changes, logs, blockers, approvals, artifacts, commits, deploys, and final outcomes to the originating platform.
- `task-491`: Add gateway tests for authentication, allowlisted users, project selection, workflow launch, approval handling, streaming updates, duplicate message protection, and failed delivery retries.

### Phase 76 - Project-Aware Remote Delegation

Allow remote requests to reach the correct business unit, capability, or specialist agent while keeping Hermes OS as the source of truth for state, approvals, and promoted artifacts.

- `task-492`: Add project registry lookup for remote requests using project names, aliases, business-unit labels, capability labels, and active-session context.
- `task-493`: Add specialist agent addressing for requests such as "ask the Khashi lead scientist", "ask Media Engine for content briefs", or "ask TLC for portfolio blockers".
- `task-494`: Add agent briefing workflow that loads current project memory, plan state, dashboard feeds, runtime status, recent decisions, and open blockers before answering.
- `task-495`: Add remote research workflow for evidence collection, source-backed synthesis, review package generation, and follow-up action recommendations.
- `task-496`: Add remote build workflow for plan selection, task batch sizing, worker delegation, validation, commit preparation, and approval-gated deploy handoff.
- `task-497`: Add remote dashboard update workflow that refreshes project feeds, readiness summaries, blockers, human-action queues, and executive daily briefing cards.
- `task-498`: Add tests for project routing, agent addressing, cross-project isolation, briefing quality gates, and source-backed remote responses.

### Phase 77 - Approval-Gated Live Execution

Promote remote Hermes from advisory chat to controlled live operations by connecting allowlisted worker execution, Codex or equivalent CLI workers, deployment rails, rollback evidence, and production-safe approval gates.

- `task-499`: Add remote execution allowlist for safe read-only actions, safe write actions, build/test actions, commit actions, push actions, deploy actions, and destructive actions.
- `task-500`: Add approval prompts that include action class, target project, command/workflow summary, risk, expected cost, rollback path, timeout, and one-tap approve/reject options.
- `task-501`: Add Codex worker adapter contract for starting a delegated coding session, streaming status, collecting evidence, handling interruptions, and returning final artifacts.
- `task-502`: Add shell/runtime worker adapter for allowlisted non-Codex project commands such as tests, health checks, feed refreshes, dashboard refreshes, and deploy scripts.
- `task-503`: Add job queue persistence for running, waiting-for-approval, completed, failed, canceled, timed-out, and resumed remote workflows.
- `task-504`: Add spend, token, and provider-limit guardrails before launching remote research, coding, or deployment workflows.
- `task-505`: Add production deployment evidence contract for commit SHA, build result, health check, deployment URL, rollback command, and post-deploy summary.
- `task-506`: Add emergency stop behavior that can cancel queued jobs, stop running workers where possible, disable gateways, and record the operator decision.
- `task-507`: Add live execution tests for dry-run parity, approval gates, worker launch, status streaming, failure recovery, rollback evidence, and emergency stop.

### Phase 78 - Remote Operator Dashboard Integration

Mirror every Discord, Telegram, CLI, API, and dashboard action into the Hermes command center so the operator can see remote activity, agent work, approvals, costs, blockers, and outcomes in one place.

- `task-508`: Add remote activity feed panel for gateway messages, routed intents, active workflows, agent traces, approvals, artifacts, commits, deploys, and failures.
- `task-509`: Add operator inbox panel for pending approvals, human-only blockers, risk acceptances, missing credentials, DNS actions, and production setup items.
- `task-510`: Add remote jobs panel with active, queued, waiting, completed, failed, canceled, and timed-out workflows across all projects.
- `task-511`: Add gateway health panel for Discord, Telegram, API, workers, queues, persistence, uptime, error rate, and delivery failures.
- `task-512`: Add project drill-through links from remote events into TLC, Khashi, Media Engine, Media Business Operations, Rinseables OS, and future registered projects.
- `task-513`: Add daily CEO briefing delivery policy for dashboard, Discord, and Telegram with severity filtering and watch-friendly summaries.
- `task-514`: Add dashboard actions to retry failed remote jobs, request more context, approve/reject pending work, open project evidence, and pause a gateway.
- `task-515`: Add end-to-end release test proving a remote message can request a project briefing, route to a specialist agent, return status, request approval for a safe workflow, execute in dry-run/live mode, and mirror the result in the dashboard.

## Operating Guardrails

- Conversation is an interface, not a replacement for Hermes OS governance.
- Chief of Staff selects workflows and delegates; it does not become the worker.
- Agents produce artifacts; Hermes OS validates and promotes them.
- High-risk, write-capable, costly, or destructive actions require approval.
- Every routed intent, delegated action, workflow checkpoint, and promoted artifact must be auditable.
- Existing command-first Hermes behavior remains available during rollout.
- Discord, Telegram, and other gateways are interfaces into Hermes OS, not independent agent brains or direct shell access.
- Remote execution must use allowlisted workflows, project-scoped context, budget checks, approval gates, and auditable worker sessions.
- Mobile/watch interactions should summarize, approve, reject, pause, and request detail; large artifacts remain source-linked in Hermes OS and project dashboards.

## Completion Definition

The COL roadmap is complete when natural-language and slash-command interactions can launch new projects, resume existing project work, route research, route architecture reviews, implement tasks through delegated agents, show progress in the dashboard, preserve session memory, and produce source-backed artifacts without requiring the operator to manually choose each command.

The remote-operator extension is complete when the operator can use Discord or Telegram from desktop, phone, or watch to request daily briefings, switch projects, ask specialist agents for current state, launch approved workflows, receive streaming progress, approve or reject risky steps, and see every remote action mirrored in the Hermes dashboard with source-backed evidence.
