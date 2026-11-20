# Circuit Vice (working title) — NC-001

**The original NARC-inspired Games2 arcade concept.** Selected as the next new
game after Strike Pixel's polish and release review; **nothing has shipped**.

A retro-future city action game built around fast 2.5D street movement,
telegraphed enemies, original procedural visuals, and tactical choices:
shoot, stun, arrest, rescue and finish the mission. Unlike a straightforward
arcade reproduction, objectives and debrief reward controlling hazards,
protecting people and completing the investigation.

## Original identity

The directory name `narc/` preserves a genre reference from the original
16 November 2026 Games2 idea list. The game's working title, characters,
music, art, weapons, level layout and scoring are **new QSOL-IMC creations**.
NARC commercial IP, ripped arcade sprites, samples, logos, ROMs and
copyrighted level maps must not be imported.

## Intended first vertical slice

One original city district, two hostile enemy archetypes, non-hostile rescue,
a non-lethal capture option, a readable original boss fight and end-of-mission
debrief. Solo keyboard/mouse first; gamepad only after verified tests; local
co-op and more stages are deferred.

Candidate VANILLAJS modules: `combat2d`, `motion2d`, `projection25d`,
`sprite2d`, `sensing`, `weapon-feel`, `audio2d` and the Creator-Interop
offline pipeline. The exact immutable source revision and minimal dependency
closure will be selected at NC-001 implementation, not speculatively asserted now.

This folder contains only planning documents. It is **not an executable game**
and is **not** in the cabinet's playable registry.

[Detailed milestone roadmap](ROADMAP.md) · [Game agent policy](AGENTS.md)
· [Games2 master roadmap](../ROADMAP.md)
