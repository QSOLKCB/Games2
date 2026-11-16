# Games2 development roadmap

**State:** Strike Pixel SP-001 merged in PR #2 as a playable preview; Cartridge
Cabinet infrastructure merged in PR #3. **SP-002 gameplay and presentation polish
is the next game PR.** Strike Pixel's initial release awaits polish, verification
and owner approval. A merged preview is not a versioned release or an automatic
upstream integration milestone.

This roadmap governs the games monorepo; [VANILLAJS](https://github.com/QSOLKCB/VANILLAJS) retains its own independent engine roadmap. An entry here is a proposal until code, tests and a reviewed completion milestone establish otherwise.

## Monorepo milestones

| ID | Milestone | Status | Required outcome |
| --- | --- | --- | --- |
| G2-DOC-001 | Documentation-first foundation | **Merged in PR #1** | Root agent rules and roadmap; archived source catalogue; pinned engine integration; `strikepixel/` game specification and Codex handoff |
| SP-001 | Strike Pixel first playable vertical slice | **Merged in PR #2; playable preview** | Sunrelay Yard, offline bots, three weapons, working match and [verification evidence](strikepixel/docs/VERIFICATION.md) |
| G2-CABINET-001 | The Cartridge Cabinet | **Merged in PR #3; infrastructure complete** | Original arcade, strict cartridge registry, complete verified collection, hosted CI and main-only Pages workflow |
| SP-002 | Strike Pixel dedicated polish pass | **Next game PR; not started** | Improve gameplay feel, balance, presentation, audio, controls, accessibility, performance and recovery; verify regressions, actual play, offline packaging and deployed preview |
| Strike Pixel initial release review | Owner approval gate | **Pending SP-002 merge and verification** | Owner tests the deployed cabinet preview; all six release conditions below must hold; not automatically a third implementation PR |
| SP-003 and later proposals | Strike Pixel enhancements | **Deferred; not started** | Preserve additional arenas/modes, progression, data-only mods, creator tools, input improvements and other proposals in the per-game roadmap |
| G2-GAME-002 | Second Games2 game | **Not selected; after Strike Pixel's initial polish review** | One separate game directory, one focused implementation PR, a separate polish PR and owner release review; owner may explicitly change priorities |
| G2-GAME-003 | Third Games2 game | **Not selected** | Same rules; independent game deliverable |
| G2-UPSTREAM-001 | First reusable engine extraction review | **Not started** | Assess three **completed** games or owner-approved earlier cross-game need; propose separately reviewed VANILLAJS changes |

No future release version, PR number or implementation date is promised by this table. Completed docs or cabinet infrastructure do not count as completed games.

## Mandatory progression for every game

**Implementation → Polish → Release Review**

1. **Pass 1 — Implementation:** one new game in its own directory; core mechanics,
   original content, a complete playable vertical slice, tests, browser checks,
   documentation and provenance in one focused PR.
2. **Pass 2 — Polish:** after implementation merges, a separate PR improves the
   same game's feel/difficulty, visuals, audio, input, menus/HUD/accessibility,
   performance, bugs/recovery, offline packaging and deployment. Include regression
   tests and actual browser gameplay, then obtain owner review.
3. **Pass 3 — Release Review:** an approval gate, not automatically another
   implementation PR. The owner tests the published preview through the cabinet.

Initial release requires **both implementation and polish PRs merged**, **required
tests/CI passed**, **a working deployed preview**, **documented limitations** and
**explicit owner release authorisation**. Every game's `ROADMAP.md` must visibly
track the three stages and evidence; its `AGENTS.md` must link that progression.

Critical defects may be fixed immediately. Additional polish may be approved;
failed release review returns the game for corrections. Two passes are a minimum,
not guaranteed readiness. Later enhancement/bug-fix PRs do not repeat the entire
process. Read the [complete development policy](docs/DEVELOPMENT_PROCESS.md).

## Development rules

1. **One new game per implementation PR**, generally. Follow with mandatory polish in a separate PR; document any technical exception to PR scope.
2. Each game gets its own directory and `README.md`, `AGENTS.md`, `ROADMAP.md`, including the visible three-stage progression above.
3. Do not import another game's story, progression or data into an engine module.
4. Consume a **pinned** VANILLAJS revision and preserve the selection and attribution.
5. Complete implementation, polish and owner release review before announcing an initial game release.
6. Preserve the entire concept and donor catalogues when reprioritising.
7. Owner authorisation is required for merge, deployment, tag and publication.

## First game: Strike Pixel

[Design brief](strikepixel/README.md) · [Per-game roadmap](strikepixel/ROADMAP.md) · [Implementation handoff](strikepixel/CODEX_HANDOFF.md)

The first implementation is an original, offline, blocky 3D FPS inspired by arcade arena shooters. SP-001 supplies one self-contained arena and match loop using an immutable VANILLAJS module closure. No microtransactions, accounts, premium currency or network multiplayer. See the [per-game roadmap](strikepixel/ROADMAP.md) for deferred expansion, input hardware and creator-tool work. Owner review is still required before this counts toward the three-game upstream milestone.

## Permanent arcade home

The cabinet launches individual, independently owned game packages. Its registry
is a publication allowlist, not automatic discovery. Each approved deployment
must preserve the complete existing collection, stable game URLs and per-game
offline scopes. New-game PRs still normally introduce only one game.

G2-CABINET-001 merged in PR #3. A release review still requires verification of
the relevant main-branch Pages run and public cabinet/game URLs. Later work can improve accessibility, cabinet
presentation and collection navigation without changing game ownership. Additional
cartridges become playable only through reviewed implementations and registration;
the concept cards do not count as new games. See [adding a cartridge](docs/ADDING_A_CARTRIDGE.md)
and [deployment policy](docs/DEPLOYMENT.md).

## Future game selection

See [the full catalogue](docs/GAME_IDEAS.md). It includes all present README ideas (arcade, tactical FPS, RTS, tower defence, racing, space, mech, strategy, survival and more) plus earlier proposals awaiting implementation. The [donor inventory](docs/DONOR_CATALOGUE.md) remains available for source-pinned reviews.

Selection should consider: genre diversity, reusable engine gaps, achievable scope, original identity, licensing, testability, and whether a short playable loop can be delivered without mandatory cloud services.

## Reusable Games2 → VANILLAJS systems

**Initial suggested review cadence:** after **three completed Games2 games**, counting from the last review. The owner may authorise an earlier review for a substantial reusable mechanic or cross-game fix. No automated promotions.

A completed game requires:
- Independent runnable package with actual gameplay.
- Per-game README/AGENTS/ROADMAP and appropriate attribution.
- Executed prescribed tests, including packaged browser behaviour and offline startup.
- Owner-approved release or equivalent reviewed completion milestone.

Potential shared areas include FPS/tactical AI, weapon rules, block-world and procedural geometry, 2D combat, squad movement, road/vehicle physics, RTS navigation, turn-based mechanics, space/mech physics, deterministic audio, visual FX, and data-only creator tools.

Promotion gates: exact immutable source pin, per-file licence and asset audit, numerical/replay contract, tests and reference comparisons, reusable API design, at least one actual VANILLAJS lab/tutorial consumer, and a **separate approved VANILLAJS PR**. Later Games2 upgrades are separate consuming-game PRs.

[Detailed integration policy](docs/ENGINE_INTEGRATION.md)

## Review register

| Review | Qualifying games | Reusable candidate | Owner decision | Upstream PR |
| --- | --- | --- | --- | --- |
| Not yet conducted | 0 | None assessed | Pending future milestone | None |

Do not retrospectively count VANILLAJS labs, other QSOLKCB games, design documents or donor repos as completed Games2 games.
