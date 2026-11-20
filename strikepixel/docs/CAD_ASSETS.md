# Strike Pixel — VANILLAJS-generated CAD assets (SP-002)

The **existing** Strike Pixel gameplay, collision, fixed ticks, AI and weapon authority
remain on the verified v2.5.0 VANILLAJS closure at commit
`32b4fb1ca80e854297998aa00f87a8f012398b89`. This graphics PR does
**not** claim those systems are upgraded to latest.

A separate **presentation-only** module is copied byte-for-byte from VANILLAJS
`modules/cad-geometry/index.js` at **`e9121ea7297b0aeca1da131b695e7c3371a98745`**
(20 November 2026); Git blob SHA-1
`10b69a5ea58878f5109e5d84a08f1ed9d370e1e9`.
The source is at `src/engine/cad-geometry/index.js`. It is audited at build
time using Git blob hashing, and remains independent of the older simulation vendor
closure. No runtime network fetch or package dependency is introduced.

`src/forge-art.js` calls `createCADPrimitive`, `createForgePreset`
and `cadColorStream` to produce original rounded robots, moving pickups,
projectiles, weapon accents and industrial arena details, then applies
deterministic face shading to the engine's interleaved XYZ/RGB streams.
Existing lightweight WebGL batching is reused; geometry is cached and
static world details are uploaded with the existing arena mesh.
The only artist-authored inputs are data such as dimensions, palette and
placement. These display-only decorations never enter collision, raycast,
navigation, authoritative state or replay formats.

### Rights and source boundaries

VANILLAJS CAD source: Apache-2.0. Its surface-of-revolution concept originated
in **DabbleCAD**, copyright 2026 DJMcNewgent, repository
`DJMcNewgent/DabbleCAD`, commit
`9cfd20b0a973275c7f7411afb6e7c355f8a863cc`,
file `src/renderer/core/shapes.js`. DabbleCAD's current notice lists Apache-2.0
and its earlier v1.0.0 release under MIT. The adaptation uses +Y-up metres and
strict bounded mesh generation, not DabbleCAD GUI, Three.js, Electron, CSG,
asset packs, textures or fonts. The original imported module is unmodified.
Both game and source licences are Apache-2.0; see root `NOTICE` and `LICENSE`.

### Acceptance and limits

Run `node --test strikepixel/tests/*.test.mjs` and
`node strikepixel/scripts/build.mjs` from Games2 root.
Then run the packaged browser checks and independently play Sunrelay Yard.
Check camera visibility and 60-fps feel on owner hardware; CI/browser smoke
is not a substitute for a measured GPU performance baseline.
Authoritative match simulation has not been modified; art remains a visual
upgrade, not a 3D animation rig, full texture/material pipeline or a
complete v3.x engine revision adoption.
