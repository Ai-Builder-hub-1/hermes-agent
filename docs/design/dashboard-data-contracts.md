# Dashboard Data Contracts

Every production dashboard should expose enough normalized data for Hermes to
summarize status without opening the UI.

Minimum dashboard registry fields:

- `projectName`
- `projectPath`
- `healthUrl`
- `snapshotUrl`

Minimum snapshot concepts:

- `DashboardSnapshot`: project identity, generated time, freshness, status.
- `HealthSnapshot`: uptime, checks, incidents, degraded dependencies.
- `CostSnapshot`: spend, token/API usage, budget pressure.
- `CapacitySnapshot`: queue pressure, scheduler capacity, worker health.
- `ActionNeeded`: owner, severity, due time, recommended next action.

Project-specific APIs can keep their local shape, but each project needs an
adapter into these shared concepts before it can be telemetry-normalized.
