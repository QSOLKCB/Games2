# Circuit Vice — NC agent and gameplay contract

Follow the [Games2 root agent policy](../AGENTS.md), the
[mandatory development sequence](../docs/DEVELOPMENT_PROCESS.md) and
[NC-001/002 release gates](ROADMAP.md).

- NC-001 is the **implementation PR**. The game is a playable candidate only
  after exact-source, static build and real browser verification; it is NOT an
  owner-approved versioned release.
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
- The NC-001 PR proposes a single `playable` preview registry row and one
  source-pinned package; this is not released until owner authorisation.
  No other concept is turned into a cartridge.

**Next action:** Review the NC-001 implementation and regression evidence; finish NC-002 polish in a separate PR after NC-001 merges.
