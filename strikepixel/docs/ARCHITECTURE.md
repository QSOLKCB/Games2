# Strike Pixel architecture

Strike Pixel owns the arena, match rules, opponents and presentation. VANILLAJS
owns the reusable movement, combat, navigation, timing, input, geometry, rendering
and audio modules. The game imports a local immutable engine closure; it never
loads engine source from GitHub at runtime.

## Source map

| Path | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Briefing, HUD, settings, controls, end screen and responsive layout |
| `start.js` | Startup boundary and visible reload recovery if module loading fails |
| `src/app.js` | Devices, input cancellation, fixed clock, UI lifecycle and presentation coordination |
| `src/world.js` | `StrikeMatch`, weapon definitions, match options, combat composition, pickups, scores and respawns |
| `src/arena.js` | Original immutable Sunrelay Yard solids, visual-only paint/decor, spawns and supplies |
| `src/bots.js` | Original bot policy and construction of the bounded navigation grid |
| `src/render.js` | Engine WebGL presentation, original box models, weapon view, traces, impacts and effects |
| `src/audio.js` | Original procedural score/effects and engine Web Audio players |
| `src/settings.js` | Versioned, bounded browser-local settings admission |
| `src/offline.js` | Optional installation of the built static package |
| `vendor/vanillajs/` | Unchanged selected engine source, catalogue, receipt, licence and notices |
| `scripts/` | Dependency-free source/package verification, build and browser verification harness |
| `tests/` | Game, settings and packaging tests |

Begin with [the README](../README.md) and [local agent policy](https://github.com/QSOLKCB/Games2/blob/main/strikepixel/AGENTS.md).
The [provenance document](PROVENANCE.md) identifies every selected engine module.

## One authoritative simulation

`StrikeMatch` is pure JavaScript with no DOM, ambient clock, storage or audio
device access. Its constructor accepts `{seed, difficulty, scoreLimit,
durationTicks}`. Supported difficulty names are `casual` and `standard`; score
limits are 1–25 and duration is 60–18,000 ticks. The UI selects the documented
three-point/two-minute or eight-point/three-minute match.

The lifecycle is `ready → playing → paused → playing → ended`. `start()` starts a
ready match, `pause()` and `resume()` preserve the logical clock, and `restart()`
reconstructs the same options and seed before starting a fresh match.
`snapshot()` returns detached state; editing it cannot change the match.

Each `step(command)` advances exactly 1/60 second while playing. Commands are
plain records containing only these optional fields:

| Field | Meaning |
| --- | --- |
| `moveX`, `moveZ` | −1…1 movement; positive X is right, positive Z means forward |
| `yaw`, `pitch` | Absolute aim in radians; defaults retain the previous aim |
| `fire`, `reload`, `jump`, `sprint` | Boolean requests |
| `weapon` | Integer 0, 1 or 2: Lancet, Rivet or Comet |

Pitch is bounded to ±1.5 radians; accepted yaw is bounded and wrapped. Input
validation rejects unknown keys, accessors, non-finite numbers and invalid types
before moving actors, consuming randomness or advancing combat. Jump is edge
gated. Pause clears weapon triggers and requires a released fire input before
shooting can resume.

A tick processes admitted input and due respawns, moves living actors through
`stepCharacter`, publishes poses to `Combat3D`, resolves actual shots/projectiles,
applies supplies and checks score/time limits. Combat events drive the HUD,
renderer and sound. The UI does not manufacture hits or award kills.

The app uses the engine `FixedClock` at 60 Hz, a 0.1-second frame bound and at most
six catch-up steps. Overload cannot create an unbounded simulation backlog.
Mouse/controller sampling is separate from authoritative state. The app copies
returned aim back into its controls so weapon recoil remains part of simulation.

## Movement, combat and match rules

Coordinates use metres, right-handed rotation, +Y up and −Z forward. Feet-centre
positions drive upright character AABBs. Geometry is static: walls, floor, cover,
a raised deck and six 0.25-metre steps. Visual-only floor markings and relay
trim do not create collision. There is no actor/actor pushing or voxel destruction.

`Combat3D` owns weapon timers, ammunition, hit regions, projectiles, damage and
elimination attribution. Precision fire needs a fresh trigger. Automatic fire
accepts held requests. The projectile weapon travels through the real world
before impact; splash requires an unobstructed segment and can damage its owner.
Weapon switching preserves individual cooldown, reload and ammunition state.
Seeded spread and recoil belong to Strike Pixel's simulation.

The player faces three allied bots. Enemy eliminations increase the relevant
side's score; friendly fire is disabled. Death schedules a 150-tick respawn,
choosing among admitted spawn positions by distance from living enemies.
Health and equipment reset on respawn while kills/deaths remain. Supplies restore
player health or all weapon reserves and then enter a finite cooldown.

The first side reaching the configured score ends the match. At timeout the
higher score wins; equal scores produce a draw. Ended and paused matches do not
advance through `step`.

## Bounded bot policy

Bots use real solid-geometry sight rays within 29 metres. A seen player starts a
reaction timer and updates remembered position. Loss of sight permits pursuit
for 180 ticks; expired memory returns the bot to patrol. Visible combat combines
approach/retreat with strafing. Bots shoot the same engine weapon and need real
ammunition/reloads; the policy has no direct-damage shortcut.

When health falls below 65% of its maximum, a bot checks up to 24 cover candidates
on a 90-tick schedule. A usable candidate must actually occlude the player's
sightline. Hurt bots alternate cover and peek windows. Navigation is the engine's
four-neighbour A* on a 34×34 X/Z occupancy grid, with a 256-expanded-cell budget
and at least 60 ticks between each bot's searches. Searches are staggered by bot.
Budget exhaustion yields no partial path.

This is a conservative ground-plane policy. The raised deck is accessible to the
player but is not a general multi-level bot navigation mesh. Snapshot work counters
expose route expansion and cover checks for inspection.

## Presentation, settings and devices

The renderer reads detached snapshots. Original box-built robots, weapons and
arena geometry use the engine mesh/renderer facilities. Recent visual effects
are bounded to 128 records; engine combat caps active projectiles at 64. A lost
WebGL context pauses play and exposes recovery rather than advancing an invisible
match.

The score is an original six-bar loop at 96 BPM, synthesized from local tone/noise
events. Shot, hit, explosion, reload and pickup cues are also procedural. Audio
starts after a user gesture. Device playback time never advances simulation;
missing audio leaves the match playable. Effects use bounded voice/buffer counts.

Native keyboard/mouse and the engine's standard-gamepad neutral gate feed the same
commands. Pointer unlock, Escape, blur, hidden tabs and controller disconnection
pause and cancel held/pending controls. A controller must be neutral before it
arms after cancellation. A drag-look/F-fire fallback avoids making pointer lock
a prerequisite for play. Full touch combat is not implemented.

Settings have a versioned kind and a 2,048-character parse bound. Only the admitted
sensitivity, inversion, audio, difficulty and match fields can replace accepted
settings. Storage is browser-local and optional. SP-001 has no game-save, replay,
map or mod import and never evaluates project data as executable instructions.

## Build and evidence boundaries

The build verifies the vendor receipt and local resource graph, then copies an
explicit public allowlist to `dist/`. The generated manifest records every
shipped file's size and SHA-256 digest. The service worker verifies complete
installation and cached responses against that inventory. Build/verification
scripts and tests are not browser runtime dependencies.

Simulation uses Float64, not exact Q16.16 arithmetic. Projectile collision uses
tick-start actor poses, with no moving-target interpolation, rollback or network
anti-cheat claims. Repeating the same inputs and seed in the same source/runtime
is tested; cross-browser bit-exact results and identical pixels are not promised.
No mathematical proof or engine evidence has been changed by this game.

Read [VERIFICATION.md](VERIFICATION.md) for execution records. Tests of pure state,
headless browser controls and narrow viewports have distinct scopes; none alone
proves physical GPU, controller or mobile-device behaviour. Future engine changes
require a [separate upstream review](https://github.com/QSOLKCB/Games2/blob/main/docs/ENGINE_INTEGRATION.md).
