# Games2 development roadmap

**State:** Strike Pixel SP-001 merged in PR #2 as a playable preview. The Cartridge
Cabinet infrastructure is proposed in its own PR. A merged preview is not a
versioned game release or an automatic upstream integration milestone.

This roadmap governs the games monorepo; [VANILLAJS](https://github.com/QSOLKCB/VANILLAJS) retains its own independent engine roadmap. An entry here is a proposal until code, tests and a reviewed completion milestone establish otherwise.

## Monorepo milestones

| ID | Milestone | Status | Required outcome |
| --- | --- | --- | --- |
| G2-DOC-001 | Documentation-first foundation | **Merged in PR #1** | Root agent rules and roadmap; archived source catalogue; pinned engine integration; `strikepixel/` game specification and Codex handoff |
| SP-001 | Strike Pixel first playable vertical slice | **Merged in PR #2; playable preview** | Sunrelay Yard, offline bots, three weapons, working match and [verification evidence](strikepixel/docs/VERIFICATION.md) |
| G2-CABINET-001 | The Cartridge Cabinet | **Implemented; infrastructure PR review pending** | Original arcade, strict cartridge registry, complete verified collection, hosted CI and main-only Pages workflow |
| SP-002 | Strike Pixel gameplay expansion | **Not started** | Original additional arenas/modes and progression only after the vertical slice is proven |
| SP-003 | Strike Pixel creator/polish pass | **Not started** | Data-only mods, accessibility, gamepad/touch, performance and offline resilience as verified |
| G2-GAME-002 | Second Games2 game | **Not selected** | One separate game directory, one focused new-game PR and independent release process |
| G2-GAME-003 | Third Games2 game | **Not selected** | Same rules; independent game deliverable |
| G2-UPSTREAM-001 | First reusable engine extraction review | **Not started** | Assess three **completed** games or owner-approved earlier cross-game need; propose separately reviewed VANILLAJS changes |

No release version, PR number or implementation date is promised by this table. Completed docs do not count as completed games.

## Development rules

1. **One new game per PR**, generally. Use later PRs for polishing or features; document any technical exception.
2. Each game gets its own directory and `README.md`, `AGENTS.md`, `ROADMAP.md`.
3. Do not import another game's story, progression or data into an engine module.
4. Consume a **pinned** VANILLAJS revision and preserve the selection and attribution.
5. Build and verify an actual playable loop before announcing a game release.
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

After G2-CABINET-001 is reviewed and merged, verify the main-branch Pages run and
the public cabinet/game URLs. Later work can improve accessibility, cabinet
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
