# Starward Signal

**The Pelagic Array.** Pilot the survey cutter Wake through the outer Pelagic Array. Recover two echoes from each of three relays, disperse interference drones and bring all three transmissions back to Port Lumen before the signal fades.

## Play

Build the complete cabinet with `node scripts/build-site.mjs` and start `node scripts/site-server.mjs` from the repository root. Select **Starward Signal** at `http://127.0.0.1:8000/Games2/`. The installed cartridge can also launch directly at `/Games2/starward-signal/` offline after the status reports completion.

Use WASD or the arrows to fly. Tap or hold Space to emit a resonance pulse. In range of the marked relay, two ordinary pulses recover its transmission. The plot at the top of the playfield shows your bearing. P or Escape pauses. Moving focus to another window pauses the run and clears held inputs. Sound is opt-in.

## The receiver and deflector

The receiver dial marks the harmonic band in gold. In range, pulse when **LOCK** appears to capture a complete transmission in a single cast. Ordinary pulses still collect one echo. The bearing gives the distance to the next relay and the chart traces the route back to port.

Hold either Shift key or **Deflect** to raise the cutter's field. It turns away nearby interference for two seconds on a full battery. Release it to recharge and send pulses again. Each station has its own musical root in the opt-in score. **Reduce motion** simplifies parallax, expanding scan rings and shield animation.

## Verification

```sh
node --test starward-signal/tests/*.test.mjs
node starward-signal/scripts/build.mjs
node starward-signal/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/browser-site.mjs
```

The [engine receipt](vendor/vanillajs/ENGINE_PIN.json) records the unmodified VANILLAJS v3.1.0 modules and their exact Git blobs. All world design, drawing and synthesized sound are original. See the [game roadmap](ROADMAP.md) and [browser tooling](../docs/DEPLOYMENT.md).
