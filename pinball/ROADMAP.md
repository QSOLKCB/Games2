# Orbital Pinball roadmap

## Implementation → Polish → Release Review

| Pass | State | Scope and evidence |
| --- | --- | --- |
| PINBALL-001 implementation | Playable candidate in review | A single original table, guided shooter lane, two driven capsule flippers, three powered bumpers, three balls and a final score. [Rules tests](tests/world.test.mjs), [cabinet playthrough](../tests/cartridges/pinball.mjs) and [engine receipt](vendor/vanillajs/ENGINE_PIN.json). |
| PINBALL-002 polish | Separate pass queued for review after implementation | Refine timing, audiovisual feedback, controls and accessibility. Exercise the packaged game and record rendering measurements. |
| Initial release review | Pending owner decision | Both PRs merged, required CI green, hosted cabinet play and offline verification, then owner sign-off. |

One table with session scores. Same-runtime replay is covered by tests. Physical controllers, cross-browser numerical identity and sustained hardware frame rates have not been measured.

[Play and verify](README.md) · [Original proposal](../docs/GAME_IDEAS.md)
