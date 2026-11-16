# Codex handoff — SP-001: first playable Strike Pixel

**Status: READY AS A DESIGN TASK, NOT IMPLEMENTED.**

This file is the next implementation brief after the documentation-only Games2 foundation PR is reviewed/merged. It is not permission to start game code inside that documentation PR.

## Repository and scope

Target: `QSOLKCB/Games2`, directory `strikepixel/` only, plus necessary root navigation or test documentation.

Implement **one original game**, not a second game, and not a VANILLAJS engine rewrite.

Baseline engine: [VANILLAJS v2.5.0](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0), commit `32b4fb1ca80e854297998aa00f87a8f012398b89`.

Read root and game AGENTS, both roadmaps, the [engine integration contract](../docs/ENGINE_INTEGRATION.md), the actual source contracts and public `MODULES.json` first.

## Implement the first playable vertical slice

Create a distinct original blocky FPS game with:

- One new block-built arena, original geometry, recognisable colour/material palette and sufficient cover.
- First-person walking, sprinting/jumping where supported, mouse look and real wall/floor collision.
- Three weapon classes: precision hitscan, automatic fire, and travelling projectile; each with actual ammunition/cooldown and different effects.
- A small population of offline bots using meaningful detection, pursuit, strafing, cover decisions and damage/death behaviour.
- A playable arena match with a score or time limit, deaths/respawn, score HUD, end screen and restart.
- Original procedural sound effects/music and readable combat feedback.
- Keyboard/mouse controls, pointer lock, clean Escape pause, focus/visibility cancellation and basic settings.
- Standard gamepad support if it can be verified without compromising the baseline quality; otherwise report as deferred.
- A complete native static/offline package with no server dependency after first installation where supported.

Use documented VANILLAJS APIs from a source-pinned module closure; identify what is reusable rather than rebuilding it. The Block Arena Foundry is a mechanical reference, not a game to republish with new branding.

No copyrighted source/assets and no microtransactions, tracking, accounts, currencies, paid unlocks, ads, loot boxes or battle passes.

## Engineering and verification

- Keep all game code, HTML, CSS, assets and tests under `strikepixel/` wherever practical.
- Record exact engine SHA and selected modules, licence/NOTICE obligations, local changes and packaging.
- Avoid runtime CDN, npm dependencies, Docker and cloud services.
- Use fixed ticks, bounded simulation/replay where supported and safe input lifecycle.
- Add tests proving spawn, movement, collision, firing, bot engagement, scoring, match completion, pause/restart, invalid data and offline packaging as applicable.
- Run real browser checks with the **actual playable game**, not only isolated module functions.
- Preserve expected failures, state actual execution versus inference, and disclose numerical/browser/device limits.
- Document local serving, user controls, supported browsers and how to reproduce the checks.

## Delivery

Create one feature branch and **one PR** for SP-001. Suggested title:

`SP-001: Build the first playable Strike Pixel offline arena FPS`

PR must include tested gameplay, documentation, provenance, screenshots where possible, required commands and actual outcomes, and deferred SP-002 items.

Stop at the PR. Do not merge, tag, publish or deploy without owner approval. Do not alter VANILLAJS as a side effect.

## Suggested first command inside Codex CLI

Open the checkout, review `AGENTS.md` and `strikepixel/AGENTS.md`, then implement `strikepixel/CODEX_HANDOFF.md` as the complete next PR scope. Preserve all other Games2 concepts and donors.

**Build one good game first. Polish it next. Return reusable physics to VANILLAJS only after review.**
