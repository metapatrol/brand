# CI

Three workflows, split by what triggers them. The shape is mcp-gateway's, so
that what is learned about this Forgejo instance in one repository applies to
the others.

| workflow | runs on | does |
|---|---|---|
| `ci.yml` | pull requests, and pushes to develop | secret scan, then install, tokens and contrast, build, generated-asset drift, tests |
| `main.yml` | pushes to main | the checks again, then semantic-release (and carries main back to develop) and the brand site |
| `release.yml` | a `v*` tag, and `workflow_dispatch` | validate the tag, test, the npm packages, the Forgejo release with the assets, the brand site and the asset tree |

## Ordering

A cheap check gates an expensive one:

    ci.yml       secret-scan ──> check

    main.yml     config, secret-scan ──> verify ──┬─> semantic-release ──> carry to develop
                                                 └─> site

    release.yml  validate ──> test ──> publish ──> notes ──> deploy

In `release.yml` nothing is announced before it exists: `notes` creates the
Forgejo release after the packages are in the registry, and `deploy` runs last.
Every job checks out the tag and is safe to run again — published versions,
uploaded asset versions and an existing release are left as they are — so a
failed release is repaired by dispatching `release.yml` again for the same tag.

## The brand site

`scripts/deploy.sh` uploads to the `brand` bucket (https://brand.metapatrol.local):

| command | what | run by |
|---|---|---|
| `deploy.sh site` | `apps/preview` at `/`, the Angular example's static build (`make shell-preview`: hash routing, relative base) at `/shell/` | `main.site` on every push to main, `release.deploy` for a tag |
| `deploy.sh assets <version>` | `@metapatrol/brand` at `/assets/<version>/` (immutable, never overwritten) and `/assets/latest/` | `release.deploy` |

The site follows main, so a change to it goes out with its merge even when no
version is released. The bucket has no fallback to `index.html`, which is why the
shell preview routes after the `#`.

## Versions

One version for all five published packages (`@metapatrol/tokens`, `style`,
`brand-kit`, `brand`, `ng`), decided by semantic-release from the conventional commits
on main since the last `vX.Y.Z` tag:

| commits since the last tag | release |
|---|---|
| `fix:` | patch |
| `feat:` | minor |
| a breaking change (`feat!:`, `BREAKING CHANGE:`) | minor while the version is 0.x (`.releaserc.json`) |
| only `chore:`, `ci:`, `build:`, `docs:`, … | none |

`scripts/set-version.mjs` sets the version on the five packages and on the ranges
they use for each other, and updates the lockfile. semantic-release commits that
with `CHANGELOG.md` as `chore: release vX.Y.Z`; `main.yml` skips its own run for
that commit.

## How a release actually happens

Not through the tag. Forgejo raises **no push event for a tag created with an
access token**, so `on: push: tags` never fires for the tag semantic-release
makes. `.releaserc.json` runs `.forgejo/trigger-release.sh` from
semantic-release's `successCmd`, which dispatches `release.yml` directly.
`successCmd` runs only when a version was released.

`on: push: tags` stays for tags pushed by hand, which do raise the event.

To publish a tag again: Actions → release → Run workflow, with the tag.

## The GitHub mirror

The repository is push-mirrored to github.com/metapatrol/brand (`main`,
`develop` and the tags). There, `.github/workflows/packages.yml` publishes each
release tag that arrives to GitHub Packages (`npm.pkg.github.com`) and creates
the GitHub release with the changelog section and the assets zip — for builds
outside the network, such as the consoles' own GitHub mirrors. Forgejo ignores
`.github/`, GitHub ignores `.forgejo/`; the forge holds no GitHub token.

The mirror does not sync on every commit: after a release, sync it (repository
settings → Mirror settings → Synchronize now) or wait for its interval. Tags
from before 0.6.1 carry no `packages.yml` and so are not on GitHub Packages.
A repository that reads the packages there with its `GITHUB_TOKEN` needs read
access under each package's *Manage Actions access* — a setting GitHub has no
API for.

## Secrets and variables

| name | kind | where | needed by |
|---|---|---|---|
| `AUTOMATION_TOKEN` | secret | organisation | `main.semantic-release` (commit, tag, dispatch), `release.publish` (`write:package`), `release.notes` |
| `S3_ACCESS_KEY` | secret | repository | `main.site`, `release.deploy` |
| `S3_SECRET_KEY` | secret | repository | `main.site`, `release.deploy` |
| `S3_ENDPOINT` | variable | repository | `main.site`, `release.deploy` |

`AUTOMATION_TOKEN` needs repository write (changelog commit, tag, release,
assets), `write:package` for the npm registry, and the right to dispatch
workflows.

Without `AUTOMATION_TOKEN` (or the S3 values), `main.yml` skips semantic-release
(or the site) rather than failing; `release.yml` fails on any missing value, because asking for a release
that cannot be published should not pass quietly.

**Nothing may be called `FORGEJO_TOKEN`.** The runner injects a variable of that
name holding its own ephemeral token, and it wins over a job env of the same
name: requests then go out as the bot, and package uploads and dispatches fail
in ways that read as a scope problem.

## Known gaps

- **The private CA.** git runs with `GIT_SSL_NO_VERIFY`, npm with `strict-ssl=false`
  and semantic-release with `NODE_TLS_REJECT_UNAUTHORIZED=0`, as in the other
  repositories. Once the runners carry the CA, these become `NODE_EXTRA_CA_CERTS`.
- **Linking packages to this repository**: Forgejo does not link npm packages on
  publish, so `release.publish` does it. Scoped names need the `lan` Gateway to
  keep `%2F` unescaped (platform/kubernetes-platform#47); before that, the proxy
  redirected every `%40metapatrol%2F…` path — tarball downloads included — to a
  form Forgejo has no route for.

## Layout

    .forgejo/
      README.md             this file
      trigger-release.sh    starts release.yml for the tag semantic-release made
      workflows/            ci.yml, main.yml, release.yml
    .github/workflows/
      packages.yml          on the GitHub mirror: GitHub Packages and the GitHub release
    .releaserc.json         semantic-release
    scripts/set-version.mjs one version for all published packages

Locally:

    make ci                    # what ci.yml runs, secret scan included
    make secret-scan-history   # the full history, for an audit
    make set-version VERSION=x.y.z   # what semantic-release runs, for a dry run
