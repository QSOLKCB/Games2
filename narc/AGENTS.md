# Circuit Vice — NC agent and gameplay contract

Follow the [Games2 root agent policy](../AGENTS.md), the
[mandatory development sequence](../docs/DEVELOPMENT_PROCESS.md) and
[NC-001/002 release gates](ROADMAP.md).

- NC-001 is merged in **PR #7**, with source, package and browser checks.
  NC-002 is the **separate required polish PR**, not a released version.
- This is an original 2.5D arcade action game. NARC is a historical inspiration
  reference, not a title, brand licence or asset source.
- Keep authoritative damage, score, actor identity, objectives and collisions
  in fixed-step simulation. Keep all visual animation and camera operations
  presentation-only.
- Track rescue/capture and combat outcomes coherently and test non-hostile
  targeting. Never rely on invisible physics/visual blockers.
- Review specific immutable VANILLAJS engine modules and licence notices,
  including any CAD/Sprite Foundry source and the complete import closure.
- Implement **NC-001** in one focused game PR, then **NC-002** in a separate
  gameplay-and-presentation polish PR, then owner release review.
- Prove real packaged offline gameplay, input cancellation, restart,
  source integrity and worker isolation; record negative checks.
- No ripped commercial assets, source, audio, maps, fonts or trademarked
  branding. No runtime cloud dependencies, telemetry, payment or accounts.
- The existing `playable` cabinet entry remains an **unreleased preview**;
  changing the game does not authorize a versioned release.
  No other concept is turned into a cartridge.

**Next action:** Review NC-002 on its exact CI-verified head, perform owner
hardware playthrough and measured frame-rate test, then decide on approval
and release review. No merge, tag or Pages deployment without authorisation.
