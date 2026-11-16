# Strike Pixel source and asset provenance

Strike Pixel is original Games2 game code built on a locally vendored subset of
VANILLAJS. The exact machine-readable inventory is
[`vendor/vanillajs/provenance.json`](../vendor/vanillajs/provenance.json), accompanied
by the original [engine catalogue](../vendor/vanillajs/MODULES.json),
[Apache-2.0 licence](../vendor/vanillajs/LICENSE) and
[engine NOTICE](../vendor/vanillajs/NOTICE).

## Immutable engine selection

- Repository: [QSOLKCB/VANILLAJS](https://github.com/QSOLKCB/VANILLAJS).
- Reviewed release: [v2.5.0](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v2.5.0).
- Exact source commit: `32b4fb1ca80e854297998aa00f87a8f012398b89`.
- Vendored engine changes: **none**. The receipt records `localChanges: []` both globally and per copied file.

The 10 explicitly selected roots are `combat3d`, `character`, `navigation`,
`render-webgl`, `geometry`, `input`, `time`, `math`, `audio2d` and `soundtrack`.
Their full module dependency closure contains 13 modules:

| Module | Use |
| --- | --- |
| `combat3d` | Actors, hit regions, damage, death attribution and bounded combat events |
| `character` | First-person walking, sprinting, jumping and static stairs |
| `collision` | Real AABB contacts, sweeps and sight/shot queries |
| `weapons` | Magazine, reserve, cooldown and reload timers |
| `projectiles` | Finite-speed swept projectile motion and lifetime |
| `navigation` | Immutable occupancy grid and bounded A* |
| `math` | Vectors, view calculations and seeded randomness |
| `geometry` | Box mesh generation |
| `render-webgl` | Native browser WebGL rendering |
| `input` | Keyboard/mouse actions and standard-gamepad neutral gating |
| `time` | Fixed-step clock and bounded catch-up |
| `audio2d` | Procedural sample generation |
| `soundtrack` | Procedural musical phrases and tick synchronization |

The closure also includes the unchanged `api/audio/index.js` and
`api/audio/effects.js` adapters. The receipt lists all source paths, byte sizes and
SHA-256 digests, including the engine licence, NOTICE and catalogue. It is the
source of truth if this explanatory table later changes.

The full upstream catalogue is retained as provenance; it does not mean every
catalogued module is present in the game package. Its historical `1.0.0` metadata
has not been rewritten to match the GitHub release name. Selected module maturity
remains experimental.

## Original game work and one packaging adaptation

The Sunrelay Yard layout and paint/decor, robot/weapon geometry, match rules,
bot behaviour, controls/UI, procedural effects and six-bar musical score were
authored for Strike Pixel. They live under `src/`, `index.html` and `style.css`.
There are no downloaded textures, third-party font files, commercial recordings,
ripped models or copied game levels.

The Block Arena Foundry and FPS contracts informed API usage. Its complete game
source, arena content and identity were not copied. Pixel Gun 3D and other historic
shooters remain genre/design references, not licensed donors or official partners.

The game-owned service-worker template is an explicit adaptation of VANILLAJS
[`scripts/service-worker.template.js` at the pinned commit](https://github.com/QSOLKCB/VANILLAJS/blob/32b4fb1ca80e854297998aa00f87a8f012398b89/scripts/service-worker.template.js).
The original source SHA-256 is
`a38bf38d637825d8cb4a50d87529569b74a2ad04bb2f333cc58a23455f516fc7`.
The local adaptation in `scripts/service-worker.template.js` uses the Strike Pixel
cache namespace, package scope and build replacement slots. It retains verified
file installation, finite parallel fetch batches and failure cleanup. This is
separate from the unchanged vendored module inventory. Both the template header
and [game NOTICE](../NOTICE) identify the adaptation.

## Reproduce the checks

From the Games2 repository root:

```sh
node strikepixel/scripts/verify.mjs --source
node strikepixel/scripts/build.mjs
node strikepixel/scripts/verify.mjs
```

Source verification derives the closure from the retained MODULES catalogue,
compares it with actual imports and the receipt, verifies file sizes/hashes,
checks licences/notices and rejects unexpected vendored files. Package verification
compares the complete allowlisted output with current source, manifest and generated
worker bytes, and rejects extra, missing, modified or escaping resources.

These local checks establish consistency with the recorded source inventory.
Review the receipt against the immutable upstream commit when adopting or updating
an engine revision; changing a receipt alongside a source file is not independent
proof of provenance. Any future vendor change needs explicit review, an updated
source pin and fresh game verification.

## Redistribution and ownership

Keep the game [LICENSE](../LICENSE), [NOTICE](../NOTICE), engine licence/NOTICE and
vendor receipt with redistributed packages. The build carries these automatically.
Retain Apache-2.0 SPDX and source-attribution headers when adapting source.

This implementation does not modify VANILLAJS or the other Games2 game concepts.
Game-specific innovations remain here. A reusable extraction needs its own
VANILLAJS PR, source/licence review, tests and owner approval; adopting the resulting
engine release is a separate reviewed change.

See [architecture](ARCHITECTURE.md), [recorded verification](VERIFICATION.md) and
[the Games2 integration contract](https://github.com/QSOLKCB/Games2/blob/main/docs/ENGINE_INTEGRATION.md).
