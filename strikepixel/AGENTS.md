# Strike Pixel — local agent rules

Read [Games2 root AGENTS.md](../AGENTS.md) first; it remains authoritative for repository policy.

This directory owns the **Strike Pixel game**. It does not own VANILLAJS physics/math modules, other Games2 games or their documentation.

## Before changing the game

1. Read this file, [README](README.md) and [ROADMAP](ROADMAP.md). [CODEX_HANDOFF](CODEX_HANDOFF.md) is the historical SP-001 brief, not the current next-task instruction.
2. Inspect VANILLAJS `v2.5.0` at exact commit `32b4fb1ca80e854297998aa00f87a8f012398b89`, its `MODULES.json` and its FPS contracts. If a newer reviewed engine is deliberately selected, record that decision and complete source pin.
3. Plan one game, one coherent playable vertical slice per implementation PR. Do not create a second Games2 game during Strike Pixel work.
4. Keep game runtime under `strikepixel/`; only narrowly necessary root navigation/docs changes are allowed.

## Mandatory Implementation → Polish → Release Review

- **Pass 1 — SP-001 implementation:** complete and merged in PR #2. Preserve its playable vertical slice, tests, browser evidence, documentation and provenance.
- **Pass 2 — SP-002 polish:** the next game PR, after implementation has merged. Improve the existing Sunrelay Yard game: gameplay feel and difficulty; graphics, animation and effects; soundtrack, sound effects and feedback; responsive controls and input handling; menus, HUD, usability and accessibility; performance and unnecessary rendering; bugs, edge cases and recovery; offline packaging and deployment; regression tests and actual browser gameplay. Record each area's changes and verification, and document remaining limitations. Submit a separate polish PR for owner review. Do not substitute a new game or a large unfinished feature expansion.
- **Pass 3 — initial release review:** an owner approval gate, not automatically another implementation PR. Both implementation and polish PRs must be merged, required tests and CI must pass, the deployed preview must work, and limitations must be documented. The owner tests it through the Games2 Cartridge Cabinet and explicitly authorises release.

Keep the visible progression and PR/evidence status in [ROADMAP.md](ROADMAP.md)
current. Critical defects may be fixed immediately during either pass. Further
polish PRs may be owner-approved; a failed release review returns the game for
corrections. Two passes are the minimum quality process, not a release guarantee.
Later enhancement and bug-fix PRs do not repeat the entire process.

The second Games2 game begins after Strike Pixel's initial polish review unless
the owner explicitly changes priorities. Cabinet infrastructure merged in PR #3;
it does not count as Strike Pixel's polish pass or release approval.

## Game invariants

- Offline-first, original art/music, accessible menus, responsive input, no runtime third-party engine or CDN.
- Absolutely no microtransactions, loot boxes, battle passes, premium currencies, pay-to-win upgrades, accounts, advertisements, telemetry or entitlement validation.
- Preserve fixed-step simulation and explicit source/pack identity; do not claim cross-browser bit-exact Float64 physics.
- Use the engine's actual physics, movement, combat, input, navigation, audio and rendering APIs where practical; do not invent shadow implementations for convenience.
- Every gameplay effect must be observed in the real state and rendered scene, not just simulated by nonfunctional UI controls.
- Pausing, escaping pointer lock, blur, hiding, controller disconnection and resets must clear held controls and pending fire safely.
- Version and validate imported maps/mod packs/replay if supported. Invalid inputs must preserve accepted state.
- Original assets only; historic shooter names are genre references, not content to reproduce.

## Verification and release

- Maintain the existing local tests and commands, adding regression coverage for implementation and polish changes.
- Execute actual game logic tests and packaged Chromium player flows, including shots, hits, bot response, match outcome, pause/restart and offline reload.
- Retain failure evidence and explain untested hardware limitations.
- Review source licence and notices for any adapted donor/engine files.
- Do not merge, tag, publish, deploy or alter VANILLAJS without owner permission.

SP-001 merged in PR #2; [CODEX_HANDOFF.md](CODEX_HANDOFF.md) remains the original
implementation brief. The game is a playable preview, not a versioned release.
Cabinet integration must reuse `scripts/build.mjs` and `scripts/verify.mjs`, copy
the complete verified package, preserve its worker scope and cache namespace,
and keep standalone exports playable. Navigation changes must retain existing
pause, input and audio cancellation. New gameplay requires its own reviewed scope.
