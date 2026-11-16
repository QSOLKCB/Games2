# Strike Pixel roadmap

**Current state: planned only.** Nothing in this directory is runnable yet.

Every milestone below needs its own reviewed development scope. Game code, tests and appropriate assets must be delivered before claiming implementation.

| ID | Status | Deliverable |
| --- | --- | --- |
| SP-DOC-001 | Proposed in first Games2 PR | README, local AGENTS, roadmap, initial implementation handoff; **no game code** |
| SP-001 | Not started | **First playable vertical slice:** one original 3D block arena, player controls, three distinct weapon types, offline bots, score/time-limited match, HUD, restart, basic original music/effects, browser/offline verification |
| SP-002 | Not started | Expanded arena roster, survival-wave option, richer bots, pickups and balancing, with tests |
| SP-003 | Not started | Bounded mod/map/weapon packs, improved authoring and optional source-bound replay; maintain backwards compatibility |
| SP-004 | Not started | Demoscene-derived original intro, better materials, effects, sound and accessibility/polish |
| SP-005 | Not started | Full game QA, original-asset/provenance audit, packaging, release candidate and owner-approved first release |
| SP-UPSTREAM-001 | Not started | Submit proven reusable game physics/tools to VANILLAJS review when a strong cross-game need exists or Games2 reaches its review threshold |

## SP-001 acceptance gate

- Real first-person movement and view interaction, independent of render timing.
- A complete short match: spawn, move, shoot, hit, score, death/respawn and match end.
- Three weapon archetypes whose simulated effects are genuinely different.
- Bots actively move, engage and react using actual game state and collision.
- All gameplay assets original or explicitly licensed.
- Pause, focus changes, restart and failure recovery implemented and tested.
- No paywall, network requirement, sign-in, tracking or premium economy.
- Executed tests and packaged Chromium play scenario; honest offline and source/provenance report.
- No edits to unrelated Games2 game concepts or VANILLAJS source.
- A reviewed implementation PR that is **not** automatically merged/tagged.

## Explicit non-goals for SP-001

- Network multiplayer and servers.
- Competitive ranking/account systems.
- Battle passes, cash shops and any monetisation.
- Huge map/weapon/skin catalogues.
- Full voxel destruction or Minecraft-style terrain.
- Unbounded AI/pathfinding.
- Claims of complete controller/mobile/physical GPU coverage without execution.
- Copying Pixel Gun 3D code, name, art, maps, sounds or commercial assets.

## Later quality priorities

Prefer a satisfying combat loop, fair bot feedback, readable hit/health/armour presentation, strong original environmental styling and stable offline packaging over adding many under-tested features.

Engine improvements discovered during game development go through [Games2 ↔ VANILLAJS review](../docs/ENGINE_INTEGRATION.md). A new engine feature requires a separate upstream PR.

[Design brief](README.md) · [Codex implementation handoff](CODEX_HANDOFF.md)
