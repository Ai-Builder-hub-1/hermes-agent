# Multi-gateway deployment

Hermes supports multiple gateway processes running concurrently — one per profile
(default, writer, admin, coder, researcher). Each gateway opens its own connection
to platform APIs and delivers messages for its profile's subscribers.

This deployment pattern is also the foundation for the Hermes Remote Operator
Runtime: Discord, Telegram, CLI, API, and dashboard gateways should all deliver
requests into the same Hermes command envelope instead of running independent
agent logic or direct shell commands.

## Single-dispatcher posture

Only one gateway owns the kanban dispatcher. The owning gateway keeps
`kanban.dispatch_in_gateway: true` (the default); every other gateway sets it
to `false`.

**Why this matters:** a gateway with `dispatch_in_gateway: true` opens per-board
SQLite connections for both the dispatcher and the notifier watcher. Multiple
gateways doing this concurrently multiplies the open file descriptors on each
`kanban.db` and amplifies WAL `-shm` reader contention. Gating both paths on the
same flag means exactly one process touches the kanban DBs.

## Configuration

On the dispatch-owning gateway (typically the `default` profile), no change is
needed. On every other profile gateway, add to `~/.hermes/config.yaml`:

```yaml
kanban:
  dispatch_in_gateway: false
```

Or set the env var: `HERMES_KANBAN_DISPATCH_IN_GATEWAY=false`

## What each gateway does

| Gateway role | dispatch_in_gateway | Opens per-board DBs? | Runs dispatcher + notifier? |
|---|---|---|---|
| default (dispatch owner) | true (default) | yes | yes |
| writer, admin, coder, etc. | false | no | no |

Non-dispatch gateways still deliver messages for their own platform adapters
(Telegram, Discord, etc.) — they just don't poll kanban boards.

## Remote operator gateway requirements

Remote gateways must be treated as control surfaces into Hermes OS, not as
separate bots with their own source of truth.

Each remote gateway must provide:

- platform identity mapping for allowed Discord users, Telegram users, and admin profiles
- normalized command envelopes for natural-language requests, slash commands, approvals, and rejects
- project context fields for active project, requested project, project aliases, and business-unit scope
- streaming status fanout for workflow steps, blockers, artifacts, commits, deploys, and final summaries
- duplicate message protection using platform message IDs and Hermes workflow IDs
- approval prompts for write-capable, costly, production-affecting, or destructive actions
- gateway health records for connection state, delivery failures, queue lag, and recent errors

Remote gateways must not directly execute arbitrary shell commands. They may
only request Hermes OS workflows or allowlisted runtime actions. Hermes OS owns
policy checks, approvals, worker delegation, source-of-truth updates, and audit
records.

## Remote operator rollout

1. Run all remote gateway traffic in dry-run mode.
2. Enable read-only requests such as status, briefing, project switch preview, and agent summaries.
3. Enable approval-gated workflow launch for one low-risk project.
4. Enable Codex or equivalent worker delegation behind allowlisted workflows.
5. Enable commit and deploy workflows only after production evidence, rollback, and owner policies exist.
6. Mirror every remote action into the Hermes dashboard activity feed and approval queue.
