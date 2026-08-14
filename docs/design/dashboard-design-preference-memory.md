# Dashboard Design Preference Memory

Status: Active  
Version: V1

This file captures reusable taste decisions so future work does not repeat rejected dashboard patterns.

## Global Preferences

- Avoid generic static dashboards. Technical compliance is not the same as visual approval.
- Avoid fat repeated banners. Keep command context compact unless it is the main command-center surface.
- Put tables inside coherent cards/surfaces, use tabs for related tables, and paginate at 10/25/50 when row counts exceed threshold.
- Move long helper text into help icons/tooltips when it clutters the page.
- Use real modern chart components with axes, labels, tooltips, states, and comparison controls.
- Keep every product to one shell, one sidebar, one header model, and no nested standalone app.

## Approved References

- `khashi-live-command-direction`: Kashi Live Command is a stronger cockpit direction than older static pages.

## Rejected Patterns

- `meal-assistant-generic-planner`: Meal Assistant is technically aligned but still visually generic; sidebar and spacing do not yet feel like the standard.

