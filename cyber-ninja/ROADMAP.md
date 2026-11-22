# Blade Circuit roadmap

## Implementation → Polish → Release Review

| Pass | State | Scope and evidence |
| --- | --- | --- |
| CYBER_NINJA-001 implementation | Merged to `main` in [#9](https://github.com/QSOLKCB/Games2/pull/9) | Three scrolling encounters, two guard types and a foreman. Chain timing, frontal blocks, armor breaks, repair and a freight-lift finish. [Rules tests](tests/world.test.mjs), [cabinet playthrough](../tests/cartridges/cyber-ninja.mjs) and [engine receipt](vendor/vanillajs/ENGINE_PIN.json). |
| CYBER_NINJA-002 polish | [#11](https://github.com/QSOLKCB/Games2/pull/11) merged to the implementation branch. This integration brings it to `main`. | Slip drive, timed riposte, readable warning and hit cues, reduced motion, foundry score and cached scenery. [Playthrough and profiling](../tests/cartridges/cyber-ninja.mjs). |
| Initial release review | Pending owner decision | Both PRs merged, required CI green, hosted cabinet play and offline verification, then owner sign-off. |

One authored route. Keyboard and on-screen controls. Physical controllers and sustained hardware frame rates have not been measured.

The owner's paired PRs used a separate branch for the polish. The integration preserves the code and gameplay evidence from #11 and uses the current six-game cabinet for verification.

[Play and verify](README.md) · [Original proposal](../docs/GAME_IDEAS.md)
