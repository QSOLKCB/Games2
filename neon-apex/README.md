# Neon Apex

**Saffron Coast GP.** Race three independent rivals through the salt flats, the switchbacks and the sunset viaduct. Each checkpoint extends the clock. Crossing the finish locks your place and time.

## Play

Build the complete cabinet with `node scripts/build-site.mjs` and start `node scripts/site-server.mjs` from the repository root. Select **Neon Apex** at `http://127.0.0.1:8000/Games2/`. The installed cartridge can also launch directly at `/Games2/neon-apex/` offline after the status reports completion.

W / Up accelerates, S / Down brakes and A / D or Left / Right steers. Touch controls support steering and throttle together. P or Escape pauses. Moving focus to another window pauses the run and clears held inputs. Sound is opt-in.

## Slipstream and split times

The car starts with one 35-charge boost. Accelerate in a rival's lane from 7–38 m behind to charge the turbo. Hold throttle and press Space or **Boost** for a 0.9-second burst. Braking, shoulder entry or contact cuts the burst. The pit board identifies the car giving you a tow and shows the time for each completed sector. Your fastest finish stays on this browser when local storage is available.

Each sector has a landmark you can read as you drive. Salt-flat turbines give way to copper mesas and the steel arches of the viaduct. **Reduce motion** controls speed streaks and turbine rotation. **Sound** enables the original sector score and pace-dependent accompaniment.

## Verification

```sh
node --test neon-apex/tests/*.test.mjs
node neon-apex/scripts/build.mjs
node neon-apex/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/browser-site.mjs
```

The [engine receipt](vendor/vanillajs/ENGINE_PIN.json) records the unmodified VANILLAJS v3.1.0 modules and their exact Git blobs. All world design, drawing and synthesized sound are original. See the [game roadmap](ROADMAP.md) and [browser tooling](../docs/DEPLOYMENT.md).
