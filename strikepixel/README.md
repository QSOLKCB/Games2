# Strike Pixel

**Status: design only — not playable or released.**

Strike Pixel is the first planned Games2 title: an **original offline blocky 3D arena FPS** that deliberately embraces low-poly/block-built visuals, lively combat, solid control feel and player-owned content.

It takes genre inspiration from colourful pixel/voxel-style arcade shooters such as Pixel Gun 3D, **without copying the other game's name, maps, weapons, progression economy, graphics or soundtrack**. All game-specific design and assets will be original QSOL-IMC work.

**No microtransactions. No premium currency. No loot boxes. No paid unlocks. No mandatory login. No ads.**

## Experience

A fast, readable FPS against local AI opponents. Clear sightlines, varied cover, responsive shooting, perceptible weapon differences and short repeatable matches.

The initial vertical slice should emphasise actual playability and quality before large amounts of content:

- One original block-built arena with real cover, spawn positions, navigation and pickups.
- At least three distinct weapons: accurate hitscan, automatic, and finite-speed projectile.
- Offline bots that patrol, acquire targets, navigate, attack, react to damage and respawn according to match rules.
- An actual local arena match with score/time limit, victory/defeat, scoreboard and restart.
- Keyboard and mouse, pointer lock with clean release, pause/focus cancellation; use the existing standard gamepad interface if feasible within the same tested PR.
- Original procedural or locally licensed graphics and sound.
- Safe behaviour on missing WebGL/audio capability; no misleading apparently-running interface.
- Browser execution, source-bound tests, strict package and offline delivery after the initial cache installation.

This is **not** an online multiplayer clone or a monetisation simulator. No combat passes through remote services.

## VANILLAJS foundation

Start from [VANILLAJS v2.5.0](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0), immutable commit `32b4fb1ca80e854297998aa00f87a8f012398b89`.

Review the public FPS contracts and the existing **Block Arena Foundry** rather than recreating collision, combat, movement, input, audio and renderer facilities.

The game's world, modes, enemy behaviours, styling, levels and music remain owned by `strikepixel/`. Avoid copying complete engine lab content into Games2 without an explicit adaptation and provenance record.

Read [engine integration](../docs/ENGINE_INTEGRATION.md), [local agent rules](AGENTS.md), [phased roadmap](ROADMAP.md), and [Codex implementation task](CODEX_HANDOFF.md).

## Original visual identity

Bright architectural blocks, strong silhouettes, distinctive original weapons, coherent colour themes and clear feedback. The Demoscene Foundry may later inform animated titles, effects and an optional original intro.

The first release need not include a full map editor, online services, skins economy or a giant weapon catalogue.

## Future development

Additional distinct arenas, survival waves, richer bots, score challenges, data-only mods, exportable replays, cosmetics earned through normal gameplay and creator tools are later proposals. They require separate reviewed scopes.

**Next task:** [SP-001 — First playable vertical slice](CODEX_HANDOFF.md). The initial PR containing this README has **no gameplay code**.
