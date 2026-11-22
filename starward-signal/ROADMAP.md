# Starward Signal roadmap

## Implementation → Polish → Release Review

| Pass | State | Evidence and scope |
| --- | --- | --- |
| SS-001 implementation | Playable candidate | Pilot the survey cutter Wake through the outer Pelagic Array. Recover two echoes from each of three relays, disperse interference drones and bring all three transmissions back to Port Lumen before the signal fades. [Rule tests](tests/world.test.mjs), [cabinet play](../tests/cartridges/starward-signal.mjs) and [engine provenance](vendor/vanillajs/ENGINE_PIN.json). |
| SS-002 polish | Planned after [#14](https://github.com/QSOLKCB/Games2/pull/14) merges. Draft prepared for that review | One-pulse harmonic locks, a rechargeable deflector, bearing and receiver instruments, a route chart, reactive score, reduced motion and packaged Canvas sampling. [Browser checks](../tests/cartridges/starward-signal.mjs). |
| Initial release review | Pending owner playthrough | Both passes merged, green checks, deployed cabinet and offline play, then an explicit owner decision. |

Initial scope is one original survey mission with keyboard and touch input. Browser checks use headless Chromium. Physical device performance and controller coverage remain open.
