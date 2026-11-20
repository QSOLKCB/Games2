# Circuit Vice NC-002 — performance methodology and release evidence

**Scope:** original 2.5D Canvas2D game, pinned VANILLAJS engine
`e9121ea7297b0aeca1da131b695e7c3371a98745`.
Authoritative gameplay runs at **60 fixed logical ticks per simulation second**,
not at a claimed 60 measured physical display FPS. Timing evidence and hardware
approval are separate conditions.

## Reproducible hosted checks

```sh
node --test narc/tests/*.test.mjs
node narc/scripts/build.mjs
node narc/scripts/verify.mjs
node narc/scripts/browser.mjs
node scripts/build-site.mjs
node scripts/verify-site.mjs
```

The browser test uses a pinned development-only Playwright/Chromium installation
as provisioned in `.github/workflows/ci.yml`, never as a game dependency.
It tests a real packaged game under `/games/narc/` and emits local, uncommitted
`narc/browser-artifacts/performance.json`.

### What the performance report measures

- Create a **fresh** dedicated 960×540 renderer with a representative game
  snapshot and all 96 allowed visual projectiles.
- Warm up with 15 draws; time **100 synchronous Canvas2D draw() calls** with
  `performance.now()` and report p50, p95, maximum and sample count.
- Record whether p95 is at or below 16.67 milliseconds as an **observation**,
  not a CI guarantee. Check that a stationary camera reuses its static
  projection; record the number of projector builds.
- This is a CPU-side, software-rendered **headless browser microbenchmark**.
  It does not measure refresh presentation, compositing, end-to-end game FPS,
  the user's NVIDIA GPU, controller latency or thermal throttling.
- Functional regression tests separately check the 60 Hz logical simulation,
  bounded catch-up, source integrity, gameplay and offline delivery.

### Owner acceptance — physical desktop

After reviewing and merging the dedicated polish PR, launch the deployed
Cabinet game on the target desktop and record browser/driver/OS versions,
window/display resolution, actual refresh rate and graphics backend.
Verify continuous gameplay at the target 60 FPS across a full mission, including
seven enemies, boss warnings, explosions, audio enabled and traversal.
Record median, p95 and worst frame times from a real display-frame trace,
plus CPU utilization and any dropped frames or hitches. Review HUD legibility,
attack warning clarity, difficulty fairness, audio balance, pause/resume,
restart and independently tested gamepad availability.

**No 60 FPS claim without the physical evidence.** If hardware acceptance
fails, reopen NC-002 for a performance-only follow-up; do not weaken tests or
silently classify the game as released.

## Guardrails

No NPM runtime packages, remote assets, CDN, account, telemetry or cloud service.
Cached render geometry remains presentation-only and never changes authoritative
collision, LOS, AI, score or replay state. No games outside Circuit Vice are
modified by this polish work except necessary repository status documentation.
