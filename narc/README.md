# Circuit Vice — District 09 (NC-002 Arcade Polish)

**Original QSOL-IMC offline arcade action game. NC-001 merged as PR #7; NC-002 is a separate gameplay and presentation polish PR awaiting review.**
Not affiliated with commercial NARC; the original idea was a mechanics reference.
No third-party arcade sprites, source, ROM, samples, characters or commercial maps.

## Play

Open Circuit Vice from the Games2 Cartridge Cabinet or directly at
`/Games2/narc/` when the verified main-branch Pages deployment is available.
The NC-002 PR itself is not production-deployed.
From the source checkout, build and verify with:

```sh
node narc/scripts/verify.mjs --source
node --test narc/tests/*.test.mjs
node narc/scripts/build.mjs
node narc/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/verify-site.mjs
node scripts/site-server.mjs
```

Then visit `http://127.0.0.1:8000/Games2/narc/`. The standalone game is
packaged to `narc/dist/`. No npm install, CDN or runtime account is needed.
Browser verification uses a separately provisioned Playwright (CI handles it).

## Mission

Enter an original retro-future response district. Find the operator, disable the
electrified lane switch, disarm or defeat suspects, then neutralize the reactor
sentinel and reach the east evacuation gate before the timer runs out.

Capture stunned suspects for a higher score; defeated enemies count differently.
Rescue and relay shutdown provide significant bonuses. Losing the civilian after
the rescue deadline, being incapacitated or missing evacuation has consequences.
Non-hostile civilians are **not valid projectile damage targets**.

## Controls

| Control | Input |
| --- | --- |
| Move / change depth lane | WASD or arrows |
| Fire | F or left click |
| Non-lethal stun | J |
| Rescue, disable switch, arrest stunned enemy | E near target |
| Dodge / brief invulnerability | Shift |
| Reload | R |
| Pause / resume | P or Escape |
| Mute all audio | M or on-page sound button |
| Toggle original soundtrack independently | N or on-page music button |

Desktop keyboard/mouse is the tested design target; physical gamepad and touch
combat are not asserted. NC-002 adds attack wind-up telegraphs, original pose
animations, a small multi-layer procedurally scored soundtrack, separate music
control, more readable weapon/reload status and a scored debrief. Camera and
static-world projection reuse reduces repeated renderer work. Fixed logical
ticks remain unchanged. Owner hardware performance and gameplay acceptance
remain required before an initial release.

[NC-002 performance and verification plan](docs/NC_002_PERFORMANCE.md) is
explicit about what the packaged browser measures and what requires an actual
hardware playthrough.

## Engine and offline provenance

The runtime uses an immutable closure of six selected, **unchanged** VANILLAJS
modules at commit `e9121ea7297b0aeca1da131b695e7c3371a98745` with
per-file Git object hashes recorded in `vendor/vanillajs/ENGINE_PIN.json`.
All original sprites are generated from bounded original VANILLAJS Sprite
Foundry recipes at startup. The original city geometry uses its independent
25D projection module; collision/game state are fixed-tick and do not depend
on presentation.

The static game build emits an exact SHA-256 package manifest, a worker scoped
to this game's directory, and digest-checked cached files that do not overwrite
the Strike Pixel cache or the cabinet root. Build tools are never shipped.

[Full NC progression](ROADMAP.md) · [Agent policy](AGENTS.md) ·
[Games2 roadmap](../ROADMAP.md)
