# Corporate dystopia FPS — roadmap

**Status:** planning scaffold only. No game source, playable cartridge, release, network service or owner sign-off is implied.

Games2's [development process](../docs/DEVELOPMENT_PROCESS.md) requires a focused implementation PR, a **separate** polish PR and an owner release gate. Development cannot bypass that process.

**Inspiration reference:** Syndicate (2012). The delivered title, characters, levels, art, soundtrack, code and story must be original.

## Implementation → Polish → Release Review

| Pass | Identifier | Status | Evidence gate |
| --- | --- | --- | --- |
| Implementation | CYBER_FPS-001 | **Proposed backlog; not started** | One original infiltration objective, fair enemies and distinct gadget interactions. Pin exact VANILLAJS source and module closure; test gameplay, packaging, offline browser behaviour and failure recovery |
| Polish | CYBER_FPS-002 | **Blocked on implementation merge** | Controls, feel, balance, original art, sound, UI/accessibility, frame budget, regression, actual play and a separately reviewed PR |
| Release Review | Initial release | **Not eligible** | Both implementation and polish merged, green required CI, playable deployed cabinet preview, limitations documented and explicit owner approval |

## Design and engineering scope

An original near-future infiltration shooter with readable augmentations and mission selection.

Provisional engine candidates: **combat3d, tactics, sensing, weapon-feel, render-lit**. Confirm public API and numerical
contracts and snapshot only the reviewed dependency closure at implementation.
Asset generation may use CAD/Creator-Interop, but independent game worlds must
remain owned by Games2; there is no runtime server or CDN requirement.

## Acceptance and exclusions

- Original, self-contained offline gameplay with a meaningful win/loss/restart loop.
- Explicit tests for invalid state/imports, time and input cancellation, sprite/mesh
  limits and browser reload (as applicable).
- Fixed simulation ticks and clear presentation/performance budgets. Do not claim
  cross-device parity without measurement.
- No commercial game replica, recognisable copyrighted characters/sound, paid
  mechanics or network multiplayer in initial scope.
- Preserve the original ideas catalogue even if this concept changes name.
- Concept status is never silently promoted to playable/released.

[Readme](README.md) · [Monorepo policy](../AGENTS.md) · [Portfolio order](../ROADMAP.md)
