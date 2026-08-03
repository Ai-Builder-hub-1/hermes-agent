# Dashboard Next Actions Execution Report

Generated: 2026-08-03T16:44:24.080Z
Mode: dry-run
Actions evaluated: 45
Blocked: 0
Skipped: 0

## Summary

- Git status: dirty: 33, clean: 12
- Strategies: project-implementation: 34, derived: 7, patch-with-review: 4
- Status: planned: 45
- Recommended clean batch: 10 action(s)

## Actions

- P0 business-mapper [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P0 business-mapper [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P0 business-mapper [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P1 business-mapper [bridge] Add visual-selection bridge and stable review handles.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: patch-with-review (medium) - Bridge fixes can touch runtime paths and review hooks; generate a targeted patch after inspecting the owning project.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P1 business-mapper [telemetry] Complete dashboard telemetry contract.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: project-implementation (medium) - Snapshot endpoints require project-owned API/data adapters.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P1 business-mapper [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../business-mapper
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: python -m py_compile business_mapper/web.py business_mapper/core.py
- P0 hermes-os [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: npm run build
- P0 hermes-os [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm run build
- P0 hermes-os [proof] Capture and review a clean production screenshot baseline.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm run build
- P0 hermes-os [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: npm run build
- P1 hermes-os [migration] Clear package-native migration codemod candidate.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (medium) - Migration candidates require explicit package-native cutover work.
  Project validation: npm run build
- P1 hermes-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P1 hermes-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P1 hermes-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../hermes
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P0 investing-system [proof] Capture and review a clean production screenshot baseline.
  Status: planned
  Project path: ../investing-system
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm run build
- P1 investing-system [telemetry] Complete dashboard telemetry contract.
  Status: planned
  Project path: ../investing-system
  Git: dirty
  Strategy: project-implementation (medium) - Snapshot endpoints require project-owned API/data adapters.
  Project validation: npm run build
- P0 khashi-vc [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../khashi-vc
  Git: dirty
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: npm run build
- P0 khashi-vc [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../khashi-vc
  Git: dirty
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: npm run build
- P1 khashi-vc [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../khashi-vc
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P0 meal-assistant [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: node --check src/server.js
- P0 meal-assistant [deployment] Complete Hetzner deployment metadata or remove from production registry.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: patch-with-review (medium) - Deployment metadata must match the Hetzner deployment spine or the project must be removed from production registry.
  Project validation: node --check src/server.js
- P0 meal-assistant [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: node --check src/server.js
- P0 meal-assistant [proof] Capture and review a clean production screenshot baseline.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: node --check src/server.js
- P0 meal-assistant [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: node --check src/server.js
- P1 meal-assistant [migration] Clear package-native migration codemod candidate.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (medium) - Migration candidates require explicit package-native cutover work.
  Project validation: node --check src/server.js
- P1 meal-assistant [telemetry] Complete dashboard telemetry contract.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (medium) - Snapshot endpoints require project-owned API/data adapters.
  Project validation: node --check src/server.js
- P1 meal-assistant [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../Meal-assistant
  Git: dirty
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: node --check src/server.js
- P0 media-business-os [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: npm test
- P0 media-business-os [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm test
- P0 media-business-os [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: npm test
- P1 media-business-os [bridge] Add visual-selection bridge and stable review handles.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: patch-with-review (medium) - Bridge fixes can touch runtime paths and review hooks; generate a targeted patch after inspecting the owning project.
  Project validation: npm test
- P1 media-business-os [bridge] Add visual-selection bridge and stable review handles.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: patch-with-review (medium) - Bridge fixes can touch runtime paths and review hooks; generate a targeted patch after inspecting the owning project.
  Project validation: npm test
- P1 media-business-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm test
- P1 media-business-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../media-business-operations
  Git: clean
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm test
- P0 media-engine [adoption] Move adoption status from needs-review to current.
  Status: planned
  Project path: ../media-engine
  Git: dirty
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: node --check tasks/ops-dashboard-server.js
- P0 media-engine [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: ../media-engine
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: node --check tasks/ops-dashboard-server.js
- P0 media-engine [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../media-engine
  Git: dirty
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: node --check tasks/ops-dashboard-server.js
- P0 nous-hermes-agent [proof] Declare a readonly production proof endpoint.
  Status: planned
  Project path: .
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm run dashboard:design-system:test | npm run dashboard:starter:validate | ./packages/hermes-dashboard-kit/node_modules/.bin/tsc -p packages/hermes-dashboard-kit/tsconfig.json --noEmit
- P0 nous-hermes-agent [proof] Capture and review a clean production screenshot baseline.
  Status: planned
  Project path: .
  Git: dirty
  Strategy: project-implementation (medium) - Proof endpoints must be implemented in the owning app, not declared centrally without a route.
  Project validation: npm run dashboard:design-system:test | npm run dashboard:starter:validate | ./packages/hermes-dashboard-kit/node_modules/.bin/tsc -p packages/hermes-dashboard-kit/tsconfig.json --noEmit
- P1 nous-hermes-agent [telemetry] Complete dashboard telemetry contract.
  Status: planned
  Project path: .
  Git: dirty
  Strategy: project-implementation (medium) - Snapshot endpoints require project-owned API/data adapters.
  Project validation: npm run dashboard:design-system:test | npm run dashboard:starter:validate | ./packages/hermes-dashboard-kit/node_modules/.bin/tsc -p packages/hermes-dashboard-kit/tsconfig.json --noEmit
- P0 tlc-capital-group-os [adoption] Move adoption status from stale to current.
  Status: planned
  Project path: ../tlc-capital-group-os
  Git: clean
  Strategy: project-implementation (low) - Adoption fixes require package-native surface changes in the owning project.
  Project validation: npm run build
- P0 tlc-capital-group-os [readiness] Remove dashboard readiness penalty/cap.
  Status: planned
  Project path: ../tlc-capital-group-os
  Git: clean
  Strategy: derived (high) - Readiness clears automatically after adoption/proof/telemetry blockers clear.
  Project validation: npm run build
- P1 tlc-capital-group-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../tlc-capital-group-os
  Git: clean
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P1 tlc-capital-group-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../tlc-capital-group-os
  Git: clean
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
- P1 tlc-capital-group-os [visual] Raise visual quality score to at least 90 and pass all checks.
  Status: planned
  Project path: ../tlc-capital-group-os
  Git: clean
  Strategy: project-implementation (low) - Visual quality fixes require page-specific UI work and screenshot review.
  Project validation: npm run build
