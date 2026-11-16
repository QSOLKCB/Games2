# Games2 — repository agent and contributor policy

Read this file before creating, editing or reviewing a game. Also read the target game's own `<game>/AGENTS.md`. The game's narrower rules supplement, but cannot waive, these repository rules.

## Scope and ownership

- Games2 owns **actual original games** under one root directory per game, e.g. `strikepixel/`. Do not put new game implementation in the repository root.
- [VANILLAJS](https://github.com/QSOLKCB/VANILLAJS) owns reusable engine systems, physics, Game Labs, mod tooling and tutorials. A game may consume a **reviewed, immutable engine revision**; it must not make VANILLAJS import code back from Games2.
- Default to **one new game per PR**. Later PRs polish an existing game. State any justified technical exception explicitly.
- Every game directory requires `README.md`, `ROADMAP.md` and `AGENTS.md` before implementation.
- Preserve [all ideas](docs/GAME_IDEAS.md) and the [complete donor catalogue](docs/DONOR_CATALOGUE.md). Do not silently drop or rename proposals.
- Changes to VANILLAJS require a **separate VANILLAJS PR** and owner review. Never silently modify both repositories.

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

## Current authorised boundary

The initial documentation foundation may alter only Markdown documentation and preserve the existing licence. It must not introduce runtime/gameplay code, workflows, dependencies, generated build products or releases.

The later implementation scope is described by [Strike Pixel's handoff](strikepixel/CODEX_HANDOFF.md). Read it only when that task has been authorised.

**Correctness outranks speed. Build independent games, then upstream reusable systems through review.**
