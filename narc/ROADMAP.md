# Circuit Vice — NC roadmap (NARC-inspired original)

**NC-001 implementation in review (dedicated PR).** This game now has an original
fixed-step playable vertical slice, locally generated assets, immutable VANILLAJS
source, offline package and cabinet registration in the proposed branch. A
**playable preview is not an initial release**. NC-002 remains a separately
required polish PR followed by owner release review. Strike Pixel SP-002A PR #5
and the portfolio PR #6 were merged before this implementation started.

The working directory `narc/` honours the preserved inspiration request.
**Circuit Vice** is a provisional original title; it is not NARC, not licensed
by the original publisher, and must not imitate its protected characters,
stage layouts, logos, music, source code or sprites.

## Game identity and first-playable target

An original retro-future metropolitan action game: moving across overlapping
2.5D city lanes, responding to an unfolding technology-smuggling incident.
The main actions are *move, aim, dodge, shoot, stun, arrest, rescue, interact*.
Enemies have perceivable intent; the encounter has both urgency and a
meaningful score trade-off between reckless fire and successful rescue.

**NC-001 must include one finished mission**, not just a combat tech demo:
a readable arrival, two enemy archetypes, one bystander/rescue case, optional
non-lethal capture, a timed hazard, a distinct original boss encounter,
debrief, score, restart and clear failure condition. A second mission, driving,
local co-op and a campaign are possible extensions, not blockers for the first
slice unless the owner chooses them.

## Mandatory game progression

| Stage | Status | Deliverable and evidence |
| --- | --- | --- |
| **NC-001 — Implementation PR** | **Implementation PR in review; CI and owner review required** | One bounded playable city level and gameplay loop, exact audited VANILLAJS pin, original art/audio, offline package, tests, actual browser gameplay and import/focus/restart recovery |
| **NC-002 — Dedicated polish PR** | **Pending NC-001 merge and actual play review** | Rebalance weapons and enemy fairness; improve sprite animation, effects, soundtrack, control feedback, menus/HUD, colour accessibility, pause/resume and stable frame pacing; rerun all regression and real-browser tests |
| **Release Review** | **Not eligible** | Both PRs merged, all required CI green, deployed Games2 cabinet preview works, limitations documented, owner plays and explicitly authorises release |
| NC-003 — Extended districts / mode variants | Deferred | Optional second district, score challenge, data-only scenario authoring and cooperative local play with independent acceptance |
| NC-UPSTREAM-001 | Deferred | Only proven reusable 2.5D combat or authoring features move to VANILLAJS by separate reviewed PR |

## NC-001 engineering work packages

### NC-001A — Scope, rules and immutable engine source

Define screen/world units, collision and z-order conventions, simulation rate,
upper bounds for actors/projectiles/particles, spawn budget and outcome scoring.
Inspect actual `MODULES.json` exports at a newly selected **immutable VANILLAJS
commit**. Candidate modules: `combat2d`, `motion2d`, `projection25d`,
`sprite2d`, `tilemap`, `sensing`, `weapon-feel`, `audio2d`, `soundtrack`
and `creator-interop`. Use the narrowest reviewed closure; do not rely on
latest main at runtime or import the complete engine without reason.

**Acceptance:** one written authority diagram (state → presentation), exact
source hashes/licences and deterministic simulation/restart fixtures.

### NC-001B — Original street and 2.5D combat

Author a distinctive multi-depth 2.5D street block with shop facades, traversal
boundaries, street props and camera framing. Gameplay uses fixed ticks:
movement, aiming, projectile contact, damage, knockback, dodge and cooldown.
Collision geometry remains physical and inspectable even when layered
art is parallax or depth-sorted.

**Acceptance:** unambiguous collision vs visual layers, aim alignment,
hit registration, bounded catch-up, input neutral-gate on focus loss,
identical same-seed logical outcomes within the declared numerical contract.

### NC-001C — AI, objectives and score

Design two distinguishable enemy rules (e.g. opportunistic ranged attacker and
close-pressure combatant), one telegraphed boss, and an objective system with
rescue, capture and timed hazard consequences. AI target acquisition and cover
must not read hidden/presentation-only actor state. Award successful objectives
without exploiting civilians as points. All spawned actors have bounded
lifetimes and readable feedback.

**Acceptance:** full first mission can win/lose/restart; hostile/non-hostile
identification works; representative decisions change debrief; no
unbounded wave multiplication or unfair off-screen fire.

### NC-001D — VANILLAJS-generated original audiovisual assets

Generate new sprites and frame atlases through the reviewed Sprite Foundry
recipe/atlas interfaces where they suit the art direction; build optional
procedural 3D props with CAD/Geometry Forge when source and renderer
compatibility are checked. Draw original character silhouettes and UI icons.
Compose original local soundtrack/cues with native audio modules. Record
per-asset provenance and verify that no ripped arcade footage, samples,
logos, fonts, ROMs or third-party franchise assets enter the package.

**Acceptance:** animation states for idle/run/hurt/attack/arrest,
contrast-readable effects and original music/sound with mute and reduced-motion
options. No CDN or runtime image/audio generation service.

### NC-001E — Packaging, tests and playable review

Added (in NC-001 branch): game-owned `index.html`, `src/`, `tests/`, game package/verification
scripts and a controlled cartridge registration **only after the package
exists and passes source review**. Do not publish an unimplemented scaffold.
Test source SHA and licence inventory, fixed-step play, score, boss,
arrest/rescue logic, missing assets, invalid settings, restart and offline
service-worker delivery.

**Acceptance:** real browser gameplay from Games2 Cartridge Cabinet, offline
reload after installation, no cross-game worker or cache interference;
published Pages content is from a verified reviewed `main` build.

## NC-002 polish work packages

- Input: consistent pointer/gamepad/keyboard handling, remapping and focus/pause
  cancellation; check real controller hardware before claiming coverage.
- Feel: fair enemy telegraphs, weapon differentiation, hit effects, balanced
  challenge modes and satisfying mission/debrief transitions.
- Presentation: smoother original character animation, layered backgrounds,
  accessible HUD, legibility on small viewports, original soundtrack,
  precise visual aim and bounded effects.
- Performance: record the 60-fps desktop target on owner hardware; separate
  CPU simulation budget, asset generation, GPU upload and draw calls. Never
  claim a baseline from unmeasured tests.
- Correctness: no soft locks on boss defeat/restart, no retained inputs across
  pause, no stale service-worker cache, no network reliance.
- Release evidence: executed vs inferred explicitly separated; include known
  limitations and an independent actual playthrough.

## Explicit exclusions and rights

No remake assets, trademarked promotional title, original NARC characters,
music or levels; no copied commercial source, ROMs or emulation cores. Do not
claim official affiliation. No accounts, ads, tracking, pay-to-win, battles
passes or live-service systems. First release is a **complete offline local
game**, not an online multiplayer promise.

## After Circuit Vice

The next candidate comes from [36 documented original game ideas](../docs/FUTURE_GAME_DIRECTORIES.md),
not from auto-generated empty cartridges. Options include the original
ninja brawler `cyber-ninja/`, `pinball/`, an accessible immersive FPS
`immersive-fps/` and `star-command-rts/`. Cross-game engine promotions remain
separate approved VANILLAJS PRs.

[Game readme](README.md) · [Local agent policy](AGENTS.md)
· [Games2 roadmap](../ROADMAP.md) · [Preserved ideas](../docs/GAME_IDEAS.md)

## NC-001 implementation record (20 November 2026)

- Exact engine source: VANILLAJS `e9121ea7297b0aeca1da131b695e7c3371a98745`.
- Source-bounded modules: combat2d (swept contacts), motion2d (integer fixed-tick movement),
  projection25d (visual-only city depth), sprite2d (original seeded sprite art),
  time (bounded fixed clock) and audio2d (generated PCM cues).
- Implemented original response district, two regular hostile archetypes, boss,
  operator rescue, live-grid switch, capture/elimination choice, timer, evacuation,
  score, restart, pause/focus cancellation, Canvas 2D rendering and local audio.
- Exact Git blob provenance lives in `vendor/vanillajs/ENGINE_PIN.json`;
  no remote game asset fetch or runtime package dependency.
- Tests and verified package browser results are required **before** merging;
  this description is a submitted implementation scope, not release certification.
