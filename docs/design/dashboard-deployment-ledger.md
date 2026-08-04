# Dashboard Deployment Ledger

Generated: 2026-08-04T02:06:09.809Z

This ledger connects each registered dashboard to its local repo state and Hetzner deployment metadata. It does not prove what commit is currently running in production unless a project records `deployment.sourceCommit` or `deployment.commitSha`.
When promotion evidence exists on Hetzner, this report uses the latest service evidence file as the production source of truth.

| Project | Status | Local commit | Deployed commit | Service | Evidence | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| Nous Hermes Agent | tracked-with-risks | 8a28d28f5642 | unknown | nous-hermes-agent | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local repo has uncommitted changes |
| Khashi VC ROC | tracked-with-risks | c4fedfb80340 | unknown | khashi | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
| Media Engine Ops | tracked-with-risks | 1f756615b8b1 | unknown | media-engine-dashboard | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
| Media Business Operations | tracked-with-risks | ce981f471137 | unknown | media-business-operations | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
| Business Mapper Workspace | tracked-with-risks | b34b118b1f90 | unknown | business-mapper | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
| Meal Assistant | tracked-with-risks | 33049524b2f1 | unknown | meal-assistant | missing | production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
| Investing System ROC | tracked-with-risks | 4a6db7a83f8a | unknown | investing-system | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local repo has uncommitted changes |
| Hermes Workspace | tracked-with-risks | 9ede741a20f0 | unknown | hermes | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local repo has uncommitted changes |
| TLC Capital Group OS | tracked-with-risks | c66123fe4647 | unknown | tlc-capital-group-os | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local branch has unpushed commits |
