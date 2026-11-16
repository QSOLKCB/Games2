# Games2 👾

**Original QSOL-IMC browser games. Built with VANILLAJS. Owned by their creators.**

Games2 is an **offline-first games monorepo**. Actual games live in separate root directories such as `/strikepixel/`. VANILLAJS is the independent engine, physics, Game Labs, editor, mods, creator tools and education project. This repository is where game-specific worlds, content, progression, modes and releases belong.

**Status:** **Strike Pixel SP-001** is implemented as a playable vertical slice, pending owner review. No Games2 game has an owner-approved release or completion milestone yet. Other concepts remain proposals.

> This is not a product. This is INDEPENDENCE.
>
> Make amazing alien tech and put it under an Apache-2.0 licence.

## Start here

| Audience | Read |
| --- | --- |
| Player / curious creator | [Play Strike Pixel locally](strikepixel/README.md#play-locally) and [planned games](docs/GAME_IDEAS.md) |
| Contributor / Codex | [Root agent policy](AGENTS.md), then the game's own `AGENTS.md` |
| Implementing the first game | [Strike Pixel roadmap](strikepixel/ROADMAP.md) and [Codex handoff](strikepixel/CODEX_HANDOFF.md) |
| Maintaining the monorepo | [Games2 roadmap](ROADMAP.md), [donor catalogue](docs/DONOR_CATALOGUE.md) |
| Integrating VANILLAJS | [Engine integration and upstream feedback](docs/ENGINE_INTEGRATION.md) |

## The two-project boundary

| VANILLAJS | Games2 |
| --- | --- |
| Reusable modules, numerical contracts, simulation, rendering and audio | Complete games with original rules, missions, levels and presentation |
| Physics, Game Labs, tools, mod formats, editor and tutorials | Game-specific mod packs, progression, assets, saved games and releases |
| Separately reviewed engine PRs and releases | One game per new-game PR, followed by focused polish PRs |
| May adopt proven reusable mechanisms after independent review | Uses a **pinned** engine revision; never a moving `main` dependency |

**Starting engine reference:** [VANILLAJS v2.5.0 — The Creator Gateway](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0), release commit `32b4fb1ca80e854297998aa00f87a8f012398b89`. Its APIs remain experimental. Strike Pixel records its exact selected modules, file digests and unchanged engine sources in [its provenance manifest](strikepixel/vendor/vanillajs/provenance.json).

## Monorepo rules

- **Generally one new game per PR.** Polish, bug fixes and enhancements follow in later PRs. Technical exceptions require a stated reason.
- **One directory per game.** Each game owns `README.md`, `AGENTS.md` and `ROADMAP.md`, plus its code and assets when implemented.
- **No erased ideas.** Preserve the full [ideas catalogue](docs/GAME_IDEAS.md) and all [donor references](docs/DONOR_CATALOGUE.md). New proposals are additive.
- **Original works only.** Historic and commercial games are inspiration, not permission to copy copyrighted characters, levels, ROMs, music, art or code.
- **Offline-first and player-owned.** No accounts, telemetry, ads, microtransactions, loot boxes, battle passes, paid unlocks or entitlement checks by default.
- **Correctness before speed.** Test actual gameplay and failure paths, describe executed versus inferred results, and retain provenance.
- **No silent publishing.** Merges, releases, deployments and irreversible operations require owner approval.

## First playable game

### [Strike Pixel](strikepixel/README.md) — `/strikepixel/`

An original colourful block-built first-person shooter against offline bots, with snappy movement, responsive weapons and replayable arcade matches. No pay-to-win systems or premium currencies.

SP-001 provides **Sunrelay Yard**, three weapons, three offline bots, score/time-limited matches and an independently served static package. Start with the [local play instructions](strikepixel/README.md), [verification record](strikepixel/docs/VERIFICATION.md) and [next milestones](strikepixel/ROADMAP.md). The [original implementation handoff](strikepixel/CODEX_HANDOFF.md) remains available for scope review. This implementation is awaiting owner review; it is not a published release.

## Future games

The broader idea catalogue covers arcade run-and-gun, beat-'em-ups, fighting games, pinball, FPS, tactical shooters, racing, RTS, tower defence, strategy, investigations, survival, mech combat and spaceflight.

It also preserves earlier proposed concepts such as a Skynet: Future Shock-style FPS, Need for Speed II-style racing, Risk-style territorial strategy, Cannon Fodder-style squad action, SWAT 4-style tactics and an original QwakeTF-based boomer shooter. **These are proposals, not implemented games.**

[Read the complete idea inventory](docs/GAME_IDEAS.md) · [Review source/donor references](docs/DONOR_CATALOGUE.md)

## Games2 → VANILLAJS

After **three completed Games2 games**, review candidates for independent extraction into VANILLAJS. An important shared engine fix may be reviewed earlier. This is a configurable planning milestone, **not an automatic code-promotion or CI trigger**.

Completed means a runnable game, its documentation, executed prescribed checks and an owner-approved release or equivalent reviewed completion milestone. A folder or design document does not count.

Reusable physics, editors, audio systems and other mechanics may become VANILLAJS modules, Game Labs or tutorials only through separately reviewed and authorised upstream PRs. Games2 remains the owner of game content.

[Read the integration contract](docs/ENGINE_INTEGRATION.md) · [Read the Games2 roadmap](ROADMAP.md)

## History and licensing

[The exact pre-foundation README](docs/ORIGINAL_README_2026-11-16.md) is preserved unchanged, including the original informal game concepts and donor URLs. The live catalogue is deliberately easier to navigate without discarding this source.

Games2's repository licence is [Apache-2.0](LICENSE). Donor licences and asset rights must be checked **per file and at pinned revisions** before adaptation; belonging to QSOLKCB does not itself grant permission for every third-party asset.

**Build the game. Test the mechanics. Teach the creator. Improve the engine.**
