# Games2 development process

Every new Games2 game receives **two planned development passes before its initial
release review**. This permanent policy applies to agents and human contributors.
Read [root AGENTS.md](../AGENTS.md), the game's own `AGENTS.md` and both roadmaps
before starting work.

**Implementation → Polish → Release Review**

The first two stages are separate development PRs. The third is an owner approval
gate, not automatically another implementation PR. Infrastructure work, including
the Cartridge Cabinet, does not count as either game development pass.

## Pass 1 — Implementation

- Create one original game in its own directory. Keep the convention of one new
  game per implementation PR; any technical exception must be explicitly justified.
- Implement core gameplay mechanics and original content as a complete, playable
  vertical slice with an actual start, play, outcome and restart loop.
- Add automated tests, real browser verification, documentation and source/asset
  provenance. Record executed results and limitations honestly.
- Submit one focused implementation PR for owner review. A merged implementation
  may be approved as a `playable` cabinet preview; it is not an initial release.

## Pass 2 — Polish

After the implementation PR is merged, perform a dedicated pass on **the same
game** and submit a separate polish PR, followed by owner review. Plan and address
each area below, recording improvements, executed checks and remaining limitations:

- Gameplay feel and difficulty balancing.
- Graphics, animations, visual effects and presentation.
- Soundtrack, sound effects and audio feedback.
- Controls, responsiveness and input handling.
- Menus, HUD, usability and accessibility.
- Performance and unnecessary rendering work.
- Bugs, edge cases and recovery behaviour.
- Offline packaging and deployment verification.
- Regression tests and actual browser gameplay.

Improve the existing playable loop. Do not substitute an unrelated game or an
excessive number of unfinished features for polish. Scope additions carefully and
retain deferred ideas in the roadmap. Use the existing package and browser checks,
add meaningful regressions for changed behaviour, and test through the intended
`/Games2/<slug>/` path. After an approved merge, verify the deployed preview and
offline behaviour; PR code must not deploy to production.

## Pass 3 — Release Review

The owner tests the published preview through the **Games2 Cartridge Cabinet**.
A game becomes eligible for its initial release only when all six conditions hold:

1. Its implementation PR has been merged.
2. Its separate polish PR has been merged.
3. Required tests and CI have passed for the release candidate.
4. The deployed preview works, including the required package/offline checks.
5. Known limitations are documented.
6. The owner explicitly authorises the release after testing the preview.

Record the reviewed revision, PRs, test results, preview URL, limitations and owner
decision in the game's roadmap or a linked review record. Leave unknown/pending
items visibly pending. A green CI run, deployment, two merged PRs or a `playable`
registry entry cannot authorise a tag, release or `released` status.

## Exceptions and later work

Critical defects discovered during either pass may be corrected immediately.
The owner may approve additional polish PRs when further work is needed; a failed
release review returns the game for corrections and relevant verification.

The two-pass rule is a **minimum quality process, not a guarantee that two PRs
make a game release-ready**. Later enhancement and bug-fix PRs do not need to
repeat the entire initial two-pass process. They still require appropriate tests,
review and owner authorisation for merge or publication.

## Required per-game roadmap

Every game's own `ROADMAP.md` must visibly show this progression from the start:

| Stage | Status to maintain | Evidence to link |
| --- | --- | --- |
| Pass 1 — Implementation | Planned, in progress, under review or merged | Implementation PR, playable scope, tests and provenance |
| Pass 2 — Polish | Planned until implementation merges; then in progress, under review or merged | Separate polish PR, improvements, regressions and browser results |
| Pass 3 — Release Review | Pending, corrections required or owner authorised | Both merged PRs, passing checks, working deployed preview, limitations and owner decision |

Keep milestone identifiers game-specific. Link the progression from the game's
`AGENTS.md`, alongside a link to the root policy, so future agents discover the
required polish work automatically. Update status with evidence rather than
marking all stages complete when implementation lands. Keep deferred features
separate from initial-release requirements without deleting earlier ideas.

For Blade Circuit and Orbital Pinball, the owner requested one implementation PR
and one polish PR for each title at the same time. The proposed polish lives in
stacked drafts. Each roadmap keeps formal Pass 2 planned until its implementation
merges, when the draft can be retargeted and its checks rerun on the accepted code.

## Current application

| Work | Status / next action |
| --- | --- |
| Strike Pixel SP-001 | Implementation complete; [PR #2](https://github.com/QSOLKCB/Games2/pull/2) merged |
| Games2 Cabinet | Infrastructure complete; [PR #3](https://github.com/QSOLKCB/Games2/pull/3) merged; does not substitute for game polish |
| Strike Pixel SP-002 | Dedicated gameplay and presentation polish; next game PR, not started |
| Strike Pixel initial release | Pending polish, verification, working deployed preview and owner approval |
| Second Games2 game | Begins after Strike Pixel's initial polish review, unless the owner explicitly changes priorities |

See the [Games2 roadmap](../ROADMAP.md) and
[Strike Pixel progression](../strikepixel/ROADMAP.md).

All [game concepts](GAME_IDEAS.md), [donor references](DONOR_CATALOGUE.md) and
[VANILLAJS integration rules](ENGINE_INTEGRATION.md) remain in force. The initial
release process does not change the separate upstream review/approval boundary or
automatically count a preview as a completed game.

**Build once. Polish properly. Test the real game. Then move on.**
