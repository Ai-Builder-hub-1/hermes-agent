# Visual Selection Bridge

The visual selection bridge is a review-only layer for mapping screenshots and
prototype surfaces back to implementation handles.

Production dashboards should expose stable `data-review-id` hooks for proof and
review. The bridge runtime must stay dev-only or proof-only and must not become
the product navigation model.

Required evidence:

- every active/prototype surface has `data-review-id` handles;
- bridge coverage is checked with `npm run dashboard:bridge:coverage`;
- any missing bridge coverage is treated as a review gap, not a completed Tier 3 surface.
