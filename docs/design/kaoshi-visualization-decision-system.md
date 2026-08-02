# Kaoshi Visualization Decision System

Status: V3 complete baseline
Owner: Nous Hermes Agent / Hermes Dashboard Kit

## Purpose

Charts are not decoration. A visualization is allowed only when it answers a better operator question than a table, KPI card, or text finding can answer alone.

This document defines the Kaoshi visualization decision system. Mobbin can inform layout taste and interaction patterns, but final implementation must use Hermes contracts, tokens, states, and proof.

## Decision Flow

1. Name the operator question.
2. Identify the data shape: single value, ranked list, time series, distribution, category matrix, flow, network, forecast, or market microstructure.
3. Classify freshness: static, manual, periodic, near-live, live, historical, forecast, or unknown.
4. Select the smallest visualization that answers the question.
5. Define interactions: hover, crosshair, selection, drilldown, zoom, compare, filter, reset, export.
6. Define fallback: table, summary, text, or no-data explanation.
7. Define proof: screenshot, unit/contract test, visual QA, accessibility check, live-data validation.

## Approved Families

| Family | Use When | Preferred Components |
| --- | --- | --- |
| Time series | Show movement over time | `PriceMovementChart`, line, area, stepped line, sparkline, event timeline |
| Market microstructure | Show live market movement, spread, depth, volume | `PriceMovementChart`, `SpreadBandChart`, `LiquidityDepthChart`, `VolumePulseChart`, `OrderBookLadder` |
| Category comparison | Show relative opportunity by segment/category/tag | `CategoryHeatmap`, `OpportunityMatrix`, ranked table, grouped bar |
| Distribution | Show spread, percentile, outliers, concentration | histogram, percentile strip, box-summary |
| Forecast and uncertainty | Show expected path with confidence | `ForecastConeChart`, confidence band, scenario range |
| Flow and dependency | Show movement or dependency across entities | sankey, dependency graph, funnel, handoff timeline |
| Executive finance | Show spend, budget, revenue, cost drivers | `ProviderSpendTimeline`, `WaterfallChart`, budget burn, cost/revenue ratio |
| Readiness and quality | Show maturity, gates, risk posture | scorecard, readiness radar, maturity ladder, gate checklist |

## Minimum Visual Quality Bar

Every chart must include:

- clear title tied to a user decision
- data freshness label
- source/provenance or confidence indicator
- loading, empty, stale, error, preview, and partial states where relevant
- accessible name and equivalent tabular/text fallback
- readable axes and labels at dashboard density
- hover/crosshair details for dense time-series data
- no fake hand-drawn chart in production mode
- no generic chart if a domain-specific visual exists in the kit

## Current Priority

Kashi Market Intelligence / Live Volatility should use this order:

1. Live market tape with pagination and row selection.
2. Selected-market drawer with price movement, spread, depth, volume, and snapshot count.
3. Category heatmap for live coverage by category/subcategory.
4. Opportunity matrix only after category taxonomy and liquidity fields are trustworthy.
5. Historical expired-market list with replayable snapshot series.

## Machine-Readable Source

The executable matrix lives in:

- `experience-audit/visualization-intent-matrix.yaml`

Validate with:

```bash
npm run dashboard:kaoshi:validate
```

