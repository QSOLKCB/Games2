# Strike Pixel — local agent rules

Read [Games2 root AGENTS.md](../AGENTS.md) first; it remains authoritative for repository policy.

This directory owns the **Strike Pixel game**. It does not own VANILLAJS physics/math modules, other Games2 games or their documentation.

## Before implementation

1. Read this file, [README](README.md), [ROADMAP](ROADMAP.md) and [CODEX_HANDOFF](CODEX_HANDOFF.md).
2. Inspect VANILLAJS `v2.5.0` at exact commit `32b4fb1ca80e854297998aa00f87a8f012398b89`, its `MODULES.json` and its FPS contracts. If a newer reviewed engine is deliberately selected, record that decision and complete source pin.
3. Plan one game, one coherent playable vertical slice per implementation PR. Do not create a second Games2 game during Strike Pixel work.
4. Keep game runtime under `strikepixel/`; only narrowly necessary root navigation/docs changes are allowed.

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

- Add local tests and commands when implementation exists; the documentation-only foundation intentionally has none.
- Execute actual game logic tests and packaged Chromium player flows, including shots, hits, bot response, match outcome, pause/restart and offline reload.
- Retain failure evidence and explain untested hardware limitations.
- Review source licence and notices for any adapted donor/engine files.
- Do not merge, tag, publish, deploy or alter VANILLAJS without owner permission.

The next authorised coding scope is described in [CODEX_HANDOFF.md](CODEX_HANDOFF.md), **but this documentation-only PR does not authorise implementation**.
