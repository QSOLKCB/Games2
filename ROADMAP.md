# Games2 — original games portfolio roadmap

**Review date:** 20 November 2026. **Priority:** finish Strike Pixel's dedicated
polish and release review, then build **Circuit Vice** — an original
NARC-inspired arcade action game in `narc/`. The 36 additional game directories
are **documentation-only concept scaffolds**, not finished games or cartridges.

The [original Games2 README dated 16 November 2026](docs/ORIGINAL_README_2026-11-16.md)
remains preserved verbatim, and [every historical game idea](docs/GAME_IDEAS.md)
is retained. This roadmap replaces the superseded "second game unselected"
planning state; it does not reinterpret game previews as releases.

## Verified historical baseline and active changes

| Phase | State | Acceptance / reference |
| --- | --- | --- |
| G2-DOC-001 | Merged PR #1 | Original proposal source, policies and first game planning |
| SP-001 | Merged PR #2; playable preview | Original Sunrelay Yard, three weapons, local bots, real match loop |
| G2-CABINET-001 | Merged PR #3; infrastructure | Offline cabinet, registry allowlist, build and main-only Pages deployment gate |
| SP-002A — CAD visuals | **PR #5 open; not merged or verified here** | Engine-generated rounded bot/weapon/pickup meshes, industrial arena presentation, asset source provenance |
| SP-002B — gameplay and release polish | **Pending** | Balance, weapon feedback, audio, controls, accessibility, menus/HUD, 60-fps hardware check, defects and offline play regression |
| Strike Pixel release review | **Pending** | Both implementation and polish requirements merged; green CI; real deployed cabinet play; limitations; owner sign-off |
| NC-001 — Circuit Vice implementation | **Selected next; not started** | Original 2.5D run-and-gun + arrest/rescue mission; fixed-step VANILLAJS, new self-contained game PR |
| NC-002 — Circuit Vice polish | **Not started** | Separate original-game polish PR and complete gameplay/browser/offline evidence |
| Circuit Vice release review | **Not eligible** | Owner tests published preview and authorises release |
| G2-GAME-003 | **Backlog** | Choose third independently playable title, e.g. `cyber-ninja/`, `pinball/`, `immersive-fps/` |
| G2-UPSTREAM-001 | **Not started** | After three completed games or explicit earlier owner approval, evaluate reusable components in independent VANILLAJS PRs |

The status of PR #5 may change after this document's creation. Check GitHub
before declaring any phase complete.

## Stage gates — all titles

**Implementation → dedicated polish → owner release review**, as required by
[AGENTS.md](AGENTS.md) and the [development process](docs/DEVELOPMENT_PROCESS.md).

1. **Implementation:** one game per PR by default; original playable vertical
   slice; bounded simulation; pinned immutable VANILLAJS dependencies and source
   notices; tests for rules, errors, browser interaction and offline packaging.
2. **Polish:** separate PR *after* implementation merge; genuine gameplay and
   graphics/audio improvement, fair difficulty, clear UX, accessibility, input
   cancellation, performance and recovery; measured evidence for claims.
3. **Release Review:** implementation and polish merged, mandatory CI passed,
   published cabinet preview playable, limitations recorded and explicit owner
   sign-off. An unmerged PR, scaffold or engine lab is not a completed game.

Fix critical defects immediately. The owner can require extra polish; two
passes are minimum practice, not an automatic release guarantee.

## Engine adoption strategy — 2026 VANILLAJS update

At the review point, VANILLAJS `main` commit
`e9121ea7297b0aeca1da131b695e7c3371a98745` includes:

| Engine subsystem | Potential Games2 use | Integration boundary |
| --- | --- | --- |
| CAD-003 Geometry Forge, CAD-001/002 profiles | Strike Pixel rounded models, original building/prop meshes, future creator art | Presentation-only meshes; do not change collision authority |
| Render-Lit, WORLD-VIS-001 | More sophisticated materials, mesh reuse, culling and conservative LOD | Device presentation only; budget and visual checks needed |
| SENSE-001 and TACTICS-001 | Fair enemies, perception, cover and squad/room orders | Deterministic policy; match source with game fixed ticks |
| TRAJECTORY-001 / weapon-feel | Flight/combat ballistics, weapon timing and visible impact feedback | Explicit numerical and swept-contact regression |
| Creator-Interop-001 | Data-only offline maps, original assets, authoring/export | Admission validation, versioned format and isolated ownership |
| combat2d, projection25d, sprite2d, motion2d | NARC-inspired game, brawlers, platformers and fighting | Original art, fixed-step gameplay, authoritative state separate |
| flight, road-arcade, vehicle3d, airframe | Racers, arcade warplanes and bridge simulations | Measured time budgets and authored game content |
| navigation, tactics, terrain, tilemap | RTS, survival, tower defence and squad action | Reused verified mechanics, original game rule sets |

**Do not equate latest main with a reviewed release pin.** SP-001's source-pinned
simulation closure remains VANILLAJS v2.5.0 commit
`32b4fb1ca80e854297998aa00f87a8f012398b89`. SP-002A introduces only
a presentation-focused CAD module from the newer commit, with a separately
checked exact Git blob. Future full engine uptake needs a dedicated compatibility
and package-provenance audit, tests and regression evidence. No CDN, third-party
runtime packages, server requirement or silently auto-updated dependencies.

## Game 1 — Strike Pixel

[Game roadmap](strikepixel/ROADMAP.md) · [Architecture](strikepixel/docs/ARCHITECTURE.md)

Finish presentation and gameplay **without changing authoritative collision or
fixed-step matching merely to improve aesthetics**. SP-002A uses generated
geometry for rounded robots, weapon accents, arena details, pickups and
projectiles; SP-002B retains fair bot behaviour, HUD/menu, soundtrack, input,
GPU baseline, packaging, recovery and full actual gameplay verification.

Deferred proposals are **not cancelled**: additional arenas, survival waves,
data-only mods, source-bound replay, visual map authoring, original cosmetics and
demoscene presentation remain SP-003/SP-004 and later.

## Game 2 — Circuit Vice (NARC-inspired original)

[Detailed NC roadmap](narc/ROADMAP.md) · [Concept](narc/README.md)

Original 2.5D arcade city action. Build one coherent district and a meaningful
combat/arrest/rescue loop; use `combat2d`, `projection25d`, `sprite2d`,
`motion2d`, audio and creator tooling after immutable-pin review. Design for
desktop keyboard/gamepad first, local co-op only if separately tested. Do **not**
reuse NARC branding in the released title, copyrighted graphics, recognisable
characters, music or maps. NC-001 gets one implementation PR, NC-002 a separate
polish PR, followed by owner release review. No placeholders registered in cabinet.

## Games 3+ — preserved backlog and creation order

All 36 future directories, including the selected second game, are listed in
[the concept-directory register](docs/FUTURE_GAME_DIRECTORIES.md).
They cover the complete original catalogue: arcade ninja/brawlers, rail gallery,
bubble trapping, fighting, pinball, immersive FPS, tactical FPS, platformers,
racing, voxel/survival, RTS, defence, investigation, mechs and space.
Earlier Skynet/NFS II/Risk/Cannon Fodder/SWAT/boomer-shooter proposals are
also retained as their own directory plans.

**Suggested next decision after Circuit Vice:** one of a ninja brawler
(`cyber-ninja/`), pinball (`pinball/`), systems-oriented immersive FPS
(`immersive-fps/`) or the first RTS (`star-command-rts/`).
This order is indicative, not an unapproved implementation queue.

## Games2 → VANILLAJS promotion review

After three independently runnable, tested and owner-approved finished games
(or an explicit earlier cross-game request), identify genuinely reusable
mechanics. Each promotion requires a separate VANILLAJS PR, exact upstream
source and licence audit, robust numerical/replay contracts, comparative
regression and an independently runnable engine lab. The consuming Games2
update then goes through a separate game PR. No automatic cross-repo promotion.

## Cabinet and operational boundaries

Only reviewed playable/released registry entries may be published. Build
the entire allowlisted collection rather than wiping old games, preserve
stable URLs and separate service-worker scopes, verify the exact Pages
artifact and deploy only from reviewed `main`. The new concept directories
must not enter `cartridges.json` or the site output until a game package
actually exists. No merge, release, owner runner or production publish without
explicit permission.

[Game ideas](docs/GAME_IDEAS.md) · [Full concept register](docs/FUTURE_GAME_DIRECTORIES.md)
· [Donor catalogue](docs/DONOR_CATALOGUE.md)
· [Engine integration policy](docs/ENGINE_INTEGRATION.md)
