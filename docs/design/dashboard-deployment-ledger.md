# Dashboard Deployment Ledger

Generated: 2026-08-05T13:23:36.729Z

This ledger connects each registered dashboard to local repo state, Hetzner deployment metadata, and the latest promotion evidence when available. Services without promotion evidence still need a recorded deployed commit before their production source can be treated as proven.

| Project | Status | Local commit | Deployed commit | Service | Evidence | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| Nous Hermes Agent | tracked | 353243782ef0 | 353243782ef0 | nous-hermes-agent | nous-hermes-agent-2026-08-05T02-58-05Z | none |
| Khashi VC ROC | tracked-with-risks | 5104d391c74d | unknown | khashi | missing | deployment source note missing; production commit not recorded; promotion evidence unavailable; local repo has uncommitted changes |
| Media Engine Ops | tracked | 42b1ce195393 | 42b1ce195393 | media-engine-dashboard | media-engine-dashboard-2026-08-05T02-52-39Z | none |
| Media Business Operations | tracked-with-risks | 49ae37cf0abe | 49ae37cf0abe | media-business-operations | media-business-operations-2026-08-05T02-51-26Z | local repo has uncommitted changes |
| Business Mapper Workspace | tracked-with-risks | a2ff9504a726 | a2ff9504a726 | business-mapper | business-mapper-2026-08-05T02-51-05Z | local repo has uncommitted changes |
| Meal Assistant | tracked-with-risks | 5212aa31c8d2 | unknown | meal-assistant | missing | production commit not recorded; promotion evidence unavailable; local repo has uncommitted changes |
| Investing System ROC | tracked | de5c212ed8f9 | de5c212ed8f9 | investing-system | investing-system-2026-08-05T02-54-12Z | none |
| Hermes Workspace | tracked-with-risks | 0fa6bc3c2dd2 | 0fa6bc3c2dd2 | hermes | hermes-2026-08-05T12-58-07Z | local repo has uncommitted changes |
| TLC Capital Group OS | tracked | 9d7b4f99d692 | 9d7b4f99d692 | tlc-capital-group-os | tlc-capital-group-os-2026-08-05T02-54-36Z | none |
