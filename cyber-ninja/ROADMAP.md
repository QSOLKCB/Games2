# Blade Circuit roadmap

## Implementation → Polish → Release Review

| Pass | State | Scope and evidence |
| --- | --- | --- |
| CYBER_NINJA-001 implementation | [Implementation PR #9](https://github.com/QSOLKCB/Games2/pull/9) in review | Three scrolling encounters, two guard types and a foreman; chain timing, frontal blocks, armor breaks, repair and a freight-lift finish. [Rules tests](tests/world.test.mjs), [cabinet playthrough](../tests/cartridges/cyber-ninja.mjs) and [engine receipt](vendor/vanillajs/ENGINE_PIN.json). |
| CYBER_NINJA-002 polish | Planned after #9 merges · [prepared draft #11](https://github.com/QSOLKCB/Games2/pull/11) | Slip drive, timed riposte, readable warning and hit cues, reduced motion, foundry score and cached scenery. [Playthrough and profiling](../tests/cartridges/cyber-ninja.mjs). |
| Initial release review | Pending owner decision | Both PRs merged, required CI green, hosted cabinet play and offline verification, then owner sign-off. |

One authored route. Keyboard and on-screen controls. Physical controllers and sustained hardware frame rates have not been measured.

The owner requested both PRs for this game together. Draft #11 holds the proposed polish and pre-merge test evidence. Formal polish review begins after #9 merges and the checks run against the accepted implementation.

[Play and verify](README.md) · [Original proposal](../docs/GAME_IDEAS.md)
