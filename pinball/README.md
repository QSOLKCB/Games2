# Orbital Pinball

Power up the Asterion Relay table. Each ball can light three numbered bumpers. A full bank awards 750 extra points and relights the targets. The run ends after its third drain.

## Play

From the repository root, run:

```sh
node scripts/build-site.mjs
node scripts/site-server.mjs
```

Open the cabinet at `http://127.0.0.1:8000/Games2/` and choose **Orbital Pinball**. The direct path is `/Games2/pinball/`. After the offline installation completes, the direct game URL works offline.

A/D or the arrows operate the left and right flippers. Hold Space to charge the plunger and release it to launch. Each numbered bumper scores 100. Try different launch strengths and flipper timings. The on-screen buttons also accept touch. P or Escape pauses and resumes. Leaving the page pauses play. Sound is opt-in.

### Skill shots, saves and nudges

Release the plunger in the marked 42–62% band and carry the ball out of the shooter lane for a 250-point skill shot. One early drain per run can be saved during the first five seconds of a launch. Tap N to nudge a ball back towards the middle. The nudge recharges in two seconds.

The table stores the best completed score on this browser when local storage is available. Sound enables an original orbital bell sequence and mechanical cues. Reduced motion removes the ball trail and expanding bumper rings while keeping the numbered lamps visible.

## Engine and verification

`time` drives the bounded 120 Hz clock. The table owns its three-substep circle/capsule contacts, moving-surface response, geometry and scoring. The [source receipt](vendor/vanillajs/ENGINE_PIN.json) names the immutable VANILLAJS v3.1.0 revision and Git blobs. The game, artwork and audio are original. The digest-verified static package includes its own scoped service worker.

```sh
node --test pinball/tests/*.test.mjs
node pinball/scripts/build.mjs
node pinball/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/browser-site.mjs
```

The browser suite uses the repository's external Playwright tooling. See the [development checks](../docs/DEPLOYMENT.md) and [milestones](ROADMAP.md).

One table with a local personal best. Same-runtime replay is covered by tests. Physical controllers, cross-browser numerical identity and sustained hardware frame rates have not been measured.
