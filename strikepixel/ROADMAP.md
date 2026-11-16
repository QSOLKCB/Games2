# Strike Pixel roadmap

**Current state: SP-001 is implemented and awaiting PR review. Unreleased.**

The first playable slice is Sunrelay Yard: an original arena, three weapons,
three offline bots and a complete score/time-limited match. Read the
[README](README.md) to run it and the [verification record](docs/VERIFICATION.md)
for executed checks and limitations. A working implementation is not an
owner-approved release or a completed game for the upstream review threshold.

| ID | Status | Deliverable |
| --- | --- | --- |
| SP-DOC-001 | Documentation foundation retained | Per-game README, agent rules, roadmap and the historical implementation handoff; this foundation originally contained no game code |
| SP-001 | Implemented; pending review, unreleased | One original 3D arena, movement and collision, three weapon classes, local bots, score/time limits, deaths/respawns, HUD/restart, settings, procedural sound/music, health/ammo pickups and static/offline packaging |
| SP-002 | Proposed; not implemented | Additional distinct arenas, survival-wave option, richer bots, expanded pickups, balance work and score challenges, with tests |
| SP-003 | Proposed; not implemented | Bounded data-only map/weapon/mod packs, improved authoring, creator tools and optional source-bound replay export; version formats and preserve compatibility |
| SP-004 | Proposed; not implemented | Demoscene-derived original intro, richer materials/effects/sound, accessibility and presentation polish, and cosmetics earned through ordinary play |
| SP-005 | Proposed; not implemented | Broader game QA, asset/provenance audit, release candidate and a separately owner-approved first release |
| SP-UPSTREAM-001 | Proposed; not started | Offer proven reusable systems to VANILLAJS after a substantial shared need or the Games2 review threshold is met |

SP-001 includes basic health/ammo supplies already; the SP-002 pickup proposal
means expanding and balancing them. It does not defer the existing collection
and cooldown behaviour. A cosmetic proposal never authorises a shop, paid unlock,
premium currency, loot box or battle pass.

## SP-001 review gate

Review the actual package against these requirements before accepting the slice:

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
