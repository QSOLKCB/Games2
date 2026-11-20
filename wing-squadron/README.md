# Solstice Wing (working title)

**Status:** planning scaffold only. No game source, playable cartridge, release, network service or owner sign-off is implied.

Games2's [development process](../docs/DEVELOPMENT_PROCESS.md) requires a focused implementation PR, a **separate** polish PR and an owner release gate. Development cannot bypass that process.

**Catalogue origin:** Wing Commander IV / Prophecy — reference to a genre or mechanic **only**, not a licence or authorization to reproduce any commercial game, trademark, story, assets, maps, ROM or soundtrack. This concept will use an original QSOL-IMC identity.

## Concept

An original cinematic space fighter campaign with simulation independent from cutscene FPS.

**Candidate VANILLAJS modules to evaluate:** `flight, trajectory, airframe, cockpit-rig, render-lit`. Names reflect modules present in VANILLAJS main as inspected on 20 November 2026; they are *not* a tested dependency closure or a source pin for a game. Before implementation select an immutable commit, check `MODULES.json`, audit dependencies, tests and licensing, and make a self-contained offline package.

## First playable slice

One playable escort/scramble mission at fixed-tick simulation.

**Controls, art, audio, game rules and release details are provisional.** No placeholder game should be registered as playable in `cartridges.json`.

[Project roadmap](ROADMAP.md) · [Agent constraints](AGENTS.md) · [Games2 master roadmap](../ROADMAP.md) · [Original ideas](../docs/GAME_IDEAS.md)
