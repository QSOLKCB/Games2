# SP-001 verification record

Executed locally on 16 November 2026 for the first playable Strike Pixel PR.
This is implementation evidence, not release approval or hosted CI evidence.

## Source identities

- Games2 starting `main`: `821e407fe3686f44909dd431e51abd3f1381eb09` (merged documentation foundation, PR #1).
- Feature branch: `feat/sp-001-strike-pixel`.
- VANILLAJS release: v2.5.0, immutable commit `32b4fb1ca80e854297998aa00f87a8f012398b89`.
- Engine selection: 13 modules, two audio API files, original catalogue, LICENSE and NOTICE; 18 unchanged files plus the game-owned provenance receipt.
- Engine file bytes were compared with `git show <pin>:<path>`, in addition to checking the receipt, declared module closure and actual imports.
- Existing concept/donor inventories, archived README, integration policy, root/game agent rules and original handoff remain byte-for-byte unchanged. Preservation digests are in the source checkout's `strikepixel/evidence/preservation.json`.

No engine module, numerical proof or prior evidence was modified. No merge, tag,
release, deployment or owner-only runner was invoked.

## Executed checks

| Command / check | Result |
| --- | --- |
| `node --test strikepixel/tests/*.test.mjs` | PASS: 24 tests; no skipped tests |
| `node strikepixel/scripts/verify.mjs --source` | PASS: local source/import graph, immutable module closure, hashes and attribution |
| `node strikepixel/scripts/build.mjs` | PASS: reproducible static package with licences/notices and digest inventory |
| `node strikepixel/scripts/verify.mjs` | PASS: package bytes match allowed source; stale, modified and extra files rejected |
| `node strikepixel/scripts/browser.mjs` with external Playwright/Chromium | PASS: real packaged game, user input, match outcomes, recovery and offline startup |
| Relative documentation paths and preserved inventory comparison | PASS; online source-only links are explicitly distinguished |
| `git diff --check` | PASS |

Node runtime: **22.18.0**. Browser tooling: externally installed **Playwright
1.64.0** and headless **Chromium 158.0.8127.18**, with software WebGL. These tools
are not runtime dependencies and are absent from the static package.

The browser harness creates and closes its own loopback HTTP server. It serves
the verified `dist/` package at `/games/strikepixel/index.html`, exercising a
nested URL rather than assuming site-root deployment. `window.strikePixel.inspect()`
returns detached, read-only observations; tests cannot mutate the match through it.
The harness advances browser `requestAnimationFrame` through Playwright's clock;
all authoritative simulation still runs through the real fixed clock and inputs.

## What was exercised

Node tests cover original arena walls/steps, jumping, sprinting, diagonal bounds,
precision head/body damage, trigger admission, automatic cadence, projectile
travel and blocked splash, ammunition/reload, bot detection/memory/pathfinding/cover,
actual bot shots, death/respawn/team scoring, win/loss/draw, pickup cooldowns,
pause and restart, deterministic same-runtime sequences, atomic input rejection,
strict settings, procedural PCM, bounded audio voices and pending-audio cancellation.
Package tests reject altered vendor/source/output bytes, external imports,
symlinks, unknown files, cache corruption and partial installations.

Packaged browser checks exercise:

- Native WebGL arena/weapon presentation and gesture-enabled music/effects.
- Actual precision hits and eliminations, sprint/jump, automatic fire, travelling projectiles, explosions and reload.
- Native pointer capture and click firing; explicitly emulated relative mouse deltas and denied-capture drag fallback.
- Escape, blur, hidden-page cancellation, stale held-key repeat, frozen pause and explicit resume.
- Simulated standard-gamepad neutral interlock, movement, firing, pause and disconnection.
- WebGL context loss, restored buffers and explicit resume after recovery.
- Bots killing the player, 2.5-second respawns, a real three-point defeat, complete match screen and restart.
- Three aimed precision eliminations producing a real three-point victory.
- Reachable controls without horizontal overflow at 320px and 390px widths.
- Complete service-worker activation, a subsequent controlled page, networking disabled, fresh nested-path startup and actual offline shots/elimination.
- Invalid persisted settings, storage failure, unavailable audio, unavailable WebGL and failed module import.

The browser report and screenshots are retained in the source checkout under
`strikepixel/evidence/`; reruns write `strikepixel/browser-artifacts/` (ignored).
Evidence is excluded from the playable package. The report identifies the exact
package hash it exercised. Screenshot pixels illustrate the observed software
renderer; they are not golden cross-device pixel assertions.

## Failures found and resolved

Development attempts are retained in `strikepixel/evidence/browser-attempts.log`.
They are not rewritten as successful runs:

1. A simulation cover fixture initially selected an unblocked sightline. It was replaced with a tower-occluded point and an explicit ray assertion; the cover test then passed.
2. The first browser movement assertion expected ground acceleration during a jump. Sprint and jump are now tested independently against the engine's actual lower air acceleration.
3. An upward projectile flew over the walls instead of producing the expected impact. The test now aims at the floor, first observes finite travel, then verifies an actual explosion.
4. The package verifier correctly rejected a stale build after documentation changed. Rebuilding restored source/package identity.
5. A headless absolute mouse movement did not provide a reliable relative delta. The check now independently proves native capture/click firing and explicitly emulates relative device deltas. Control scenarios begin with fresh matches so bot deaths do not contaminate unrelated assertions.
6. Offline gameplay succeeded, but an assertion expected the online installation wording. It now verifies the ready state and the distinct installed-offline message.

Independent review also fixed returning-offline installation status when the
uncached manifest is unavailable, fatal-render-error resume handling, the
advertised help shortcut and initial storage-availability reporting. No existing
engine assertion was weakened, and no frozen source/evidence was changed.

## Limits and deferred validation

No physical GPU/RTX, real gamepad, mobile device, touch combat, Safari, Firefox,
screen-reader session or long-duration soak was tested. Standard gamepad results
use an emulated browser device. Fullscreen is an optional convenience and is not
part of the recorded hardware coverage. This is one arena and a playable vertical
slice, not a claim of a polished full commercial game.

The player can reach the raised deck; bots use a conservative ground-plane grid.
Physics use Float64 with tick-start target poses. Cross-browser bit-exact physics,
network lag compensation, replay export, mod imports, extra arenas and progression
are not implemented or implied. See [the roadmap](../ROADMAP.md) for later scopes.

To reproduce the checks, use [the README commands](../README.md#development-and-checks).
Owner review is required before merging or counting this game toward the upstream
integration milestone.
