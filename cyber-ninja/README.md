# Blade Circuit

Cross the Glassline Foundry as a repair chassis carrying a glass cutter. The exit lift is beyond three defended gates. Defeat each group, then travel right past its gate. The last warden wears reinforced armor.

## Play

From the repository root, run:

```sh
node scripts/build-site.mjs
node scripts/site-server.mjs
```

Open the cabinet at `http://127.0.0.1:8000/Games2/` and choose **Blade Circuit**. The direct path is `/Games2/cyber-ninja/`. After the offline installation completes, the direct game URL works offline.

Move with A/D or the arrows. Hold J for a repeating three-cut chain. K raises a frontal guard. The third cut breaks armor. A guard raised during the last ten ticks of an incoming wind-up stuns its attacker. A cleared line repairs one hull point. The on-screen buttons also accept touch. P or Escape pauses and resumes. Leaving the page pauses play. Sound is opt-in.

### Slip drive and riposte

Tap L or Shift to slip seven ticks in your facing direction. The drive recharges in about one second. Face an incoming strike and raise Guard during its last ten warning ticks. Release Guard and cut within the following 34 ticks for a three-damage riposte and 60 bonus points. The meter shows when the drive or counter is ready.

The sound switch enables an original foundry bass sequence and separate guard, dash and riposte cues. Motion follows the system preference and can be changed in the game. Reduced motion removes afterimages, swing arcs, stride animation and impact sparks. Warnings and hull feedback remain visible.

## Engine and verification

`time` drives the 60 Hz clock and `motion2d` drives bounded integer movement. Each file is an unmodified leaf of the upstream module inventory. The [source receipt](vendor/vanillajs/ENGINE_PIN.json) names the immutable VANILLAJS v3.1.0 revision and Git blobs. The game, artwork and audio are original. The digest-verified static package includes its own scoped service worker.

```sh
node --test cyber-ninja/tests/*.test.mjs
node cyber-ninja/scripts/build.mjs
node cyber-ninja/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/browser-site.mjs
```

The browser suite uses the repository's external Playwright tooling. See the [development checks](../docs/DEPLOYMENT.md) and [milestones](ROADMAP.md).

One authored route. Keyboard and on-screen controls. Physical controllers and sustained hardware frame rates have not been measured.
