# Orbital Pinball roadmap

## Implementation → Polish → Release Review

| Pass | State | Scope and evidence |
| --- | --- | --- |
| PINBALL-001 implementation | [Implementation PR #10](https://github.com/QSOLKCB/Games2/pull/10) in review | A single original table, guided shooter lane, two driven capsule flippers, three powered bumpers, three balls and a final score. [Rules tests](tests/world.test.mjs), [cabinet playthrough](../tests/cartridges/pinball.mjs) and [engine receipt](vendor/vanillajs/ENGINE_PIN.json). |
| PINBALL-002 polish | Stacked polish in review | Skill shot, limited ball save, nudge, local record, original bell score, reduced motion and a cached playfield. [Playthrough and profiling](../tests/cartridges/pinball.mjs). |
| Initial release review | Pending owner decision | Both PRs merged, required CI green, hosted cabinet play and offline verification, then owner sign-off. |

One table with a local personal best. Same-runtime replay is covered by tests. Physical controllers, cross-browser numerical identity and sustained hardware frame rates have not been measured.

[Play and verify](README.md) · [Original proposal](../docs/GAME_IDEAS.md)
