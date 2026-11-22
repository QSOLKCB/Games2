# Neon Apex

**Saffron Coast GP.** Race three independent rivals through the salt flats, the switchbacks and the sunset viaduct. Each checkpoint extends the clock. Crossing the finish locks your place and time.

## Play

Build the complete cabinet with `node scripts/build-site.mjs` and start `node scripts/site-server.mjs` from the repository root. Select **Neon Apex** at `http://127.0.0.1:8000/Games2/`. The installed cartridge can also launch directly at `/Games2/neon-apex/` offline after the status reports completion.

W / Up accelerates, S / Down brakes and A / D or Left / Right steers. Touch controls support steering and throttle together. P or Escape pauses. Moving focus to another window pauses the run and clears held inputs. Sound is opt-in.

## Verification

```sh
node --test neon-apex/tests/*.test.mjs
node neon-apex/scripts/build.mjs
node neon-apex/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/browser-site.mjs
```

The [engine receipt](vendor/vanillajs/ENGINE_PIN.json) records the unmodified VANILLAJS v3.1.0 modules and their exact Git blobs. All world design, drawing and synthesized sound are original. See the [game roadmap](ROADMAP.md) and [browser tooling](../docs/DEPLOYMENT.md).
