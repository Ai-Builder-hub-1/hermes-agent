# Dashboard Deployment Ledger

Generated: 2026-08-04T00:01:32.712Z

This ledger connects each registered dashboard to its local repo state and Hetzner deployment metadata. It does not prove what commit is currently running in production unless a project records `deployment.sourceCommit` or `deployment.commitSha`.

| Project | Status | Branch | Commit | Service | Risks |
| --- | --- | --- | --- | --- | --- |
| Nous Hermes Agent | tracked-with-risks | main | ae5671814bce | nous-hermes-agent | deployment source note missing; production commit not recorded |
| Khashi VC ROC | tracked-with-risks | main | c4fedfb80340 | khashi | deployment source note missing; production commit not recorded; local branch has unpushed commits |
| Media Engine Ops | tracked-with-risks | main | 1f756615b8b1 | media-engine-dashboard | deployment source note missing; production commit not recorded; local branch has unpushed commits |
| Media Business Operations | tracked-with-risks | main | ce981f471137 | media-business-operations | deployment source note missing; production commit not recorded; local branch has unpushed commits |
| Business Mapper Workspace | tracked-with-risks | main | b34b118b1f90 | business-mapper | deployment source note missing; production commit not recorded; local branch has unpushed commits |
| Meal Assistant | tracked-with-risks | main | 33049524b2f1 | meal-assistant | production commit not recorded; local branch has unpushed commits |
| Investing System ROC | tracked-with-risks | main | 4a6db7a83f8a | investing-system | deployment source note missing; production commit not recorded; local repo has uncommitted changes |
| Hermes Workspace | tracked-with-risks | deploy/hermes-workspace-hetzner | 9ede741a20f0 | hermes | deployment source note missing; production commit not recorded |
| TLC Capital Group OS | tracked-with-risks | main | c66123fe4647 | tlc-capital-group-os | deployment source note missing; production commit not recorded; local branch has unpushed commits |
