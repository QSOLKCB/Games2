# Games2 ↔ VANILLAJS integration contract

## Ownership

**VANILLAJS:** reusable physics, collision, math, rendering, input, audio, modules, Mod SDK, Game Labs and tutorials.

**Games2:** game-specific worlds, rules, enemies, modes, visuals, progression, data packs, save files, releases and packaging.

Games2 must not import source directly from VANILLAJS's GitHub `main` at runtime. VANILLAJS must not import Games2's game logic or creative assets into core modules.

## Pinned initial engine

The currently published baseline is [VANILLAJS v2.5.0 — Creator Gateway](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0), commit:

`32b4fb1ca80e854297998aa00f87a8f012398b89`

At the reviewed baseline VANILLAJS includes the experimental Block Arena Foundry, `combat3d`, `mod-fps`, `character`, `weapons`, `projectiles`, `collision`, `navigation`, `render-webgl`, `gamepad`, `audio2d` and creator workflows. Verify actual exports, import closure and versioned contracts against the pinned source before using any of them.

Read the following source documentation when implementation begins:

- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/AGENTS.md
- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/MODULES.json
- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/docs/AGENT_GUIDE.md
- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/docs/FPS_FOUNDATION_001.md
- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/docs/BUILD_YOUR_FIRST_BLOCKY_FPS.md
- https://github.com/QSOLKCB/VANILLAJS/blob/v2.5.0/docs/GAMES2_INTEGRATION.md

These are **reference URLs**, not remote runtime imports.

## How a Games2 game should consume the engine

1. Identify the minimum actual public module/API dependency closure from `MODULES.json`, using direct module imports where the API is documented.
2. Pin a reviewed immutable commit or release; use a local copy or source-pinned build generated entirely within the game. Keep a full local provenance record and licence notices with distributed source.
3. Choose one explicit approach for the game; do not duplicate the same engine functionality under both local and remote imports.
4. Own all game-specific world/scene content in the game's directory. Do not quietly copy a complete VANILLAJS lab and present it as an independently authored game.
5. Test both real browser gameplay and the packaged/offline product. A Node physics test is not a substitute for a game being playable.
6. Apply upstream fixes by explicit revision update in a separate consuming-game PR with fresh tests.

The first documentation PR adds **no vendored engine code**, package lock, game runtime or installation requirement. The next implementation PR must make the dependency selection inspectable.

## Numerical, replay and source evidence boundaries

- Describe right-handed +Y-up / −Z-forward conventions, metre-scale Float64 FPS simulation, kinematic AABB limits and any movement approximations in a consuming game.
- Use fixed-tick replay and source/pack identity where supported, without claiming cross-runtime Float64 bit-exactness.
- Never mix `combat2d`'s integer 256-subunits model with 3D Float64 FPS combat without explicit conversions and an independent test.
- Preserve start/pause/blur/controller cancellation and offline startup; do not assume those behaviours work because the donor has a lab.
- Include success, rejection, malformed-input, overflow/capacity and gameplay lifecycle tests appropriate to the selected APIs.
- Be honest about executed tests versus inferred outcomes and hardware not available for validation.

## Games2 → VANILLAJS upstream review

Game implementations are the proving ground for reusable ideas. The default review threshold is **three completed Games2 games** since the previous review; the owner may approve an earlier review for an important cross-game system.

A completed game requires executable gameplay, mandatory per-game docs, passing prescribed checks and owner-approved release (or equivalent reviewed completion milestone). Design-only folders and VANILLAJS labs never count.

For a candidate reusable feature:

1. Record the Games2 revision and concrete user-visible or numerical behaviour.
2. Audit all relevant donor commits, file licences, assets and provenance.
3. Identify an engine-general contract independent of game fiction, progression and DOM.
4. Compare against existing VANILLAJS module contracts and select a minimal additive change.
5. Supply reference tests and a real lab/tutorial demonstrating the feature.
6. Submit a **separate VANILLAJS PR** and obtain owner review, with release/tag separately authorised.
7. Update Games2 to a reviewed engine revision only through another Games2 PR.

No automatic synchronization, copying, source promotion or background workflow is authorised.

## Minimal integration receipt — future implementation

When code lands, record in the game (format chosen during implementation):

- Consuming game commit.
- Source VANILLAJS commit and release.
- Selected imported engine modules and transitive closure.
- Local changes and patches (if any).
- Source SHA-256 / vendor-copy integrity for shipped assets where feasible.
- Licences and notices.
- Game-level test commands and executed results.
- Known numerical and platform limitations.

Do not create a fake populated provenance receipt in this documentation-only PR.

[Games2 roadmap](../ROADMAP.md) · [Donor inventory](DONOR_CATALOGUE.md)
