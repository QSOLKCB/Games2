# Neon Apex roadmap

## Implementation → Polish → Release Review

| Pass | State | Evidence and scope |
| --- | --- | --- |
| NA-001 implementation | Playable candidate | Race three independent rivals through the salt flats, the switchbacks and the sunset viaduct. Each checkpoint extends the clock. Crossing the finish locks your place and time. [Rule tests](tests/world.test.mjs), [cabinet play](../tests/cartridges/neon-apex.mjs) and [engine provenance](vendor/vanillajs/ENGINE_PIN.json). |
| NA-002 polish | Planned after [#13](https://github.com/QSOLKCB/Games2/pull/13) merges. Draft prepared for that review | Slipstream recharge and turbo, sector landmarks, timing board and local best, adaptive score, reduced motion and packaged Canvas sampling. [Browser checks](../tests/cartridges/neon-apex.mjs). |
| Initial release review | Pending owner playthrough | Both passes merged, green checks, deployed cabinet and offline play, then an explicit owner decision. |

Initial scope is one authored point-to-point race with keyboard and touch input. Browser checks use headless Chromium. Physical device performance and controller coverage remain open.
