# Operating Interface Visual QA

Status: implemented as a QA manifest; screenshot automation is the next proof layer.

This file defines the visual checks every shared dashboard component must survive before a project treats it as production-ready.

## Required Viewports

- Desktop: 1440 x 1000
- Compact laptop: 1180 x 820
- Tablet: 820 x 1180
- Mobile: 390 x 844

## Required Screens

- Operating interface gallery
- Hermes cost cockpit
- Kashi market intelligence
- Media Engine ops cockpit
- TLC enterprise readiness

## Required States

- Ready
- Loading
- Empty
- Error
- Preview/mock data
- Stale data
- Permission-limited
- Partial data

## Required Checks

- No overlapping text.
- No clipped controls.
- Tables and market tapes scroll horizontally when needed.
- Drawer content remains usable on compact laptop and mobile.
- Command/search surfaces can be reached by keyboard.
- Charts have labels, tooltips/crosshair affordance, and empty-state fallback.
- Mock-preview data is visibly labeled.
- Static adapter pages and React package-native pages share the same visual tokens.

## Current Proof Status

- Kit build: required.
- Interface registry validation: required.
- Static adapter validation: required.
- Automated screenshot comparison: backlog.
