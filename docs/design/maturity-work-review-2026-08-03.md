# Cross-Project Maturity Work Review

Generated: 2026-08-03

## Executive Status

The dashboard UX/design maturity layer is green. Current automated evidence shows:

- `npm run dashboard:governance:refresh-all`: passed.
- `npm run dashboard:standards:summary:fast`: passed.
- `npm run dashboard:health:validate:live`: passed for 9 dashboards.
- `npm run dashboard:world-class:report`: 100/100, world-class-ready.
- Production proof registry: 9/9 baselines present, no auth-wall or blank-primary flags.
- Telemetry contract report: 9/9 ready.
- Visual quality report: all governed surfaces pass at 100.

The remaining maturity work is no longer primarily a UI/design-system problem. It is operating maturity: deployment provenance, deterministic package distribution, runtime data ownership, release hygiene, and automation hardening.

## Maturity Split

| Layer | Current Status | Interpretation |
| --- | --- | --- |
| UI/design system | Green | Dashboard kit, visual quality, proof baselines, telemetry contracts, and standards gates are operating. |
| Production health | Green | All registered dashboards pass live health validation. |
| Deployment provenance | Not mature | Registry knows how to deploy, but it does not yet record what exact commit is running or rollback source per service. |
| Repo hygiene | Mixed | Several project repos have unpushed local commits; Investing System has uncommitted source changes. |
| Package distribution | Mixed | Nous owns source package and Media Engine vendors it; six projects still use fragile sibling `file:` dependencies; Investing System is missing the dependency. |
| Runtime data policy | Mixed | Media Engine, Media Business Operations, and Business Mapper track runtime-like data that needs classification or relocation. |
| Deploy tooling | Improved | Hermes promotion script now scopes single-service promotion and makes full-fleet rebuild explicit with `HERMES_PROMOTE_FULL_FLEET=1`. |

## P0 Maturity Work

### 1. Deployment Source Stamping

Current status: the promotion script now writes deployment evidence for successful service promotions, and the central deployment ledger reads the latest evidence from Hetzner. Nous Hermes Agent is the first proven service: its deployed commit, previous rollback commit, image ID, health result, and evidence event are recorded.

Remaining gap: the other services still need at least one promotion through the updated script before their production source can be treated as proven. Until then, they still report `production commit not recorded` and `promotion evidence unavailable`.

Impact:

- Operators cannot prove from the central registry which commit is currently live.
- Rollbacks still rely on manual memory or shell history.
- A green production health check does not prove the intended source was deployed.

Required work:

- Roll the updated promotion script across each service promotion.
- Extend evidence to include public proof URL result and screenshot capture result, not only service health.
- Add operator identity to the evidence record.
- Add strict promotion validation once every service has at least one recorded source event.

### 2. Repo-State Hygiene Before Promotion

Current repo state:

| Project | State |
| --- | --- |
| Nous Hermes Agent | Clean, private `main` in sync. |
| Hermes Workspace | Clean, private deploy branch in sync. |
| Khashi VC | Clean, ahead 1. |
| Media Engine | Clean, ahead 4. |
| Media Business Operations | Clean, ahead 2. |
| Business Mapper | Clean, ahead 1. |
| Meal Assistant | Clean, ahead 1. |
| TLC Capital Group OS | Clean, ahead 2. |
| Investing System | Dirty: `docs/strategic-vision.md`, `src/api/server.ts`. |

Required work:

- Push or intentionally archive all ahead commits in private repos.
- Inspect and commit or revert the Investing System changes. The API change appears useful because it adds `/api/dashboard-snapshot`; the doc title change appears accidental: `#  EMB fileLeon Strategic Vision`.
- Add a promotion preflight that fails when the target repo has uncommitted changes unless a backup branch has been created and pushed privately.

### 3. Private-Only Remote Policy

Current status:

- Nous Hermes Agent local and Hetzner remotes now point only to private `Ai-Builder-hub-1/hermes-agent`.
- Hermes Workspace deploy tooling is private.

Required work:

- Run a cross-project remote audit and enforce that push URLs never point to public upstreams.
- Keep public upstreams, if needed, read-only and named `upstream-public-readonly`.
- Add a pre-push/pre-deploy guard that blocks public push URLs in production projects.

## P1 Maturity Work

### 4. Dashboard Kit Distribution

Current distribution status:

| Project | Status |
| --- | --- |
| Nous Hermes Agent | Ready: source package owner. |
| Media Engine | Ready: vendored package copy. |
| Investing System | Blocked: missing `@hermes/dashboard-kit`. |
| Khashi VC | Advisory: sibling `file:../nous-hermes-agent/...`. |
| Media Business Operations | Advisory: sibling `file:../nous-hermes-agent/...`. |
| Business Mapper | Advisory: sibling `file:../nous-hermes-agent/...`. |
| Meal Assistant | Advisory: sibling `file:../nous-hermes-agent/...`. |
| Hermes Workspace | Advisory: sibling `file:../nous-hermes-agent/...`. |
| TLC Capital Group OS | Advisory: sibling `file:../nous-hermes-agent/...`. |

Required work:

- Pick one deterministic package distribution model:
  - private npm package, or
  - vendored package copy with refresh script, or
  - true workspace layout for projects intentionally deployed together.
- Short-term practical fix: standardize on `vendor/hermes-dashboard-kit` for independently deployed projects, with a refresh command that copies from Nous and validates hash/version.
- Add `@hermes/dashboard-kit` to Investing System or mark why Investing is intentionally non-kit.

### 5. Runtime Data Ownership

Current runtime-data review items:

| Project | Files |
| --- | --- |
| Media Engine | 9 runtime-like tracked files under `data/`. |
| Media Business Operations | `data/dashboard-snapshot.json`. |
| Business Mapper | `data/workspaces/_workspace-index.json`, `data/workspaces/demo-real-estate.json`. |

Required work:

- Classify each tracked data file as `fixture`, `seed`, `config`, `snapshot artifact`, or `runtime state`.
- Keep fixture/config files tracked with a manifest.
- Move runtime state to `/data/<service>` or object storage and add `.gitignore` coverage.
- Add per-project data policy docs and a central runtime-data validator that accepts declared fixtures.

### 6. Deploy Tooling Regression Tests

Current status:

- The production script was fixed to avoid fleet-wide dependency traversal during normal service promotion.
- Syntax was validated locally and on Hetzner.
- The fix is live on Hetzner and committed to Hermes Workspace at `9ede741`.

Required work:

- Add a shell-level test or static check asserting normal promotion does not run `docker compose up -d --build ... caddy`.
- Add a dry-run mode to `promote-service.sh` that prints target repo, resolved commit, compose build targets, compose up targets, Caddy action, and health checks without changing production.
- Add `HERMES_PROMOTE_FULL_FLEET=1` evidence requirements before full-stack rebuilds.

## P2 Maturity Work

### 7. Maturity Scoring Refinement

Current issue:

- `world-class-ready 100/100` is accurate for the UI/proof/design governance layer, but it masks operating maturity issues that should not be described as fully mature.

Required work:

- Split score reporting into at least two top-level scores:
  - `Dashboard Experience Maturity`
  - `Operations And Release Maturity`
- Keep current 100/100 dashboard score.
- Add an operations score that includes deployment source stamping, private remote policy, package distribution, runtime-data policy, repo hygiene, and deploy automation tests.

### 8. Release Train Automation

Required work:

- Convert the next-actions report into an executable but guarded release train.
- Require green live health, clean repo state, private remotes, known rollback refs, and package distribution checks before promotion.
- Store promotion artifacts in a durable location with links from the central dashboard.

### 9. Screenshot/Proof Freshness

Current status:

- Production baselines exist and are clean.

Required work:

- Add freshness SLA enforcement for production screenshots.
- Capture screenshots after each production deploy and tie them to the deployment ledger event.
- Keep auth-proof capture documented for protected dashboards.

## Recommended Build Sequence

1. V14: Deployment Source Ledger
   - Status: in progress.
   - Done: promotion script writes append-only deploy evidence; Nous ledger consumes latest Hetzner evidence; Nous Hermes Agent has a proven deployment event.
   - Remaining: promote the rest of the services through the updated script, add proof/screenshot result capture, and require strict evidence after all services have a baseline event.

2. V15: Private Remote And Repo Hygiene Gate
   - Add cross-project remote audit.
   - Block public push URLs and dirty deploy checkouts.

3. V16: Dashboard Kit Distribution Cutover
   - Pick private package or vendored distribution.
   - Fix Investing System dependency.
   - Replace sibling `file:` dependencies.

4. V17: Runtime Data Policy
   - Add fixture/runtime manifests.
   - Move generated runtime state out of git.

5. V18: Promotion Script Test Harness
   - Add dry-run mode and static tests.
   - Require explicit full-fleet rebuild approval.

6. V19: Operations Maturity Score
   - Split dashboard experience score from operations maturity score.
   - Surface both in the central dashboard.

7. V20: Release Train Runner
   - Turn review evidence into controlled multi-project promotion with rollback artifacts.

## Bottom Line

The system has reached high dashboard maturity. The next serious standard upgrade is not more UI polish; it is making production operations auditable, repeatable, private-only, and recoverable. The most important next build is V14 deployment source stamping because it closes the biggest gap between "production is healthy" and "we can prove exactly what is running and how to roll it back."
