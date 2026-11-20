# Circuit Vice — District 09 (NC-001)

**Original QSOL-IMC offline arcade action game — implementation preview in review.**
Not affiliated with commercial NARC; the original idea was a mechanics reference.
No third-party arcade sprites, source, ROM, samples, characters or commercial maps.

## Play

After this implementation PR is reviewed and merged, open Circuit Vice from the
Games2 Cartridge Cabinet or directly at `/Games2/narc/`.
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
| Mute | M or on-page button |

Desktop keyboard/mouse is the tested design target; physical gamepad and touch
combat are not asserted. Full NC-002 balancing, accessibility, audio and graphics
polish remain separate.

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
