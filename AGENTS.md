# Games2 — repository agent and contributor policy

Read this file before creating, editing or reviewing a game. Also read the target game's own `<game>/AGENTS.md`. The game's narrower rules supplement, but cannot waive, these repository rules.

## Scope and ownership

- Games2 owns **actual original games** under one root directory per game, e.g. `strikepixel/`. Do not put new game implementation in the repository root.
- [VANILLAJS](https://github.com/QSOLKCB/VANILLAJS) owns reusable engine systems, physics, Game Labs, mod tooling and tutorials. A game may consume a **reviewed, immutable engine revision**; it must not make VANILLAJS import code back from Games2.
- Default to **one new game per implementation PR**. Follow the mandatory two-pass process below; state any justified technical exception to PR scope explicitly.
- Every game directory requires `README.md`, `ROADMAP.md` and `AGENTS.md` before implementation.
- Preserve [all ideas](docs/GAME_IDEAS.md) and the [complete donor catalogue](docs/DONOR_CATALOGUE.md). Do not silently drop or rename proposals.
- Changes to VANILLAJS require a **separate VANILLAJS PR** and owner review. Never silently modify both repositories.

## Mandatory two-pass development policy

Every new game must plan **Implementation → Polish → Release Review** before its
initial release. Read [the development process](docs/DEVELOPMENT_PROCESS.md).

1. **Pass 1 — Implementation:** one original game in its own directory, a complete playable vertical slice, automated tests, actual browser verification, documentation and provenance; submit one focused implementation PR.
2. **Pass 2 — Polish:** after that implementation PR merges, improve the same game in a separate polish PR, followed by owner review. Address gameplay/difficulty, graphics/animation/effects, soundtrack/audio feedback, controls/input, menus/HUD/accessibility, performance/rendering work, bugs/recovery, offline packaging/deployment, regression tests and actual browser gameplay. Avoid unrelated games or excessive unfinished features.
3. **Pass 3 — Release Review:** an owner approval gate, **not automatically a third implementation PR**. Both PRs must be merged, required tests/CI must pass, the deployed preview must work, limitations must be documented, and the owner must test through the Cartridge Cabinet and explicitly authorise release.

- Every game's `ROADMAP.md` must visibly track all three stages, their status, PR/evidence references and remaining release gates. Its `AGENTS.md` must link to this policy and the local progression. Update both as work advances; never infer release approval from a merge or deployment.
- Critical defects may be fixed immediately. The owner may approve further polish PRs; failed release review returns the game for corrections. Two passes are a minimum quality process, not a guarantee of release readiness. Later enhancements and bug fixes do not repeat the whole process.
- The owner selected Circuit Vice after Strike Pixel. Later selections have their
  own implementation and polish PRs. Consult the [portfolio register](docs/FUTURE_GAME_DIRECTORIES.md)
  and each game's roadmap for current status.

## Engineering

- Native HTML, CSS, JavaScript and browser standards first. No npm **runtime** packages, CDN assets, external game engine, Docker, mandatory cloud services or opaque build pipeline by default. Existing Node development tools are allowed where useful.
- Prefer simple, inspectable and offline-reproducible code. Use Python's standard library and `uv run` where a Python helper is genuinely appropriate.
- Preserve Apache-2.0 licensing and source/asset notices. Audit donor code and third-party assets individually at immutable source commits. Inspirations are **design references**, not licences.
- No copyrighted game replicas, ripped assets, ROMs, commercial soundtracks or trademarks presented as an official product.
- Use explicit fixed-step game simulation with bounded catch-up, input cancellation, pause/focus semantics and declared numerical limits where appropriate.
- Separate renderer/device presentation from authoritative simulation and replay state. Do not claim universal cross-browser Float64 or pixel identity.
- Use bounded, data-only mod schemas where mods are supported. Validate completely before replacing accepted state.
- Keep save/replay formats versioned. Invalid imports, stale records, unsupported versions and resource exhaustion must fail safely.

## Player ownership and content

- Default: no accounts, login, telemetry, ads, subscriptions, loot boxes, premium currencies, battle passes, paywalls, paid weapon unlocks or entitlement checks.
- Prefer original procedural or appropriately licensed local assets and soundtrack material.
- No network multiplayer in a first offline game unless separately approved and scoped.
- Each game's artistic identity, levels, characters, progression, soundtrack and release assets remain game-owned.

## Changes, evidence and review

- Read the target game's README, ROADMAP and agent policy; inspect VANILLAJS `MODULES.json` and the relevant public API contracts before using engine code.
- Record the exact VANILLAJS release/commit and the selected module dependency closure in an inspectable provenance file **when code is added**. The documentation-only PR does not vendor runtime code.
- For implementation PRs, add and execute meaningful Node tests and packaged browser checks, including controls, actual play, restart, bad inputs, offline delivery, and affected regressions.
- Never weaken a test to obtain green CI. Distinguish **executed**, **inferred**, and **not tested**. Preserve failed attempts where relevant.
- Deployment jobs, if introduced later, must be explicitly main-branch restricted, and PR code must not deploy to production.
- Do not invoke owner-only personal runners, spend paid API credits, create external services, merge, tag, publish or deploy without owner authorisation.
- Keep documentation claims accurate. A proposed roadmap milestone, concept directory or engine lab is not a completed Games2 game.

## Cabinet and deployment boundary

The documentation foundation merged in PR #1, Strike Pixel's playable SP-001
slice in PR #2 and cabinet infrastructure in PR #3. None creates a versioned game release. The
[original handoff](strikepixel/CODEX_HANDOFF.md) remains historical scope evidence.

- Root `index.html`, `cabinet/`, `cartridges.json`, `scripts/` and workflows own the arcade infrastructure. Game runtime still belongs in its own directory.
- The versioned cartridge registry is a curated data-only publication allowlist. Only explicitly registered `playable` or `released` entries may launch or enter `site/`; concepts and development entries cannot publish packages.
- Reuse each game's existing build/verifier. Assemble the complete approved collection on every build; never discover and publish arbitrary directories or drop unchanged games.
- Preserve per-game worker scopes and cache namespaces. Do not add a root worker that takes control of game requests.
- PRs run verification only. Production Pages deployment requires the reviewed `main` ref, successful verification of that exact artifact, minimal job permissions and the `github-pages` environment restricted to `main`.
- Do not change repository Pages settings, dispatch a production deployment, merge, tag or release without owner authorisation. A workflow committed in a PR does not authorise running PR code in production.
- Read [Adding a cartridge](docs/ADDING_A_CARTRIDGE.md) and [deployment policy](docs/DEPLOYMENT.md) before changing this infrastructure. No new game is implied by a cabinet change.

**Correctness outranks speed. Build independent games, then upstream reusable systems through review.**

**Build once. Polish properly. Test the real game. Then move on.**
