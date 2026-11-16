# Adding a Games2 cartridge

One game per new-game PR. One cartridge per game. Every deployment contains the
whole approved collection. A cartridge is a catalogue record, not executable
code, a remote game URL or a way to bypass game review.

Every new game follows **Implementation → Polish → Release Review** under the
[mandatory two-pass policy](DEVELOPMENT_PROCESS.md). A playable preview may enter
the cabinet after its implementation is approved. Initial release requires the
separate polish PR and owner release gate; infrastructure work is not game polish.

## 1. Build an independent game

Create one original game's directory, with its own `README.md`, `ROADMAP.md` and
`AGENTS.md`. Follow the [repository policy](../AGENTS.md), preserve the
[concept catalogue](GAME_IDEAS.md) and [donor references](DONOR_CATALOGUE.md), and
pin any engine dependency with licences, notices and source provenance.

Plan both development passes in the game's `ROADMAP.md` before implementation.
Show each stage's status and evidence, and link that progression and root policy
from the game's `AGENTS.md` so future agents discover the polish requirement.

The game must work independently of the cabinet. Finish its gameplay loop,
prescribed Node tests, packaged browser tests and offline verifier first. Do not
turn a concept card into a launch link to an unfinished directory.

## 2. Use the local package contract

The site builder invokes fixed, reviewed local commands for every approved game:

```sh
node <slug>/scripts/build.mjs
node <slug>/scripts/verify.mjs
```

Each command runs with that game's directory as its working directory. Do not
depend on a global working directory. Commands and module names cannot be supplied
through the registry. Strike Pixel's existing builder/verifier demonstrate this
contract; the cabinet does not replace them.

The builder must write a complete native static package to `<slug>/dist/` and
the verifier must reject a stale, modified, incomplete or expanded package.
Source must include `index.html`, `README.md`, `ROADMAP.md`, `AGENTS.md`, `LICENSE`,
`NOTICE` and the two scripts above. The package must contain `index.html`, `LICENSE`
and `NOTICE`, plus every runtime dependency it actually needs.

`dist/manifest.json` uses this data contract:

```json
{
  "schemaVersion": 1,
  "game": "example-game",
  "version": "<64 lowercase hexadecimal characters identifying the package>",
  "engineCommit": "<optional immutable 40-character source commit>",
  "files": [
    { "path": "index.html", "bytes": 1234, "sha256": "<64 lowercase hexadecimal characters>" }
  ]
}
```

The example is a format illustration, not an accepted manifest. `files` must list
every shipped file except the manifest itself, with actual byte counts and
SHA-256 digests. The site records the manifest's digest separately. No unknown
fields, duplicate paths, parent traversal, symlinks, hidden/private files,
development scripts, tests, browser profiles, evidence or dependencies may enter
the package. Use `src/` for native runtime modules. The build checks the entire
declared package and copies it without rewriting its bytes.

Use relative runtime paths. The game must work at `/Games2/<slug>/`, with its own
worker scoped to that game directory and its own cache namespace. Preserve those
identities on later updates. Do not add a root worker or delete another game's
caches. Audio, pointer lock, fullscreen and input belong to the game page, which
opens directly rather than inside an iframe.

## 3. Register the cartridge and original art

Edit [`cartridges.json`](../cartridges.json), preserving existing approved rows.
The root object has exactly `schemaVersion: 1` and a `cartridges` array. Each row
has these strict fields:

| Field | Contract |
| --- | --- |
| `slug` | Unique lowercase identifier, starting with a letter; letters, digits and single hyphen separators; at most 40 characters; no infrastructure names |
| `title`, `subtitle` | Original plain text, bounded to 80 and 120 characters |
| `description`, `genre` | Plain text, bounded to 600 and 60 characters |
| `status` | `concept`, `development`, `playable` or `released` |
| `directory` | Optional except for playable/released; must exactly equal `slug` |
| `artwork` | Optional original local SVG at `cabinet/assets/<safe-name>.svg` |
| `releaseLabel` | Optional plain text, at most 80 characters; never invent a release |
| `order` | Integer 0–9999; lower values appear first |

`concept` and `development` records never produce a launch link or public game
package. A development entry may declare its existing directory so source
validation recognises it while it remains excluded from `site/`. Arbitrary
unregistered root directories are rejected rather than discovered or published.

Use `playable` only for an explicitly approved preview that has completed its
required implementation checks. `released` requires both development PRs merged,
passing tests/CI, a working deployed preview, documented limitations and explicit
owner release authorisation after cabinet play-testing. Merging SP-001 or deploying
a preview did not turn Strike Pixel into a v1.0.0 product.

Create original cartridge art. SVGs must contain local vector artwork, without
scripts, event handlers, foreign objects, external resources or commercial game
covers. Missing art is a build error when a path is declared. A network failure
after deployment still gets a readable UI fallback and does not break a valid
game's launch control.

The launcher reads the registry. A new cartridge needs no hand-edited launcher
code; information comes from its record. URLs are derived as `./<slug>/`, never
accepted from arbitrary data. Do not add command, HTML, script or external URL
fields to the registry.

## 4. Verify the complete collection

From the repository root:

```sh
node --test tests/*.test.mjs
node --test strikepixel/tests/*.test.mjs
node strikepixel/scripts/verify.mjs --source
node scripts/verify-site.mjs --source
node scripts/verify-workflows.mjs
node scripts/build-site.mjs
node scripts/verify-site.mjs
node scripts/site-server.mjs
```

Open **http://127.0.0.1:8000/Games2/**. Select the new cartridge, launch its actual
package, test gameplay and return navigation, then open the direct game URL.
Check service-worker scope and a fresh offline visit after complete installation.
Stop the local server with Ctrl+C.

Browser verification uses external, development-only Playwright/Chromium:

```sh
node strikepixel/scripts/browser.mjs
node scripts/browser-site.mjs
git diff --check
```

If needed, set `NODE_PATH` to an existing tooling `node_modules` directory and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its installed Chromium executable. Hosted CI
provisions pinned tooling explicitly; see [deployment documentation](DEPLOYMENT.md).
Add the new game's own tests and browser checks to the verification workflow as
part of its PR. The cabinet smoke test must grow to prove its launch too.

The tests deliberately build two fixture games to prove collection retention.
Do not replace the whole registry with just the new row, publish only changed
directories, or overwrite the Pages artifact with one game. Keep the existing
slugs, package contents and URLs. Any intentional retirement needs a separate
owner-reviewed policy decision.

## 5. Review, merge and verify live deployment

Open one focused implementation PR with screenshots, actual test results, provenance and known
limitations. PR CI has no production deployment permission. Merge only with
owner approval; the approved `main` workflow then builds and verifies the complete
collection and uploads only `site/` to GitHub Pages.

After the owner merges, check the successful Pages workflow and test the public
cabinet and direct game URL. Only then describe that deployment as live in the
game's README. The expected URL pattern is
`https://qsolkcb.github.io/Games2/<slug>/`.

The current repository already uses GitHub Actions as its Pages source and a
`github-pages` environment limited to `main`. If settings change, the owner must
restore those restrictions. Do not automatically alter settings or deploy a PR
to work around a failure.

## 6. Polish the same game, then request release review

After the implementation PR merges, deliver a separate polish PR covering all
[required polish areas](DEVELOPMENT_PROCESS.md#pass-2--polish), with regression
tests and actual browser gameplay. Obtain owner review and merge authorisation,
then verify the updated deployed preview, return navigation and offline package.
Keep all other approved cartridges and packages intact.

Update the game's roadmap with both merged PRs and verification evidence. The
owner then tests through the cabinet and decides the initial release. This is an
approval gate, not automatically a third implementation PR. Failed review returns
the game for corrections; critical defects can be fixed immediately, and further
polish may be approved. Later enhancement/bug-fix PRs do not repeat the entire
two-pass process.

Strike Pixel SP-001 and cabinet infrastructure have merged in PRs #2 and #3.
SP-002 is the next game PR for dedicated Strike Pixel polish. Start a second game
after Strike Pixel's initial polish review unless the owner changes priorities.
