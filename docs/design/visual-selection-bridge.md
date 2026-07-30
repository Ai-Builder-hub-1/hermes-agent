# Visual Selection Bridge

## Purpose

The Visual Selection Bridge lets an operator select a visible dashboard region in the browser and turn that selection into a structured change request for Codex or Hermes OS.

This is not a prototype-gallery-only capability. The active Hermes cost cockpit is the first proving ground, but the same pattern should work for any standalone dashboard surface.

## Current Proving Ground

| Field | Value |
| --- | --- |
| Project | Nous Hermes Agent |
| Surface | Hermes Cost Cockpit Active Prototype |
| File | `docs/design/prototype-gallery/hermes-cost-cockpit-active.html` |
| Bridge asset | `docs/design/prototype-gallery/visual-selection-bridge.js` |
| Review map | `docs/design/prototype-review-map.json` |

## Operator Workflow

1. Open the standalone dashboard page.
2. Click **Select UI** in the lower-right corner.
3. Hover the dashboard until the desired region or inner element is outlined.
4. Click the outlined area.
5. Pick the intended boundary from **Selection hierarchy** if needed.
6. Type the desired change in the panel.
7. Click **Copy request**.
8. Paste the request into Codex chat.

The bridge always runs in smart inference mode. It captures precise inferred boundaries while still keeping the nearest stable parent review ID for routing.

Smart inference does not require every inner element to be manually annotated. It infers component-like boundaries from:

- DOM structure
- visual classes such as `.metric`, `.badge`, `.side-item`, `.provider`, `.unit`, `.card`
- semantic tags such as headings, buttons, links, table rows, table cells, and values
- visible text such as `Tokens processed`
- the nearest stable parent `data-review-id`

After a click, the bridge shows a **Selection hierarchy**. For example, clicking `Tokens processed` can offer:

- `Metric label: Tokens processed`
- `Metric card: Tokens processed`
- `Parent region: cost-cockpit.metric-cards`

The operator can switch between those choices before copying the request.

For example, the bridge can target:

- a metric number
- a badge
- a table row
- a button
- a sidebar item
- a chart label
- a card heading

The copied request includes:

- project
- surface
- source file
- stable `data-review-id`
- selection mode
- selected inner element summary
- generated virtual ID
- generated element selector
- human-readable label
- operator instruction

## Handoff Shape

```json
{
  "schemaVersion": 1,
  "source": "visual-selection-bridge",
  "project": "nous-hermes-agent",
  "surface": "hermes-cost-cockpit-active",
  "file": "docs/design/prototype-gallery/hermes-cost-cockpit-active.html",
  "reviewId": "cost-cockpit.sidebar",
  "label": "Primary navigation sidebar",
  "selectionMode": "smart",
  "selectedRole": "metric-label",
  "selectedScope": "text",
  "virtualId": "cost-cockpit.metric-cards.metric-label.tokens-processed",
  "selectedElement": "Metric label: Tokens processed",
  "selectedElementSelector": "[data-review-id=\"cost-cockpit.metric-cards\"] > div:nth-of-type(1) > div",
  "instruction": "Make this sidebar feel more modern.",
  "url": "http://localhost:4178/hermes-cost-cockpit-active.html",
  "capturedAt": "2026-07-28T00:00:00.000Z"
}
```

## Responsibility Split

| Layer | Responsibility |
| --- | --- |
| Hermes OS | Universal command layer, selection-event routing, change request persistence, approval/history, cross-project dispatch. |
| Nous Hermes Agent | Dashboard design system, prototype implementation, stable review IDs, visual bridge asset, dashboard-specific change execution. |
| Downstream projects | Add stable `data-review-id` handles to screens that should support visual selection. |

## Implementation Rules

- Major reviewable regions must use stable `data-review-id` values.
- Human-facing descriptions may change, but review IDs should remain stable unless the region is intentionally retired.
- The bridge should resolve to the nearest parent with `data-review-id`, not a brittle DOM selector.
- The bridge must work without a backend: copy-to-chat is the minimum viable workflow.
- Hermes OS integration comes later: it should ingest the same payload shape rather than inventing a separate event contract.

## Current Limitations

- The bridge copies requests to the clipboard; it does not yet post directly to Hermes OS.
- It works on pages that include the bridge script and review IDs.
- It does not know source maps or React component names yet.
- It does not automatically refresh the page after Codex edits.

## Next Integration Step

When Hermes OS is ready to coordinate this flow, it should accept the same payload and route by:

1. `project`
2. `surface`
3. `reviewId`
4. mapped `file`
5. requested `instruction`

That lets Hermes OS become the command layer without moving dashboard design implementation out of Nous Hermes Agent.
