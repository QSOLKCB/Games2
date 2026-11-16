# Strike Pixel roadmap

**Current state: SP-001 merged in PR #2. SP-002 polish is the next game PR.
Initial release pending polish, verification and owner approval.**

The first playable slice is Sunrelay Yard: an original arena, three weapons,
three offline bots and a complete score/time-limited match. Read the
[README](README.md) to run it and the [verification record](docs/VERIFICATION.md)
for executed checks and limitations. A working implementation is not an
owner-approved release or a completed game for the upstream review threshold.

## Implementation → Polish → Release Review

Every new Games2 game requires two planned development passes before initial
release review. This game follows the [repository policy](https://github.com/QSOLKCB/Games2/blob/main/AGENTS.md).

| Pass | Milestone | Status | Required outcome |
| --- | --- | --- | --- |
| 1 — Implementation | SP-001 | **Complete; merged in PR #2; playable preview** | One original 3D arena, movement and collision, three weapon classes, local bots, score/time limits, deaths/respawns, HUD/restart, settings, procedural sound/music, health/ammo pickups, static/offline packaging, tests, browser verification, documentation and provenance |
| 2 — Polish | SP-002 | **Next game PR; not started** | A separate PR improving the existing game's gameplay and presentation, addressing the checklist below, with regression evidence and owner review |
| 3 — Release Review | Initial release; carries forward SP-005 release QA | **Pending polish, verification and owner approval** | Owner plays the deployed preview through the Games2 Cartridge Cabinet and reviews all six release conditions below; this is an approval gate, not automatically another implementation PR |

The Cabinet infrastructure merged in PR #3. It is not a game polish pass or a
release approval. The second Games2 game begins after Strike Pixel's initial
polish review unless the owner explicitly changes priorities.

## SP-002 polish scope

Improve the existing Sunrelay Yard game and record changes, actual verification
and remaining limitations for each area:

- Gameplay feel, weapon feedback, fair bot behaviour and difficulty balancing.
- Graphics, animation, visual effects and presentation.
- Soundtrack, sound effects and readable audio feedback.
- Controls, responsiveness and input handling, including cancellation and resume.
- Menus, HUD, usability and accessibility.
- Performance and unnecessary rendering work.
- Bugs, edge cases and recovery behaviour.
- Offline packaging and deployment verification through the cabinet's Pages paths.
- Regression tests and actual browser gameplay, including match outcomes and restart.

Do not replace this polish pass with an unrelated game or an excessive number of
unfinished features. Critical defects discovered during implementation or polish
may be corrected immediately. An additional polish PR may be owner-approved when
needed; a failed release review returns the game for corrections. Two passes are
a minimum quality process, not a guarantee that two PRs make a game release-ready.
Later enhancement and bug-fix PRs do not repeat the entire two-pass process.

## Initial release review gate

The owner tests the published preview through the Games2 Cartridge Cabinet. The
game becomes eligible for its initial release only when all six conditions hold:

1. The implementation PR is merged.
2. The dedicated polish PR is merged.
3. Required tests and CI have passed.
4. The deployed preview works.
5. Known limitations are documented.
6. The owner authorises the release.

Broader game QA, the asset/provenance audit and release-candidate assessment from
the earlier SP-005 proposal remain part of this review. The deferred expansion
and creator proposals below are not automatic prerequisites or extra planned
implementation passes for the initial release.

## Retained foundation and deferred proposals

| ID / earlier proposal | Status | Preserved scope |
| --- | --- | --- |
| SP-DOC-001 | Documentation foundation retained | Per-game README, agent rules, roadmap and the historical implementation handoff; this foundation originally contained no game code |
| Earlier SP-002 expansion proposal | Deferred; separate future scope after initial polish review | Additional distinct arenas, survival-wave option, richer bots, expanded pickups and score challenges, with tests; balance work is now prioritised in the dedicated SP-002 polish pass |
| SP-003 | Proposed; not implemented | Bounded data-only map/weapon/mod packs, improved authoring, creator tools and optional source-bound replay export; version formats and preserve compatibility |
| SP-004 | Proposed; not implemented | Demoscene-derived original intro, richer materials/effects/sound and cosmetics earned through ordinary play; immediate accessibility and presentation improvements belong in SP-002 |
| SP-UPSTREAM-001 | Proposed; not started | Offer proven reusable systems to VANILLAJS after a substantial shared need or the Games2 review threshold is met |

SP-001 includes basic health/ammo supplies already; the deferred pickup proposal
means expanding them. It does not defer the existing collection and cooldown
behaviour. A cosmetic proposal never authorises a shop, paid unlock, premium
currency, loot box or battle pass.

## SP-001 review gate

These acceptance requirements remain the SP-001 regression baseline after its
implementation merged in PR #2:

- First-person movement, sprint/jump and wall/floor collision advance at fixed ticks.
- A player can shoot, hit, score, die, respawn, finish a match and restart.
- Lancet hitscan, Rivet automatic fire and travelling Comet projectiles have real ammunition, cooldowns and distinct combat behaviour.
- Bots move, detect visible opponents, remember lost targets, route, strafe, seek cover when hurt and attack through the same combat system.
- Original procedural assets and unchanged, source-pinned engine files have complete licences and notices.
- Pause, focus changes, input cancellation, settings rejection, startup failure and restart have reproducible checks.
- The package has no runtime network dependency, account, tracking or monetisation.
- Node and packaged Chromium checks have recorded results, including actual play and offline reload. Failed attempts and unavailable hardware coverage are reported.
- The PR remains limited to Strike Pixel and necessary Games2 navigation/status changes. VANILLAJS and unrelated game concepts remain unchanged.
- Merging, tagging, releasing and deployment require their own owner authorisation.

## Numerical and gameplay limits to preserve

The current physics are upright Float64 AABBs in metres, with static steps and a
conservative ground-plane bot navigation grid. Players can use the raised deck;
bots do not have a general multi-level navigation mesh. Projectile sweeps use
tick-start target poses. There is no rollback, network lag compensation or claim
of universal floating-point identity.

The shipped match choices are quick skirmish and arena match. Save import,
replay import/export, user-authored mods and a visual map editor are not present.
Any future format needs complete admission validation before accepted state changes.

## Explicit non-goals for SP-001

- Network multiplayer, servers, rankings or account systems.
- Battle passes, cash shops, paid advantages or any monetisation.
- Huge weapon, map or skin catalogues.
- Full voxel destruction or Minecraft-style terrain.
- Unbounded AI or pathfinding.
- Claims of complete controller, mobile or physical-GPU coverage without execution.
- Copying Pixel Gun 3D code, branding, art, maps, sounds or commercial assets.

Desktop keyboard/mouse remains the primary interaction. Complete touch combat,
physical-device coverage and accessibility beyond the current menus need further
work and explicit verification. Small viewport tests do not replace that work.

## Later quality priorities

Prefer a satisfying combat loop, readable hit/health/armour feedback, fair bot
behaviour, distinctive arenas and reliable offline packaging over accumulating
untested features. Preserve all earlier proposals: new arenas, survival waves,
richer bots, pickups, balancing, score challenges, creator tools, data-only mods,
replays, normal-play cosmetics, procedural audiovisual intros and final release QA.

A reusable improvement goes through [Games2 ↔ VANILLAJS review](https://github.com/QSOLKCB/Games2/blob/main/docs/ENGINE_INTEGRATION.md).
The default milestone is three independently runnable games with required docs,
prescribed tests and owner-approved completion, with earlier review allowed for
a substantial shared system. Promotion needs a separate engine PR and owner
approval; adoption of its release is another reviewed game change.

[Play and develop](README.md) · [Original SP-001 brief](https://github.com/QSOLKCB/Games2/blob/main/strikepixel/CODEX_HANDOFF.md) · [Architecture](docs/ARCHITECTURE.md)
