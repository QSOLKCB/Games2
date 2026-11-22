# Blade Circuit roadmap

## Implementation → Polish → Release Review

| Pass | State | Scope and evidence |
| --- | --- | --- |
| CYBER_NINJA-001 implementation | Playable candidate in review | Three scrolling encounters, two guard types and a foreman; chain timing, frontal blocks, armor breaks, repair and a freight-lift finish. [Rules tests](tests/world.test.mjs), [cabinet playthrough](../tests/cartridges/cyber-ninja.mjs) and [engine receipt](vendor/vanillajs/ENGINE_PIN.json). |
| CYBER_NINJA-002 polish | Separate pass queued for review after implementation | Refine timing, audiovisual feedback, controls and accessibility. Exercise the packaged game and record rendering measurements. |
| Initial release review | Pending owner decision | Both PRs merged, required CI green, hosted cabinet play and offline verification, then owner sign-off. |

One authored route. Keyboard and on-screen controls. Physical controllers and sustained hardware frame rates have not been measured.

[Play and verify](README.md) · [Original proposal](../docs/GAME_IDEAS.md)
