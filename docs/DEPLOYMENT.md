# Cabinet deployment and CI

The cabinet is a static site built into `site/`. GitHub Pages serves that directory at
[qsolkcb.github.io/Games2/](https://qsolkcb.github.io/Games2/). Each playable game keeps
its own package and service-worker scope underneath the cabinet. There is no root
service worker, npm runtime dependency, CDN, account service or production build server.

## Current settings and deployment status

A read-only GitHub API audit on **2026-11-16** found:

- Pages uses **GitHub Actions** (`build_type: workflow`) with HTTPS enforced.
- The `github-pages` environment exists and uses custom deployment branch policies.
- Its sole permitted branch is `main`; protected-branch matching is disabled.
- The configured URL is `https://qsolkcb.github.io/Games2/`.

These settings already match the workflow. No settings change is needed. If an owner
changes them later, restore the Actions publishing source and the environment's
explicit `main` branch restriction before publishing. Environment restrictions are
an independent control; the repository's tests cannot enforce remote settings.

The URL returned **HTTP 404 at 2026-11-16 07:59 UTC**, before this cabinet was
deployed. Adding these workflow files does not establish a successful hosted run or
a live deployment. Review the eventual Actions run and its deployment URL after an
owner-approved merge. This task does not manually dispatch or deploy anything.

## One verified path to publication

[ci.yml](../.github/workflows/ci.yml) runs for pull requests targeting `main` and can
be called as a reusable workflow. [pages.yml](../.github/workflows/pages.yml) calls
that same verification on a push to `main` or an explicit dispatch **on `main`**.
Main therefore runs all CI gates through Pages, without a second duplicate main CI run.

The verification job uses a GitHub-hosted `ubuntu-24.04` runner and a token with only
`contents: read`. Checkout uses the event's commit and disables persisted credentials.
There are no personal runners, inherited secrets, PR preview deployments,
`pull_request_target` jobs or `workflow_run` promotion of untrusted artifacts.

Before the sole Pages artifact upload, the job executes these commands in order:

```sh
node scripts/verify-workflows.mjs
node scripts/verify-site.mjs --source
node strikepixel/scripts/verify.mjs --source
node --test tests/*.test.mjs
node --test strikepixel/tests/*.test.mjs
node strikepixel/scripts/build.mjs
node strikepixel/scripts/verify.mjs
node scripts/build-site.mjs
node scripts/verify-site.mjs
# External browser tooling is provisioned here; see below.
node strikepixel/scripts/browser.mjs
node scripts/browser-site.mjs
node scripts/verify-site.mjs
git diff --check
```

The site builder also invokes the approved game's own builder and verifier. The
explicit Strike Pixel steps keep its existing checks visible. The final site
verification checks the actual bytes immediately before upload. The artifact is
named `github-pages`, contains only `site/`, and expires after one day. The selected
uploader supports `include-hidden-files`; the site's stricter allowlist and inventory
checks permit no hidden paths. No `.nojekyll` marker is generated. Pages receives the
already-built artifact directly, without a Jekyll build step.

Artifact upload additionally requires the reusable call's `pages_artifact: true`,
the exact `QSOLKCB/Games2` repository, `refs/heads/main`, and a push or manual dispatch.
An ordinary PR cannot upload this Pages artifact. The deployment job repeats those
repository/ref/event checks, requires successful verification through `needs`, and
uses the artifact from the **same workflow run**. There is no cross-run artifact lookup.

Short case-sensitive shell checks also enforce the exact repository, ref and event
immediately before upload and deployment. This matters because
[GitHub expression string comparisons ignore case](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions):
a branch named `Main` must not be treated as `main` during manual dispatch.

Only the deployment job receives `pages: write` and `id-token: write`. It uses the
`github-pages` environment, checks the public main-branch HEAD, then invokes the
official deployment action. It neither checks out nor executes repository code.
The HEAD check fails on a superseded commit or a failed lookup.

The stable workflow-wide `games2-pages` concurrency group serializes builds and
deployments with `cancel-in-progress: false`. A new pending run can replace an older
pending run; an active deployment is allowed to finish. The HEAD check blocks stale
queued builds and old reruns. Main can advance after that check while a deployment
is already in flight; that deployment finishes before the newer queued run. This is
serialized publication, not an atomic transaction with the branch pointer.
[GitHub documents the queue behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## External browser provisioning

Node 22 runs the repository checks. Playwright **1.64.0** is a development tool
installed under the hosted runner's temporary directory. It is not added to either
repository package, lockfile, vendored engine or shipped site. Its matching Chromium
and system libraries are provisioned explicitly, following
[Playwright's CI installation guidance](https://playwright.dev/docs/ci):

```sh
export NODE_PATH="$RUNNER_TEMP/games2-browser/node_modules"
export PLAYWRIGHT_BROWSERS_PATH="$RUNNER_TEMP/games2-browsers"
npm install --prefix "$RUNNER_TEMP/games2-browser" --ignore-scripts --no-save --package-lock=false --no-audit --no-fund playwright@1.64.0
node "$RUNNER_TEMP/games2-browser/node_modules/playwright/cli.js" install --with-deps chromium
node strikepixel/scripts/browser.mjs
node scripts/browser-site.mjs
```

The hosted installation needs network access and Ubuntu package provisioning; playing
the built site does not. The workflow prints the Playwright version and Chromium
executable path. Browser suites retain their own assertions and reports. There is no
browser-result cache, silent browser skip or assertion relaxation. A provisioning,
browser or packaging failure stops publication.

On 2026-11-16, `npm view playwright@1.64.0` confirmed the published npm package,
its exact `playwright-core: 1.64.0` dependency and Node `>=20` requirement. The
[official v1.64.0 release](https://github.com/microsoft/playwright/releases/tag/v1.64.0)
and its
[browser manifest](https://github.com/microsoft/playwright/blob/606ecd8b34bac100db32561b6278ffd76e5eb3cd/packages/playwright-core/browsers.json)
specify Chromium and Chromium headless shell **156.0.8078.4**, revision **1248**.
That is the browser this workflow installs. Initial local verification used an
explicit Chromium **158** executable override; those results are separate from a
hosted run using the bundled browser. Registry/release availability does not by
itself establish successful browser installation or execution on hosted Ubuntu.

Locally, an existing Playwright installation can be supplied through `NODE_PATH`.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an already-installed compatible browser.
Local tests do not require a new npm installation or GitHub credentials. Hosted
Ubuntu execution, physical controllers, mobile devices and GPU hardware remain
separate claims from local headless browser results.

## Action pin provenance

The following release tags were resolved through the **official `actions/*`
repositories on 2026-11-16**. GitHub's commit API reported verified signatures for
each selected commit. Workflows use the full immutable SHA, not the tag. These pins
identify reviewed inputs; they are not a claim that every transitive component has
undergone a source audit.

| Action | Audited release | Pinned commit |
| --- | --- | --- |
| `actions/checkout` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | [`3d3c42e5aac5ba805825da76410c181273ba90b1`](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1) |
| `actions/setup-node` | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) | [`949feb2413d6458794dcd2491c4babbbce0c15c1`](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1) |
| `actions/upload-pages-artifact` | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | [`fc324d3547104276b827a68afc52ff2a11cc49c9`](https://github.com/actions/upload-pages-artifact/commit/fc324d3547104276b827a68afc52ff2a11cc49c9) |
| `actions/deploy-pages` | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | [`368f82528645a54fb793d4d04e342629a3f51346`](https://github.com/actions/deploy-pages/commit/368f82528645a54fb793d4d04e342629a3f51346) |

The selected upload action's
[composite definition](https://github.com/actions/upload-pages-artifact/blob/fc324d3547104276b827a68afc52ff2a11cc49c9/action.yml)
also pins its internal `actions/upload-artifact` v7.0.0 invocation to
[`bbbca2ddaa5d8feaa63e36b76fdaad77386f024f`](https://github.com/actions/upload-artifact/commit/bbbca2ddaa5d8feaa63e36b76fdaad77386f024f).
The selected JavaScript actions use Node 24 internally, supplied by the hosted
runner independently of the project's Node 22 runtime. The Pages job arrangement
follows [GitHub's documented artifact, dependency, permission and environment requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Maintaining the trust boundary

Both `.yml` files use JSON syntax, a valid YAML subset. This lets the dependency-free
[workflow validator](../scripts/verify-workflows.mjs) parse the actual workflow data.
It rejects unknown workflow files, extra jobs or fields, changed action pins, unsafe
permissions/runners/events, skipped gates, altered checkout behavior, mutable reusable
workflow references, and unverified or mismatched artifact paths. Intentional changes
require a review of the workflow, policy checks and this pin record together.

[Deployment tests](../tests/deployment.test.mjs) evaluate the actual guard expressions
as data, simulate trusted and untrusted events, and mutate the workflow graph to
check rejection. They execute the real freshness shell with a local fake Git command
to test current/stale revisions and lookup failure without contacting GitHub.
No workflow expression is evaluated as JavaScript or executable imported data.

```sh
node scripts/verify-workflows.mjs
node --test tests/deployment.test.mjs
```

These local checks are regression protection, not a replacement for owner review or
GitHub environment policy. An owner should inspect workflow changes before merging.
Do not broaden deployment permissions, remove main restrictions or deploy a PR
artifact to resolve a failing check. Fix the failure and rerun the reviewed path.
