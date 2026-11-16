# Strike Pixel

**SP-001: playable preview, merged in PR #2. Unreleased.**

**Implementation → Polish → Release Review:** SP-001 implementation is complete;
SP-002 is the next dedicated gameplay and presentation polish PR. Initial release
remains pending merged polish, required tests and CI, a working deployed preview,
documented limitations and owner approval after playing through the Games2
Cartridge Cabinet. Release review is an approval gate, not automatically a third
implementation PR. See the [visible progression and polish scope](ROADMAP.md#implementation--polish--release-review)
and [repository policy](https://github.com/QSOLKCB/Games2/blob/main/AGENTS.md).

An original offline arena FPS for Games2. Enter **Sunrelay Yard**, a compact
34-metre block-built arena with teal cover, a warm amber relay tower, flank routes
and an accessible raised deck. Three weapons, three local opponents, one short
match. Every weapon is available from the start.

**No microtransactions. No premium currency. No loot boxes. No battle passes.
No accounts, advertisements, tracking or paid unlocks.**

## Play locally

Use Node.js 22 or later and Python 3. No npm installation is needed to build or
play. Run these commands from the **Games2 repository root**:

```sh
node strikepixel/scripts/build.mjs
node strikepixel/scripts/verify.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/strikepixel/dist/** in a WebGL-capable browser.
Choose a match and difficulty, then select **Enter the Yard**. Sound starts after
that user action; a missing audio device does not prevent play.

To test it through the Games2 cabinet, run `node scripts/build-site.mjs` from the
repository root, serve `site/`, and select the Strike Pixel cartridge. The site
build reuses this game's build/verifier and copies its complete verified package.
When the parent cabinet registry is available, the footer offers **Return to
Games2 Arcade**; leaving pauses and cancels controls through the existing lifecycle.
The standalone export still works without a cabinet. The cabinet itself requires
network access; cached game visits retain their independent offline support.
See the repository's [Pages deployment guide](https://github.com/QSOLKCB/Games2/blob/main/docs/DEPLOYMENT.md)
for deployment status and the post-merge live-site check.

- **Arena match:** first to eight eliminations, or the higher score after three minutes.
- **Quick skirmish:** first to three eliminations, or the higher score after two minutes.
- You play against the combined score of three bots. Equal scores at timeout are a draw.
- Death causes a 2.5-second respawn delay. Find cover, reload and try a different route.
- **Casual** gives more health, slower opponents, longer reaction time and less accurate enemy fire. **Standard** raises the pressure.

The timer counts simulation time. Pausing stops the match, weapon timers,
projectiles, respawns and pickup cooldowns together.

## Controls

| Action | Keyboard / mouse |
| --- | --- |
| Move | W, A, S, D |
| Sprint / jump | Shift / Space |
| Look | Mouse after clicking the arena; arrow keys also aim |
| Fire | Left mouse button while captured, or F |
| Select weapon | 1, 2, 3, or the weapon buttons |
| Reload | R |
| Pause | Escape or the Pause button |
| Resume | Resume match in the briefing |
| Mouse capture unavailable | Drag the arena to look; use F to fire |
| Help / fullscreen | On-screen Controls and Full screen buttons |

Field settings control aim sensitivity, inverted vertical aim, music and effects.
Settings are stored locally in this browser. There is no account or cloud save.
Release held fire before resuming: a stale trigger cannot fire through a pause.

A standard-mapped gamepad uses the left stick to move, right stick to look, RT
to fire, A to jump, X to reload, LB/RB to switch weapons and Start to pause.
Release controls to neutral before resuming. Hardware controller testing is
reported separately from simulated browser input.

Desktop keyboard and mouse are the primary controls. A responsive small-screen
layout is not a claim of complete touch combat or physical mobile validation.
See the [verification record](docs/VERIFICATION.md) for actual device coverage.

## Your loadout

| Weapon | Behaviour | Magazine / starting reserve |
| --- | --- | --- |
| **Lancet** | Accurate hitscan; one shot per fresh press; headshots and one penetration through wood or an actor. Stone stops it. | 8 / 48 |
| **Rivet** | Sustained automatic fire with seeded dispersion. Hold the trigger; reload behind cover. | 24 / 144 |
| **Comet** | A visible projectile travelling at 22 m/s. Its 2.6-metre splash is blocked by solid cover and can hurt its owner. | 4 / 20 |

Cooldown and reload progress belong to each weapon, including while another
weapon is selected. Amber supplies restore reserve ammunition; teal health
supplies restore health. Collected supplies return after their own cooldown.
The six shallow steps on the west flank lead to the raised deck.

Bots use sightlines, reaction delay, remembered positions, bounded pathfinding,
strafing and cover decisions when hurt. Their shots pass through the same combat
and collision systems as yours. They do not deal random damage through walls.

## Offline package

The build produces a complete static game in `strikepixel/dist/`. Keep its files
together. You can copy that folder to another machine and serve it with a local
HTTP server without internet access.

For browser-cached offline play, first open the package over HTTPS or a loopback
HTTP address and wait for **Offline installation complete**. Reload or reopen the
game once so the installed worker controls the page before disconnecting. An
interrupted installation is not a completed offline copy. Clearing browser site
data removes the installation. An available update waits for existing game tabs
to close.

Do not double-click `index.html` to use a `file://` URL. Native module loading and
service-worker installation need an HTTP origin. A local server supplies files;
it does not run a game backend or contact a cloud service.

The export includes the runtime, engine closure, licence/notice files, this README,
roadmap and Markdown guides, a SHA-256 manifest and the generated service worker.
Development tools, tests and raw verification artifacts stay in the checkout.
Repository policy, historical handoff and upstream integration links open the
source repository when online; they are not game runtime dependencies.

## Development and checks

From the repository root:

```sh
node --test strikepixel/tests/*.test.mjs
node strikepixel/scripts/verify.mjs --source
node strikepixel/scripts/build.mjs
node strikepixel/scripts/verify.mjs
node strikepixel/scripts/browser.mjs
git diff --check
```

The browser command requires separately installed Playwright and Chromium. It is
verification tooling, not a shipped dependency. Point `NODE_PATH` at the directory
containing the existing Playwright package when it is not otherwise resolvable.
Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium executable when
needed. For example:

```sh
NODE_PATH=/path/to/tools/node_modules PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium node strikepixel/scripts/browser.mjs
```

Build first: browser checks exercise the actual static package.

Read [architecture](docs/ARCHITECTURE.md), [provenance](docs/PROVENANCE.md),
[recorded verification](docs/VERIFICATION.md), [agent rules](https://github.com/QSOLKCB/Games2/blob/main/strikepixel/AGENTS.md) and the
[roadmap](ROADMAP.md) before changing the game. Test results belong in the execution
record; the presence of a command here is not evidence that it has passed.

If startup fails, keep the error message, check that the HTTP server is running
and use Reload game. WebGL is required for the playable scene. Audio failure is
reported separately. Offline installation failure leaves the currently loaded
game usable, but requires a successful installation before a later offline visit.

## Foundation, ownership and future work

The game consumes **VANILLAJS v2.5.0**, pinned to immutable commit
`32b4fb1ca80e854297998aa00f87a8f012398b89`. Selected engine files are copied unchanged;
the [vendor receipt](vendor/vanillajs/provenance.json) records their full dependency
closure and hashes. These engine modules remain experimental. Simulation uses
60 Hz Float64 metre-scale physics, not Q16.16 or a promise of cross-browser
bit-exact results.

Sunrelay Yard, match rules, bot policy, robot and weapon models, presentation,
effects and the procedural score are original Strike Pixel work. Colourful
block-shooter games, including Pixel Gun 3D, are genre references only: no names,
maps, source, ripped art or commercial music from those games are reproduced.
The Block Arena Foundry is an engine-contract reference, not the game republished
with different branding.

The roadmap preserves proposals for additional arenas, survival waves, richer
bots, score challenges, data-only mods, exportable replays, creator tools and
cosmetics earned through normal play. None is an entitlement system or a promise
of the current build. Full voxel destruction, online multiplayer and a large
content catalogue are outside SP-001.

VANILLAJS owns reusable engine systems; Games2 owns this game. Engine changes need
[a separate upstream review](https://github.com/QSOLKCB/Games2/blob/main/docs/ENGINE_INTEGRATION.md). The historical
[SP-001 handoff](https://github.com/QSOLKCB/Games2/blob/main/strikepixel/CODEX_HANDOFF.md) remains available as the original implementation
brief. No release, tag or deployment is implied by this implementation.

**QSOL-IMC — THIS IS NOT A PRODUCT. THIS IS INDEPENDENCE.**
