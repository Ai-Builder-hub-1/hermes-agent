# Meal Assistant V3 Visual Migration Packet

Status: Ready For Planning Review  
Project: `meal-assistant`  
Surface: `meal-dashboard-shell`  
Route: `/`

## Current State

Meal Assistant is technically clean against the rendered-implementation audit, but it is not visually mature. The sidebar, calendar, planner drawer, meal library, and spacing still feel generic and uneven. Current visual tier is `V1`; target is `V3`.

## Target Direction

Build Meal Assistant into a month-first household planning workspace:

- one real calendar grid, not disconnected day cards
- compact selected-day and multi-day planning state
- right-side drawer for day/multi-day planning
- modern meal library with filtering and quick edit
- small insight/history surface for planning rhythm
- polished sidebar using the premium dashboard standard

## Reference Families

- calendar/planner workspace
- household operations dashboard
- light-mode consumer productivity tool
- drawer-based planning flow
- entity library with filters

## Target Pages

### Planner

Month-first planning workspace with one real calendar grid, compact selected-day state, and a right-side drawer for day/multi-day planning.

### Meal Library

Modern searchable library with filters, compact meal cards or table/list toggle, clear broad meal attributes, and quick edit drawer.

### History And Insights

Small insight surface showing recent cooking, repeated proteins, skipped days, checklist history, and planning rhythm.

## Components Needed

- `PremiumSidebar`
- `PlannerMonthCalendar`
- `PlannerDayDrawer`
- `MultiDaySelectionBar`
- `MealLibrarySurface`
- `FilterRail`
- `CompactMetricStrip`
- `ChecklistExportPanel`
- `EmptyState`
- `HelpTooltip`

## Workflow Proof

- create or select meals
- select one day
- select multiple non-adjacent days
- open drawer
- save meal choices
- auto-fill remaining selected days without adjacent generated protein repeat
- export broad checklist
- reload and verify persistence

## Visual Proof Required

- desktop expanded sidebar
- desktop collapsed sidebar
- month calendar
- multi-day drawer
- meal library
- mobile planner

## Acceptance

- Rubric score >= 88.
- Human review queue state is approved.
- No clipped text or overflow.
- Calendar reads as one calendar, not unrelated cards.
- Drawer opens reliably and saves workflow state.
- New reusable components or patterns are promoted back to dashboard kit when broadly useful.

