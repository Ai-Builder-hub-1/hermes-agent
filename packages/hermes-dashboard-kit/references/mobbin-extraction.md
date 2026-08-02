# Mobbin Extraction Notes

Mobbin was used as reference input for reusable patterns, not as copied UI.

## Reference Searches

- Analytics dashboard with sidebar, data table, line charts, metric cards, and drilldown panel.
  - [Mixpanel reference](https://mobbin.com/screens/10d76bb3-6f65-4805-ad42-30ee24ec78e2)
  - [Pinterest reference](https://mobbin.com/screens/85521cd3-384e-4b60-878c-0ea45ee6701a)
  - [LangChain reference](https://mobbin.com/screens/b43a980d-6a77-48d5-b764-d697475a157c)
  - [Vercel reference](https://mobbin.com/screens/172f9834-0e6a-4fa8-abd4-6e91b02b5ef4)
- Financial trading dashboard with market table, price chart, watchlist, order book, and detail drawer.
  - [Kraken reference](https://mobbin.com/screens/5bdd6cb2-5040-44c4-8781-c70f3aea60a8)
  - [Binance reference](https://mobbin.com/screens/d221a27f-1087-431a-a7ab-951051a292db)
  - [OKX reference](https://mobbin.com/screens/5757d656-1d7c-4896-a5ad-349bfa78458b)
  - [Coinbase reference](https://mobbin.com/screens/e7c087d3-435d-4035-8fed-a18e70dbc46a)
- Calendar/planning dashboard with sidebar, drawer form, table tabs, and product interface.
  - [Midday reference](https://mobbin.com/screens/6f3df76d-09ea-4a4c-acaf-f6684ab14e1f)
  - [Time2book reference](https://mobbin.com/screens/c101a468-c2e9-4803-957e-b49489612815)
  - [Amie reference](https://mobbin.com/screens/4b4b1ff2-a31b-4e7c-b5eb-d5e64b45e347)
  - [Motion reference](https://mobbin.com/screens/0417b2c0-aa06-4466-bb0e-2b6afaf4f853)
- Operations command center with approval queues, issue timelines, workflow status, and publishing actions.
  - [Manus reference](https://mobbin.com/screens/6459d49c-17ac-4f10-bf92-b70d5e0a20e4)
  - [Replit reference](https://mobbin.com/screens/391346fa-b178-4a09-a9e0-206bf55d62a0)
  - [Employment Hero reference](https://mobbin.com/screens/9e501280-5c35-49d9-825d-039d85fd9af5)
  - [PlanetScale reference](https://mobbin.com/screens/be0ec4c5-4a49-4f4a-8a29-179143a514c5)
- Calendar and planning workspaces with month grid, selected-day detail, right drawer, and library/filter relationship.
  - [Jobber reference](https://mobbin.com/screens/36069a10-c2f8-4d88-8153-bd57f50e289a)
  - [Assembly reference](https://mobbin.com/screens/0329a411-7058-4cf7-bf21-6682d8ed2f23)
  - [Sprout Social reference](https://mobbin.com/screens/68209e50-690c-470e-871e-bab21a61e817)
  - [Adobe Express reference](https://mobbin.com/screens/a9946797-645c-4f24-b8c3-2d63fff7e630)
- Enterprise portfolio and project-feed dashboards with readiness, approvals, executive operations, and project rollups.
  - [Wrike reference](https://mobbin.com/screens/870801c6-8507-473d-be80-594f713ac360)
  - [Asana reference](https://mobbin.com/screens/96adabaf-18ec-4ea4-a786-f7924df08f8e)
  - [Linear reference](https://mobbin.com/screens/9c8e3907-b7af-48d6-ae2d-9b4ff700d433)
  - [Plane reference](https://mobbin.com/screens/14824988-ad65-403a-9acf-5de457043a06)
- Business mapping and validation workspaces with graph/detail layouts, recommendation boards, advisory timelines, and evidence review.
  - [Obvious reference](https://mobbin.com/screens/1f73557c-e0dd-45c8-af73-a6e300c14462)
  - [Adaline reference](https://mobbin.com/screens/34d120dd-fad7-40f3-bb1f-a8713df94385)
  - [Productboard reference](https://mobbin.com/screens/e02ef67a-b98f-4ff3-aaa4-f1fa406b6dd3)
  - [Mixpanel reference](https://mobbin.com/screens/585399fe-fa56-4556-a7af-36981ff900b0)

## Extracted Standards

- Navigation should feel like one product shell, not a page embedded inside another page.
- Dense dashboards should lead with a command header, compact metrics, and a primary work surface.
- Market/trading views need a tape/watchlist, chartable detail panel, and time-window controls.
- Charts need visible axes, grid/scale context, labels, and a clear insufficient-data state.
- Tables need pagination, contained horizontal overflow, and row density fit for repeated scanning.
- Drawers are preferred for selected-record details when the user is browsing a large list.
- Planning/calendar flows should use a large navigable calendar and right-side planning drawer, not disconnected cards.
- Empty/error/stale/proof states should be first-class UI, not console/debug text.
- Operations dashboards need a clear distinction between observation, approval, execution, and exception handling.
- Calendar dashboards need a true calendar surface, not disconnected day cards, plus a drawer for selected-day or selected-range work.
- Enterprise portfolio dashboards should separate executive rollup, project feed, readiness evidence, approvals, and outcomes instead of dumping raw JSON.
- Business mapping dashboards should treat graph, validation queue, recommendations, roadmap, and advisory timeline as coordinated panels in one workspace.

## What Must Not Happen

- Do not copy complete Mobbin screens.
- Do not treat Mobbin as a runtime dependency.
- Do not ship raw placeholder charts after a page claims Tier 3.
- Do not let individual projects invent their own shell, table, chart, and drawer standards.
