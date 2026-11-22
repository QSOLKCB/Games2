# Games2 Arcade 👾

See the [cartridge registry](cartridges.json) for playable previews and the
[portfolio register](docs/FUTURE_GAME_DIRECTORIES.md) for each game's implementation status.
The collection's first tag is [v1.0.0](https://github.com/QSOLKCB/Games2/releases/tag/v1.0.0).

**Original QSOL-IMC browser games. Built with VANILLAJS. Owned by their creators.**

Games2 is an **offline-first games monorepo**. Actual games live in separate root directories such as `/strikepixel/`. VANILLAJS is the independent engine, physics, Game Labs, editor, mods, creator tools and education project. This repository is where game-specific worlds, content, progression, modes and releases belong.

**Insert cartridge. Press start. Own the game.**

**Strike Pixel SP-001 merged in PR #2** as a playable preview. The Cartridge
Cabinet **merged in PR #3**, adding an original arcade launcher and a verified collection build for
GitHub Pages. Concept cartridges are clearly labelled coming soon and cannot
launch. No versioned game release is implied.

**Deployment targets after a successful main-branch Pages deployment:**
[Games2 Arcade](https://qsolkcb.github.io/Games2/) ·
[Strike Pixel](https://qsolkcb.github.io/Games2/strikepixel/).
The original cabinet audit found Pages configured for Actions but the public root
returned 404. Confirm the current deployment before release review; PR code never
deploys to production. See [deployment status and setup](docs/DEPLOYMENT.md).

> This is not a product. This is INDEPENDENCE.
>
> Make amazing alien tech and put it under an Apache-2.0 licence.

## Start here

Build and play the complete approved collection locally, with Node.js 22:

```sh
node scripts/build-site.mjs
node scripts/verify-site.mjs
node scripts/site-server.mjs
```

Open **http://127.0.0.1:8000/Games2/**. Select a cartridge and choose **Play
Cartridge**. Each game opens in its own page and owns its controls, audio and
offline cache. No npm installation is needed to build or play.

| Audience | Read |
| --- | --- |
| Player / curious creator | The arcade above, [Strike Pixel controls](strikepixel/README.md#controls) and [planned games](docs/GAME_IDEAS.md) |
| Contributor / Codex | [Root agent policy](AGENTS.md), [mandatory development process](docs/DEVELOPMENT_PROCESS.md), then the game's own `AGENTS.md` |
| Polishing Strike Pixel | [SP-002 and release progression](strikepixel/ROADMAP.md); [original SP-001 handoff](strikepixel/CODEX_HANDOFF.md) is historical scope evidence |
| Maintaining the monorepo | [Games2 roadmap](ROADMAP.md), [donor catalogue](docs/DONOR_CATALOGUE.md) |
| Integrating VANILLAJS | [Engine integration and upstream feedback](docs/ENGINE_INTEGRATION.md) |
| Adding a cartridge | [Registration, packaging and verification guide](docs/ADDING_A_CARTRIDGE.md) |
| Reviewing infrastructure | [Deployment policy](docs/DEPLOYMENT.md) and [cabinet verification](docs/CABINET_VERIFICATION.md) |

## The two-project boundary

| VANILLAJS | Games2 |
| --- | --- |
| Reusable modules, numerical contracts, simulation, rendering and audio | Complete games with original rules, missions, levels and presentation |
| Physics, Game Labs, tools, mod formats, editor and tutorials | Game-specific mod packs, progression, assets, saved games and releases |
| Separately reviewed engine PRs and releases | One game per new-game PR, followed by focused polish PRs |
| May adopt proven reusable mechanisms after independent review | Uses a **pinned** engine revision; never a moving `main` dependency |

**Starting engine reference:** [VANILLAJS v2.5.0 — The Creator Gateway](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0), release commit `32b4fb1ca80e854297998aa00f87a8f012398b89`. Its APIs remain experimental. Strike Pixel records its exact selected modules, file digests and unchanged engine sources in [its provenance manifest](strikepixel/vendor/vanillajs/provenance.json).

## Monorepo rules

- **Generally one new game per implementation PR.** Technical exceptions require a stated reason.
- **Two planned development passes before initial release review.** Merge the implementation PR, then complete a separate polish PR and owner review. Release review is an approval gate, not automatically a third implementation PR. See the [mandatory process and release conditions](docs/DEVELOPMENT_PROCESS.md).
- **One directory per game.** Each game owns `README.md`, `AGENTS.md` and `ROADMAP.md`, plus its code and assets. Every game roadmap visibly tracks **Implementation → Polish → Release Review**.
- **No erased ideas.** Preserve the full [ideas catalogue](docs/GAME_IDEAS.md) and all [donor references](docs/DONOR_CATALOGUE.md). New proposals are additive.
- **Original works only.** Historic and commercial games are inspiration, not permission to copy copyrighted characters, levels, ROMs, music, art or code.
- **Offline-first and player-owned.** No accounts, telemetry, ads, microtransactions, loot boxes, battle passes, paid unlocks or entitlement checks by default.
- **Correctness before speed.** Test actual gameplay and failure paths, describe executed versus inferred results, and retain provenance.
- **No silent publishing.** Merges, releases, deployments and irreversible operations require owner approval.

## First playable game

### [Strike Pixel](strikepixel/README.md) — `/strikepixel/`

An original colourful block-built first-person shooter against offline bots, with snappy movement, responsive weapons and replayable arcade matches. No pay-to-win systems or premium currencies.

SP-001 provides **Sunrelay Yard**, three weapons, three offline bots, score/time-limited matches and an independently served static package. Start with the [local play instructions](strikepixel/README.md), [original verification record](strikepixel/docs/VERIFICATION.md) and [next milestones](strikepixel/ROADMAP.md). The [original implementation handoff](strikepixel/CODEX_HANDOFF.md) remains available for scope review. Its implementation merged in PR #2; it is not a published release.

Strike Pixel tracks its remaining gameplay and presentation polish in its own roadmap.
Each additional cartridge follows its own implementation, polish and owner release review.

## One collection, independent cartridges

[`cartridges.json`](cartridges.json) is the curated publication allowlist. The
launcher derives local URLs from validated slugs. Only approved `playable` and
`released` entries are built; `concept` and `development` entries cannot launch.
The racing and spaceflight cards retain the original Neon Apex and Starward Signal
names, artwork and cabinet URLs. Select a card for its current play status.

`node scripts/build-site.mjs` invokes every approved game's existing build and
verifier, then copies its complete package into `site/<slug>/`. Every deployment
contains the whole current approved collection. Adding a game does not remove
unchanged games. Temporary outputs, tests, browser profiles, development tooling
and unregistered game directories never enter the artifact.

PRs run Node, source/package, site and browser checks on hosted GitHub runners.
The production workflow builds and verifies the same artifact before deploying
from `main`, with a `github-pages` environment restricted to that branch. The
cabinet has no service worker; Strike Pixel retains its own scoped, digest-verified
offline installation. The cabinet requires connectivity, while installed games
can be opened directly offline.

[Fly Starward Signal](starward-signal/README.md) for controls and the Pelagic Array mission.

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
