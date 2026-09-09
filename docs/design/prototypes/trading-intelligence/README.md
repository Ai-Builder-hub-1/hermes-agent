# Trading Intelligence Control Plane — design prototypes

Four **standalone, self-contained HTML prototypes** for the Nous Hermes Trading
Intelligence page. Each file opens by double-click: no server, no build, no
network. They exist to choose an information architecture before any React is
written — none of this code is meant to ship as-is.

| File | Concept | Answers first |
|---|---|---|
| `variant-a-tabbed-command-center.html` | The handoff spec's literal layout: header → KPI ribbon → project cards → 7 tabs → events rail | "Show me everything, in order" |
| `variant-b-dense-grid.html` | One screen, no tabs. Fleet numbers left, both systems centre, live activity tape right, control bar docked bottom | "Is anything wrong, right now" |
| `variant-c-split-comparison.html` | Row-aligned diff of the two systems, with a gutter that marks which metrics are actually comparable | "Are they moving the same direction" |
| `variant-d-event-stream-console.html` | Chronological stream first, system state condensed to a left rail, controls behind a ⌘K palette | "What just happened, and why" |

## Try this first

Open any file and use the **prototype state switcher** in the striped bar at the
top: `Loaded` · `Loading` · `One source down` · `Empty` · `Summary error`, plus a
theme toggle. Every variant implements all five states and both themes — that is
the `requiredStates` evidence the dashboard certification standard asks for.

Then click any control. Every control opens a preview-first dialog: the first
request is always `execute:false`, and the execute button stays disabled until a
reason is typed for anything above low risk.

## What is real and what is mocked

**Real** — every field name, taken from the producers, not from the handoff doc:

- `investing-system/src/trading-desk/oanda.ts` — `getInvestingTradingCommandCenterSummary` / `…Events` / `…Controls`
- `khashi-vc/src/web/roc-api.ts` — `tradingCommandCenterSummary` / `…Events` / `…Controls`
- `nous-hermes-agent/hermes_cli/trading_intelligence.py` — the aggregation and normalisation

**Mocked** — the values, and only the values. The fixture reproduces the state
in the handoff §24: 2/2 sources reachable, investing `watch`, khashi `blocked`,
fleet `blocked`, 10 controls, merged events.

Nothing makes a network call. `fetch` is never invoked.

## Contract findings these prototypes are built around

Five things the handoff spec says that the code does not do. Each one is
visible in the prototypes rather than described.

1. **`credentials: "same-origin"` is not enough.** The Nous dashboard passes
   `X-Hermes-Session-Token` from `window.__HERMES_SESSION_TOKEN__` on the
   loopback path and only uses cookies when the OAuth gate is engaged
   (`web_server.py` `auth_middleware`). It also prefixes every path with
   `window.__HERMES_BASE_PATH__` for reverse-proxy deploys. The React port must
   go through `fetchJSON` in `web/src/lib/api.ts` — the §23 wrapper as written
   will 401 locally and 404 behind a prefix.
   The real 401 body is `{"detail":"Unauthorized"}`, not the §4 shape.

2. **A genuine `0` is not "No data".** `_aggregate_kpis` used `or` fallback
   chains, so `realizedPnlToday: 0` fell through to `strategyGrossPnl` and the
   fleet ribbon showed a blended `-$288.10`. Fixed in
   `hermes_cli/trading_intelligence.py` (`_first_number`); the fixture keeps
   `realizedPnlToday: 0` precisely so the ribbon can be checked: it must read
   **$124.40**, and `-$412.50` must appear only in the Investing System panel.
   Throughout, `null` renders "No data" and `0` renders `0`.

3. **The KPI contract is asymmetric.** `openRiskUsd`, `liveMarkets` and
   `paperCandidates` come only from khashi-vc. investing-system publishes
   `reviewedTrades` (not `closedTrades`) and `realizedPnlToday` (not
   `realizedPnlUsd`), and no open-risk figure at all. Variant C makes this the
   point of the page — the amber gutter marks every row where a blank means
   "not in the contract" rather than "zero".

4. **`status` is an open string.** `_normalize_project_status` passes unmatched
   source values straight through, so the four-way switch in §7 needs a default
   branch. All four variants fall back to an `unknown` tone.

5. **Controls publish neither `riskLevel` nor `requiresConfirmation`.**
   investing-system emits `dangerous` / `execution` / `effect`; khashi-vc emits
   `runbookCommand` / `requiresServiceRestart` / `brokerMutation`. Risk is
   derived from those (`H.riskLevel`), and success is never claimed on transport
   alone — `H.executionSucceeded` requires `status === "proxied"`, a 2xx, and a
   source result that is not itself rejected.

Also: the backend emits a fifth endpoint, `/api/trading-intelligence/frontend-spec`,
which §6 omits; and its events tab is labelled **"Latest Events"**, not "Events".
Rendering tabs from `summary.tabs` (as recommended) gives the backend's labels.

## Design rules applied

- Status colour is never alone — every badge is icon + word + colour.
- Status hues are reserved and never reused as a project colour; the two
  projects use categorical slots 1 (blue) and 2 (orange).
- Signed P/L gets red/green; open risk and counts stay neutral, because green
  on "open risk $260" reads as good news.
- Wide tables scroll inside their own box; the page body never scrolls sideways.
- Light and dark are both selected, not an automatic flip.
- An unavailable project is never hidden — exposing missing streams is the job.

## Verification

`verify.mjs` (kept alongside the sources) drives Chromium over every variant ×
{desktop 1440, mobile 390} × {light, dark} × all five states, clicking every tab,
filter chip and control dialog. It asserts: no console or page errors, no
horizontal page overflow, the preview→execute sequence exists and carries
`execute:true`, `null` renders "No data" while a real `0` renders `0`, and the
fleet rollup shows `$124.40` with no `strategyGrossPnl` leakage.

Current result: **all checks pass** for all four variants.

## Shipped: variant B

Variant B is the one that shipped, as `/trading-intelligence`:

| Piece | Path |
|---|---|
| Page | `web/src/pages/TradingIntelligencePage.tsx` |
| Typed client + derivations | `web/src/lib/trading-intelligence.ts` |
| Unit tests | `web/src/lib/trading-intelligence.test.ts` |
| Route | `web/src/dashboard-route-registry.tsx` |
| Governance metadata | `web/src/dashboard-page-metadata.ts` |

`evidence/` holds the screenshots the port was verified against, plus the two
scripts that produce them:

```sh
cd web && npm run build                 # SPA into hermes_cli/web_dist
node docs/design/prototypes/trading-intelligence/evidence/page-harness.mjs &
node docs/design/prototypes/trading-intelligence/evidence/page-verify.mjs
```

`page-harness.mjs` serves the built dashboard with stubbed control-plane
endpoints (`?ti=ready|degraded|empty|error`) and correctly-shaped stubs for the
shell's own endpoints. `page-verify.mjs` drives Chromium over every scenario at
1600px and 390px, in both colour schemes, and asserts: no page errors, no
horizontal overflow, `$124.40` in the fleet rollup with `strategyGrossPnl`
appearing only in the project panel, a genuine `0` rendering as `$0.00`, `null`
rendering as "No data", the degraded and empty copy, the error shell, and the
full preview → execute sequence including the reason-length gate and the
"source confirmed" check. All checks pass.

Two bugs it caught that review would not have:

- The design system paints every `<code>` element with `--midground` and
  `text-background`. Overriding only the text colour rendered the source error
  message peach-on-peach — an invisible error string in the one state where the
  operator most needs to read it.
- At the centre-column width, a side-by-side KPI row truncated
  `orderbookSnapshots` to `orderbookSna…` and `strategyGrossPnl` to
  `strategy…`. Key now sits above value.

## Porting a different variant

These are prototypes, not a design system implementation. Shipping one of the
others into `web/src` means:

1. Rebuild with `@nous-research/ui` primitives (HDK-first baseline — hand-rolled
   CSS here is deliberate throwaway).
2. Data through `fetchJSON` from `@/lib/api`, not raw `fetch`.
3. Register the route in `web/src/dashboard-route-registry.tsx`.
4. Add a `dashboardPageMetadata` entry — recipe (`operations-control-room` is
   the closest fit), owner, category, `dataContracts`, `requiredStates`,
   `validation`, and a `productionUrl` or `localOnlyReason`.
5. Poll `/summary` 30–60s, `/events?limit=10` 15–30s when visible, `/controls`
   on tab open and after every execute.
