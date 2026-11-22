# Orbital Pinball contributor notes

Follow the [repository policy](../AGENTS.md), [development process](../docs/DEVELOPMENT_PROCESS.md), [game roadmap](ROADMAP.md) and [preserved catalogue](../docs/GAME_IDEAS.md).

Keep simulation and rendering separate. Use the pinned leaf modules in `vendor/vanillajs/` and retain their notices. Gameplay and audio must run from the installed package without external requests. Keep input cancellation and game-only cache scope covered through the cabinet. Keep original art, sounds and rules with the game.

Implementation PR #10 and the stacked PINBALL-002 polish pass require independent review. The owner tests the deployed preview and decides its initial release.
